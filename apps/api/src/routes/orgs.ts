import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma } from '../lib/prisma'
import { authenticate } from '../middleware/auth'
import { tenantContext } from '../lib/prisma'
import { AuthService } from '../services/AuthService'

export const orgRoutes = async (app: FastifyInstance) => {
    app.addHook('preHandler', authenticate)

    app.get('/me', async (request, reply) => {
        const user = request.user as { orgId: string }
        const org = await tenantContext.run({ orgId: user.orgId }, async () => {
            return prisma.organization.findUnique({
                where: { id: user.orgId },
            })
        })

        if (!org) {
            return reply.status(404).send({ success: false, message: 'Organization not found' })
        }

        return { success: true, id: org.id, name: org.name, slug: org.slug }
    })

    app.put('/me', async (request, reply) => {
        const user = request.user as { orgId: string }
        const { name } = z.object({ name: z.string().min(2).optional() }).parse(request.body)

        const org = await tenantContext.run({ orgId: user.orgId }, async () => {
            return prisma.organization.update({
                where: { id: user.orgId },
                data: { name },
            })
        })

        if (!org) {
            return reply.status(404).send({ success: false, message: 'Organization not found' })
        }

        return { success: true, id: org.id, name: org.name, slug: org.slug }
    })

    app.get('/members', async (request) => {
        const user = request.user as { orgId: string }
        const members = await prisma.user.findMany({
            where: { organizationId: user.orgId },
            orderBy: { createdAt: 'asc' },
            select: { id: true, email: true, role: true, createdAt: true },
        })

        return {
            success: true,
            members: members.map((member) => ({
                id: member.id,
                name: member.email.split('@')[0],
                email: member.email,
                role: member.role,
                joinedAt: member.createdAt,
            })),
        }
    })

    app.post('/invite', async (request, reply) => {
        const user = request.user as { orgId: string }
        const { email, role } = z
            .object({
                email: z.string().email(),
                role: z.enum(['owner', 'admin', 'editor', 'viewer']).default('viewer'),
            })
            .parse(request.body)

        const existing = await prisma.user.findUnique({ where: { email } })
        if (existing) {
            return reply.status(400).send({ success: false, message: 'User already exists' })
        }

        const tempPassword = await AuthService.hashPassword(Math.random().toString(36).slice(2) + Date.now())
        await prisma.user.create({
            data: {
                email,
                role,
                passwordHash: tempPassword,
                organizationId: user.orgId,
            },
        })

        return { success: true, message: 'Member invited successfully' }
    })

    app.delete<{ Params: { memberId: string } }>('/members/:memberId', async (request, reply) => {
        const user = request.user as { orgId: string; userId?: string }
        const { memberId } = request.params

        const member = await prisma.user.findFirst({
            where: { id: memberId, organizationId: user.orgId },
        })

        if (!member) {
            return reply.status(404).send({ success: false, message: 'Member not found' })
        }

        if (member.id === user.userId) {
            return reply.status(400).send({ success: false, message: 'You cannot remove yourself' })
        }

        await prisma.user.delete({ where: { id: member.id } })
        return { success: true }
    })

    app.put<{ Params: { memberId: string } }>('/members/:memberId/role', async (request, reply) => {
        const user = request.user as { orgId: string }
        const { memberId } = request.params
        const { role } = z
            .object({
                role: z.enum(['owner', 'admin', 'editor', 'viewer']),
            })
            .parse(request.body)

        const member = await prisma.user.findFirst({
            where: { id: memberId, organizationId: user.orgId },
        })

        if (!member) {
            return reply.status(404).send({ success: false, message: 'Member not found' })
        }

        await prisma.user.update({
            where: { id: member.id },
            data: { role },
        })

        return { success: true }
    })
}
