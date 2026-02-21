'use client'

import { useParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    AreaChart,
    Area
} from 'recharts'
import {
    Activity,
    Clock,
    Globe,
    Shield,
    ArrowLeft,
    RefreshCw,
    AlertTriangle,
    CheckCircle2
} from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'

interface MonitorCheck {
    id: string
    status: 'up' | 'down' | 'degraded'
    latency: number
    message?: string
    createdAt: string
}

interface Monitor {
    id: string
    name: string
    url: string
    type: string
    status: string
    interval: number
    uptime: number
    checks: MonitorCheck[]
    metadata?: any
}

export default function MonitorDetailPage() {
    const { id } = useParams()

    const { data: monitor, isLoading, refetch, isRefetching } = useQuery({
        queryKey: ['monitor', id],
        queryFn: async () => {
            const response: any = await api.get(`api/monitors/${id}`).json()
            return response.data as Monitor
        },
        refetchInterval: 30000,
    })

    if (isLoading) {
        return (
            <div className="flex h-96 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
            </div>
        )
    }

    if (!monitor) {
        return (
            <Card className="p-12 text-center">
                <AlertTriangle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
                <CardTitle>Monitor not found</CardTitle>
                <Button asChild className="mt-6">
                    <Link href="/monitors">Back to Monitors</Link>
                </Button>
            </Card>
        )
    }

    const chartData = monitor.checks?.slice().reverse().map(check => ({
        time: format(new Date(check.createdAt), 'HH:mm:ss'),
        latency: check.latency,
        status: check.status
    })) || []

    return (
        <div className="space-y-6 pb-12">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button asChild variant="ghost" size="icon">
                        <Link href="/monitors">
                            <ArrowLeft className="h-5 w-5" />
                        </Link>
                    </Button>
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-3xl font-bold tracking-tight">{monitor.name}</h1>
                            <Badge variant={monitor.status === 'up' ? 'success' : 'destructive'} className="uppercase">
                                {monitor.status}
                            </Badge>
                        </div>
                        <p className="text-muted-foreground">{monitor.url}</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isRefetching}>
                        <RefreshCw className={cn("h-4 w-4 mr-2", isRefetching && "animate-spin")} />
                        Refresh
                    </Button>
                    <Button asChild size="sm" variant="outline">
                        <Link href={`/monitors/${id}/edit`}>Edit</Link>
                    </Button>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Current Latency</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{monitor.checks?.[0]?.latency || 0}ms</div>
                        <p className="text-xs text-emerald-500 flex items-center gap-1 mt-1">
                            <CheckCircle2 className="h-3 w-3" />
                            Healthy
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Uptime (30d)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{monitor.uptime}%</div>
                        <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
                            <div className="bg-emerald-500 h-full transition-all" style={{ width: `${monitor.uptime}%` }} />
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Interval</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{monitor.interval}s</div>
                        <p className="text-xs text-muted-foreground mt-1">Distributed checking active</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Monitor Type</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold uppercase">{monitor.type}</div>
                        <p className="text-xs text-muted-foreground mt-1">Global region support</p>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Latency History</CardTitle>
                    <CardDescription>Response time over the last check cycles.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="h-[350px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData}>
                                <defs>
                                    <linearGradient id="colorLatency" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.1} />
                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                <XAxis
                                    dataKey="time"
                                    fontSize={12}
                                    tickLine={false}
                                    axisLine={false}
                                    stroke="#94a3b8"
                                />
                                <YAxis
                                    fontSize={12}
                                    tickLine={false}
                                    axisLine={false}
                                    stroke="#94a3b8"
                                    tickFormatter={(val) => `${val}ms`}
                                />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                                        borderRadius: '8px',
                                        border: '1px solid #e2e8f0',
                                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                                    }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="latency"
                                    stroke="#10b981"
                                    strokeWidth={2}
                                    fillOpacity={1}
                                    fill="url(#colorLatency)"
                                    animationDuration={1500}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </CardContent>
            </Card>

            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Recent Checks</CardTitle>
                        <CardDescription>Logs of the latest monitoring events.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {monitor.checks?.slice(0, 5).map((check) => (
                                <div key={check.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                                    <div className="flex items-center gap-3">
                                        <div className={cn(
                                            "h-2 w-2 rounded-full",
                                            check.status === 'up' ? "bg-emerald-500" : "bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]"
                                        )} />
                                        <div>
                                            <div className="text-sm font-medium">{check.status === 'up' ? 'Success' : 'Failure'}</div>
                                            <div className="text-[10px] text-muted-foreground">{format(new Date(check.createdAt), 'MMM d, HH:mm:ss')}</div>
                                        </div>
                                    </div>
                                    <div className="text-sm font-bold text-slate-500">{check.latency}ms</div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Configuration</CardTitle>
                        <CardDescription>Visual summary of probe setttings.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div className="text-muted-foreground">Timeout</div>
                            <div className="font-medium text-right">{monitor.metadata?.timeout || 10000}ms</div>
                            <div className="text-muted-foreground">Follow Redirects</div>
                            <div className="font-medium text-right">{monitor.metadata?.followRedirect ? 'Enabled' : 'Disabled'}</div>
                            <div className="text-muted-foreground">Payload Analysis</div>
                            <div className="font-medium text-right">{monitor.metadata?.bodyMatch ? 'Active' : 'None'}</div>
                            <div className="text-muted-foreground">Check Frequency</div>
                            <div className="font-medium text-right">Every {monitor.interval}s</div>
                        </div>
                        <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                            <div className="text-sm font-semibold mb-2">Check Regions</div>
                            <div className="flex gap-2">
                                <Badge variant="secondary">Global (Default)</Badge>
                                <Badge variant="outline">US-East</Badge>
                                <Badge variant="outline">EU-West</Badge>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}

function Loader2({ className }: { className?: string }) {
    return <RefreshCw className={cn("animate-spin", className)} />
}
