'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
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
import { useAuth } from '@/components/auth-provider'
import { api } from '@/lib/api'
import { Loader2, ShieldCheck } from 'lucide-react'

const loginSchema = z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
})

type LoginFormValues = z.infer<typeof loginSchema>

export default function LoginPage() {
    const { login } = useAuth()
    const [error, setError] = useState<string | null>(null)
    const [isSubmitting, setIsSubmitting] = useState(false)

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<LoginFormValues>({
        resolver: zodResolver(loginSchema),
    })

    const onSubmit = async (values: LoginFormValues) => {
        setIsSubmitting(true)
        setError(null)
        try {
            const response: any = await api.post('auth/login', { json: values }).json()
            login(response.token, response.user)
        } catch (err: any) {
            const errorData = await err.response?.json()
            setError(errorData?.message || 'Invalid email or password')
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">
            {/* Left Side - Hero/Branding */}
            <div className="hidden lg:flex w-1/2 bg-slate-900 items-center justify-center p-12 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/20 to-sky-500/20" />
                <div className="relative z-10 text-white max-w-md">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="h-12 w-12 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
                            <ShieldCheck className="h-8 w-8 text-white" />
                        </div>
                        <h1 className="text-3xl font-bold tracking-tight">NetPulse</h1>
                    </div>
                    <h2 className="text-4xl font-bold mb-6">Uptime monitoring for modern teams.</h2>
                    <p className="text-slate-400 text-lg leading-relaxed">
                        Monitor your APIs, websites, and infrastructure in real-time. Get notified before your customers notice.
                    </p>

                    <div className="mt-12 grid grid-cols-2 gap-6">
                        <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700/50">
                            <div className="text-2xl font-bold text-emerald-400">99.99%</div>
                            <div className="text-sm text-slate-500">Uptime Reliability</div>
                        </div>
                        <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700/50">
                            <div className="text-2xl font-bold text-sky-400">&lt; 50ms</div>
                            <div className="text-sm text-slate-500">Global Latency</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Side - Login Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12">
                <Card className="w-full max-w-md border-none shadow-none bg-transparent lg:bg-white lg:dark:bg-slate-900 lg:shadow-xl lg:border lg:border-slate-200 lg:dark:border-slate-800">
                    <CardHeader className="space-y-1">
                        <div className="lg:hidden flex items-center gap-2 mb-4">
                            <ShieldCheck className="h-6 w-6 text-emerald-500" />
                            <span className="font-bold text-xl">NetPulse</span>
                        </div>
                        <CardTitle className="text-2xl font-bold">Welcome back</CardTitle>
                        <CardDescription>
                            Enter your credentials to access your dashboard
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                            {error && (
                                <div className="p-3 text-sm bg-destructive/10 border border-destructive/20 text-destructive rounded-md">
                                    {error}
                                </div>
                            )}
                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="name@example.com"
                                    {...register('email')}
                                    className={errors.email ? 'border-destructive' : ''}
                                />
                                {errors.email && (
                                    <p className="text-xs text-destructive">{errors.email.message}</p>
                                )}
                            </div>
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="password">Password</Label>
                                    <Button variant="link" className="px-0 h-auto font-normal text-xs text-slate-500" type="button">
                                        Forgot password?
                                    </Button>
                                </div>
                                <Input
                                    id="password"
                                    type="password"
                                    {...register('password')}
                                    className={errors.password ? 'border-destructive' : ''}
                                />
                                {errors.password && (
                                    <p className="text-xs text-destructive">{errors.password.message}</p>
                                )}
                            </div>
                            <Button type="submit" className="w-full h-10" disabled={isSubmitting}>
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Signing in...
                                    </>
                                ) : (
                                    'Sign In'
                                )}
                            </Button>
                        </form>
                    </CardContent>
                    <CardFooter className="flex flex-col space-y-4 border-t border-slate-100 dark:border-slate-800 pt-6 mt-6">
                        <div className="text-sm text-slate-500 text-center">
                            Don't have an account?{' '}
                            <Button variant="link" className="px-0 h-auto font-semibold text-emerald-600 dark:text-emerald-400" type="button">
                                Request access
                            </Button>
                        </div>
                    </CardFooter>
                </Card>
            </div>
        </div>
    )
}
