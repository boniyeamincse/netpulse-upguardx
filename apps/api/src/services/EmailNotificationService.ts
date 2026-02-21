let nodemailer: any
try {
    nodemailer = require('nodemailer')
} catch (e) {
    console.warn('⚠️ nodemailer not installed - email notifications disabled')
    nodemailer = null
}

interface EmailAlertConfig {
    smtpHost?: string
    smtpPort?: number
    smtpUser?: string
    smtpPass?: string
}

export class EmailNotificationService {
    private static transporter: any = null

    static initializeTransporter(config: EmailAlertConfig) {
        if (!nodemailer) {
            console.warn('✉️ Email notifications disabled - nodemailer not installed')
            return null
        }

        // Use environment variables or provided config
        const smtpHost = config.smtpHost || process.env.SMTP_HOST || 'localhost'
        const smtpPort = config.smtpPort || parseInt(process.env.SMTP_PORT || '587')
        const smtpUser = config.smtpUser || process.env.SMTP_USER
        const smtpPass = config.smtpPass || process.env.SMTP_PASS
        const fromEmail = process.env.SMTP_FROM_EMAIL || 'alerts@netpulse.io'

        this.transporter = nodemailer.createTransport({
            host: smtpHost,
            port: smtpPort,
            secure: smtpPort === 465, // Use TLS for 587, SSL for 465
            auth: smtpUser ? {
                user: smtpUser,
                pass: smtpPass,
            } : undefined,
        })

        return this.transporter
    }

    /**
     * Send an email alert
     */
    static async sendAlert({
        email,
        monitorName,
        status,
        message,
    }: {
        email: string
        monitorName: string
        status: 'up' | 'down' | 'degraded'
        message: string
    }): Promise<boolean> {
        try {
            if (!nodemailer) {
                console.warn('✉️ Email service disabled (nodemailer not installed). Alert not sent.')
                return false
            }

            if (!this.transporter) {
                this.initializeTransporter({})
            }

            const htmlContent = this.generateEmailHTML(monitorName, status, message)

            const mailOptions = {
                from: process.env.SMTP_FROM_EMAIL || 'alerts@netpulse.io',
                to: email,
                subject: `[${status.toUpperCase()}] Alert: ${monitorName}`,
                html: htmlContent,
                text: message,
            }

            await this.transporter!.sendMail(mailOptions)
            return true
        } catch (error: any) {
            console.error('Email sending failed:', error.message)
            return false
        }
    }

    /**
     * Test email configuration
     */
    static async testConnection(email: string, config: EmailAlertConfig): Promise<boolean> {
        try {
            if (!nodemailer) {
                console.warn('✉️ Email service disabled (nodemailer not installed)')
                return false
            }

            const transporter = nodemailer.createTransport({
                host: config.smtpHost || process.env.SMTP_HOST,
                port: config.smtpPort || parseInt(process.env.SMTP_PORT || '587'),
                secure: (config.smtpPort || 587) === 465,
                auth: config.smtpUser ? {
                    user: config.smtpUser,
                    pass: config.smtpPass,
                } : undefined,
            })

            await transporter.verify()
            
            // Send test email
            await transporter.sendMail({
                from: process.env.SMTP_FROM_EMAIL || 'alerts@netpulse.io',
                to: email,
                subject: 'NetPulse Email Alert Test',
                html: '<p>This is a test email from NetPulse. If you received this, your email configuration is working correctly!</p>',
            })

            return true
        } catch (error: any) {
            console.error('Email test failed:', error.message)
            return false
        }
    }

    private static generateEmailHTML(monitorName: string, status: string, message: string): string {
        const statusColor = status === 'up' ? '#10b981' : status === 'down' ? '#ef4444' : '#f59e0b'
        const statusBg = status === 'up' ? '#ecfdf5' : status === 'down' ? '#fef2f2' : '#fffbeb'

        return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>NetPulse Alert</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333;">
    <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <!-- Header -->
        <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="margin: 0; font-size: 24px; color: #1f2937;">NetPulse Alert</h1>
        </div>

        <!-- Status Card -->
        <div style="background: ${statusBg}; border: 2px solid ${statusColor}; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
            <div style="display: flex; align-items: center; gap: 10px;">
                <div style="width: 12px; height: 12px; background: ${statusColor}; border-radius: 50%;"></div>
                <span style="font-size: 18px; font-weight: bold; color: ${statusColor}; text-transform: uppercase;">${status}</span>
            </div>
            <h2 style="margin: 10px 0 0 0; font-size: 20px; color: #1f2937;">${monitorName}</h2>
        </div>

        <!-- Message -->
        <div style="background: #f9fafb; border-radius: 6px; padding: 15px; margin-bottom: 20px;">
            <p style="margin: 0; color: #555;">${message}</p>
        </div>

        <!-- Footer -->
        <div style="text-align: center; color: #999; font-size: 12px; border-top: 1px solid #e5e7eb; padding-top: 15px;">
            <p style="margin: 0;">This alert was sent by NetPulse Monitoring</p>
            <p style="margin: 5px 0 0 0;">© 2026 NetPulse. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
        `
    }
}
