import { prisma } from '../lib/prisma'
import pino from 'pino'
import { env } from '../config/env'

const logger = pino({
    level: env.LOG_LEVEL,
    transport: env.NODE_ENV === 'development' ? { target: 'pino-pretty' } : undefined,
})

export class IncidentManager {
    async handleResult(monitorId: string, status: string, organizationId: string, message?: string) {
        if (status === 'down') {
            await this.openIncident(monitorId, organizationId, message)
        } else if (status === 'up') {
            await this.resolveIncident(monitorId)
        }
    }

    private async openIncident(monitorId: string, organizationId: string, message?: string) {
        // Check if there's already an open incident for this monitor
        const existing = await prisma.incident.findFirst({
            where: {
                monitorId,
                status: 'open',
            },
        })

        if (existing) return

        logger.info({ monitorId }, 'opening new incident')
        await prisma.incident.create({
            data: {
                monitorId,
                organizationId,
                status: 'open',
                severity: 'critical',
                startedAt: new Date(),
            },
        })

        // TODO: Trigger alerts (Phase 66+)
    }

    private async resolveIncident(monitorId: string) {
        const existing = await prisma.incident.findFirst({
            where: {
                monitorId,
                status: 'open',
            },
        })

        if (!existing) return

        logger.info({ monitorId, incidentId: existing.id }, 'resolving incident')
        await prisma.incident.update({
            where: { id: existing.id },
            data: {
                status: 'resolved',
                resolvedAt: new Date(),
            },
        })

        // TODO: Trigger resolution alerts
    }
}

export const incidentManager = new IncidentManager()
