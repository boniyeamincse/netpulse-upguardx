import { Queue } from 'bullmq'
import { prisma } from '../lib/prisma'
import { connection } from '../lib/redis'
import { env } from '../config/env'
import pino from 'pino'

const logger = pino({
    level: env.LOG_LEVEL,
    transport: env.NODE_ENV === 'development' ? { target: 'pino-pretty' } : undefined,
})

// @ts-expect-error - version mismatch between ioredis and bullmq types in this environment
const probeQueue = new Queue('monitor-probe', { connection })
const SCHEDULE_KEY = 'monitor:schedule'

export class Scheduler {
    private isRunning = false

    async start() {
        if (this.isRunning) return
        this.isRunning = true
        logger.info('starting monitor scheduler')

        // Initial sync from DB
        await this.syncMonitors()

        // Main scheduling loop
        this.scheduleLoop()
    }

    async stop() {
        this.isRunning = false
        logger.info('stopping monitor scheduler')
    }

    private async syncMonitors() {
        try {
            const monitors = await prisma.monitor.findMany({
                where: { status: { not: 'paused' } },
                select: { id: true, interval: true },
            })

            const now = Date.now()
            const pipeline = connection.pipeline()

            for (const monitor of monitors) {
                // Only add if not already in schedule
                pipeline.zadd(SCHEDULE_KEY, 'NX', now, monitor.id)
            }

            await pipeline.exec()
            logger.info({ count: monitors.length }, 'synced monitors to schedule')
        } catch (err) {
            logger.error({ err }, 'failed to sync monitors')
        }
    }

    private async scheduleLoop() {
        while (this.isRunning) {
            try {
                const now = Date.now()
                // Get monitors due for check (score <= now)
                const dueMonitors = await connection.zrangebyscore(SCHEDULE_KEY, 0, now)

                if (dueMonitors.length > 0) {
                    logger.info({ count: dueMonitors.length }, 'found due monitors')

                    for (const monitorId of dueMonitors) {
                        // Get monitor details to reschedule
                        const monitor = await prisma.monitor.findUnique({
                            where: { id: monitorId },
                            select: { id: true, interval: true, status: true },
                        })

                        if (monitor && monitor.status !== 'paused') {
                            // 1. Push to BullMQ
                            await probeQueue.add('probe', { monitorId: monitor.id }, {
                                jobId: `probe:${monitor.id}:${now}`,
                            })

                            let nextInterval = monitor.interval

                            // Exponential backoff if degraded or down
                            if (monitor.status === 'down' || monitor.status === 'degraded') {
                                // Simplified backoff: double the interval up to 1 hour
                                // In a real app, we'd store a 'failCount' in Redis
                                const failCountKey = `monitor:failcount:${monitor.id}`
                                const failCount = await connection.incr(failCountKey)
                                await connection.expire(failCountKey, 3600)

                                nextInterval = Math.min(monitor.interval * Math.pow(2, failCount), 3600)
                            } else {
                                await connection.del(`monitor:failcount:${monitor.id}`)
                            }

                            const nextCheck = now + (nextInterval * 1000)
                            await connection.zadd(SCHEDULE_KEY, nextCheck, monitorId)
                        } else {
                            // Remove if not active or deleted
                            await connection.zrem(SCHEDULE_KEY, monitorId)
                        }
                    }
                }
            } catch (err: any) {
                logger.error({ err: err?.message }, 'error in schedule loop')
            }

            // Wait a bit before next check
            await new Promise((resolve) => setTimeout(resolve, 1000))
        }
    }
}

export const scheduler = new Scheduler()
