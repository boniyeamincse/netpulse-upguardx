export interface ProbeResult {
    status: 'up' | 'down' | 'degraded'
    latency: number
    statusCode?: number
    message?: string
    records?: string[]
    daysRemaining?: number
    validTo?: string
}
