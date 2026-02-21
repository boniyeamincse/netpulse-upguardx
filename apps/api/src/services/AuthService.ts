import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
// @ts-expect-error - otplib types can be tricky with some module resolutions
import { authenticator } from 'otplib'
import QRCode from 'qrcode'
import { env } from '../env'

export class AuthService {
    private static readonly SALT_ROUNDS = 10

    static async hashPassword(password: string): Promise<string> {
        return bcrypt.hash(password, this.SALT_ROUNDS)
    }

    static async comparePassword(password: string, hash: string): Promise<boolean> {
        return bcrypt.compare(password, hash)
    }

    static generateToken(payload: { userId: string; orgId: string; role: string }): string {
        return jwt.sign(payload, env.JWT_SECRET, { expiresIn: '1d' })
    }

    static verifyToken(token: string): any {
        try {
            return jwt.verify(token, env.JWT_SECRET)
        } catch {
            return null
        }
    }

    static generateTwoFactorSecret(): string {
        return authenticator.generateSecret()
    }

    static async generateQrCode(email: string, secret: string): Promise<string> {
        const otpauth = authenticator.keyuri(email, 'NetPulse UpGuardX', secret)
        return QRCode.toDataURL(otpauth)
    }

    static verifyTwoFactorToken(token: string, secret: string): boolean {
        return authenticator.verify({ token, secret })
    }
}
