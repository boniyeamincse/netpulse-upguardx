import { connection } from '../lib/redis'

export class LockManager {
    /**
     * Attempts to acquire a lock for a given resource
     * @param resource The resource to lock
     * @param ttl Time to live in milliseconds
     */
    async acquire(resource: string, ttl: number = 30000): Promise<boolean> {
        const key = `lock:${resource}`
        const result = await connection.set(key, 'locked', 'PX', ttl, 'NX')
        return result === 'OK'
    }

    /**
     * Releases a lock for a given resource
     */
    async release(resource: string) {
        const key = `lock:${resource}`
        await connection.del(key)
    }
}

export const lockManager = new LockManager()
