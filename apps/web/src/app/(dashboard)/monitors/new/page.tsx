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
    CardFooter,
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
import { Loader2, Plus, Trash2, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

const monitorSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    url: z.string().url('Invalid URL'),
    type: z.enum(['http', 'tcp', 'icmp', 'dns', 'ssl']),
    interval: z.coerce.number().min(30, 'Interval must be at least 30 seconds'),
    metadata: z.object({
        headers: z.array(z.object({
            key: z.string(),
            value: z.string()
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

    const {
        register,
        handleSubmit,
        control,
        watch,
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

        // Transform headers array back to record
        const headersRecord = values.metadata?.headers?.reduce((acc, { key, value }) => {
            if (key && value) acc[key] = value
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
            await api.post('api/monitors', { json: payload }).json()
            router.push('/monitors')
        } catch (err: any) {
            const errorData = await err.response?.json()
            setError(errorData?.message || 'Failed to create monitor')
        } finally {
            setIsSubmitting(false)
        }
    }

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
                    <p className="text-muted-foreground">Configure a new monitoring probe.</p>
                </div>
            </div>

            <form onSubmit={handleSubmit(onSubmit)}>
                <div className="grid gap-6 md:grid-cols-3">
                    <Card className="md:col-span-2">
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

                    <Card>
                        <CardHeader>
                            <CardTitle>Settings</CardTitle>
                            <CardDescription>Advanced probe behavior.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="followRedirect">Follow Redirects</Label>
                                    <Switch id="followRedirect" defaultChecked {...register('metadata.followRedirect')} />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="timeout">Timeout (ms)</Label>
                                <Input id="timeout" type="number" placeholder="10000" {...register('metadata.timeout')} />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="proxy">Proxy URL (Optional)</Label>
                                <Input id="proxy" placeholder="http://proxy.com:8080" {...register('metadata.proxy')} />
                            </div>
                        </CardContent>
                    </Card>

                    {monitorType === 'http' && (
                        <Card className="md:col-span-3">
                            <CardHeader className="flex flex-row items-center justify-between">
                                <div>
                                    <CardTitle>HTTP Headers</CardTitle>
                                    <CardDescription>Custom headers to send with the request.</CardDescription>
                                </div>
                                <Button type="button" variant="outline" size="sm" onClick={() => append({ key: '', value: '' })}>
                                    <Plus className="h-4 w-4 mr-1" />
                                    Add Header
                                </Button>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {fields.map((field, index) => (
                                    <div key={field.id} className="flex gap-4 items-end">
                                        <div className="flex-1 space-y-2">
                                            <Label className="text-[10px] uppercase text-muted-foreground">Key</Label>
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
                                ))}

                                <div className="space-y-2 pt-4 border-t">
                                    <Label htmlFor="bodyMatch">Response Body Match (Regex)</Label>
                                    <Input id="bodyMatch" placeholder='{"status":"ok"}' {...register('metadata.bodyMatch')} />
                                    <p className="text-xs text-muted-foreground">Monitor will fail if body does not match this pattern.</p>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>

                <div className="mt-8 flex justify-end gap-4">
                    <Button variant="outline" asChild disabled={isSubmitting}>
                        <Link href="/monitors">Cancel</Link>
                    </Button>
                    <Button type="submit" className="bg-emerald-600 hover:bg-emerald-500 text-white min-w-[120px]" disabled={isSubmitting}>
                        {isSubmitting ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Creating...
                            </>
                        ) : (
                            'Save Monitor'
                        )}
                    </Button>
                </div>
            </form>
        </div>
    )
}
