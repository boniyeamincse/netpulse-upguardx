import crypto from 'crypto'
import { prisma } from '../lib/prisma'

export class ApiKeyService {
    static async generateKey(organizationId: string, name: string): Promise<{ id: string; key: string }> {
        const key = `np_${crypto.randomBytes(24).toString('hex')}`

        const apiKey = await prisma.apiKey.create({
            data: {
                name,
                key,
                organizationId,
            },
        })

        return { id: apiKey.id, key }
    }

    static async validateKey(key: string): Promise<{ organizationId: string } | null> {
        const apiKey = await prisma.apiKey.findUnique({
            where: { key },
            select: { organizationId: true },
        })

        if (apiKey) {
            await prisma.apiKey.update({
                where: { key },
                data: { lastUsedAt: new Date() },
            })
        }

        return apiKey
    }
}
