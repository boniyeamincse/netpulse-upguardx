import { prisma } from '../lib/prisma'

export class DowntimeService {
    /**
     * Calculates total downtime in seconds for a monitor within a given time range
     */
    async calculateDowntime(monitorId: string, from: Date, to: Date): Promise<number> {
        const incidents = await prisma.incident.findMany({
            where: {
                monitorId,
                startedAt: { lte: to },
                OR: [
                    { resolvedAt: { gte: from } },
                    { resolvedAt: null },
                ],
            },
        })

        let totalDowntime = 0

        for (const incident of incidents) {
            const start = Math.max(incident.startedAt.getTime(), from.getTime())
            const end = incident.resolvedAt
                ? Math.min(incident.resolvedAt.getTime(), to.getTime())
                : to.getTime()

            if (end > start) {
                totalDowntime += (end - start) / 1000
            }
        }

        return totalDowntime
    }

    /**
     * Calculates uptime percentage for a monitor within a given time range
     */
    async calculateUptimePercentage(monitorId: string, from: Date, to: Date): Promise<number> {
        const totalSeconds = (to.getTime() - from.getTime()) / 1000
        if (totalSeconds <= 0) return 100

        const downtime = await this.calculateDowntime(monitorId, from, to)
        const uptime = totalSeconds - downtime

        return Math.max(0, Math.min(100, (uptime / totalSeconds) * 100))
    }
}

export const downtimeService = new DowntimeService()
