import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { Monitor, MonitorCheck, Incident, ApiKey, AlertChannel, Organization } from '@netpulse/types'

// Monitor Hooks
export function useMonitors() {
    return useQuery({
        queryKey: ['monitors'],
        queryFn: async () => {
            const response = await api.get('monitors').json<{ success: boolean; monitors: Monitor[] }>()
            return response.monitors
        },
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

export function useMonitorChecks(id: string) {
    return useQuery({
        queryKey: ['monitorChecks', id],
        queryFn: async () => {
            const response = await api
                .get(`monitors/${id}/checks`)
                .json<{ success: boolean; checks: MonitorCheck[] }>()
            return response.checks
        },
        enabled: !!id,
        refetchInterval: 30000, // Refetch every 30 seconds
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
        },
    })
}

// Stats Hooks
export function useDashboardStats() {
    return useQuery({
        queryKey: ['dashboardStats'],
        queryFn: async () => {
            const response = await api
                .get('stats/summary')
                .json<{ success: boolean; total: number; up: number; down: number; degraded: number }>()
            return response
        },
        refetchInterval: 60000, // Refetch every minute
    })
}

// Incident Hooks
export function useIncidents() {
    return useQuery({
        queryKey: ['incidents'],
        queryFn: async () => {
            const response = await api.get('incidents').json<{ success: boolean; incidents: Incident[] }>()
            return response.incidents
        },
        refetchInterval: 60000,
    })
}

// API Key Hooks
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
        mutationFn: async (name: string) => {
            const response = await api
                .post('apikeys', { json: { name } })
                .json<{ success: boolean; apiKey: ApiKey }>()
            return response.apiKey
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

// Organization Hooks
export function useOrganization() {
    return useQuery({
        queryKey: ['organization'],
        queryFn: async () => {
            const response = await api.get('orgs/me').json<{ success: boolean; id: string; name: string }>()
            return response
        },
    })
}

// Alert Channel Hooks
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
