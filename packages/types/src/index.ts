export type MonitorStatus = 'up' | 'down' | 'degraded' | 'pending'

export interface Monitor {
    id: string
    name: string
    type: 'http' | 'https' | 'tcp' | 'icmp' | 'dns' | 'ssl'
    target: string
    status: MonitorStatus
    lastCheckedAt?: string
}

export interface User {
    id: string
    email: string
    role: 'super_admin' | 'admin' | 'viewer'
    organizationId: string
}
