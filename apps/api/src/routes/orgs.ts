import { FastifyInstance } from 'fastify'
import { prisma } from '../lib/prisma'
import { authenticate } from '../middleware/auth'
import { tenantContext } from '../lib/prisma'

export const orgRoutes = async (app: FastifyInstance) => {
    app.addHook('preHandler', authenticate)

    app.get('/me', async (request) => {
        const user = request.user as { orgId: string }
        return tenantContext.run({ orgId: user.orgId }, async () => {
            return prisma.organization.findUnique({
                where: { id: user.orgId },
                include: { users: { select: { id: true, email: true, role: true } } },
            })
        })
    })

    app.put('/me', async (request) => {
        const user = request.user as { orgId: string }
        const { name } = request.body as { name: string }

        return tenantContext.run({ orgId: user.orgId }, async () => {
            return prisma.organization.update({
                where: { id: user.orgId },
                data: { name },
            })
        })
    })
}
