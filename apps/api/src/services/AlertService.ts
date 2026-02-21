import { prisma } from '../lib/prisma'
import { AuditService } from './AuditService'

export class AlertService {
    /**
     * Dispatch alerts for a monitor status change
     */
    static async dispatchAlertsForMonitor(
        monitorId: string,
        status: 'up' | 'down' | 'degraded',
        monitorName: string,
        organizationId: string
    ) {
        try {
            // Find all alert rules for this monitor
            const alertRules = await prisma.alertRule.findMany({
                where: {
                    monitorId,
                    enabled: true,
                    alertChannel: {
                        isActive: true,
                    }
                },
                include: {
                    alertChannel: true,
                }
            })

            // Filter rules based on trigger condition
            const triggeredRules = alertRules.filter(rule => {
                if (rule.triggerOn === 'down' && status === 'down') return true
                if (rule.triggerOn === 'degraded' && status === 'degraded') return true
                if (rule.triggerOn === 'up' && status === 'up') return true
                return false
            })

            if (triggeredRules.length === 0) {
                return { sent: 0, failed: 0 }
            }

            // Send alerts through each channel
            let sent = 0
            let failed = 0

            for (const rule of triggeredRules) {
                try {
                    // Create alert log entry
                    const alertLog = await prisma.alertLog.create({
                        data: {
                            ruleId: rule.id,
                            status: 'pending',
                        }
                    })

                    // Send based on channel type
                    let success = false

                    if (rule.alertChannel.type === 'email') {
                        const { EmailNotificationService } = await import('./EmailNotificationService')
                        success = await EmailNotificationService.sendAlert({
                            email: (rule.alertChannel.config as any).email,
                            monitorName,
                            status,
                            message: `Monitor "${monitorName}" is now ${status.toUpperCase()}`,
                        })
                    } else if (rule.alertChannel.type === 'slack') {
                        // TODO: Implement Slack
                        success = false
                    } else if (rule.alertChannel.type === 'discord') {
                        // TODO: Implement Discord
                        success = false
                    }

                    // Update alert log
                    await prisma.alertLog.update({
                        where: { id: alertLog.id },
                        data: {
                            status: success ? 'sent' : 'failed',
                            sentAt: success ? new Date() : undefined,
                            error: success ? null : 'Failed to send alert',
                        }
                    })

                    if (success) sent++
                    else failed++

                } catch (error: any) {
                    failed++
                    console.error(`Error sending alert for rule ${rule.id}:`, error)
                }
            }

            await AuditService.log({
                action: 'ALERTS_DISPATCHED',
                resource: 'monitor',
                resourceId: monitorId,
                organizationId,
                payload: { status, sent, failed, triggered: triggeredRules.length },
            })

            return { sent, failed }
        } catch (error: any) {
            console.error('Error dispatching alerts:', error)
            return { sent: 0, failed: 0 }
        }
    }

    /**
     * Create an alert rule
     */
    static async createAlertRule(
        monitorId: string,
        channelId: string,
        triggerOn: 'down' | 'degraded' | 'up' = 'down',
        organizationId: string,
        name?: string
    ) {
        return prisma.alertRule.create({
            data: {
                name: name || `Alert: ${triggerOn}`,
                monitorId,
                channelId,
                triggerOn,
                organizationId,
                enabled: true,
            },
            include: {
                alertChannel: true,
            }
        })
    }

    /**
     * Get all alert rules for an organization
     */
    static async getAlertRules(organizationId: string) {
        return prisma.alertRule.findMany({
            where: { organizationId },
            include: {
                alertChannel: true,
                monitor: true,
            },
            orderBy: { createdAt: 'desc' },
        })
    }

    /**
     * Delete an alert rule
     */
    static async deleteAlertRule(ruleId: string) {
        return prisma.alertRule.delete({
            where: { id: ruleId }
        })
    }

    /**
     * Toggle alert rule status
     */
    static async toggleAlertRule(ruleId: string, enabled: boolean) {
        return prisma.alertRule.update({
            where: { id: ruleId },
            data: { enabled }
        })
    }
}
