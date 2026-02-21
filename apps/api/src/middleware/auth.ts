import { FastifyRequest } from 'fastify'
import { ApiKeyService } from '../services/ApiKeyService'

export const authenticate = async (request: FastifyRequest) => {
    // 1. Check for API Key first
    const apiKey = request.headers['x-api-key'] as string
    if (apiKey) {
        const result = await ApiKeyService.validateKey(apiKey)
        if (result) {
            request.user = { orgId: result.organizationId, role: 'api_key' } as any
            return
        }
    }

    // 2. Fallback to JWT
    await request.jwtVerify()
}

// Wrapper to provide tenant context to Prisma
export const withTenant = async (request: FastifyRequest) => {
    const user = request.user as { orgId: string } | undefined
    if (user?.orgId) {
        // This is handled by the route or a decorator
    }
}
