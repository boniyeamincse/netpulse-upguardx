import { FastifyInstance } from 'fastify'
import fastifySwagger from '@fastify/swagger'
import fastifySwaggerUi from '@fastify/swagger-ui'
import fastifyJwt from '@fastify/jwt'
import fastifyAuth from '@fastify/auth'
import fastifyCors from '@fastify/cors'
import { env } from '../env'

export const registerPlugins = async (app: FastifyInstance) => {
    await app.register(fastifyCors)

    await app.register(fastifyJwt, {
        secret: env.JWT_SECRET,
    })

    await app.register(fastifyAuth)

    await app.register(fastifySwagger, {
        openapi: {
            info: {
                title: 'NetPulse UpGuardX API',
                description: 'Smart Uptime Monitoring & Security Visibility',
                version: '0.1.0',
            },
            components: {
                securitySchemes: {
                    bearerAuth: {
                        type: 'http',
                        scheme: 'bearer',
                        bearerFormat: 'JWT',
                    },
                    apiKey: {
                        type: 'apiKey',
                        name: 'x-api-key',
                        in: 'header',
                    },
                },
            },
        },
    })

    await app.register(fastifySwaggerUi, {
        routePrefix: '/docs',
    })
}
