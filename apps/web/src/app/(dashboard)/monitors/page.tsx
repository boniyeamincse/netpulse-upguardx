'use client'

import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import {
    Activity,
    Globe,
    Clock,
    ArrowUpRight,
    RefreshCw,
    Plus,
    Zap,
    BarChart3,
    AlertTriangle,
    CheckCircle2,
    Search,
    Filter,
    Grid,
    List,
    Pause,
    Play,
    Trash2,
    MoreHorizontal,
    ChevronLeft,
    ChevronRight,
    ChevronsLeft,
    ChevronsRight,
} from 'lucide-react'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

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

type ViewMode = 'grid' | 'list'
type SortField = 'name' | 'status' | 'uptime' | 'latency' | 'lastCheck'
type SortOrder = 'asc' | 'desc'

export default function MonitorsPage() {
    const queryClient = useQueryClient()
    
    // View and filter state
    const [viewMode, setViewMode] = useState<ViewMode>('grid')
    const [search, setSearch] = useState('')
    const [statusFilter, setStatusFilter] = useState<string>('all')
    const [typeFilter, setTypeFilter] = useState<string>('all')
    const [sortField, setSortField] = useState<SortField>('name')
    const [sortOrder, setSortOrder] = useState<SortOrder>('asc')
    const [page, setPage] = useState(1)
    const [pageSize, setPageSize] = useState(12)

    const { data: monitors, isLoading, refetch, isRefetching } = useQuery({
        queryKey: ['monitors'],
        queryFn: async () => {
            const response: any = await api.get('monitors').json()
            return response.data as Monitor[]
        },
        refetchInterval: 30000,
    })

    // Delete mutation
    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            await api.delete(`monitors/${id}`).json()
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['monitors'] })
        },
    })

    // Pause/Resume mutation
    const toggleStatusMutation = useMutation({
        mutationFn: async ({ id, action }: { id: string; action: 'pause' | 'resume' }) => {
            const response: any = await api.post(`monitors/${id}/${action}`).json()
            return response.data
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['monitors'] })
        },
    })

    // Filter and sort monitors
    const filteredMonitors = useMemo(() => {
        if (!monitors) return []

        let result = [...monitors]

        // Apply search filter
        if (search) {
            const searchLower = search.toLowerCase()
            result = result.filter(m => 
                m.name.toLowerCase().includes(searchLower) ||
                m.url.toLowerCase().includes(searchLower)
            )
        }

        // Apply status filter
        if (statusFilter !== 'all') {
            result = result.filter(m => m.status === statusFilter)
        }

        // Apply type filter
        if (typeFilter !== 'all') {
            result = result.filter(m => m.type === typeFilter)
        }

        // Apply sorting
        result.sort((a, b) => {
            let comparison = 0
            switch (sortField) {
                case 'name':
                    comparison = a.name.localeCompare(b.name)
                    break
                case 'status':
                    const statusOrder = { down: 0, degraded: 1, pending: 2, up: 3, paused: 4 }
                    comparison = (statusOrder[a.status] ?? 5) - (statusOrder[b.status] ?? 5)
                    break
                case 'uptime':
                    comparison = (a.uptime ?? 0) - (b.uptime ?? 0)
                    break
                case 'latency':
                    comparison = (a.latency ?? 0) - (b.latency ?? 0)
                    break
                case 'lastCheck':
                    const aTime = a.lastCheck ? new Date(a.lastCheck).getTime() : 0
                    const bTime = b.lastCheck ? new Date(b.lastCheck).getTime() : 0
                    comparison = aTime - bTime
                    break
            }
            return sortOrder === 'asc' ? comparison : -comparison
        })

        return result
    }, [monitors, search, statusFilter, typeFilter, sortField, sortOrder])

    // Pagination
    const totalPages = Math.ceil(filteredMonitors.length / pageSize)
    const paginatedMonitors = filteredMonitors.slice(
        (page - 1) * pageSize,
        page * pageSize
    )

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

    const handleDelete = (id: string, name: string) => {
        if (confirm(`Are you sure you want to delete "${name}"? This action cannot be undone.`)) {
            deleteMutation.mutate(id)
        }
    }

    const handleToggleStatus = (monitor: Monitor) => {
        const action = monitor.status === 'paused' ? 'resume' : 'pause'
        toggleStatusMutation.mutate({ id: monitor.id, action })
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
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

            {/* Summary Stats */}
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

            {/* Filters and Search */}
            <Card>
                <CardContent className="p-4">
                    <div className="flex flex-col lg:flex-row gap-4">
                        {/* Search */}
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search monitors..."
                                value={search}
                                onChange={(e) => {
                                    setSearch(e.target.value)
                                    setPage(1)
                                }}
                                className="pl-9"
                            />
                        </div>

                        {/* Filters */}
                        <div className="flex flex-wrap gap-2">
                            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1) }}>
                                <SelectTrigger className="w-[130px]">
                                    <SelectValue placeholder="Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Status</SelectItem>
                                    <SelectItem value="up">Up</SelectItem>
                                    <SelectItem value="down">Down</SelectItem>
                                    <SelectItem value="degraded">Degraded</SelectItem>
                                    <SelectItem value="paused">Paused</SelectItem>
                                    <SelectItem value="pending">Pending</SelectItem>
                                </SelectContent>
                            </Select>

                            <Select value={typeFilter} onValueChange={(v) => { setTypeFilter(v); setPage(1) }}>
                                <SelectTrigger className="w-[130px]">
                                    <SelectValue placeholder="Type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Types</SelectItem>
                                    <SelectItem value="http">HTTP/HTTPS</SelectItem>
                                    <SelectItem value="tcp">TCP</SelectItem>
                                    <SelectItem value="icmp">ICMP/Ping</SelectItem>
                                    <SelectItem value="dns">DNS</SelectItem>
                                    <SelectItem value="ssl">SSL</SelectItem>
                                </SelectContent>
                            </Select>

                            <Select value={`${sortField}-${sortOrder}`} onValueChange={(v) => {
                                const [field, order] = v.split('-') as [SortField, SortOrder]
                                setSortField(field)
                                setSortOrder(order)
                            }}>
                                <SelectTrigger className="w-[160px]">
                                    <SelectValue placeholder="Sort by" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="name-asc">Name (A-Z)</SelectItem>
                                    <SelectItem value="name-desc">Name (Z-A)</SelectItem>
                                    <SelectItem value="status-asc">Status (Down first)</SelectItem>
                                    <SelectItem value="uptime-desc">Uptime (High to Low)</SelectItem>
                                    <SelectItem value="uptime-asc">Uptime (Low to High)</SelectItem>
                                    <SelectItem value="latency-asc">Latency (Fastest)</SelectItem>
                                    <SelectItem value="lastCheck-desc">Recently Checked</SelectItem>
                                </SelectContent>
                            </Select>

                            {/* View Toggle */}
                            <div className="flex border rounded-md">
                                <Button
                                    variant={viewMode === 'grid' ? 'default' : 'ghost'}
                                    size="icon"
                                    className="rounded-r-none"
                                    onClick={() => setViewMode('grid')}
                                >
                                    <Grid className="h-4 w-4" />
                                </Button>
                                <Button
                                    variant={viewMode === 'list' ? 'default' : 'ghost'}
                                    size="icon"
                                    className="rounded-l-none"
                                    onClick={() => setViewMode('list')}
                                >
                                    <List className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Results count */}
                    <div className="mt-4 text-sm text-muted-foreground">
                        Showing {paginatedMonitors.length} of {filteredMonitors.length} monitors
                        {filteredMonitors.length !== monitors?.length && ` (filtered from ${monitors?.length} total)`}
                    </div>
                </CardContent>
            </Card>

            {/* Monitors Grid/List */}
            {isLoading ? (
                <div className={cn(
                    "grid gap-4",
                    viewMode === 'grid' ? "md:grid-cols-2 lg:grid-cols-3" : "grid-cols-1"
                )}>
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                        <Card key={i} className="animate-pulse">
                            <div className="h-48 bg-slate-100 dark:bg-slate-800 rounded-lg m-4" />
                        </Card>
                    ))}
                </div>
            ) : filteredMonitors.length === 0 ? (
                <Card className="flex flex-col items-center justify-center p-12 text-center border-dashed">
                    <div className="h-12 w-12 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
                        <Activity className="h-6 w-6 text-slate-400" />
                    </div>
                    <CardTitle>{monitors?.length === 0 ? 'No monitors configured' : 'No monitors match your filters'}</CardTitle>
                    <CardDescription className="max-w-sm mt-2">
                        {monitors?.length === 0
                            ? 'Create your first monitor to start tracking service uptime, performance, and incidents in real-time.'
                            : 'Try adjusting your search or filter criteria to find what you\'re looking for.'}
                    </CardDescription>
                    {monitors?.length === 0 && (
                        <Button asChild className="mt-6 bg-emerald-600 hover:bg-emerald-500 text-white">
                            <Link href="/monitors/new">
                                <Plus className="h-4 w-4 mr-2" />
                                Create Monitor
                            </Link>
                        </Button>
                    )}
                </Card>
            ) : viewMode === 'grid' ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {paginatedMonitors.map((monitor) => (
                        <MonitorGridCard
                            key={monitor.id}
                            monitor={monitor}
                            onDelete={handleDelete}
                            onToggleStatus={handleToggleStatus}
                            isDeleting={deleteMutation.isPending}
                            isToggling={toggleStatusMutation.isPending}
                        />
                    ))}
                </div>
            ) : (
                <Card>
                    <div className="divide-y">
                        {paginatedMonitors.map((monitor) => (
                            <MonitorListItem
                                key={monitor.id}
                                monitor={monitor}
                                onDelete={handleDelete}
                                onToggleStatus={handleToggleStatus}
                                isDeleting={deleteMutation.isPending}
                                isToggling={toggleStatusMutation.isPending}
                            />
                        ))}
                    </div>
                </Card>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">Rows per page:</span>
                        <Select value={pageSize.toString()} onValueChange={(v) => { setPageSize(Number(v)); setPage(1) }}>
                            <SelectTrigger className="w-[70px]">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="12">12</SelectItem>
                                <SelectItem value="24">24</SelectItem>
                                <SelectItem value="48">48</SelectItem>
                                <SelectItem value="96">96</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => setPage(1)}
                            disabled={page === 1}
                        >
                            <ChevronsLeft className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1}
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <span className="text-sm px-4">
                            Page {page} of {totalPages}
                        </span>
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                            disabled={page === totalPages}
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => setPage(totalPages)}
                            disabled={page === totalPages}
                        >
                            <ChevronsRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            )}
        </div>
    )
}

