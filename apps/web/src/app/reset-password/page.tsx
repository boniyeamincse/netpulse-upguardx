'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
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
import { api } from '@/lib/api'
import { Loader2, ShieldCheck, ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react'
import Link from 'next/link'

const resetPasswordSchema = z.object({
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
})

type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>

export default function ResetPasswordPage() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const token = searchParams.get('token')

    const [error, setError] = useState<string | null>(null)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [success, setSuccess] = useState(false)
    const [isValidToken, setIsValidToken] = useState(true)
    const [isLoading, setIsLoading] = useState(true)

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<ResetPasswordFormValues>({
        resolver: zodResolver(resetPasswordSchema),
    })

    useEffect(() => {
        // Validate token
        if (!token) {
            setIsValidToken(false)
        }
        setIsLoading(false)
    }, [token])

    const onSubmit = async (values: ResetPasswordFormValues) => {
        if (!token) return

        setIsSubmitting(true)
        setError(null)
        try {
            await api.post('auth/reset-password', {
                json: {
                    token,
                    password: values.password,
                }
            }).json()
            setSuccess(true)
            setTimeout(() => router.push('/login'), 3000)
        } catch (err: any) {
            const errorData = await err.response?.json()
            setError(errorData?.message || 'Failed to reset password')
        } finally {
            setIsSubmitting(false)
        }
    }

    if (isLoading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
                <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
            </div>
        )
    }

    if (!isValidToken) {
        return (
            <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">
                <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 lg:ml-auto">
                    <Card className="w-full max-w-md">
                        <CardHeader>
                            <div className="h-12 w-12 bg-destructive/10 rounded-lg flex items-center justify-center mb-4">
                                <AlertCircle className="h-6 w-6 text-destructive" />
                            </div>
                            <CardTitle>Invalid Link</CardTitle>
                            <CardDescription>
                                This password reset link is invalid or has expired.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <p className="text-sm text-slate-600 dark:text-slate-400">
                                Password reset links expire after 1 hour. Please request a new one.
                            </p>
                            <Button asChild className="w-full bg-emerald-600 hover:bg-emerald-500 text-white">
                                <Link href="/forgot-password">Request New Link</Link>
                            </Button>
                            <Button asChild variant="outline" className="w-full">
                                <Link href="/login">Back to Login</Link>
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        )
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
                    <h2 className="text-4xl font-bold mb-6">Create a strong password</h2>
                    <p className="text-slate-400 text-lg leading-relaxed">
                        Use a combination of upper and lowercase letters, numbers, and symbols for a secure password.
                    </p>

                    <div className="mt-12 space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700/50">
                                <div className="text-sm font-semibold text-slate-300 mb-2">✓ Secure</div>
                                <div className="text-xs text-slate-500">8+ characters</div>
                            </div>
                            <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700/50">
                                <div className="text-sm font-semibold text-slate-300 mb-2">✓ Unique</div>
                                <div className="text-xs text-slate-500">Not reused</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Side - Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12">
                <Card className="w-full max-w-md">
                    <CardHeader>
                        <div className="flex items-center gap-2 mb-3">
                            <Button asChild variant="ghost" size="icon">
                                <Link href="/login">
                                    <ArrowLeft className="h-5 w-5" />
                                </Link>
                            </Button>
                        </div>
                        <CardTitle className="text-2xl">Reset Password</CardTitle>
                        <CardDescription>
                            Enter your new password below.
                        </CardDescription>
                    </CardHeader>

                    <CardContent>
                        {success ? (
                            <div className="space-y-4 text-center">
                                <div className="h-12 w-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto">
                                    <CheckCircle2 className="h-6 w-6 text-emerald-600" />
                                </div>
                                <div className="space-y-2">
                                    <h3 className="font-semibold text-lg">Password Reset</h3>
                                    <p className="text-sm text-slate-600 dark:text-slate-400">
                                        Your password has been successfully reset. Redirecting to login...
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                                {error && (
                                    <div className="p-3 text-sm bg-destructive/10 border border-destructive/20 text-destructive rounded-md">
                                        {error}
                                    </div>
                                )}

                                <div className="space-y-2">
                                    <Label htmlFor="password">New Password</Label>
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
                                            Resetting...
                                        </>
                                    ) : (
                                        'Reset Password'
                                    )}
                                </Button>
                            </form>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
