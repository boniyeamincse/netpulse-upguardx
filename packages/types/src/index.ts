// Monitor Types
export type MonitorStatus = 'up' | 'down' | 'degraded' | 'pending' | 'paused'
export type MonitorType = 'http' | 'tcp' | 'icmp' | 'dns' | 'ssl'

export interface Monitor {
    id: string
    name: string
    type: MonitorType
    target: string
    status: MonitorStatus
    interval: number
    lastCheckAt?: string
    createdAt: string
    updatedAt: string
    organizationId: string
    metadata?: Record<string, any>
}

export interface MonitorCheck {
    id: string
    monitorId: string
    status: string
    latency: number
    message?: string
    statusCode?: number
    region?: string
    createdAt: string
}

// User Types
export interface User {
    id: string
    email: string
    name?: string
    role: 'owner' | 'admin' | 'editor' | 'viewer'
    organizationId: string
    twoFactorEnabled: boolean
    createdAt: string
    updatedAt: string
}

// Organization Types
export interface Organization {
    id: string
    name: string
    slug: string
    plan: string
    createdAt: string
    updatedAt: string
}

// Incident Types
export type IncidentStatus = 'open' | 'resolved' | 'investigating' | 'identified' | 'monitoring'
export type IncidentSeverity = 'critical' | 'error' | 'warning'

export interface Incident {
    id: string
    monitorId: string
    monitorName: string
    organizationId: string
    status: IncidentStatus
    severity: IncidentSeverity
    startedAt: string
    resolvedAt?: string
    message?: string
    createdAt: string
    updatedAt: string
}

// API Key Types
export interface ApiKey {
    id: string
    name: string
    key: string
    organizationId: string
    lastUsedAt?: string
    createdAt: string
}

// Alert Types
export interface AlertChannel {
    id: string
    name: string
    type: 'email' | 'slack' | 'discord' | 'telegram' | 'webhook'
    config: Record<string, any>
    isActive: boolean
    organizationId: string
    createdAt: string
}

export interface AlertRule {
    id: string
    monitorId: string
    channelId: string
    triggerOn: 'down' | 'degraded' | 'up'
    cooldownMinutes: number
    organizationId: string
    createdAt: string
}

// API Response Types
export interface ApiResponse<T> {
    success: boolean
    data?: T
    message?: string
    error?: string
}