// Grid Card Component
function MonitorGridCard({
    monitor,
    onDelete,
    onToggleStatus,
    isDeleting,
    isToggling,
}: {
    monitor: Monitor
    onDelete: (id: string, name: string) => void
    onToggleStatus: (monitor: Monitor) => void
    isDeleting: boolean
    isToggling: boolean
}) {
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
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                                <Link href={`/monitors/${monitor.id}`}>
                                    <ArrowUpRight className="h-4 w-4 mr-2" />
                                    View Details
                                </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                                <Link href={`/monitors/${monitor.id}/edit`}>
                                    <Activity className="h-4 w-4 mr-2" />
                                    Edit Monitor
                                </Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => onToggleStatus(monitor)} disabled={isToggling}>
                                {monitor.status === 'paused' ? (
                                    <>
                                        <Play className="h-4 w-4 mr-2" />
                                        Resume Monitor
                                    </>
                                ) : (
                                    <>
                                        <Pause className="h-4 w-4 mr-2" />
                                        Pause Monitor
                                    </>
                                )}
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                                className="text-rose-600 focus:text-rose-600"
                                onClick={() => onDelete(monitor.id, monitor.name)}
                                disabled={isDeleting}
                            >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete Monitor
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </CardHeader>

            <CardContent className="space-y-4">
                <div className="flex items-center gap-2 text-xs text-muted-foreground truncate">
                    <Globe className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate font-mono">{monitor.url}</span>
                </div>

                <div className={cn("h-12 rounded-lg border border-dashed border-slate-200 dark:border-slate-700 flex items-center justify-center", config.bgColor)}>
                    <BarChart3 className="h-6 w-6 text-slate-300 dark:text-slate-700" />
                </div>

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

