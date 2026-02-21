import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma } from '../lib/prisma'
import { AlertService } from '../services/AlertService'
import { EmailNotificationService } from '../services/EmailNotificationService'
import { AuditService } from '../services/AuditService'
import { authenticate } from '../middleware/auth'

const createChannelSchema = z.object({
    name: z.string().min(1),
    type: z.enum(['email', 'slack', 'discord', 'telegram', 'webhook']),
    config: z.record(z.any()),
})

const createAlertRuleSchema = z.object({
    monitorId: z.string().uuid(),
    channelId: z.string().uuid(),
    triggerOn: z.enum(['down', 'degraded', 'up']).default('down'),
})

export const alertRoutes = async (app: FastifyInstance) => {
    // Apply authentication middleware to all routes
    app.addHook('preHandler', authenticate)

    // Create alert channel
    app.post('/alert-channels', async (request, reply) => {
        const organizationId = (request as any).user?.orgId
        if (!organizationId) {
            return reply.status(401).send({ success: false, message: 'Unauthorized' })
        }

        const { name, type, config } = createChannelSchema.parse(request.body)

        try {
            const channel = await prisma.alertChannel.create({
                data: {
                    name,
                    type,
                    config,
                    organizationId,
                    isActive: true,
                }
            })

            await AuditService.log({
                action: 'ALERT_CHANNEL_CREATED',
                resource: 'alert_channel',
                resourceId: channel.id,
                organizationId,
                payload: { type, name },
            })

            return { success: true, channel }
        } catch (error: any) {
            return reply.status(400).send({ success: false, message: error.message })
        }
    })

    // List alert channels
    app.get('/alert-channels', async (request, reply) => {
        const organizationId = (request as any).user?.orgId
        if (!organizationId) {
            return reply.status(401).send({ success: false, message: 'Unauthorized' })
        }

        const channels = await prisma.alertChannel.findMany({
            where: { organizationId },
            orderBy: { createdAt: 'desc' },
        })

        // Remove sensitive config
        const safeChannels = channels.map(ch => ({
            ...ch,
            config: { ...ch.config, password: '***' } // Hide passwords
        }))

        return { success: true, channels: safeChannels }
    })

    // Delete alert channel
    app.delete<{ Params: { id: string } }>('/alert-channels/:id', async (request, reply) => {
        const organizationId = (request as any).user?.orgId
        const { id } = request.params

        // Verify ownership
        const channel = await prisma.alertChannel.findFirst({
            where: { id, organizationId }
        })

        if (!channel) {
            return reply.status(404).send({ success: false, message: 'Channel not found' })
        }

        await prisma.alertChannel.delete({ where: { id } })

        await AuditService.log({
            action: 'ALERT_CHANNEL_DELETED',
            resource: 'alert_channel',
            resourceId: id,
            organizationId,
        })

        return { success: true }
    })

    // Create alert rule
    app.post('/alert-rules', async (request, reply) => {
        const organizationId = (request as any).user?.orgId
        if (!organizationId) {
            return reply.status(401).send({ success: false, message: 'Unauthorized' })
        }

        const { monitorId, channelId, triggerOn } = createAlertRuleSchema.parse(request.body)

        try {
            // Verify monitor and channel belong to org
            const [monitor, channel] = await Promise.all([
                prisma.monitor.findFirst({ where: { id: monitorId, organizationId } }),
                prisma.alertChannel.findFirst({ where: { id: channelId, organizationId } }),
            ])

            if (!monitor || !channel) {
                return reply.status(404).send({ success: false, message: 'Monitor or channel not found' })
            }

            const rule = await AlertService.createAlertRule(
                monitorId,
                channelId,
                triggerOn,
                organizationId
            )

            await AuditService.log({
                action: 'ALERT_RULE_CREATED',
                resource: 'alert_rule',
                resourceId: rule.id,
                organizationId,
                payload: { monitorId, channelId, triggerOn },
            })

            return { success: true, rule }
        } catch (error: any) {
            if (error.code === 'P2002') {
                return reply.status(400).send({ success: false, message: 'Alert rule already exists for this monitor-channel pair' })
            }
            return reply.status(400).send({ success: false, message: error.message })
        }
    })

    // List alert rules
    app.get('/alert-rules', async (request, reply) => {
        const organizationId = (request as any).user?.orgId
        if (!organizationId) {
            return reply.status(401).send({ success: false, message: 'Unauthorized' })
        }

        const rules = await AlertService.getAlertRules(organizationId)
        return { success: true, rules }
    })

    // Delete alert rule
    app.delete<{ Params: { id: string } }>('/alert-rules/:id', async (request, reply) => {
        const organizationId = (request as any).user?.orgId
        const { id } = request.params

        // Verify ownership
        const rule = await prisma.alertRule.findFirst({
            where: { id, organizationId }
        })

        if (!rule) {
            return reply.status(404).send({ success: false, message: 'Rule not found' })
        }

        await AlertService.deleteAlertRule(id)

        await AuditService.log({
            action: 'ALERT_RULE_DELETED',
            resource: 'alert_rule',
            resourceId: id,
            organizationId,
        })

        return { success: true }
    })

    // Test email channel
    app.post('/alert-channels/test-email', async (request, reply) => {
        const organizationId = (request as any).user?.orgId
        if (!organizationId) {
            return reply.status(401).send({ success: false, message: 'Unauthorized' })
        }

        try {
            const { email, config } = z.object({
                email: z.string().email(),
                config: z.record(z.any()),
            }).parse(request.body)

            const result = await EmailNotificationService.testConnection(email, config)
            if (result) {
                return { success: true, message: 'Test email sent successfully' }
            } else {
                return reply.status(400).send({ success: false, message: 'Failed to send test email' })
            }
        } catch (error: any) {
            return reply.status(400).send({ success: false, message: error.message })
        }
    })
}
