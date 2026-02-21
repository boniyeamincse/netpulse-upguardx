import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma } from '../lib/prisma'
import { AuthService } from '../services/AuthService'
import { AuditService } from '../services/AuditService'
import { authenticate } from '../middleware/auth'
import crypto from 'crypto'
import { authenticator } from 'otplib'
import QRCode from 'qrcode'

const registerSchema = z.object({
    email: z.string().email(),
    password: z.string().min(8),
    orgName: z.string().min(2),
})

const loginSchema = z.object({
    email: z.string().email(),
    password: z.string(),
})

export const authRoutes = async (app: FastifyInstance) => {
    app.post('/register', {
        schema: {
            body: {
                type: 'object',
                required: ['email', 'password', 'orgName'],
                properties: {
                    email: { type: 'string' },
                    password: { type: 'string' },
                    orgName: { type: 'string' },
                },
            },
        },
        handler: async (request, reply) => {
            const { email, password, orgName } = registerSchema.parse(request.body)

            const existingUser = await prisma.user.findUnique({ where: { email } })
            if (existingUser) {
                return reply.status(400).send({ success: false, message: 'User already exists' })
            }

            const passwordHash = await AuthService.hashPassword(password)
            const slug = orgName.toLowerCase().replace(/\s+/g, '-')

            const org = await prisma.organization.create({
                data: {
                    name: orgName,
                    slug,
                    users: {
                        create: {
                            email,
                            passwordHash,
                            role: 'owner',
                        },
                    },
                },
                include: { users: true },
            })

            const user = org.users[0]
            const token = AuthService.generateToken({ userId: user.id, orgId: org.id, role: user.role })

            await AuditService.log({
                action: 'USER_REGISTER',
                resource: 'user',
                resourceId: user.id,
                organizationId: org.id,
                payload: { email },
            })

            return { success: true, token, user: { id: user.id, email: user.email, orgId: org.id } }
        },
    })

    app.post('/login', async (request, reply) => {
        const { email, password } = loginSchema.parse(request.body)
        const user = await prisma.user.findUnique({ where: { email } })

        if (!user || !(await AuthService.comparePassword(password, user.passwordHash))) {
            return reply.status(401).send({ success: false, message: 'Invalid credentials' })
        }

        const token = AuthService.generateToken({ userId: user.id, orgId: user.organizationId, role: user.role })

        return { success: true, token, user: { id: user.id, email: user.email, orgId: user.organizationId } }
    })

    app.post('/forgot-password', async (request, reply) => {
        const { email } = z.object({ email: z.string().email() }).parse(request.body)
        
        const user = await prisma.user.findUnique({ where: { email } })
        
        // Always return success for security (don't reveal if email exists)
        if (!user) {
            return { success: true, message: 'If the email exists, a reset link has been sent' }
        }

        // Generate reset token (expires in 1 hour)
        const resetToken = crypto.randomBytes(32).toString('hex')
        const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex')
        const resetTokenExpiry = new Date(Date.now() + 3600000) // 1 hour

        await prisma.user.update({
            where: { id: user.id },
            data: {
                passwordResetToken: resetTokenHash,
                passwordResetExpiry: resetTokenExpiry,
            }
        })

        // TODO: Send email with reset link to user.email
        // const resetLink = `${process.env.WEB_URL}/reset-password?token=${resetToken}`
        // await sendEmail(user.email, 'Reset Your Password', resetLink)

        await AuditService.log({
            action: 'PASSWORD_RESET_REQUEST',
            resource: 'user',
            resourceId: user.id,
            organizationId: user.organizationId,
            payload: { email },
        })

        return { success: true, message: 'If the email exists, a reset link has been sent' }
    })

    app.post('/reset-password', async (request, reply) => {
        const { token, password } = z.object({
            token: z.string(),
            password: z.string().min(8),
        }).parse(request.body)

        const resetTokenHash = crypto.createHash('sha256').update(token).digest('hex')
        
        const user = await prisma.user.findFirst({
            where: {
                passwordResetToken: resetTokenHash,
                passwordResetExpiry: { gt: new Date() }
            }
        })

        if (!user) {
            return reply.status(400).send({ success: false, message: 'Invalid or expired reset link' })
        }

        const passwordHash = await AuthService.hashPassword(password)

        await prisma.user.update({
            where: { id: user.id },
            data: {
                passwordHash,
                passwordResetToken: null,
                passwordResetExpiry: null,
            }
        })

        await AuditService.log({
            action: 'PASSWORD_RESET_SUCCESS',
            resource: 'user',
            resourceId: user.id,
            organizationId: user.organizationId,
            payload: { email: user.email },
        })

        return { success: true, message: 'Password has been reset successfully' }
    })

    // 2FA: Generate QR Code
    app.post<{ Headers: { authorization?: string } }>('/2fa/generate', {
        preHandler: authenticate,
        handler: async (request, reply) => {
            const userId = (request as any).user?.userId
            if (!userId) {
                return reply.status(401).send({ success: false, message: 'Unauthorized' })
            }

            const user = await prisma.user.findUnique({ where: { id: userId } })
            if (!user) {
                return reply.status(404).send({ success: false, message: 'User not found' })
            }

            if (user.twoFactorEnabled) {
                return reply.status(400).send({ success: false, message: '2FA is already enabled' })
            }

            // Generate secret
            const secret = authenticator.generateSecret()

            // Generate QR code
            const otpauthUrl = authenticator.keyuri(user.email, 'NetPulse', secret)
            const qrCode = await QRCode.toDataURL(otpauthUrl)

            // Generate backup codes
            const backupCodes = Array.from({ length: 10 }, () =>
                crypto.randomBytes(4).toString('hex').toUpperCase()
            )

            // Store in session temporarily (expires in 10 minutes)
            // In production, you'd use Redis or session store
            const setupToken = crypto.randomBytes(32).toString('hex')

            await AuditService.log({
                action: '2FA_GENERATION_STARTED',
                resource: 'user',
                resourceId: user.id,
                organizationId: user.organizationId,
            })

            return {
                success: true,
                secret,
                qrCode,
                backupCodes,
                setupToken,
                expiresIn: 600, // 10 minutes
            }
        },
    })

    // 2FA: Verify & Enable
    app.post<{ Headers: { authorization?: string } }>('/2fa/verify', {
        preHandler: authenticate,
        handler: async (request, reply) => {
            const userId = (request as any).user?.userId
            if (!userId) {
                return reply.status(401).send({ success: false, message: 'Unauthorized' })
            }

            const { token, secret } = z.object({
                token: z.string().length(6, 'Token must be 6 digits'),
                secret: z.string(),
            }).parse(request.body)

            const user = await prisma.user.findUnique({ where: { id: userId } })
            if (!user) {
                return reply.status(404).send({ success: false, message: 'User not found' })
            }

            // Verify token
            const isValid = authenticator.check(token, secret)
            if (!isValid) {
                return reply.status(400).send({ success: false, message: 'Invalid verification code' })
            }

            // Generate backup codes
            const backupCodes = Array.from({ length: 10 }, () =>
                crypto.randomBytes(4).toString('hex').toUpperCase()
            )
            const backupCodesHash = backupCodes.map(code =>
                crypto.createHash('sha256').update(code).digest('hex')
            )

            // Enable 2FA
            await prisma.user.update({
                where: { id: user.id },
                data: {
                    twoFactorEnabled: true,
                    twoFactorSecret: secret,
                },
            })

            await AuditService.log({
                action: '2FA_ENABLED',
                resource: 'user',
                resourceId: user.id,
                organizationId: user.organizationId,
            })

            return {
                success: true,
                message: '2FA enabled successfully',
                backupCodes,
            }
        },
    })

    // 2FA: Disable
    app.post<{ Headers: { authorization?: string } }>('/2fa/disable', {
        preHandler: authenticate,
        handler: async (request, reply) => {
            const userId = (request as any).user?.userId
            if (!userId) {
                return reply.status(401).send({ success: false, message: 'Unauthorized' })
            }

            const user = await prisma.user.findUnique({ where: { id: userId } })
            if (!user) {
                return reply.status(404).send({ success: false, message: 'User not found' })
            }

            await prisma.user.update({
                where: { id: user.id },
                data: {
                    twoFactorEnabled: false,
                    twoFactorSecret: null,
                },
            })

            await AuditService.log({
                action: '2FA_DISABLED',
                resource: 'user',
                resourceId: user.id,
                organizationId: user.organizationId,
            })

            return { success: true, message: '2FA has been disabled' }
        },
    })
}
