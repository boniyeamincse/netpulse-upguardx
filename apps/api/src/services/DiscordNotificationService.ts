export class DiscordNotificationService {
    /**
     * Send alert to Discord webhook
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
            const color =
                status === 'up' ? 0x10b981 : // green
                status === 'down' ? 0xef4444 : // red
                0xf59e0b // amber

            const emoji = status === 'up' ? '✅' : status === 'down' ? '🔴' : '⚠️'

            const embed = {
                title: `${emoji} ${monitorName}`,
                description: message,
                color,
                fields: [
                    {
                        name: 'Status',
                        value: status.toUpperCase(),
                        inline: true,
                    },
                    {
                        name: 'Target',
                        value: target || 'N/A',
                        inline: true,
                    },
                    {
                        name: 'Time',
                        value: new Date().toLocaleString(),
                        inline: false,
                    },
                ],
                footer: {
                    text: 'NetPulse Monitoring',
                },
                timestamp: new Date().toISOString(),
            }

            const payload = {
                embeds: [embed],
            }

            const response = await fetch(webhookUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            })
            return response.ok
        } catch (error: any) {
            console.error('Discord notification failed:', error.message)
            return false
        }
    }
}
