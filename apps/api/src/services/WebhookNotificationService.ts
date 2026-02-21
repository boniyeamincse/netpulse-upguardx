import axios from 'axios'

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

            const response = await axios.post(webhookUrl, payload, {
                timeout: 10000,
                headers: {
                    'Content-Type': 'application/json',
                    'User-Agent': 'NetPulse/1.0',
                },
            })

            // Check for successful response
            return response.status >= 200 && response.status < 300
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

            const response = await axios.post(webhookUrl, testPayload, {
                timeout: 10000,
            })

            if (response.status >= 200 && response.status < 300) {
                return { success: true, message: 'Webhook is working correctly' }
            } else {
                return { success: false, message: `Received status code ${response.status}` }
            }
        } catch (error: any) {
            return { success: false, message: error.message }
        }
    }
}
