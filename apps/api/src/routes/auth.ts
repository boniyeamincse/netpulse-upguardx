import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma } from '../lib/prisma'
import { AuthService } from '../services/AuthService'
import { AuditService } from '../services/AuditService'

const registerSchema = z.object({
    email: z.string().email(),
    password: z.string().min(8),
    orgName: z.string().min(2),
})

const loginSchema = z.object({
    email: z.string().email(),
    password: z.string(),
})

export const authRoutes = async (app: FastifyInstance) => {
    app.post('/register', {
        schema: {
            body: {
                type: 'object',
                required: ['email', 'password', 'orgName'],
                properties: {
                    email: { type: 'string' },
                    password: { type: 'string' },
                    orgName: { type: 'string' },
                },
            },
        },
        handler: async (request, reply) => {
            const { email, password, orgName } = registerSchema.parse(request.body)

            const existingUser = await prisma.user.findUnique({ where: { email } })
            if (existingUser) {
                return reply.status(400).send({ success: false, message: 'User already exists' })
            }

            const passwordHash = await AuthService.hashPassword(password)
            const slug = orgName.toLowerCase().replace(/\s+/g, '-')

            const org = await prisma.organization.create({
                data: {
                    name: orgName,
                    slug,
                    users: {
                        create: {
                            email,
                            passwordHash,
                            role: 'owner',
                        },
                    },
                },
                include: { users: true },
            })

            const user = org.users[0]
            const token = AuthService.generateToken({ userId: user.id, orgId: org.id, role: user.role })

            await AuditService.log({
                action: 'USER_REGISTER',
                resource: 'user',
                resourceId: user.id,
                organizationId: org.id,
                payload: { email },
            })

            return { success: true, token, user: { id: user.id, email: user.email, orgId: org.id } }
        },
    })

    app.post('/login', async (request, reply) => {
        const { email, password } = loginSchema.parse(request.body)
        const user = await prisma.user.findUnique({ where: { email } })

        if (!user || !(await AuthService.comparePassword(password, user.passwordHash))) {
            return reply.status(401).send({ success: false, message: 'Invalid credentials' })
        }

        const token = AuthService.generateToken({ userId: user.id, orgId: user.organizationId, role: user.role })

        return { success: true, token, user: { id: user.id, email: user.email, orgId: user.organizationId } }
    })
}
