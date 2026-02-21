import { FastifyInstance, FastifyRequest } from 'fastify'
import { z } from 'zod'
import { prisma } from '../lib/prisma'
import { authenticate } from '../middleware/auth'
import { AuditService } from '../services/AuditService'

const createMonitorSchema = z.object({
    name: z.string().min(1),
    type: z.enum(['http', 'tcp', 'icmp', 'dns', 'ssl']),
    target: z.string().min(1),
    interval: z.number().min(30).default(60),
    metadata: z.record(z.any()).optional(),
})

const updateMonitorSchema = createMonitorSchema.partial()

export const monitorRoutes = async (app: FastifyInstance) => {
    // Apply authentication middleware to all routes
    app.addHook('preHandler', authenticate)

    // Create monitor
    app.post('/monitors', async (request, reply) => {
        const organizationId = (request.user as any)?.orgId
        if (!organizationId) {
            return reply.status(401).send({ success: false, message: 'Unauthorized' })
        }

        const data = createMonitorSchema.parse(request.body)

        try {
            const monitor = await prisma.monitor.create({
                data: {
                    ...data,
                    organizationId,
                    status: 'pending',
                },
            })

            await AuditService.log({
                action: 'MONITOR_CREATED',
                resource: 'monitor',
                resourceId: monitor.id,
                organizationId,
                payload: { name: monitor.name, type: monitor.type },
            })

            return { success: true, monitor }
        } catch (error: any) {
            return reply.status(400).send({ success: false, message: error.message })
        }
    })

    // List monitors
    app.get('/monitors', async (request, reply) => {
        const organizationId = (request.user as any)?.orgId
        if (!organizationId) {
            return reply.status(401).send({ success: false, message: 'Unauthorized' })
        }

        const monitors = await prisma.monitor.findMany({
            where: { organizationId },
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                name: true,
                type: true,
                target: true,
                status: true,
                interval: true,
                lastCheckAt: true,
                createdAt: true,
                updatedAt: true,
            },
        })

        return { success: true, monitors }
    })

    // Get monitor details
    app.get<{ Params: { id: string } }>('/monitors/:id', async (request, reply) => {
        const organizationId = (request.user as any)?.orgId
        const { id } = request.params

        const monitor = await prisma.monitor.findFirst({
            where: { id, organizationId },
        })

        if (!monitor) {
            return reply.status(404).send({ success: false, message: 'Monitor not found' })
        }

        return { success: true, monitor }
    })

    // Get monitor checks (for charting)
    app.get<{ Params: { id: string } }>('/monitors/:id/checks', async (request, reply) => {
        const organizationId = (request.user as any)?.orgId
        const { id } = request.params

        // Verify monitor belongs to user's org
        const monitor = await prisma.monitor.findFirst({
            where: { id, organizationId },
        })

        if (!monitor) {
            return reply.status(404).send({ success: false, message: 'Monitor not found' })
        }

        // Get last 100 checks (24 hours worth for hourly checks)
        const checks = await prisma.monitorCheck.findMany({
            where: { monitorId: id },
            orderBy: { createdAt: 'desc' },
            take: 100,
        })

        return { success: true, checks: checks.reverse() }
    })

    // Update monitor
    app.put<{ Params: { id: string } }>('/monitors/:id', async (request, reply) => {
        const organizationId = (request.user as any)?.orgId
        const { id } = request.params

        const monitor = await prisma.monitor.findFirst({
            where: { id, organizationId },
        })

        if (!monitor) {
            return reply.status(404).send({ success: false, message: 'Monitor not found' })
        }

        const data = updateMonitorSchema.parse(request.body)

        try {
            const updated = await prisma.monitor.update({
                where: { id },
                data,
            })

            await AuditService.log({
                action: 'MONITOR_UPDATED',
                resource: 'monitor',
                resourceId: id,
                organizationId,
                payload: data,
            })

            return { success: true, monitor: updated }
        } catch (error: any) {
            return reply.status(400).send({ success: false, message: error.message })
        }
    })

    // Delete monitor
    app.delete<{ Params: { id: string } }>('/monitors/:id', async (request, reply) => {
        const organizationId = (request.user as any)?.orgId
        const { id } = request.params

        const monitor = await prisma.monitor.findFirst({
            where: { id, organizationId },
        })

        if (!monitor) {
            return reply.status(404).send({ success: false, message: 'Monitor not found' })
        }

        await prisma.monitor.delete({ where: { id } })

        await AuditService.log({
            action: 'MONITOR_DELETED',
            resource: 'monitor',
            resourceId: id,
            organizationId,
            payload: { name: monitor.name },
        })

        return { success: true }
    })

    // Get dashboard stats
    app.get('/stats/summary', async (request, reply) => {
        const organizationId = (request.user as any)?.orgId
        if (!organizationId) {
            return reply.status(401).send({ success: false, message: 'Unauthorized' })
        }

        const monitors = await prisma.monitor.findMany({
            where: { organizationId },
            select: { status: true },
        })

        const total = monitors.length
        const up = monitors.filter((m) => m.status === 'up').length
        const down = monitors.filter((m) => m.status === 'down').length
        const degraded = monitors.filter((m) => m.status === 'degraded').length

        return { success: true, total, up, down, degraded }
    })

    // Get incidents
    app.get('/incidents', async (request, reply) => {
        const organizationId = (request.user as any)?.orgId
        if (!organizationId) {
            return reply.status(401).send({ success: false, message: 'Unauthorized' })
        }

        const incidents = await prisma.incident.findMany({
            where: { organizationId },
            include: {
                monitor: { select: { name: true } },
            },
            orderBy: { startedAt: 'desc' },
        })

        const formatted = incidents.map((incident) => ({
            id: incident.id,
            monitorId: incident.monitorId,
            monitorName: incident.monitor.name,
            status: incident.status,
            severity: incident.severity,
            startedAt: incident.startedAt,
            resolvedAt: incident.resolvedAt,
            message: incident.message,
        }))

        return { success: true, incidents: formatted }
    })

    // Create API Key
    app.post('/apikeys', async (request, reply) => {
        const organizationId = (request.user as any)?.orgId
        if (!organizationId) {
            return reply.status(401).send({ success: false, message: 'Unauthorized' })
        }

        const { name } = z.object({ name: z.string().min(1) }).parse(request.body)

        // Generate API key
        const key = 'nk_' + Buffer.from(Math.random().toString()).toString('base64').substr(0, 32)

        try {
            const apiKey = await prisma.apiKey.create({
                data: {
                    name,
                    key,
                    organizationId,
                },
            })

            return { success: true, apiKey: { ...apiKey, key } } // Only show full key on creation
        } catch (error: any) {
            return reply.status(400).send({ success: false, message: error.message })
        }
    })

    // List API Keys
    app.get('/apikeys', async (request, reply) => {
        const organizationId = (request.user as any)?.orgId
        if (!organizationId) {
            return reply.status(401).send({ success: false, message: 'Unauthorized' })
        }

        const apiKeys = await prisma.apiKey.findMany({
            where: { organizationId },
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                name: true,
                key: true, // Frontend will mask this except for creation
                lastUsedAt: true,
                createdAt: true,
            },
        })

        return { success: true, apiKeys }
    })

    // Delete API Key
    app.delete<{ Params: { id: string } }>('/apikeys/:id', async (request, reply) => {
        const organizationId = (request.user as any)?.orgId
        const { id } = request.params

        const apiKey = await prisma.apiKey.findFirst({
            where: { id, organizationId },
        })

        if (!apiKey) {
            return reply.status(404).send({ success: false, message: 'API key not found' })
        }

        await prisma.apiKey.delete({ where: { id } })

        return { success: true }
    })
}
