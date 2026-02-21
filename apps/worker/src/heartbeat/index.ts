import { connection } from '../lib/redis'
import { env } from '../config/env'
import pino from 'pino'

const logger = pino({
    level: env.LOG_LEVEL,
    transport: env.NODE_ENV === 'development' ? { target: 'pino-pretty' } : undefined,
})

export class Heartbeat {
    private interval: NodeJS.Timeout | null = null

    async start() {
        logger.info({ workerId: env.WORKER_ID }, 'starting heartbeat')

        // Immediate heartbeat
        await this.send()

        // Periodical heartbeat every 30 seconds
        this.interval = setInterval(() => this.send(), 30000)
    }

    async stop() {
        if (this.interval) {
            clearInterval(this.interval)
            logger.info('stopped heartbeat')
        }

        // Mark as offline
        await connection.del(`worker:heartbeat:${env.WORKER_ID}`)
    }

    private async send() {
        try {
            const data = {
                workerId: env.WORKER_ID,
                lastSeen: new Date().toISOString(),
                status: 'online',
                concurrency: env.CONCURRENCY,
            }

            await connection.set(
                `worker:heartbeat:${env.WORKER_ID}`,
                JSON.stringify(data),
                'EX',
                60 // Expires in 60 seconds if not refreshed
            )
        } catch (err) {
            logger.error({ err }, 'failed to send heartbeat')
        }
    }
}

export const heartbeat = new Heartbeat()
