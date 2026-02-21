'use client'

import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
    AlertCircle,
    CheckCircle2,
    Clock,
    ExternalLink,
    Filter,
    RefreshCw,
    Search
} from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { format, formatDistance } from 'date-fns'
import { Input } from '@/components/ui/input'

interface Incident {
    id: string
    monitorId: string
    monitorName: string
    type: string
    status: 'resolved' | 'investigating' | 'identified' | 'monitoring'
    startedAt: string
    resolvedAt?: string
    message?: string
}

export default function IncidentsPage() {
    const { data: incidents, isLoading, refetch, isRefetching } = useQuery({
        queryKey: ['incidents'],
        queryFn: async () => {
            const response: any = await api.get('api/incidents').json()
            return response.data as Incident[]
        },
        refetchInterval: 60000,
    })

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Incidents</h1>
                    <p className="text-muted-foreground">Historical and active service disruptions.</p>
                </div>
                <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isLoading || isRefetching}>
                    <RefreshCw className={cn("h-4 w-4 mr-2", (isLoading || isRefetching) && "animate-spin")} />
                    Refresh
                </Button>
            </div>

            <div className="flex gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input className="pl-9" placeholder="Filter by monitor or message..." />
                </div>
                <Button variant="outline" gap-2>
                    <Filter className="h-4 w-4" />
                    Filter
                </Button>
            </div>

            {isLoading ? (
                <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="h-32 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" />
                    ))}
                </div>
            ) : incidents?.length === 0 ? (
                <Card className="flex flex-col items-center justify-center p-12 text-center bg-emerald-50/20 border-emerald-100 dark:bg-emerald-500/5 dark:border-emerald-500/20">
                    <div className="h-12 w-12 bg-emerald-100 dark:bg-emerald-500/20 rounded-full flex items-center justify-center mb-4">
                        <CheckCircle2 className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <CardTitle>All systems operational</CardTitle>
                    <CardDescription className="max-w-sm mt-2">
                        No active incidents found. All monitored services are performing within expected parameters.
                    </CardDescription>
                </Card>
            ) : (
                <div className="space-y-4">
                    {incidents?.map((incident) => (
                        <IncidentCard key={incident.id} incident={incident} />
                    ))}
                </div>
            )}
        </div>
    )
}

function IncidentCard({ incident }: { incident: Incident }) {
    const isResolved = incident.status === 'resolved'

    return (
        <Card className={cn(
            "group hover:shadow-md transition-shadow transition-colors",
            !isResolved && "border-rose-200 dark:border-rose-900 bg-rose-50/30 dark:bg-rose-950/20"
        )}>
            <CardContent className="p-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-start gap-4">
                        <div className={cn(
                            "p-2 rounded-xl shrink-0",
                            isResolved ? "bg-slate-100 dark:bg-slate-800" : "bg-rose-100 dark:bg-rose-900"
                        )}>
                            {isResolved ? (
                                <CheckCircle2 className="h-5 w-5 text-slate-500" />
                            ) : (
                                <AlertCircle className="h-5 w-5 text-rose-600 animate-pulse" />
                            )}
                        </div>
                        <div className="space-y-1">
                            <div className="flex items-center gap-2">
                                <span className="font-bold text-lg">{incident.monitorName}</span>
                                <Badge variant={isResolved ? 'secondary' : 'error'} className="capitalize">
                                    {incident.status}
                                </Badge>
                            </div>
                            <div className="text-sm text-foreground font-medium">{incident.message || 'Service downtime detected'}</div>
                            <div className="flex items-center gap-4 text-xs text-muted-foreground pt-1">
                                <span className="flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    Started {format(new Date(incident.startedAt), 'MMM d, HH:mm')}
                                </span>
                                {incident.resolvedAt && (
                                    <span className="flex items-center gap-1">
                                        <CheckCircle2 className="h-3 w-3" />
                                        Resolved in {formatDistance(new Date(incident.resolvedAt), new Date(incident.startedAt))}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 self-end md:self-center">
                        <Button asChild variant="outline" size="sm" className="h-9 gap-2">
                            <Link href={`/monitors/${incident.monitorId}`}>
                                View Monitor
                                <ExternalLink className="h-3.5 w-3.5" />
                            </Link>
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
