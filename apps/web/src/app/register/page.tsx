'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
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
import { useAuth } from '@/components/auth-provider'
import { api } from '@/lib/api'
import { Loader2, ShieldCheck, ArrowRight } from 'lucide-react'
import Link from 'next/link'

const registerSchema = z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string(),
    orgName: z.string().min(2, 'Organization name must be at least 2 characters'),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
})

type RegisterFormValues = z.infer<typeof registerSchema>

export default function RegisterPage() {
    const { login } = useAuth()
    const router = useRouter()
    const [error, setError] = useState<string | null>(null)
    const [isSubmitting, setIsSubmitting] = useState(false)

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<RegisterFormValues>({
        resolver: zodResolver(registerSchema),
    })

    const onSubmit = async (values: RegisterFormValues) => {
        setIsSubmitting(true)
        setError(null)
        try {
            const response: any = await api.post('auth/register', {
                json: {
                    email: values.email,
                    password: values.password,
                    orgName: values.orgName,
                }
            }).json()

            login(response.token, response.user)
            router.push('/monitors')
        } catch (err: any) {
            const errorData = await err.response?.json()
            setError(errorData?.message || 'Failed to create account')
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

            {/* Right Side - Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12">
                <Card className="w-full max-w-md">
                    <CardHeader className="space-y-2">
                        <CardTitle className="text-2xl">Create Account</CardTitle>
                        <CardDescription>
                            Set up your organization and start monitoring.
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
                                <Label htmlFor="orgName">Organization Name</Label>
                                <Input
                                    id="orgName"
                                    placeholder="Acme Corp"
                                    {...register('orgName')}
                                />
                                {errors.orgName && (
                                    <p className="text-xs text-destructive">{errors.orgName.message}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="email">Email Address</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="you@example.com"
                                    {...register('email')}
                                />
                                {errors.email && (
                                    <p className="text-xs text-destructive">{errors.email.message}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="password">Password</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    placeholder="••••••••"
                                    {...register('password')}
                                />
                                {errors.password && (
                                    <p className="text-xs text-destructive">{errors.password.message}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="confirmPassword">Confirm Password</Label>
                                <Input
                                    id="confirmPassword"
                                    type="password"
                                    placeholder="••••••••"
                                    {...register('confirmPassword')}
                                />
                                {errors.confirmPassword && (
                                    <p className="text-xs text-destructive">{errors.confirmPassword.message}</p>
                                )}
                            </div>

                            <Button
                                type="submit"
                                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white"
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Creating Account...
                                    </>
                                ) : (
                                    <>
                                        Create Account
                                        <ArrowRight className="ml-2 h-4 w-4" />
                                    </>
                                )}
                            </Button>
                        </form>

                        <div className="mt-4 text-center text-sm">
                            <span className="text-slate-600 dark:text-slate-400">
                                Already have an account?{' '}
                            </span>
                            <Link href="/login" className="text-emerald-600 hover:text-emerald-500 font-medium">
                                Sign in
                            </Link>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
