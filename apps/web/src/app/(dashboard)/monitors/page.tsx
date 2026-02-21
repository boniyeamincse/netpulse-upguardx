'use client'

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
    RefreshCw
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
    const { data: monitors, isLoading, refetch, isRefetching } = useQuery({
        queryKey: ['monitors'],
        queryFn: async () => {
            const response: any = await api.get('monitors').json()
            return response.data as Monitor[]
        },
        refetchInterval: 30000, // Refresh every 30s
    })

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Monitors</h1>
                    <p className="text-muted-foreground">Manage and track your service health.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="icon" onClick={() => refetch()} disabled={isLoading || isRefetching}>
                        <RefreshCw className={cn("h-4 w-4", (isLoading || isRefetching) && "animate-spin")} />
                    </Button>
                    <Button asChild className="bg-emerald-600 hover:bg-emerald-500 text-white border-none">
                        <Link href="/monitors/new">Add Monitor</Link>
                    </Button>
                </div>
            </div>

            {isLoading ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {[1, 2, 3].map((i) => (
                        <Card key={i} className="animate-pulse">
                            <div className="h-48 bg-slate-100 dark:bg-slate-800 rounded-lg" />
                        </Card>
                    ))}
                </div>
            ) : monitors?.length === 0 ? (
                <Card className="flex flex-col items-center justify-center p-12 text-center">
                    <div className="h-12 w-12 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
                        <Activity className="h-6 w-6 text-slate-400" />
                    </div>
                    <CardTitle>No monitors found</CardTitle>
                    <CardDescription className="max-w-sm mt-2">
                        You haven't added any monitors yet. Start by creating your first monitor to track your service uptime.
                    </CardDescription>
                    <Button asChild className="mt-6">
                        <Link href="/monitors/new">Create First Monitor</Link>
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
        up: { variant: 'success', label: 'Up' },
        down: { variant: 'error', label: 'Down' },
        degraded: { variant: 'warning', label: 'Degraded' },
        pending: { variant: 'secondary', label: 'Pending' },
        paused: { variant: 'outline', label: 'Paused' },
    }

    const { variant, label } = statusConfig[monitor.status] || statusConfig.pending

    return (
        <Card className="group hover:border-emerald-500/50 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <div className="flex items-center gap-2 truncate">
                    <div className={cn(
                        "h-2.5 w-2.5 rounded-full shrink-0",
                        monitor.status === 'up' ? "bg-emerald-500" :
                            monitor.status === 'down' ? "bg-rose-500" : "bg-amber-500"
                    )} />
                    <CardTitle className="text-base font-semibold truncate">
                        {monitor.name}
                    </CardTitle>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground group-hover:text-foreground">
                    <MoreVertical className="h-4 w-4" />
                </Button>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground truncate">
                    <Globe className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{monitor.url}</span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <div className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Uptime</div>
                        <div className="text-lg font-semibold">{monitor.uptime || 0}%</div>
                    </div>
                    <div className="space-y-1">
                        <div className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Latency</div>
                        <div className="text-lg font-semibold">{monitor.latency || 0}ms</div>
                    </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2">
                        <Badge variant={variant as any}>{label}</Badge>
                        <Badge variant="outline" className="uppercase text-[10px] px-1.5">{monitor.type}</Badge>
                    </div>
                    <Button asChild variant="ghost" size="sm" className="h-8 gap-1 pr-2 hover:bg-emerald-500/10 hover:text-emerald-600">
                        <Link href={`/monitors/${monitor.id}`}>
                            Details
                            <ArrowUpRight className="h-3.5 w-3.5" />
                        </Link>
                    </Button>
                </div>
            </CardContent>
        </Card>
    )
}
