import fastify, { FastifyInstance } from 'fastify'
import { env } from './env'

export const createApp = (): FastifyInstance => {
    const app = fastify({
        logger: {
            level: env.LOG_LEVEL,
            transport: env.NODE_ENV === 'development' ? { target: 'pino-pretty' } : undefined,
        },
    })

    // Global Error Handler
    app.setErrorHandler((error, request, reply) => {
        app.log.error(error)

        if (error.validation) {
            return reply.status(400).send({
                success: false,
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'Invalid input data',
                    details: error.validation,
                },
            })
        }

        reply.status(500).send({
            success: false,
            error: {
                code: 'INTERNAL_SERVER_ERROR',
                message: 'An unexpected error occurred',
            },
        })
    })

    // Health Check
    app.get('/health', async () => {
        return { status: 'ok', timestamp: new Date().toISOString() }
    })

    return app
}
