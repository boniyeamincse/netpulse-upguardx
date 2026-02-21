'use client'

import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Card } from '@/components/ui/card'
import { Activity, AlertCircle, CheckCircle, XCircle } from 'lucide-react'

interface Monitor {
    id: string
    name: string
    type: string
    status: string
    lastCheckAt?: string
}

async function fetchMonitors() {
    return api.get('monitors').json<{ monitors: Monitor[] }>()
}

async function fetchStats() {
    return api.get('stats/summary').json<{
        total: number
        up: number
        down: number
        degraded: number
    }>()
}

export default function DashboardPage() {
    const { data: monitors, isLoading: monitorsLoading } = useQuery({
        queryKey: ['monitors'],
        queryFn: fetchMonitors,
        staleTime: 30000,
    })

    const { data: stats, isLoading: statsLoading } = useQuery({
        queryKey: ['stats'],
        queryFn: fetchStats,
        staleTime: 30000,
    })

    const isLoading = monitorsLoading || statsLoading

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-white">Dashboard</h1>
                <p className="text-slate-400 mt-2">Monitor your services and infrastructure in real-time</p>
            </div>

            {/* Stats Grid */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card className="bg-slate-900 border-slate-800 p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-slate-400">Total Monitors</p>
                            <p className="text-2xl font-bold text-white mt-1">{stats?.total || 0}</p>
                        </div>
                        <Activity className="h-8 w-8 text-slate-400" />
                    </div>
                </Card>

                <Card className="bg-slate-900 border-slate-800 p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-slate-400">Up</p>
                            <p className="text-2xl font-bold text-emerald-500 mt-1">{stats?.up || 0}</p>
                        </div>
                        <CheckCircle className="h-8 w-8 text-emerald-500" />
                    </div>
                </Card>

                <Card className="bg-slate-900 border-slate-800 p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-slate-400">Down</p>
                            <p className="text-2xl font-bold text-red-500 mt-1">{stats?.down || 0}</p>
                        </div>
                        <XCircle className="h-8 w-8 text-red-500" />
                    </div>
                </Card>

                <Card className="bg-slate-900 border-slate-800 p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-slate-400">Degraded</p>
                            <p className="text-2xl font-bold text-yellow-500 mt-1">{stats?.degraded || 0}</p>
                        </div>
                        <AlertCircle className="h-8 w-8 text-yellow-500" />
                    </div>
                </Card>
            </div>

            {/* Recent Monitors */}
            <div>
                <h2 className="text-xl font-semibold text-white mb-4">Recent Monitors</h2>
                <Card className="bg-slate-900 border-slate-800 overflow-hidden">
                    {isLoading ? (
                        <div className="p-6 text-center">
                            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
                        </div>
                    ) : monitors && monitors.monitors.length > 0 ? (
                        <div className="divide-y divide-slate-800">
                            {monitors.monitors.slice(0, 5).map((monitor) => (
                                <div
                                    key={monitor.id}
                                    className="p-4 flex items-center justify-between hover:bg-slate-800 transition-colors"
                                >
                                    <div className="flex items-center gap-3 flex-1">
                                        <div
                                            className={`h-3 w-3 rounded-full ${
                                                monitor.status === 'up'
                                                    ? 'bg-emerald-500'
                                                    : monitor.status === 'down'
                                                      ? 'bg-red-500'
                                                      : 'bg-yellow-500'
                                            }`}
                                        ></div>
                                        <div>
                                            <p className="text-sm font-semibold text-white">{monitor.name}</p>
                                            <p className="text-xs text-slate-400">{monitor.type.toUpperCase()}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs font-medium text-slate-400">
                                            {monitor.lastCheckAt
                                                ? new Date(monitor.lastCheckAt).toLocaleTimeString()
                                                : 'Never'}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="p-6 text-center text-slate-400">
                            <p>No monitors yet. Create one to get started.</p>
                        </div>
                    )}
                </Card>
            </div>
        </div>
    )
}
