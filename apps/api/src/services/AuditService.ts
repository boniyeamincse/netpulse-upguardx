import { prisma } from '../lib/prisma'

export class AuditService {
    static async log(params: {
        action: string
        resource: string
        resourceId?: string
        actorId?: string
        payload?: any
        organizationId: string
    }) {
        try {
            await prisma.auditLog.create({
                data: {
                    action: params.action,
                    resource: params.resource,
                    resourceId: params.resourceId,
                    actorId: params.actorId,
                    payload: params.payload,
                    organizationId: params.organizationId,
                },
            })
        } catch (error) {
            console.error('Failed to create audit log:', error)
        }
    }
}
