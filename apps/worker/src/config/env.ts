import { z } from 'zod'
import dotenv from 'dotenv'

dotenv.config()

const envSchema = z.object({
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    REDIS_URL: z.string().url().default('redis://localhost:6379'),
    LOG_LEVEL: z.string().default('info'),
    WORKER_ID: z.string().default('worker-1'),
    CONCURRENCY: z.coerce.number().default(10),
    REGION: z.string().default('local'),
})

export const env = envSchema.parse(process.env)
