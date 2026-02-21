export class WebhookNotificationService {
    /**
     * Send alert via custom webhook
     */
    static async sendAlert({
        webhookUrl,
        monitorName,
        status,
        message,
        target,
        metadata,
    }: {
        webhookUrl: string
        monitorName: string
        status: 'up' | 'down' | 'degraded'
        message: string
        target?: string
        metadata?: Record<string, any>
    }): Promise<boolean> {
        try {
            const payload = {
                monitor: monitorName,
                status,
                message,
                target,
                timestamp: new Date().toISOString(),
                metadata,
            }

            const controller = new AbortController()
            const timeout = setTimeout(() => controller.abort(), 10000)
            const response = await fetch(webhookUrl, {
                method: 'POST',
                signal: controller.signal,
                headers: {
                    'Content-Type': 'application/json',
                    'User-Agent': 'NetPulse/1.0',
                },
                body: JSON.stringify(payload),
            })
            clearTimeout(timeout)

            return response.ok
        } catch (error: any) {
            console.error('Webhook notification failed:', error.message)
            return false
        }
    }

    /**
     * Test webhook connectivity
     */
    static async testWebhook(webhookUrl: string): Promise<{ success: boolean; message: string }> {
        try {
            const testPayload = {
                type: 'test',
                message: 'This is a test webhook from NetPulse',
                timestamp: new Date().toISOString(),
            }

            const controller = new AbortController()
            const timeout = setTimeout(() => controller.abort(), 10000)
            const response = await fetch(webhookUrl, {
                method: 'POST',
                signal: controller.signal,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(testPayload),
            })
            clearTimeout(timeout)

            if (response.ok) {
                return { success: true, message: 'Webhook is working correctly' }
            } else {
                return { success: false, message: `Received status code ${response.status}` }
            }
        } catch (error: any) {
            return { success: false, message: error.message }
        }
    }
}
