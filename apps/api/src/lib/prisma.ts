import { PrismaClient } from '@prisma/client'
import { AsyncLocalStorage } from 'async_hooks'

// Context to store the current organization ID
export const tenantContext = new AsyncLocalStorage<{ orgId: string }>()

const prismaClient = new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
})

// Prisma extension for Multi-Tenancy
export const prisma = prismaClient.$extends({
    query: {
        $allModels: {
            async $allOperations({ model, operation, args, query }: any) {
                const context = tenantContext.getStore()

                // Skip multi-tenancy for models that don't belong to an organization (e.g., Organization itself)
                if (!context?.orgId || model === 'Organization') {
                    return query(args)
                }

                // Apply orgId filter to all find/update/delete operations
                if (
                    operation === 'findFirst' ||
                    operation === 'findMany' ||
                    operation === 'update' ||
                    operation === 'updateMany' ||
                    operation === 'delete' ||
                    operation === 'deleteMany' ||
                    operation === 'count'
                ) {
                    args.where = { ...args.where, organizationId: context.orgId }
                }

                // Apply orgId to creates
                if (operation === 'create') {
                    args.data = { ...args.data, organizationId: context.orgId }
                }

                if (operation === 'createMany') {
                    if (Array.isArray(args.data)) {
                        args.data = args.data.map((item: any) => ({ ...item, organizationId: context.orgId }))
                    }
                }

                return query(args)
            },
        },
    },
})
