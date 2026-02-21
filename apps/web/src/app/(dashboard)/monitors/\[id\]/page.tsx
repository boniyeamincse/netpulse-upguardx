'use client'

import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Edit2, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

interface Monitor {
    id: string
    name: string
    type: string
    target: string
    status: string
    interval: number
    lastCheckAt?: string
    createdAt: string
    updatedAt: string
}

interface Check {
    timestamp: string
    latency: number
    status: string
    statusCode?: number
}

async function fetchMonitor(id: string) {
    return api.get(`monitors/${id}`).json<Monitor>()
}

async function fetchMonitorChecks(id: string) {
    return api.get(`monitors/${id}/checks`).json<{ checks: Check[] }>()
}

export default function MonitorDetailPage() {
    const params = useParams()
    const router = useRouter()
    const monitorId = params.id as string

    const { data: monitor, isLoading: monitorLoading } = useQuery({
        queryKey: ['monitor', monitorId],
        queryFn: () => fetchMonitor(monitorId),
        staleTime: 30000,
    })

    const { data: checksData, isLoading: checksLoading } = useQuery({
        queryKey: ['monitorChecks', monitorId],
        queryFn: () => fetchMonitorChecks(monitorId),
        staleTime: 30000,
    })

    const statusStyles = {
        up: { bg: 'bg-emerald-900', text: 'text-emerald-200', dot: 'bg-emerald-500' },
        down: { bg: 'bg-red-900', text: 'text-red-200', dot: 'bg-red-500' },
        degraded: { bg: 'bg-yellow-900', text: 'text-yellow-200', dot: 'bg-yellow-500' },
        pending: { bg: 'bg-slate-700', text: 'text-slate-200', dot: 'bg-slate-400' },
    }

    const chartData = checksData?.checks?.slice(-24).map((check) => ({
        time: new Date(check.timestamp).toLocaleTimeString(),
        latency: check.latency,
    })) || []

    const avgLatency =
        checksData && checksData.checks.length > 0
            ? Math.round(checksData.checks.reduce((sum, check) => sum + check.latency, 0) / checksData.checks.length)
            : 0

    const handleDelete = async () => {
        if (confirm('Are you sure you want to delete this monitor?')) {
            try {
                await api.delete(`monitors/${monitorId}`)
                router.push('/monitors')
            } catch (error) {
                console.error('Failed to delete monitor:', error)
            }
        }
    }

    if (monitorLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
            </div>
        )
    }

    if (!monitor) {
        return (
            <div className="space-y-6">
                <Button
                    variant="ghost"
                    size="sm"
                    asChild
                    className="text-slate-400 hover:text-white hover:bg-slate-800"
                >
                    <Link href="/monitors">
                        <ArrowLeft className="h-5 w-5 mr-2" />
                        Back
                    </Link>
                </Button>
                <p className="text-slate-400">Monitor not found</p>
            </div>
        )
    }

    const statusStyle = statusStyles[monitor.status as keyof typeof statusStyles] || statusStyles.pending

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                    <Button
                        variant="ghost"
                        size="sm"
                        asChild
                        className="text-slate-400 hover:text-white hover:bg-slate-800"
                    >
                        <Link href="/monitors">
                            <ArrowLeft className="h-5 w-5 mr-2" />
                            Back
                        </Link>
                    </Button>
                    <div>
                        <div className="flex items-center gap-3">
                            <div className={`h-4 w-4 rounded-full ${statusStyle.dot}`}></div>
                            <h1 className="text-3xl font-bold text-white">{monitor.name}</h1>
                        </div>
                        <p className="text-slate-400 mt-2">{monitor.target}</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button
                        size="sm"
                        variant="outline"
                        asChild
                        className="border-slate-700 text-slate-400 hover:text-white hover:bg-slate-800"
                    >
                        <Link href={`/monitors/${monitorId}/edit`}>
                            <Edit2 className="h-4 w-4" />
                        </Link>
                    </Button>
                    <Button
                        size="sm"
                        variant="outline"
                        className="border-red-700 text-red-400 hover:text-red-300 hover:bg-red-950"
                        onClick={handleDelete}
                    >
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* Status Cards */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card className="bg-slate-900 border-slate-800 p-6">
                    <p className="text-sm font-medium text-slate-400">Status</p>
                    <p className={`text-2xl font-bold mt-1 ${statusStyle.text}`}>{monitor.status.toUpperCase()}</p>
                </Card>

                <Card className="bg-slate-900 border-slate-800 p-6">
                    <p className="text-sm font-medium text-slate-400">Type</p>
                    <p className="text-2xl font-bold text-white mt-1">{monitor.type.toUpperCase()}</p>
                </Card>

                <Card className="bg-slate-900 border-slate-800 p-6">
                    <p className="text-sm font-medium text-slate-400">Avg Latency</p>
                    <p className="text-2xl font-bold text-emerald-500 mt-1">{avgLatency}ms</p>
                </Card>

                <Card className="bg-slate-900 border-slate-800 p-6">
                    <p className="text-sm font-medium text-slate-400">Interval</p>
                    <p className="text-2xl font-bold text-white mt-1">{monitor.interval}s</p>
                </Card>
            </div>

            {/* Latency Chart */}
            <Card className="bg-slate-900 border-slate-800 p-6">
                <h2 className="text-xl font-semibold text-white mb-4">Latency History</h2>
                {checksLoading ? (
                    <div className="flex items-center justify-center h-64">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
                    </div>
                ) : chartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                            <XAxis stroke="#94a3b8" />
                            <YAxis stroke="#94a3b8" />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569' }}
                                labelStyle={{ color: '#e2e8f0' }}
                            />
                            <Legend />
                            <Line
                                type="monotone"
                                dataKey="latency"
                                stroke="#10b981"
                                dot={false}
                                strokeWidth={2}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="flex items-center justify-center h-64 text-slate-400">
                        <p>No check data available yet</p>
                    </div>
                )}
            </Card>

            {/* Recent Checks */}
            <Card className="bg-slate-900 border-slate-800 p-6">
                <h2 className="text-xl font-semibold text-white mb-4">Recent Checks</h2>
                {checksLoading ? (
                    <div className="flex items-center justify-center h-32">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
                    </div>
                ) : checksData && checksData.checks.length > 0 ? (
                    <div className="space-y-2">
                        {checksData.checks.slice(-10).reverse().map((check, idx) => (
                            <div key={idx} className="flex items-center justify-between p-3 bg-slate-800 rounded-lg">
                                <div>
                                    <p className="text-sm font-medium text-white">
                                        {new Date(check.timestamp).toLocaleString()}
                                    </p>
                                    <p className="text-xs text-slate-400">Latency: {check.latency}ms</p>
                                </div>
                                <div
                                    className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${statusStyle.bg} ${statusStyle.text}`}
                                >
                                    {check.status}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-slate-400">No check data available</p>
                )}
            </Card>
        </div>
    )
}
