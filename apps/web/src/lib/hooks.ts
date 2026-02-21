import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { Monitor, MonitorCheck, Incident, ApiKey, AlertChannel, Organization } from '@netpulse/types'

// ============================================
// User Hooks
// ============================================

export function useUser() {
    return useQuery({
        queryKey: ['user'],
        queryFn: async () => {
            const response = await api.get('auth/me').json<{ success: boolean; user: { id: string; name: string; email: string; role: string } }>()
            return response.user
        },
        staleTime: 5 * 60 * 1000, // 5 minutes
    })
}

export function useUpdateProfile() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: async (data: { name?: string; email?: string }) => {
            const response = await api
                .put('auth/profile', { json: data })
                .json<{ success: boolean; user: { id: string; name: string; email: string } }>()
            return response.user
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['user'] })
        },
    })
}

export function useChangePassword() {
    return useMutation({
        mutationFn: async (data: { currentPassword: string; newPassword: string }) => {
            const response = await api
                .post('auth/change-password', { json: data })
                .json<{ success: boolean; message: string }>()
            return response
        },
    })
}

// ============================================
// Monitor Hooks
// ============================================

export function useMonitors(params?: {
    status?: string
    type?: string
    search?: string
    page?: number
    limit?: number
}) {
    const searchParams = new URLSearchParams()
    if (params?.status && params.status !== 'all') searchParams.set('status', params.status)
    if (params?.type && params.type !== 'all') searchParams.set('type', params.type)
    if (params?.search) searchParams.set('search', params.search)
    if (params?.page) searchParams.set('page', params.page.toString())
    if (params?.limit) searchParams.set('limit', params.limit.toString())

    const queryString = searchParams.toString()
    const endpoint = queryString ? `monitors?${queryString}` : 'monitors'

    return useQuery({
        queryKey: ['monitors', params],
        queryFn: async () => {
            const response = await api.get(endpoint).json<{ 
                success: boolean; 
                monitors: Monitor[];
                pagination?: { page: number; limit: number; total: number; totalPages: number }
            }>()
            return response
        },
        staleTime: 30000, // 30 seconds
    })
}

export function useMonitor(id: string) {
    return useQuery({
        queryKey: ['monitor', id],
        queryFn: async () => {
            const response = await api.get(`monitors/${id}`).json<{ success: boolean; monitor: Monitor }>()
            return response.monitor
        },
        enabled: !!id,
    })
}

export function useMonitorChecks(id: string, params?: { 
    startDate?: string
    endDate?: string
    limit?: number 
}) {
    const searchParams = new URLSearchParams()
    if (params?.startDate) searchParams.set('startDate', params.startDate)
    if (params?.endDate) searchParams.set('endDate', params.endDate)
    if (params?.limit) searchParams.set('limit', params.limit.toString())

    const queryString = searchParams.toString()
    const endpoint = queryString ? `monitors/${id}/checks?${queryString}` : `monitors/${id}/checks`

    return useQuery({
        queryKey: ['monitorChecks', id, params],
        queryFn: async () => {
            const response = await api
                .get(endpoint)
                .json<{ success: boolean; checks: MonitorCheck[] }>()
            return response.checks
        },
        enabled: !!id,
        refetchInterval: 30000, // Refetch every 30 seconds
    })
}

export function useMonitorStats(id: string, period: '24h' | '7d' | '30d' = '24h') {
    return useQuery({
        queryKey: ['monitorStats', id, period],
        queryFn: async () => {
            const response = await api
                .get(`monitors/${id}/stats?period=${period}`)
                .json<{ 
                    success: boolean; 
                    stats: {
                        uptime: number
                        avgLatency: number
                        totalChecks: number
                        failedChecks: number
                        incidents: number
                    }
                }>()
            return response.stats
        },
        enabled: !!id,
        refetchInterval: 60000, // Refetch every minute
    })
}

export function useCreateMonitor() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: async (data: Partial<Monitor>) => {
            const response = await api
                .post('monitors', { json: data })
                .json<{ success: boolean; monitor: Monitor }>()
            return response.monitor
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['monitors'] })
            queryClient.invalidateQueries({ queryKey: ['dashboardStats'] })
        },
    })
}

export function useUpdateMonitor(id: string) {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: async (data: Partial<Monitor>) => {
            const response = await api
                .put(`monitors/${id}`, { json: data })
                .json<{ success: boolean; monitor: Monitor }>()
            return response.monitor
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['monitor', id] })
            queryClient.invalidateQueries({ queryKey: ['monitors'] })
        },
    })
}

