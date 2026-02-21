'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { api } from '@/lib/api'
import { Loader2, Plus, Trash2, ArrowLeft, CheckCircle2, Zap } from 'lucide-react'
import Link from 'next/link'

const monitorSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    url: z.string().url('Invalid URL'),
    type: z.enum(['http', 'tcp', 'icmp', 'dns', 'ssl']),
    interval: z.coerce.number().min(30, 'Interval must be at least 30 seconds'),
    metadata: z.object({
        headers: z.array(z.object({
            key: z.string().optional(),
            value: z.string().optional()
        })).optional(),
        bodyMatch: z.string().optional(),
        timeout: z.coerce.number().optional().default(10000),
        followRedirect: z.boolean().optional().default(true),
        proxy: z.string().optional(),
    }).optional(),
})

type MonitorFormValues = z.infer<typeof monitorSchema>

export default function NewMonitorPage() {
    const router = useRouter()
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [step, setStep] = useState(0)

    const {
        register,
        handleSubmit,
        control,
        watch,
        trigger,
        formState: { errors },
    } = useForm<MonitorFormValues>({
        resolver: zodResolver(monitorSchema),
        defaultValues: {
            type: 'http',
            interval: 60,
            metadata: {
                timeout: 10000,
                followRedirect: true,
                headers: [],
            }
        },
    })

    const { fields, append, remove } = useFieldArray({
        control,
        name: 'metadata.headers' as any,
    })

    const monitorType = watch('type')

    const onSubmit = async (values: MonitorFormValues) => {
        setIsSubmitting(true)
        setError(null)

        const headersRecord = values.metadata?.headers?.reduce((acc, h) => {
            if (h?.key && h?.value) acc[h.key] = h.value
            return acc
        }, {} as Record<string, string>)

        const payload = {
            ...values,
            metadata: {
                ...values.metadata,
                headers: headersRecord,
            }
        }

        try {
            await api.post('monitors', { json: payload }).json()
            router.push('/monitors')
        } catch (err: any) {
            const errorData = await err.response?.json()
            setError(errorData?.message || 'Failed to create monitor')
        } finally {
            setIsSubmitting(false)
        }
    }

    const next = async () => {
        let valid = true
        if (step === 0) {
            valid = await trigger(['name', 'url', 'type', 'interval'])
        } else if (step === 1) {
            valid = await trigger(['metadata.timeout', 'metadata.followRedirect'])
        }
        if (valid) setStep((s) => Math.min(2, s + 1))
    }

    const back = () => setStep((s) => Math.max(0, s - 1))

    const steps = [
        { title: 'Basic Info', icon: '1' },
        { title: 'Advanced Settings', icon: '2' },
        { title: 'HTTP Headers', icon: '3' },
    ]

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center gap-4">
                <Button asChild variant="ghost" size="icon">
                    <Link href="/monitors">
                        <ArrowLeft className="h-5 w-5" />
                    </Link>
                </Button>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">New Monitor</h1>
                    <p className="text-muted-foreground">Step {step + 1} of 3 — Create a new monitoring probe</p>
                </div>
            </div>

            <div className="flex gap-2 justify-center">
                {steps.map((s, i) => (
                    <div key={i} className="flex items-center gap-2">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors ${
                            i < step ? 'bg-emerald-600 text-white' :
                            i === step ? 'bg-emerald-100 text-emerald-600 ring-2 ring-emerald-600' :
                            'bg-slate-100 text-slate-600'
                        }`}>
                            {i < step ? <CheckCircle2 className="h-4 w-4" /> : s.icon}
                        </div>
                        <span className={`text-sm font-medium ${i === step ? 'text-emerald-600' : 'text-slate-600'}`}>{s.title}</span>
                        {i < steps.length - 1 && <div className="w-8 h-px bg-slate-200 ml-2" />}
                    </div>
                ))}
            </div>

            <form onSubmit={handleSubmit(onSubmit)}>
                {/* Step 0: Basic Info */}
                {step === 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Basic Configuration</CardTitle>
                            <CardDescription>Essential details for your monitor.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {error && (
                                <div className="p-3 text-sm bg-destructive/10 border border-destructive/20 text-destructive rounded-md">
                                    {error}
                                </div>
                            )}
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Friendly Name</Label>
                                    <Input id="name" placeholder="My Website" {...register('name')} />
                                    {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="type">Monitor Type</Label>
                                    <Select defaultValue="http" onValueChange={(val: any) => register('type').onChange({ target: { value: val, name: 'type' } })}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="http">HTTP / HTTPS</SelectItem>
                                            <SelectItem value="tcp">TCP (Port)</SelectItem>
                                            <SelectItem value="icmp">ICMP (Ping)</SelectItem>
                                            <SelectItem value="dns">DNS Records</SelectItem>
                                            <SelectItem value="ssl">SSL Certificate</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="url">Target URL / Host</Label>
                                <Input id="url" placeholder="https://example.com" {...register('url')} />
                                {errors.url && <p className="text-xs text-destructive">{errors.url.message}</p>}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="interval">Heartbeat Interval (Seconds)</Label>
                                <Input id="interval" type="number" {...register('interval')} />
                                <p className="text-xs text-muted-foreground">Frequency of checks. Min 30s.</p>
                                {errors.interval && <p className="text-xs text-destructive">{errors.interval.message}</p>}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Step 1: Advanced Settings */}
                {step === 1 && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Advanced Settings</CardTitle>
                            <CardDescription>Configure probe behavior and timeouts.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <Label htmlFor="followRedirect">Follow HTTP Redirects</Label>
                                    <p className="text-xs text-muted-foreground mt-1">Automatically follow 3xx redirects</p>
                                </div>
                                <Switch id="followRedirect" defaultChecked {...register('metadata.followRedirect')} />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="timeout">Request Timeout (milliseconds)</Label>
                                <Input id="timeout" type="number" placeholder="10000" {...register('metadata.timeout')} />
                                <p className="text-xs text-muted-foreground">Max time to wait for a response. Default 10000ms.</p>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="proxy">Proxy URL (Optional)</Label>
                                <Input id="proxy" placeholder="http://proxy.example.com:8080" {...register('metadata.proxy')} />
                                <p className="text-xs text-muted-foreground">Route requests through a proxy server</p>
                            </div>

                            <div className="space-y-2 pt-4 border-t">
                                <Label htmlFor="bodyMatch">Response Body Match (Regex)</Label>
                                <Input id="bodyMatch" placeholder='{"status":"ok"}' {...register('metadata.bodyMatch')} />
                                <p className="text-xs text-muted-foreground">Monitor fails if body does not match this pattern.</p>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Step 2: HTTP Headers */}
                {step === 2 && (
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle>HTTP Headers</CardTitle>
                                <CardDescription>Custom headers to send with requests (optional).</CardDescription>
                            </div>
                            <Button type="button" variant="outline" size="sm" onClick={() => append({ key: '', value: '' })}>
                                <Plus className="h-4 w-4 mr-1" />
                                Add Header
                            </Button>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {fields.length === 0 ? (
                                <div className="p-8 text-center border-2 border-dashed rounded-lg">
                                    <Zap className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                                    <p className="text-sm text-muted-foreground">No headers added yet.</p>
                                    <p className="text-xs text-muted-foreground">Add headers like User-Agent or Authorization.</p>
                                </div>
                            ) : (
                                fields.map((field, index) => (
                                    <div key={field.id} className="flex gap-4 items-end p-4 bg-slate-50 dark:bg-slate-900 rounded-lg border">
                                        <div className="flex-1 space-y-2">
                                            <Label className="text-[10px] uppercase text-muted-foreground">Header Key</Label>
                                            <Input {...register(`metadata.headers.${index}.key` as any)} placeholder="User-Agent" />
                                        </div>
                                        <div className="flex-1 space-y-2">
                                            <Label className="text-[10px] uppercase text-muted-foreground">Value</Label>
                                            <Input {...register(`metadata.headers.${index}.value` as any)} placeholder="NetPulse/1.0" />
                                        </div>
                                        <Button variant="ghost" size="icon" className="text-destructive" onClick={() => remove(index)}>
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))
                            )}
                        </CardContent>
                    </Card>
                )}

                {/* Navigation */}
                <div className="mt-8 flex justify-between">
                    <Button variant="outline" asChild>
                        <Link href="/monitors">Cancel</Link>
                    </Button>
                    <div className="flex gap-4">
                        {step > 0 && (
                            <Button variant="secondary" onClick={back} disabled={isSubmitting}>
                                Back
                            </Button>
                        )}

                        {step < 2 ? (
                            <Button onClick={next} className="bg-emerald-600 hover:bg-emerald-500 text-white">
                                Next
                            </Button>
                        ) : (
                            <Button type="submit" className="bg-emerald-600 hover:bg-emerald-500 text-white min-w-[140px]" disabled={isSubmitting}>
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Creating...
                                    </>
                                ) : (
                                    'Create Monitor'
                                )}
                            </Button>
                        )}
                    </div>
                </div>
            </form>
        </div>
    )
}
