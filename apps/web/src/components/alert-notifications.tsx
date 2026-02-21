'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Mail, Plus, Trash2, AlertCircle, CheckCircle2, Loader2, Edit2, Eye, EyeOff } from "lucide-react"
import { api } from '@/lib/api'

interface AlertChannel {
    id: string
    name: string
    type: 'email' | 'slack' | 'discord' | 'telegram' | 'webhook'
    config: Record<string, any>
    isActive: boolean
    createdAt: string
}

interface AlertRule {
    id: string
    name?: string
    monitorId: string
    channelId: string
    triggerOn: 'down' | 'degraded' | 'up'
    enabled: boolean
    monitor?: { name: string; url?: string }
    channel?: { name: string }
}

interface Monitor {
    id: string
    name: string
    url?: string
}

export function AlertNotifications() {
    const [channels, setChannels] = useState<AlertChannel[]>([])
    const [rules, setRules] = useState<AlertRule[]>([])
    const [monitors, setMonitors] = useState<Monitor[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [loadingChannels, setLoadingChannels] = useState(true)
    const [loadingRules, setLoadingRules] = useState(true)
    const [step, setStep] = useState<'channels' | 'setup' | 'rules'>('channels')
    const [showPasswords, setShowPasswords] = useState(false)
    
    const [newChannel, setNewChannel] = useState({
        name: '',
        type: 'email' as const,
        config: { email: '', smtpHost: '', smtpPort: 587, smtpUser: '', smtpPass: '' }
    })
    
    const [newRule, setNewRule] = useState({
        monitorId: '',
        channelId: '',
        triggerOn: 'down' as const
    })

    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

    // Fetch channels on mount
    useEffect(() => {
        fetchChannels()
        fetchRules()
        fetchMonitors()
    }, [])

    const fetchChannels = async () => {
        try {
            setLoadingChannels(true)
            const response: any = await api.get('alert-channels').json()
            setChannels(response.channels || [])
        } catch (err) {
            console.error('Failed to fetch channels', err)
        } finally {
            setLoadingChannels(false)
        }
    }

    const fetchRules = async () => {
        try {
            setLoadingRules(true)
            const response: any = await api.get('alert-rules').json()
            setRules(response.rules || [])
        } catch (err) {
            console.error('Failed to fetch rules', err)
        } finally {
            setLoadingRules(false)
        }
    }

    const fetchMonitors = async () => {
        try {
            const response: any = await api.get('monitors').json()
            setMonitors(response.monitors || [])
        } catch (err) {
            console.error('Failed to fetch monitors', err)
        }
    }

    const handleAddChannel = async () => {
        if (!newChannel.name || !newChannel.config.email || !newChannel.config.smtpHost) {
            setError('Please fill in all required fields')
            return
        }

        setIsLoading(true)
        setError(null)
        try {
            const response: any = await api.post('alert-channels', {
                json: {
                    name: newChannel.name,
                    type: newChannel.type,
                    config: newChannel.config,
                }
            }).json()

            setChannels([...channels, response.channel])
            setNewChannel({
                name: '',
                type: 'email',
                config: { email: '', smtpHost: '', smtpPort: 587, smtpUser: '', smtpPass: '' }
            })
            setSuccess(true)
            setStep('channels')
            setTimeout(() => setSuccess(false), 3000)
        } catch (err: any) {
            const errorData = await err.response?.json()
            setError(errorData?.message || 'Failed to create channel')
        } finally {
            setIsLoading(false)
        }
    }

    const handleTestEmail = async () => {
        if (!newChannel.config.email) {
            setError('Please enter a test email address')
            return
        }

        setIsLoading(true)
        setError(null)
        try {
            await api.post('alert-channels/test-email', {
                json: {
                    email: newChannel.config.email,
                    config: newChannel.config,
                }
            }).json()
            setSuccess(true)
            setTimeout(() => setSuccess(false), 3000)
        } catch (err: any) {
            const errorData = await err.response?.json()
            setError(errorData?.message || 'Failed to send test email')
        } finally {
            setIsLoading(false)
        }
    }

    const handleDeleteChannel = async (id: string) => {
        setIsLoading(true)
        try {
            await api.delete(`alert-channels/${id}`)
            setChannels(channels.filter(c => c.id !== id))
            setDeleteConfirm(null)
            setSuccess(true)
            setTimeout(() => setSuccess(false), 3000)
        } catch (err: any) {
            const errorData = await err.response?.json()
            setError(errorData?.message || 'Failed to delete channel')
        } finally {
            setIsLoading(false)
        }
    }

    const handleAddRule = async () => {
        if (!newRule.monitorId || !newRule.channelId) {
            setError('Please select both a monitor and notification channel')
            return
        }

        setIsLoading(true)
        setError(null)
        try {
            const response: any = await api.post('alert-rules', {
                json: {
                    monitorId: newRule.monitorId,
                    channelId: newRule.channelId,
                    triggerOn: newRule.triggerOn,
                }
            }).json()

            setRules([...rules, response.rule])
            setNewRule({ monitorId: '', channelId: '', triggerOn: 'down' })
            setSuccess(true)
            setStep('channels')
            setTimeout(() => setSuccess(false), 3000)
        } catch (err: any) {
            const errorData = await err.response?.json()
            setError(errorData?.message || 'Failed to create rule')
        } finally {
            setIsLoading(false)
        }
    }

    const handleDeleteRule = async (id: string) => {
        setIsLoading(true)
        try {
            await api.delete(`alert-rules/${id}`)
            setRules(rules.filter(r => r.id !== id))
            setDeleteConfirm(null)
            setSuccess(true)
            setTimeout(() => setSuccess(false), 3000)
        } catch (err: any) {
            const errorData = await err.response?.json()
            setError(errorData?.message || 'Failed to delete rule')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="space-y-6">
            {error && (
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            {success && (
                <Alert className="bg-emerald-50 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    <AlertDescription className="text-emerald-700 dark:text-emerald-400">
                        Operation completed successfully!
                    </AlertDescription>
                </Alert>
            )}

            {/* Notification Channels Section */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>Notification Channels</CardTitle>
                            <CardDescription>Configure where alerts will be sent (Email, Slack, Discord, etc.)</CardDescription>
                        </div>
                        <Button 
                            size="sm" 
                            onClick={() => { setStep('setup'); setError(null) }}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white"
                        >
                            <Plus className="h-4 w-4 mr-1" />
                            Add Channel
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    {loadingChannels ? (
                        <div className="py-8 text-center">
                            <Loader2 className="h-6 w-6 animate-spin mx-auto text-slate-400" />
                        </div>
                    ) : channels.length === 0 ? (
                        <div className="text-center py-8 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-dashed">
                            <Mail className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                            <p className="text-sm text-muted-foreground">No notification channels configured</p>
                            <p className="text-xs text-muted-foreground mt-1">Alerts won't be sent until you add a channel</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {channels.map(channel => (
                                <div key={channel.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-slate-50 dark:hover:bg-slate-900/50 transition">
                                    <div className="flex items-center gap-4 flex-1">
                                        <div className="h-10 w-10 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-lg flex items-center justify-center">
                                            <Mail className="h-5 w-5 text-white" />
                                        </div>
                                        <div>
                                            <div className="font-semibold text-sm">{channel.name}</div>
                                            <div className="text-xs text-muted-foreground">
                                                {channel.type === 'email' && `To: ${channel.config.email}`}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <Badge variant={channel.isActive ? "default" : "secondary"} className={channel.isActive ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300" : ""}>
                                            {channel.isActive ? '✓ Active' : 'Inactive'}
                                        </Badge>
                                        <Button 
                                            variant="ghost" 
                                            size="icon" 
                                            className="h-8 w-8 text-destructive hover:bg-destructive/10"
                                            onClick={() => setDeleteConfirm(channel.id)}
                                            disabled={isLoading}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Setup New Channel Modal */}
            {step === 'setup' && (
                <Card className="border-2 border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/50 dark:bg-emerald-950/20">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle>Add Email Notification Channel</CardTitle>
                                <CardDescription>Configure SMTP settings to send email alerts</CardDescription>
                            </div>
                            <Button variant="ghost" size="sm" onClick={() => setStep('channels')}>✕</Button>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Channel Name *</Label>
                                <Input
                                    id="name"
                                    placeholder="e.g., Production Alerts"
                                    value={newChannel.name}
                                    onChange={(e) => setNewChannel({ ...newChannel, name: e.target.value })}
                                    className="border-slate-200 dark:border-slate-700"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="email">Recipient Email *</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="alerts@example.com"
                                    value={newChannel.config.email}
                                    onChange={(e) => setNewChannel({
                                        ...newChannel,
                                        config: { ...newChannel.config, email: e.target.value }
                                    })}
                                    className="border-slate-200 dark:border-slate-700"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="host">SMTP Host *</Label>
                                <Input
                                    id="host"
                                    placeholder="smtp.gmail.com"
                                    value={newChannel.config.smtpHost}
                                    onChange={(e) => setNewChannel({
                                        ...newChannel,
                                        config: { ...newChannel.config, smtpHost: e.target.value }
                                    })}
                                    className="border-slate-200 dark:border-slate-700"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="port">SMTP Port *</Label>
                                <Input
                                    id="port"
                                    type="number"
                                    placeholder="587"
                                    value={newChannel.config.smtpPort}
                                    onChange={(e) => setNewChannel({
                                        ...newChannel,
                                        config: { ...newChannel.config, smtpPort: parseInt(e.target.value) || 587 }
                                    })}
                                    className="border-slate-200 dark:border-slate-700"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="user">SMTP Username</Label>
                                <Input
                                    id="user"
                                    placeholder="your-email@gmail.com"
                                    value={newChannel.config.smtpUser || ''}
                                    onChange={(e) => setNewChannel({
                                        ...newChannel,
                                        config: { ...newChannel.config, smtpUser: e.target.value }
                                    })}
                                    className="border-slate-200 dark:border-slate-700"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="pass">SMTP Password</Label>
                                <div className="flex gap-2">
                                    <Input
                                        id="pass"
                                        type={showPasswords ? "text" : "password"}
                                        placeholder="••••••••"
                                        value={newChannel.config.smtpPass || ''}
                                        onChange={(e) => setNewChannel({
                                            ...newChannel,
                                            config: { ...newChannel.config, smtpPass: e.target.value }
                                        })}
                                        className="border-slate-200 dark:border-slate-700"
                                    />
                                    <Button 
                                        variant="outline" 
                                        size="icon"
                                        onClick={() => setShowPasswords(!showPasswords)}
                                    >
                                        {showPasswords ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </Button>
                                </div>
                            </div>
                        </div>

                        <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-950/20 dark:border-blue-800">
                            <AlertCircle className="h-4 w-4 text-blue-600" />
                            <AlertDescription className="text-blue-700 dark:text-blue-400 text-sm">
                                <strong>Gmail users:</strong> Use an app-specific password, not your regular password. Enable 2FA first in your Google Account.
                            </AlertDescription>
                        </Alert>
                    </CardContent>
                    <CardFooter className="border-t pt-6 gap-3 bg-slate-50/50 dark:bg-slate-900/50">
                        <Button 
                            variant="outline" 
                            onClick={() => setStep('channels')}
                            disabled={isLoading}
                        >
                            Cancel
                        </Button>
                        <Button 
                            onClick={handleTestEmail} 
                            variant="outline"
                            disabled={isLoading || !newChannel.config.email || !newChannel.config.smtpHost}
                        >
                            {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                            Send Test Email
                        </Button>
                        <Button 
                            onClick={handleAddChannel}
                            disabled={isLoading || !newChannel.name || !newChannel.config.email || !newChannel.config.smtpHost}
                            className="ml-auto bg-emerald-600 hover:bg-emerald-500 text-white"
                        >
                            {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                            Save Channel
                        </Button>
                    </CardFooter>
                </Card>
            )}

            {/* Delete Confirmation */}
            {deleteConfirm && (
                <Card className="border-destructive/50 bg-destructive/5">
                    <CardHeader>
                        <CardTitle className="text-destructive">Delete Channel?</CardTitle>
                        <CardDescription>This action cannot be undone. All rules using this channel will be deleted.</CardDescription>
                    </CardHeader>
                    <CardFooter className="gap-3">
                        <Button 
                            variant="outline" 
                            onClick={() => setDeleteConfirm(null)}
                            disabled={isLoading}
                        >
                            Cancel
                        </Button>
                        <Button 
                            variant="destructive"
                            onClick={() => deleteConfirm && handleDeleteChannel(deleteConfirm)}
                            disabled={isLoading}
                        >
                            Delete
                        </Button>
                    </CardFooter>
                </Card>
            )}

            {/* Alert Rules Section */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>Alert Rules</CardTitle>
                            <CardDescription>Define when and where to send notifications based on monitor status changes</CardDescription>
                        </div>
                        <Button 
                            size="sm" 
                            onClick={() => { setStep('rules'); setError(null) }}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white"
                        >
                            <Plus className="h-4 w-4 mr-1" />
                            Add Rule
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    {loadingRules ? (
                        <div className="py-8 text-center">
                            <Loader2 className="h-6 w-6 animate-spin mx-auto text-slate-400" />
                        </div>
                    ) : rules.length === 0 ? (
                        <div className="text-center py-8 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-dashed">
                            <AlertCircle className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                            <p className="text-sm text-muted-foreground">No alert rules configured</p>
                            <p className="text-xs text-muted-foreground mt-1">Create a rule to automatically send alerts when monitors change status</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {rules.map(rule => {
                                const triggerColor = {
                                    down: 'red',
                                    degraded: 'amber',
                                    up: 'green'
                                }[rule.triggerOn]

                                return (
                                    <div key={rule.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-slate-50 dark:hover:bg-slate-900/50 transition">
                                        <div className="flex items-center gap-4 flex-1">
                                            <div className={`h-10 w-10 bg-${triggerColor}-100 dark:bg-${triggerColor}-900/30 rounded-lg flex items-center justify-center`}>
                                                <AlertCircle className={`h-5 w-5 text-${triggerColor}-600`} />
                                            </div>
                                            <div>
                                                <div className="text-sm">
                                                    <span className="font-semibold">{rule.monitor?.name || 'Unknown Monitor'}</span>
                                                    <span className="text-muted-foreground mx-2">→</span>
                                                    <span className="font-semibold">{rule.channel?.name || 'Unknown Channel'}</span>
                                                </div>
                                                <div className="text-xs text-muted-foreground mt-1">
                                                    Trigger when status becomes <Badge variant="outline" className="ml-1 text-xs">
                                                        {rule.triggerOn === 'down' && '🔴 Down'}
                                                        {rule.triggerOn === 'degraded' && '🟡 Degraded'}
                                                        {rule.triggerOn === 'up' && '🟢 Up'}
                                                    </Badge>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <Badge variant={rule.enabled ? "default" : "secondary"} className={rule.enabled ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300" : ""}>
                                                {rule.enabled ? '✓ Active' : 'Inactive'}
                                            </Badge>
                                            <Button 
                                                variant="ghost" 
                                                size="icon" 
                                                className="h-8 w-8 text-destructive hover:bg-destructive/10"
                                                onClick={() => setDeleteConfirm(rule.id)}
                                                disabled={isLoading}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Setup New Rule */}
            {step === 'rules' && (
                <Card className="border-2 border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/50 dark:bg-emerald-950/20">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle>Create Alert Rule</CardTitle>
                                <CardDescription>Set up automatic alerts for monitor status changes</CardDescription>
                            </div>
                            <Button variant="ghost" size="sm" onClick={() => setStep('channels')}>✕</Button>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="monitor">Select Monitor *</Label>
                            <Select value={newRule.monitorId} onValueChange={(val) => setNewRule({ ...newRule, monitorId: val })}>
                                <SelectTrigger id="monitor" className="border-slate-200 dark:border-slate-700">
                                    <SelectValue placeholder="Choose a monitor..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {monitors.length === 0 ? (
                                        <div className="p-2 text-sm text-muted-foreground">No monitors found</div>
                                    ) : (
                                        monitors.map(monitor => (
                                            <SelectItem key={monitor.id} value={monitor.id}>
                                                {monitor.name} {monitor.url && `(${monitor.url})`}
                                            </SelectItem>
                                        ))
                                    )}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="channel">Notification Channel *</Label>
                            <Select value={newRule.channelId} onValueChange={(val) => setNewRule({ ...newRule, channelId: val })}>
                                <SelectTrigger id="channel" className="border-slate-200 dark:border-slate-700">
                                    <SelectValue placeholder="Choose a channel..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {channels.length === 0 ? (
                                        <div className="p-2 text-sm text-muted-foreground">No channels found. Create one first.</div>
                                    ) : (
                                        channels.map(channel => (
                                            <SelectItem key={channel.id} value={channel.id}>
                                                {channel.name}
                                            </SelectItem>
                                        ))
                                    )}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="trigger">Trigger Alert When Status Becomes *</Label>
                            <Select value={newRule.triggerOn} onValueChange={(val: any) => setNewRule({ ...newRule, triggerOn: val })}>
                                <SelectTrigger id="trigger" className="border-slate-200 dark:border-slate-700">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="down">🔴 Down (Not Responding)</SelectItem>
                                    <SelectItem value="degraded">🟡 Degraded (High Latency)</SelectItem>
                                    <SelectItem value="up">🟢 Up (Recovered)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-950/20 dark:border-blue-800">
                            <AlertCircle className="h-4 w-4 text-blue-600" />
                            <AlertDescription className="text-blue-700 dark:text-blue-400 text-sm">
                                This rule will send an alert to the selected channel whenever the monitor status changes to the specified condition.
                            </AlertDescription>
                        </Alert>
                    </CardContent>
                    <CardFooter className="border-t pt-6 gap-3 bg-slate-50/50 dark:bg-slate-900/50">
                        <Button 
                            variant="outline" 
                            onClick={() => setStep('channels')}
                            disabled={isLoading}
                        >
                            Cancel
                        </Button>
                        <Button 
                            onClick={handleAddRule}
                            disabled={isLoading || !newRule.monitorId || !newRule.channelId}
                            className="ml-auto bg-emerald-600 hover:bg-emerald-500 text-white"
                        >
                            {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                            Create Rule
                        </Button>
                    </CardFooter>
                </Card>
            )}
        </div>
    )
}