export function useDeleteMonitor() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: async (id: string) => {
            await api.delete(`monitors/${id}`).json()
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['monitors'] })
            queryClient.invalidateQueries({ queryKey: ['dashboardStats'] })
        },
    })
}

export function usePauseMonitor() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: async (id: string) => {
            const response = await api
                .post(`monitors/${id}/pause`)
                .json<{ success: boolean; monitor: Monitor }>()
            return response.monitor
        },
        onSuccess: (_, id) => {
            queryClient.invalidateQueries({ queryKey: ['monitor', id] })
            queryClient.invalidateQueries({ queryKey: ['monitors'] })
        },
    })
}

export function useResumeMonitor() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: async (id: string) => {
            const response = await api
                .post(`monitors/${id}/resume`)
                .json<{ success: boolean; monitor: Monitor }>()
            return response.monitor
        },
        onSuccess: (_, id) => {
            queryClient.invalidateQueries({ queryKey: ['monitor', id] })
            queryClient.invalidateQueries({ queryKey: ['monitors'] })
        },
    })
}

export function useTriggerCheck() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: async (id: string) => {
            const response = await api
                .post(`monitors/${id}/check`)
                .json<{ success: boolean; check: MonitorCheck }>()
            return response.check
        },
        onSuccess: (_, id) => {
            queryClient.invalidateQueries({ queryKey: ['monitorChecks', id] })
            queryClient.invalidateQueries({ queryKey: ['monitor', id] })
        },
    })
}

// ============================================
// Dashboard Stats Hooks
// ============================================

export function useDashboardStats() {
    return useQuery({
        queryKey: ['dashboardStats'],
        queryFn: async () => {
            const response = await api
                .get('stats/summary')
                .json<{ 
                    success: boolean; 
                    total: number
                    up: number
                    down: number
                    degraded: number
                    paused: number
                    avgUptime: number
                    avgLatency: number
                    incidents24h: number
                }>()
            return response
        },
        refetchInterval: 60000, // Refetch every minute
    })
}

export function useRecentIncidents(limit: number = 5) {
    return useQuery({
        queryKey: ['recentIncidents', limit],
        queryFn: async () => {
            const response = await api
                .get(`incidents?limit=${limit}`)
                .json<{ success: boolean; incidents: Incident[] }>()
            return response.incidents
        },
        refetchInterval: 60000,
    })
}

// ============================================
// Incident Hooks
// ============================================

export function useIncidents(params?: {
    status?: string
    monitorId?: string
    startDate?: string
    endDate?: string
    page?: number
    limit?: number
}) {
    const searchParams = new URLSearchParams()
    if (params?.status && params.status !== 'all') searchParams.set('status', params.status)
    if (params?.monitorId) searchParams.set('monitorId', params.monitorId)
    if (params?.startDate) searchParams.set('startDate', params.startDate)
    if (params?.endDate) searchParams.set('endDate', params.endDate)
    if (params?.page) searchParams.set('page', params.page.toString())
    if (params?.limit) searchParams.set('limit', params.limit.toString())

    const queryString = searchParams.toString()
    const endpoint = queryString ? `incidents?${queryString}` : 'incidents'

    return useQuery({
        queryKey: ['incidents', params],
        queryFn: async () => {
            const response = await api.get(endpoint).json<{ 
                success: boolean
                incidents: Incident[]
                pagination?: { page: number; limit: number; total: number; totalPages: number }
            }>()
            return response
        },
        refetchInterval: 60000,
    })
}

export function useIncident(id: string) {
    return useQuery({
        queryKey: ['incident', id],
        queryFn: async () => {
            const response = await api.get(`incidents/${id}`).json<{ success: boolean; incident: Incident }>()
            return response.incident
        },
        enabled: !!id,
    })
}

export function useResolveIncident() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: async (id: string) => {
            const response = await api
                .post(`incidents/${id}/resolve`)
                .json<{ success: boolean; incident: Incident }>()
            return response.incident
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['incidents'] })
            queryClient.invalidateQueries({ queryKey: ['recentIncidents'] })
            queryClient.invalidateQueries({ queryKey: ['dashboardStats'] })
        },
    })
}

export function useAcknowledgeIncident() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: async (id: string) => {
            const response = await api
                .post(`incidents/${id}/acknowledge`)
                .json<{ success: boolean; incident: Incident }>()
            return response.incident
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['incidents'] })
            queryClient.invalidateQueries({ queryKey: ['recentIncidents'] })
        },
    })
}

// ============================================
// API Key Hooks
// ============================================

