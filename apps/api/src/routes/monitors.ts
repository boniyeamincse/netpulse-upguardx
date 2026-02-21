import { FastifyInstance, FastifyRequest } from 'fastify'
import { z } from 'zod'
import { prisma } from '../lib/prisma'
import { authenticate } from '../middleware/auth'
import { AuditService } from '../services/AuditService'
import { ApiKeyService } from '../services/ApiKeyService'

const createMonitorSchema = z.object({
    name: z.string().min(1),
    type: z.enum(['http', 'tcp', 'icmp', 'dns', 'ssl']),
    target: z.string().min(1),
    interval: z.number().min(30).default(60),
    metadata: z.record(z.any()).optional(),
})

const updateMonitorSchema = createMonitorSchema.partial()
const readNotifications = new Set<string>()

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

        const query = z
            .object({
                status: z.string().optional(),
                type: z.string().optional(),
                search: z.string().optional(),
                page: z.coerce.number().min(1).default(1),
                limit: z.coerce.number().min(1).max(100).default(50),
            })
            .parse(request.query)

        const where: any = { organizationId }
        if (query.status) where.status = query.status
        if (query.type) where.type = query.type
        if (query.search) where.name = { contains: query.search, mode: 'insensitive' }

        const [total, monitors] = await Promise.all([
            prisma.monitor.count({ where }),
            prisma.monitor.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip: (query.page - 1) * query.limit,
                take: query.limit,
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
            }),
        ])

        return {
            success: true,
            monitors,
            pagination: {
                page: query.page,
                limit: query.limit,
                total,
                totalPages: Math.ceil(total / query.limit),
            },
        }
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
        const query = z
            .object({
                startDate: z.string().datetime().optional(),
                endDate: z.string().datetime().optional(),
                limit: z.coerce.number().min(1).max(1000).default(100),
            })
            .parse(request.query)

        // Verify monitor belongs to user's org
        const monitor = await prisma.monitor.findFirst({
            where: { id, organizationId },
        })

        if (!monitor) {
            return reply.status(404).send({ success: false, message: 'Monitor not found' })
        }

        // Get last 100 checks (24 hours worth for hourly checks)
        const checks = await prisma.monitorCheck.findMany({
            where: {
                monitorId: id,
                createdAt: {
                    gte: query.startDate ? new Date(query.startDate) : undefined,
                    lte: query.endDate ? new Date(query.endDate) : undefined,
                },
            },
            orderBy: { createdAt: 'desc' },
            take: query.limit,
        })

        return { success: true, checks: checks.reverse() }
    })

    app.get<{ Params: { id: string } }>('/monitors/:id/stats', async (request, reply) => {
        const organizationId = (request.user as any)?.orgId
        const { id } = request.params
        const { period } = z
            .object({ period: z.enum(['24h', '7d', '30d']).default('24h') })
            .parse(request.query)

        const hours = period === '24h' ? 24 : period === '7d' ? 24 * 7 : 24 * 30
        const since = new Date(Date.now() - hours * 60 * 60 * 1000)

        const monitor = await prisma.monitor.findFirst({ where: { id, organizationId } })
        if (!monitor) {
            return reply.status(404).send({ success: false, message: 'Monitor not found' })
        }

        const checks = await prisma.monitorCheck.findMany({
            where: { monitorId: id, createdAt: { gte: since } },
            orderBy: { createdAt: 'desc' },
        })

        const totalChecks = checks.length
        const failedChecks = checks.filter((check) => check.status !== 'up').length
        const avgLatency =
            totalChecks === 0
                ? 0
                : Math.round(checks.reduce((sum, check) => sum + (check.latency || 0), 0) / totalChecks)
        const uptime = totalChecks === 0 ? 0 : Number((((totalChecks - failedChecks) / totalChecks) * 100).toFixed(2))
        const incidents = await prisma.incident.count({ where: { monitorId: id, startedAt: { gte: since } } })

        return {
            success: true,
            stats: { uptime, avgLatency, totalChecks, failedChecks, incidents },
        }
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

    app.post<{ Params: { id: string } }>('/monitors/:id/pause', async (request, reply) => {
        const organizationId = (request.user as any)?.orgId
        const { id } = request.params

        const monitor = await prisma.monitor.findFirst({ where: { id, organizationId } })
        if (!monitor) {
            return reply.status(404).send({ success: false, message: 'Monitor not found' })
        }

        const updated = await prisma.monitor.update({ where: { id }, data: { status: 'paused' } })
        return { success: true, monitor: updated }
    })

    app.post<{ Params: { id: string } }>('/monitors/:id/resume', async (request, reply) => {
        const organizationId = (request.user as any)?.orgId
        const { id } = request.params

        const monitor = await prisma.monitor.findFirst({ where: { id, organizationId } })
        if (!monitor) {
            return reply.status(404).send({ success: false, message: 'Monitor not found' })
        }

        const updated = await prisma.monitor.update({ where: { id }, data: { status: 'pending' } })
        return { success: true, monitor: updated }
    })

    app.post<{ Params: { id: string } }>('/monitors/:id/check', async (request, reply) => {
        const organizationId = (request.user as any)?.orgId
        const { id } = request.params

        const monitor = await prisma.monitor.findFirst({ where: { id, organizationId } })
        if (!monitor) {
            return reply.status(404).send({ success: false, message: 'Monitor not found' })
        }

        const check = await prisma.monitorCheck.create({
            data: {
                monitorId: id,
                status: monitor.status === 'paused' ? 'down' : 'up',
                latency: Math.floor(Math.random() * 250) + 10,
                message: 'Manual check triggered',
                region: 'manual',
            },
        })

        await prisma.monitor.update({
            where: { id },
            data: {
                status: check.status === 'up' ? 'up' : 'down',
                lastCheckAt: new Date(),
            },
        })

        return { success: true, check }
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
        const paused = monitors.filter((m) => m.status === 'paused').length

        const checks24h = await prisma.monitorCheck.findMany({
            where: {
                monitor: { organizationId },
                createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
            },
            select: { latency: true, status: true },
        })
        const avgLatency =
            checks24h.length === 0
                ? 0
                : Math.round(checks24h.reduce((sum, check) => sum + check.latency, 0) / checks24h.length)
        const successCount = checks24h.filter((check) => check.status === 'up').length
        const avgUptime = checks24h.length === 0 ? 0 : Number(((successCount / checks24h.length) * 100).toFixed(2))
        const incidents24h = await prisma.incident.count({
            where: { organizationId, startedAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
        })

        return { success: true, total, up, down, degraded, paused, avgUptime, avgLatency, incidents24h }
    })

    // Get incidents
    app.get('/incidents', async (request, reply) => {
        const organizationId = (request.user as any)?.orgId
        if (!organizationId) {
            return reply.status(401).send({ success: false, message: 'Unauthorized' })
        }

        const query = z
            .object({
                status: z.string().optional(),
                monitorId: z.string().optional(),
                startDate: z.string().datetime().optional(),
                endDate: z.string().datetime().optional(),
                page: z.coerce.number().min(1).default(1),
                limit: z.coerce.number().min(1).max(100).default(50),
            })
            .parse(request.query)

        const where: any = { organizationId }
        if (query.status) where.status = query.status
        if (query.monitorId) where.monitorId = query.monitorId
        if (query.startDate || query.endDate) {
            where.startedAt = {
                gte: query.startDate ? new Date(query.startDate) : undefined,
                lte: query.endDate ? new Date(query.endDate) : undefined,
            }
        }

        const [total, incidents] = await Promise.all([
            prisma.incident.count({ where }),
            prisma.incident.findMany({
                where,
                include: {
                    monitor: { select: { name: true } },
                },
                orderBy: { startedAt: 'desc' },
                skip: (query.page - 1) * query.limit,
                take: query.limit,
            }),
        ])

        const formatted = incidents.map((incident) => ({
            id: incident.id,
            monitorId: incident.monitorId,
            monitorName: incident.monitor.name,
            organizationId: incident.organizationId,
            status: incident.status,
            severity: incident.severity,
            startedAt: incident.startedAt,
            resolvedAt: incident.resolvedAt,
            createdAt: incident.createdAt,
            updatedAt: incident.updatedAt,
        }))

        return {
            success: true,
            incidents: formatted,
            pagination: {
                page: query.page,
                limit: query.limit,
                total,
                totalPages: Math.ceil(total / query.limit),
            },
        }
    })

    app.get<{ Params: { id: string } }>('/incidents/:id', async (request, reply) => {
        const organizationId = (request.user as any)?.orgId
        const { id } = request.params

        const incident = await prisma.incident.findFirst({
            where: { id, organizationId },
            include: { monitor: { select: { name: true } } },
        })

        if (!incident) {
            return reply.status(404).send({ success: false, message: 'Incident not found' })
        }

        return {
            success: true,
            incident: {
                id: incident.id,
                monitorId: incident.monitorId,
                monitorName: incident.monitor.name,
                organizationId: incident.organizationId,
                status: incident.status,
                severity: incident.severity,
                startedAt: incident.startedAt,
                resolvedAt: incident.resolvedAt,
                createdAt: incident.createdAt,
                updatedAt: incident.updatedAt,
            },
        }
    })

    app.post<{ Params: { id: string } }>('/incidents/:id/resolve', async (request, reply) => {
        const organizationId = (request.user as any)?.orgId
        const { id } = request.params

        const incident = await prisma.incident.findFirst({ where: { id, organizationId } })
        if (!incident) {
            return reply.status(404).send({ success: false, message: 'Incident not found' })
        }

        const updated = await prisma.incident.update({
            where: { id },
            data: { status: 'resolved', resolvedAt: new Date() },
            include: { monitor: { select: { name: true } } },
        })

        return {
            success: true,
            incident: {
                id: updated.id,
                monitorId: updated.monitorId,
                monitorName: updated.monitor.name,
                organizationId: updated.organizationId,
                status: updated.status,
                severity: updated.severity,
                startedAt: updated.startedAt,
                resolvedAt: updated.resolvedAt,
                createdAt: updated.createdAt,
                updatedAt: updated.updatedAt,
            },
        }
    })

    app.post<{ Params: { id: string } }>('/incidents/:id/acknowledge', async (request, reply) => {
        const organizationId = (request.user as any)?.orgId
        const { id } = request.params

        const incident = await prisma.incident.findFirst({ where: { id, organizationId } })
        if (!incident) {
            return reply.status(404).send({ success: false, message: 'Incident not found' })
        }

        const updated = await prisma.incident.update({
            where: { id },
            data: { status: 'investigating' },
            include: { monitor: { select: { name: true } } },
        })

        return {
            success: true,
            incident: {
                id: updated.id,
                monitorId: updated.monitorId,
                monitorName: updated.monitor.name,
                organizationId: updated.organizationId,
                status: updated.status,
                severity: updated.severity,
                startedAt: updated.startedAt,
                resolvedAt: updated.resolvedAt,
                createdAt: updated.createdAt,
                updatedAt: updated.updatedAt,
            },
        }
    })

    app.get('/notifications', async (request, reply) => {
        const organizationId = (request.user as any)?.orgId
        if (!organizationId) {
            return reply.status(401).send({ success: false, message: 'Unauthorized' })
        }

        const logs = await prisma.auditLog.findMany({
            where: { organizationId },
            orderBy: { createdAt: 'desc' },
            take: 50,
        })

        return {
            success: true,
            notifications: logs.map((log) => ({
                id: log.id,
                type: log.action,
                title: log.action.replaceAll('_', ' '),
                message: `${log.resource}${log.resourceId ? ` (${log.resourceId})` : ''}`,
                read: readNotifications.has(`${organizationId}:${log.id}`),
                createdAt: log.createdAt,
            })),
        }
    })

    app.post<{ Params: { id: string } }>('/notifications/:id/read', async (request, reply) => {
        const organizationId = (request.user as any)?.orgId
        if (!organizationId) {
            return reply.status(401).send({ success: false, message: 'Unauthorized' })
        }

        const { id } = request.params
        readNotifications.add(`${organizationId}:${id}`)
        return { success: true }
    })

    app.post('/notifications/read-all', async (request, reply) => {
        const organizationId = (request.user as any)?.orgId
        if (!organizationId) {
            return reply.status(401).send({ success: false, message: 'Unauthorized' })
        }

        const ids = await prisma.auditLog.findMany({
            where: { organizationId },
            select: { id: true },
        })

        for (const log of ids) {
            readNotifications.add(`${organizationId}:${log.id}`)
        }

        return { success: true }
    })

    // Create API Key
    app.post('/apikeys', async (request, reply) => {
        const organizationId = (request.user as any)?.orgId
        if (!organizationId) {
            return reply.status(401).send({ success: false, message: 'Unauthorized' })
        }

        const { name } = z.object({ name: z.string().min(1) }).parse(request.body)

        try {
            const generated = await ApiKeyService.generateKey(organizationId, name)

            return {
                success: true,
                key: generated.key,
                apiKey: {
                    id: generated.id,
                    name: generated.name,
                    createdAt: generated.createdAt,
                    lastUsedAt: generated.lastUsedAt,
                },
            }
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
                key: true,
                lastUsedAt: true,
                createdAt: true,
            },
        })

        return {
            success: true,
            apiKeys: apiKeys.map((apiKey) => ({
                id: apiKey.id,
                name: apiKey.name,
                key: `${'*'.repeat(Math.max(0, apiKey.key.length - 4))}${apiKey.key.slice(-4)}`,
                lastUsedAt: apiKey.lastUsedAt,
                createdAt: apiKey.createdAt,
            })),
        }
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
