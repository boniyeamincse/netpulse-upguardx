'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
    Activity,
    Globe,
    Clock,
    MoreVertical,
    ArrowUpRight,
    RefreshCw,
    Plus,
    Zap,
    BarChart3,
    AlertTriangle,
    CheckCircle2
} from 'lucide-react'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'

interface Monitor {
    id: string
    name: string
    url: string
    type: 'http' | 'tcp' | 'icmp' | 'dns' | 'ssl'
    status: 'up' | 'down' | 'degraded' | 'pending' | 'paused'
    interval: number
    lastCheck?: string
    lastStatusChange?: string
    uptime?: number
    latency?: number
}

export default function MonitorsPage() {
    const [isAddingMonitor, setIsAddingMonitor] = useState(false)
    
    const { data: monitors, isLoading, refetch, isRefetching } = useQuery({
        queryKey: ['monitors'],
        queryFn: async () => {
            const response: any = await api.get('monitors').json()
            return response.data as Monitor[]
        },
        refetchInterval: 30000, // Refresh every 30s
    })

    // Calculate summary stats
    const stats = {
        total: monitors?.length ?? 0,
        up: monitors?.filter((m: Monitor) => m.status === 'up').length ?? 0,
        down: monitors?.filter((m: Monitor) => m.status === 'down').length ?? 0,
        degraded: monitors?.filter((m: Monitor) => m.status === 'degraded').length ?? 0,
        avgUptime: monitors?.length 
            ? Math.round((monitors?.reduce((sum: number, m: Monitor) => sum + (m.uptime ?? 0), 0) ?? 0) / monitors.length)
            : 0,
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Uptime Monitor</h1>
                    <p className="text-muted-foreground mt-1">Real-time monitoring dashboard for all your services</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="icon" onClick={() => refetch()} disabled={isLoading || isRefetching}>
                        <RefreshCw className={cn("h-4 w-4", (isLoading || isRefetching) && "animate-spin")} />
                    </Button>
                    <Button asChild className="bg-emerald-600 hover:bg-emerald-500 text-white">
                        <Link href="/monitors/new">
                            <Plus className="h-4 w-4 mr-2" />
                            New Monitor
                        </Link>
                    </Button>
                </div>
            </div>

            {/* Summary Stats (Uptime Kuma Style) */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
                <Card className="border-emerald-200 dark:border-emerald-900/50">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total</p>
                                <p className="text-3xl font-bold mt-2">{stats.total}</p>
                            </div>
                            <Activity className="h-8 w-8 text-slate-300 dark:text-slate-700" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-emerald-500/50 bg-emerald-50/50 dark:bg-emerald-900/20">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-medium text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">Up</p>
                                <p className="text-3xl font-bold mt-2 text-emerald-600">{stats.up}</p>
                            </div>
                            <CheckCircle2 className="h-8 w-8 text-emerald-500" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-rose-500/50 bg-rose-50/50 dark:bg-rose-900/20">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-medium text-rose-700 dark:text-rose-400 uppercase tracking-wider">Down</p>
                                <p className="text-3xl font-bold mt-2 text-rose-600">{stats.down}</p>
                            </div>
                            <AlertTriangle className="h-8 w-8 text-rose-500" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-amber-500/50 bg-amber-50/50 dark:bg-amber-900/20">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-medium text-amber-700 dark:text-amber-400 uppercase tracking-wider">Degraded</p>
                                <p className="text-3xl font-bold mt-2 text-amber-600">{stats.degraded}</p>
                            </div>
                            <Zap className="h-8 w-8 text-amber-500" />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Avg Uptime</p>
                                <p className="text-3xl font-bold mt-2">{stats.avgUptime}%</p>
                            </div>
                            <BarChart3 className="h-8 w-8 text-slate-300 dark:text-slate-700" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Monitors Grid */}
            {isLoading ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {[1, 2, 3].map((i) => (
                        <Card key={i} className="animate-pulse">
                            <div className="h-48 bg-slate-100 dark:bg-slate-800 rounded-lg m-4" />
                        </Card>
                    ))}
                </div>
            ) : monitors?.length === 0 ? (
                <Card className="flex flex-col items-center justify-center p-12 text-center border-dashed">
                    <div className="h-12 w-12 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
                        <Activity className="h-6 w-6 text-slate-400" />
                    </div>
                    <CardTitle>No monitors configured</CardTitle>
                    <CardDescription className="max-w-sm mt-2">
                        Create your first monitor to start tracking service uptime, performance, and incidents in real-time.
                    </CardDescription>
                    <Button asChild className="mt-6 bg-emerald-600 hover:bg-emerald-500 text-white">
                        <Link href="/monitors/new">
                            <Plus className="h-4 w-4 mr-2" />
                            Create Monitor
                        </Link>
                    </Button>
                </Card>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {monitors?.map((monitor) => (
                        <MonitorCard key={monitor.id} monitor={monitor} />
                    ))}
                </div>
            )}
        </div>
    )
}

