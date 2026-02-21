import axios from 'axios'

export class SlackNotificationService {
    /**
     * Send alert to Slack webhook
     */
    static async sendAlert({
        webhookUrl,
        monitorName,
        status,
        message,
        target,
    }: {
        webhookUrl: string
        monitorName: string
        status: 'up' | 'down' | 'degraded'
        message: string
        target?: string
    }): Promise<boolean> {
        try {
            const color = status === 'up' ? '#10b981' : status === 'down' ? '#ef4444' : '#f59e0b'
            const emoji = status === 'up' ? '✅' : status === 'down' ? '🔴' : '⚠️'

            const payload = {
                attachments: [
                    {
                        color,
                        title: `${emoji} ${monitorName} - ${status.toUpperCase()}`,
                        text: message,
                        fields: [
                            {
                                title: 'Target',
                                value: target || 'N/A',
                                short: true,
                            },
                            {
                                title: 'Time',
                                value: new Date().toLocaleString(),
                                short: true,
                            },
                        ],
                        footer: 'NetPulse Alerts',
                        ts: Math.floor(Date.now() / 1000),
                    },
                ],
            }

            await axios.post(webhookUrl, payload)
            return true
        } catch (error: any) {
            console.error('Slack notification failed:', error.message)
            return false
        }
    }
}
