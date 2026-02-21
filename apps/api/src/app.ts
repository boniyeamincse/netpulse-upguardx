import fastify, { FastifyInstance, FastifyRequest } from 'fastify'
import { env } from './env'
import { registerPlugins } from './plugins'
import { authRoutes } from './routes/auth'
import { orgRoutes } from './routes/orgs'

// Wrapper to provide tenant context to Prisma
export const withTenant = async (request: FastifyRequest) => {
    const user = request.user as { orgId: string } | undefined
    if (user?.orgId) {
        // tenantContext logic
    }
}

export const createApp = async (): Promise<FastifyInstance> => {
    const app = fastify({
        logger: {
            level: env.LOG_LEVEL,
            transport: env.NODE_ENV === 'development' ? { target: 'pino-pretty' } : undefined,
        },
    })

    // Register Plugins (Swagger, JWT, etc.)
    await registerPlugins(app)

    // Global Tenant Context Middleware
    app.addHook('preHandler', withTenant)

    // Register Routes
    await app.register(authRoutes, { prefix: '/api/v1/auth' })
    await app.register(orgRoutes, { prefix: '/api/v1/orgs' })

    // Global Error Handler
    app.setErrorHandler((error: any, request, reply) => {
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
    app.get('/api/v1/health', async () => {
        return { status: 'ok', timestamp: new Date().toISOString() }
    })

    return app
}
