import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma } from '../lib/prisma'
import { AlertService } from '../services/AlertService'
import { EmailNotificationService } from '../services/EmailNotificationService'
import { SlackNotificationService } from '../services/SlackNotificationService'
import { DiscordNotificationService } from '../services/DiscordNotificationService'
import { WebhookNotificationService } from '../services/WebhookNotificationService'
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

const updateChannelSchema = z.object({
    name: z.string().min(1).optional(),
    config: z.record(z.any()).optional(),
    isActive: z.boolean().optional(),
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
        const safeChannels = channels.map((ch) => {
            const config =
                ch.config && typeof ch.config === 'object' && !Array.isArray(ch.config)
                    ? ({ ...ch.config } as Record<string, unknown>)
                    : {}

            for (const key of ['password', 'token', 'apiKey', 'webhookUrl', 'smtpPass']) {
                if (key in config) {
                    config[key] = '***'
                }
            }

            return {
                ...ch,
                config,
            }
        })

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

    app.get<{ Params: { id: string } }>('/alert-channels/:id', async (request, reply) => {
        const organizationId = (request as any).user?.orgId
        const { id } = request.params

        const channel = await prisma.alertChannel.findFirst({
            where: { id, organizationId },
        })

        if (!channel) {
            return reply.status(404).send({ success: false, message: 'Channel not found' })
        }

        return { success: true, channel }
    })

    app.put<{ Params: { id: string } }>('/alert-channels/:id', async (request, reply) => {
        const organizationId = (request as any).user?.orgId
        const { id } = request.params
        const data = updateChannelSchema.parse(request.body)

        const channel = await prisma.alertChannel.findFirst({
            where: { id, organizationId },
        })

        if (!channel) {
            return reply.status(404).send({ success: false, message: 'Channel not found' })
        }

        const updated = await prisma.alertChannel.update({
            where: { id },
            data,
        })

        return { success: true, channel: updated }
    })

    app.post<{ Params: { id: string } }>('/alert-channels/:id/test', async (request, reply) => {
        const organizationId = (request as any).user?.orgId
        const { id } = request.params

        const channel = await prisma.alertChannel.findFirst({
            where: { id, organizationId },
        })

        if (!channel) {
            return reply.status(404).send({ success: false, message: 'Channel not found' })
        }

        const cfg = (channel.config as any) || {}
        let success = false

        if (channel.type === 'email') {
            success = await EmailNotificationService.testConnection(cfg.email, cfg)
        } else if (channel.type === 'slack') {
            success = await SlackNotificationService.sendAlert({
                webhookUrl: cfg.webhookUrl,
                monitorName: 'Test Monitor',
                status: 'up',
                message: 'Test alert from NetPulse',
            })
        } else if (channel.type === 'discord') {
            success = await DiscordNotificationService.sendAlert({
                webhookUrl: cfg.webhookUrl,
                monitorName: 'Test Monitor',
                status: 'up',
                message: 'Test alert from NetPulse',
            })
        } else if (channel.type === 'webhook') {
            success = await WebhookNotificationService.sendAlert({
                webhookUrl: cfg.webhookUrl,
                monitorName: 'Test Monitor',
                status: 'up',
                message: 'Test alert from NetPulse',
            })
        }

        if (!success) {
            return reply.status(400).send({ success: false, message: 'Failed to send test notification' })
        }

        return { success: true, message: 'Test notification sent successfully' }
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
