import { FastifyReply, FastifyRequest } from 'fastify'
import Redis from 'ioredis'
import { env } from '../env'

const redis = new Redis(env.REDIS_URL)

export const rateLimit = (limit: number, windowSeconds: number) => {
    return async (request: FastifyRequest, reply: FastifyReply) => {
        const key = `ratelimit:${request.ip}:${request.routerPath}`

        const count = await redis.incr(key)

        if (count === 1) {
            await redis.expire(key, windowSeconds)
        }

        if (count > limit) {
            reply.status(429).send({
                success: false,
                error: {
                    code: 'TOO_MANY_REQUESTS',
                    message: 'Rate limit exceeded',
                },
            })
        }
    }
}