function MonitorCard({ monitor }: { monitor: Monitor }) {
    const statusConfig = {
        up: { color: 'bg-emerald-500', label: 'Up', textColor: 'text-emerald-700 dark:text-emerald-400', bgColor: 'bg-emerald-50 dark:bg-emerald-900/20' },
        down: { color: 'bg-rose-500', label: 'Down', textColor: 'text-rose-700 dark:text-rose-400', bgColor: 'bg-rose-50 dark:bg-rose-900/20' },
        degraded: { color: 'bg-amber-500', label: 'Degraded', textColor: 'text-amber-700 dark:text-amber-400', bgColor: 'bg-amber-50 dark:bg-amber-900/20' },
        pending: { color: 'bg-slate-400', label: 'Pending', textColor: 'text-slate-700 dark:text-slate-400', bgColor: 'bg-slate-50 dark:bg-slate-900/20' },
        paused: { color: 'bg-slate-300', label: 'Paused', textColor: 'text-slate-700 dark:text-slate-400', bgColor: 'bg-slate-50 dark:bg-slate-900/20' },
    }

    const config = statusConfig[monitor.status] || statusConfig.pending

    return (
        <Card className="group overflow-hidden hover:shadow-lg transition-all duration-200 border hover:border-emerald-500/50">
            {/* Status Bar */}
            <div className={cn("h-1", config.color)} />
            
            <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                            <div className={cn("h-3 w-3 rounded-full shrink-0", config.color)} />
                            <span className={cn("text-xs font-bold uppercase tracking-wider", config.textColor)}>
                                {config.label}
                            </span>
                        </div>
                        <CardTitle className="text-lg font-bold line-clamp-1">{monitor.name}</CardTitle>
                    </div>
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-muted-foreground group-hover:text-foreground group-hover:bg-slate-100 dark:group-hover:bg-slate-800"
                        asChild
                    >
                        <Link href={`/monitors/${monitor.id}`}>
                            <ArrowUpRight className="h-4 w-4" />
                        </Link>
                    </Button>
                </div>
            </CardHeader>

            <CardContent className="space-y-4">
                {/* URL */}
                <div className="flex items-center gap-2 text-xs text-muted-foreground truncate">
                    <Globe className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate font-mono">{monitor.url}</span>
                </div>

                {/* Mini Chart Area */}
                <div className={cn("h-12 rounded-lg border border-dashed border-slate-200 dark:border-slate-700 flex items-center justify-center", config.bgColor)}>
                    <BarChart3 className="h-6 w-6 text-slate-300 dark:text-slate-700" />
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="space-y-1 p-2 rounded-md bg-slate-50 dark:bg-slate-900/50">
                        <div className="text-[10px] uppercase font-bold text-muted-foreground">Uptime</div>
                        <div className="text-xl font-bold text-emerald-600">{monitor.uptime || 0}%</div>
                    </div>
                    <div className="space-y-1 p-2 rounded-md bg-slate-50 dark:bg-slate-900/50">
                        <div className="text-[10px] uppercase font-bold text-muted-foreground">Response</div>
                        <div className="text-xl font-bold">{monitor.latency || 0}ms</div>
                    </div>
                    <div className="space-y-1 p-2 rounded-md bg-slate-50 dark:bg-slate-900/50">
                        <div className="text-[10px] uppercase font-bold text-muted-foreground">Type</div>
                        <div className="text-sm font-bold uppercase">{monitor.type}</div>
                    </div>
                </div>

                {/* Last Check Info */}
                {monitor.lastCheck && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2 border-t border-slate-100 dark:border-slate-800">
                        <Clock className="h-3.5 w-3.5" />
                        <span>Last check {formatDistanceToNow(new Date(monitor.lastCheck), { addSuffix: true })}</span>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