// List Item Component
function MonitorListItem({
    monitor,
    onDelete,
    onToggleStatus,
    isDeleting,
    isToggling,
}: {
    monitor: Monitor
    onDelete: (id: string, name: string) => void
    onToggleStatus: (monitor: Monitor) => void
    isDeleting: boolean
    isToggling: boolean
}) {
    const statusConfig = {
        up: { color: 'bg-emerald-500', label: 'Up', textColor: 'text-emerald-700 dark:text-emerald-400' },
        down: { color: 'bg-rose-500', label: 'Down', textColor: 'text-rose-700 dark:text-rose-400' },
        degraded: { color: 'bg-amber-500', label: 'Degraded', textColor: 'text-amber-700 dark:text-amber-400' },
        pending: { color: 'bg-slate-400', label: 'Pending', textColor: 'text-slate-700 dark:text-slate-400' },
        paused: { color: 'bg-slate-300', label: 'Paused', textColor: 'text-slate-700 dark:text-slate-400' },
    }

    const config = statusConfig[monitor.status] || statusConfig.pending

    return (
        <div className="flex items-center gap-4 p-4 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
            <div className={cn("h-3 w-3 rounded-full shrink-0", config.color)} />
            
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                    <span className="font-semibold truncate">{monitor.name}</span>
                    <Badge variant="outline" className="uppercase text-xs">{monitor.type}</Badge>
                </div>
                <div className="text-sm text-muted-foreground truncate font-mono">{monitor.url}</div>
            </div>

            <div className="hidden md:flex items-center gap-6">
                <div className="text-center">
                    <div className="text-sm font-bold text-emerald-600">{monitor.uptime || 0}%</div>
                    <div className="text-xs text-muted-foreground">Uptime</div>
                </div>
                <div className="text-center">
                    <div className="text-sm font-bold">{monitor.latency || 0}ms</div>
                    <div className="text-xs text-muted-foreground">Latency</div>
                </div>
                <div className="text-center min-w-[100px]">
                    <div className="text-sm">
                        {monitor.lastCheck 
                            ? formatDistanceToNow(new Date(monitor.lastCheck), { addSuffix: true })
                            : 'Never'
                        }
                    </div>
                    <div className="text-xs text-muted-foreground">Last Check</div>
                </div>
            </div>

            <Badge className={cn("uppercase", config.textColor)}>
                {config.label}
            </Badge>

            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                        <Link href={`/monitors/${monitor.id}`}>
                            <ArrowUpRight className="h-4 w-4 mr-2" />
                            View Details
                        </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                        <Link href={`/monitors/${monitor.id}/edit`}>
                            <Activity className="h-4 w-4 mr-2" />
                            Edit Monitor
                        </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => onToggleStatus(monitor)} disabled={isToggling}>
                        {monitor.status === 'paused' ? (
                            <>
                                <Play className="h-4 w-4 mr-2" />
                                Resume Monitor
                            </>
                        ) : (
                            <>
                                <Pause className="h-4 w-4 mr-2" />
                                Pause Monitor
                            </>
                        )}
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                        className="text-rose-600 focus:text-rose-600"
                        onClick={() => onDelete(monitor.id, monitor.name)}
                        disabled={isDeleting}
                    >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete Monitor
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    )
}