export function useApiKeys() {
    return useQuery({
        queryKey: ['apiKeys'],
        queryFn: async () => {
            const response = await api.get('apikeys').json<{ success: boolean; apiKeys: ApiKey[] }>()
            return response.apiKeys
        },
    })
}

export function useCreateApiKey() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: async (data: { name: string; expiresAt?: string }) => {
            const response = await api
                .post('apikeys', { json: data })
                .json<{ success: boolean; apiKey: ApiKey; key: string }>()
            return response
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['apiKeys'] })
        },
    })
}

export function useDeleteApiKey() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: async (id: string) => {
            await api.delete(`apikeys/${id}`).json()
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['apiKeys'] })
        },
    })
}

// ============================================
// Organization Hooks
// ============================================

export function useOrganization() {
    return useQuery({
        queryKey: ['organization'],
        queryFn: async () => {
            const response = await api.get('orgs/me').json<{ success: boolean; id: string; name: string; slug: string }>()
            return response
        },
    })
}

export function useUpdateOrganization() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: async (data: { name?: string }) => {
            const response = await api
                .put('orgs/me', { json: data })
                .json<{ success: boolean; id: string; name: string }>()
            return response
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['organization'] })
        },
    })
}

export function useOrganizationMembers() {
    return useQuery({
        queryKey: ['organizationMembers'],
        queryFn: async () => {
            const response = await api
                .get('orgs/members')
                .json<{ 
                    success: boolean
                    members: Array<{ id: string; name: string; email: string; role: string; joinedAt: string }>
                }>()
            return response.members
        },
    })
}

export function useInviteMember() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: async (data: { email: string; role: string }) => {
            const response = await api
                .post('orgs/invite', { json: data })
                .json<{ success: boolean; message: string }>()
            return response
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['organizationMembers'] })
        },
    })
}

export function useRemoveMember() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: async (memberId: string) => {
            await api.delete(`orgs/members/${memberId}`).json()
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['organizationMembers'] })
        },
    })
}

export function useUpdateMemberRole() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: async (data: { memberId: string; role: string }) => {
            const response = await api
                .put(`orgs/members/${data.memberId}/role`, { json: { role: data.role } })
                .json<{ success: boolean }>()
            return response
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['organizationMembers'] })
        },
    })
}

// ============================================
// Alert Channel Hooks
// ============================================

export function useAlertChannels() {
    return useQuery({
        queryKey: ['alertChannels'],
        queryFn: async () => {
            const response = await api
                .get('alert-channels')
                .json<{ success: boolean; channels: AlertChannel[] }>()
            return response.channels
        },
    })
}

export function useAlertChannel(id: string) {
    return useQuery({
        queryKey: ['alertChannel', id],
        queryFn: async () => {
            const response = await api
                .get(`alert-channels/${id}`)
                .json<{ success: boolean; channel: AlertChannel }>()
            return response.channel
        },
        enabled: !!id,
    })
}

export function useCreateAlertChannel() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: async (data: Partial<AlertChannel>) => {
            const response = await api
                .post('alert-channels', { json: data })
                .json<{ success: boolean; channel: AlertChannel }>()
            return response.channel
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['alertChannels'] })
        },
    })
}

export function useUpdateAlertChannel() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: async (data: { id: string; updates: Partial<AlertChannel> }) => {
            const response = await api
                .put(`alert-channels/${data.id}`, { json: data.updates })
                .json<{ success: boolean; channel: AlertChannel }>()
            return response.channel
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['alertChannels'] })
        },
    })
}

export function useDeleteAlertChannel() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: async (id: string) => {
            await api.delete(`alert-channels/${id}`).json()
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['alertChannels'] })
        },
    })
}

export function useTestAlertChannel() {
    return useMutation({
        mutationFn: async (id: string) => {
            const response = await api
                .post(`alert-channels/${id}/test`)
                .json<{ success: boolean; message: string }>()
            return response
        },
    })
}

// ============================================
// Notification Hooks
// ============================================

export function useNotifications() {
    return useQuery({
        queryKey: ['notifications'],
        queryFn: async () => {
            const response = await api
                .get('notifications')
                .json<{ 
                    success: boolean
                    notifications: Array<{
                        id: string
                        type: string
                        title: string
                        message: string
                        read: boolean
                        createdAt: string
                    }>
                }>()
            return response.notifications
        },
        refetchInterval: 60000,
    })
}

export function useMarkNotificationRead() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: async (id: string) => {
            await api.post(`notifications/${id}/read`).json()
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] })
        },
    })
}

export function useMarkAllNotificationsRead() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: async () => {
            await api.post('notifications/read-all').json()
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] })
        },
    })
}
