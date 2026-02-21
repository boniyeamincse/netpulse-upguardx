import { Worker, Job } from 'bullmq'
import { env } from './config/env'
import { connection } from './lib/redis'
import { scheduler } from './scheduler'
import { prisma } from './lib/prisma'
import { probeHttp } from './prober/http'
import { probeTcp } from './prober/tcp'
import { probeIcmp } from './prober/icmp'
import { probeDns } from './prober/dns'
import { probeSsl } from './prober/ssl'
import { evaluateResult } from './evaluator'
import { heartbeat } from './heartbeat'
import { incidentManager } from './incident'
import { lockManager } from './lib/lock'
import { ProbeResult } from './prober/types'
import pino from 'pino'

const logger = pino({
    level: env.LOG_LEVEL,
    transport: env.NODE_ENV === 'development' ? { target: 'pino-pretty' } : undefined,
})

logger.info({ workerId: env.WORKER_ID, concurrency: env.CONCURRENCY }, 'starting netpulse worker')

// Start services
heartbeat.start().catch((err: any) => {
    logger.error({ err: err.message }, 'failed to start heartbeat')
})

scheduler.start().catch((err: any) => {
    logger.error({ err: err.message }, 'failed to start scheduler')
})

const worker = new Worker(
    'monitor-probe',
    async (job: Job) => {
        const { monitorId } = job.data

        // Acquire distributed lock
        const lockAcquired = await lockManager.acquire(monitorId, 30000)
        if (!lockAcquired) {
            logger.debug({ jobId: job.id, monitorId }, 'job locked, skipping')
            return { status: 'locked' }
        }

        try {
            logger.info({ jobId: job.id, monitorId }, 'processing monitor probe')

            const monitor = await prisma.monitor.findUnique({
                where: { id: monitorId },
            }) as any

            if (!monitor) return { status: 'error', message: 'Monitor not found' }

            let probeResult: ProbeResult
            const metadata = monitor.metadata || {}

            switch (monitor.type) {
                case 'http': {
                    probeResult = await probeHttp(monitor.target, {
                        headers: metadata.headers,
                        bodyMatch: metadata.bodyMatch,
                        followRedirect: metadata.followRedirect,
                        timeout: metadata.timeout,
                    })
                    break
                }
                case 'tcp': {
                    const [host, port] = monitor.target.split(':')
                    probeResult = await probeTcp(host, parseInt(port || '80'))
                    break
                }
                case 'icmp': {
                    probeResult = await probeIcmp(monitor.target)
                    break
                }
                case 'dns': {
                    probeResult = await probeDns(monitor.target)
                    break
                }
                case 'ssl': {
                    const [sslHost, sslPort] = monitor.target.split(':')
                    probeResult = await probeSsl(sslHost, parseInt(sslPort || '443'))
                    break
                }
                default: {
                    return { status: 'error', message: 'Unknown monitor type' }
                }
            }

            const evaluation = evaluateResult(monitor, probeResult)

            // Save check result
            await (prisma.monitorCheck as any).create({
                data: {
                    monitorId: monitor.id,
                    status: evaluation.status,
                    latency: Math.floor(probeResult.latency),
                    message: evaluation.message || probeResult.message,
                    statusCode: probeResult.statusCode,
                    region: env.REGION || 'unknown',
                }
            })

            // Update monitor status
            await prisma.monitor.update({
                where: { id: monitor.id },
                data: {
                    status: evaluation.status,
                    lastCheckAt: new Date(),
                }
            })

            // Handle incidents
            await incidentManager.handleResult(
                monitor.id,
                evaluation.status,
                monitor.organizationId,
                evaluation.message || probeResult.message
            )

            return { status: 'ok', result: evaluation.status }
        } catch (err: any) {
            logger.error({ jobId: job.id, err: err.message }, 'error processing job')
            return { status: 'error', message: err.message }
        } finally {
            await lockManager.release(monitorId)
        }
    },
    {
        // @ts-expect-error - version mismatch between ioredis and bullmq types
        connection,
        concurrency: env.CONCURRENCY,
        removeOnComplete: { count: 100 },
        removeOnFail: { count: 1000 },
    }
)

worker.on('active', (job) => {
    logger.debug({ jobId: job.id }, 'job active')
})

worker.on('completed', (job) => {
    logger.info({ jobId: job.id }, 'job completed')
})

worker.on('failed', (job, err) => {
    logger.error({ jobId: job?.id, error: err.message }, 'job failed')
})

worker.on('error', (err) => {
    logger.error({ error: err.message }, 'worker error')
})

process.on('SIGTERM', async () => {
    logger.info('SIGTERM received, shutting down worker...')
    await worker.close()
    await scheduler.stop()
    await heartbeat.stop()
    await connection.quit()
    process.exit(0)
})

process.on('SIGINT', async () => {
    logger.info('SIGINT received, shutting down worker...')
    await worker.close()
    await scheduler.stop()
    await heartbeat.stop()
    await connection.quit()
    process.exit(0)
})
