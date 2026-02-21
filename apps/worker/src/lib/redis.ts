import IORedis from 'ioredis'
import { env } from '../config/env'

export const connection = new IORedis(env.REDIS_URL, {
    maxRetriesPerRequest: null,
})

// BullMQ recommends a separate connection for blocking commands if needed, 
// but for simple workers the same connection with maxRetriesPerRequest: null is often used.
