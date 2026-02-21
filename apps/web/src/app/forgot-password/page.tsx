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
    CardHeader,
    CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { api } from '@/lib/api'
import { Loader2, ShieldCheck, ArrowLeft, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'

const forgotPasswordSchema = z.object({
    email: z.string().email('Invalid email address'),
})

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>

export default function ForgotPasswordPage() {
    const [error, setError] = useState<string | null>(null)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [submitted, setSubmitted] = useState(false)

    const {
        register,
        handleSubmit,
        watch,
        formState: { errors },
    } = useForm<ForgotPasswordFormValues>({
        resolver: zodResolver(forgotPasswordSchema),
    })

    const email = watch('email')

    const onSubmit = async (values: ForgotPasswordFormValues) => {
        setIsSubmitting(true)
        setError(null)
        try {
            await api.post('auth/forgot-password', { json: values }).json()
            setSubmitted(true)
        } catch (err: any) {
            const errorData = await err.response?.json()
            setError(errorData?.message || 'Failed to process request')
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
                    <h2 className="text-4xl font-bold mb-6">Regain access to your account.</h2>
                    <p className="text-slate-400 text-lg leading-relaxed">
                        We'll send you a password reset link via email. Check your inbox and click the link to create a new password.
                    </p>

                    <div className="mt-12 space-y-4 text-sm text-slate-400">
                        <div className="flex items-start gap-3">
                            <div className="h-5 w-5 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                                <div className="h-2 w-2 bg-emerald-400 rounded-full" />
                            </div>
                            <span>We'll verify your email address</span>
                        </div>
                        <div className="flex items-start gap-3">
                            <div className="h-5 w-5 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                                <div className="h-2 w-2 bg-emerald-400 rounded-full" />
                            </div>
                            <span>Send a secure reset link</span>
                        </div>
                        <div className="flex items-start gap-3">
                            <div className="h-5 w-5 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                                <div className="h-2 w-2 bg-emerald-400 rounded-full" />
                            </div>
                            <span>Create your new password</span>
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
                        <CardTitle className="text-2xl">Forgot password?</CardTitle>
                        <CardDescription>
                            Enter your email address and we'll send you a link to reset your password.
                        </CardDescription>
                    </CardHeader>

                    <CardContent>
                        {submitted ? (
                            <div className="space-y-4 text-center">
                                <div className="h-12 w-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto">
                                    <CheckCircle2 className="h-6 w-6 text-emerald-600" />
                                </div>
                                <div className="space-y-2">
                                    <h3 className="font-semibold text-lg">Check your email</h3>
                                    <p className="text-sm text-slate-600 dark:text-slate-400">
                                        We've sent a password reset link to <strong>{email}</strong>
                                    </p>
                                </div>
                                <div className="pt-4 space-y-3">
                                    <p className="text-xs text-slate-500">
                                        The link expires in 1 hour. If you don't see the email, check your spam folder.
                                    </p>
                                    <Button asChild className="w-full bg-emerald-600 hover:bg-emerald-500 text-white">
                                        <Link href="/login">Back to Login</Link>
                                    </Button>
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

                                <Button
                                    type="submit"
                                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-white"
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Sending...
                                        </>
                                    ) : (
                                        'Send Reset Link'
                                    )}
                                </Button>

                                <div className="text-center text-sm text-slate-600 dark:text-slate-400">
                                    Remember your password?{' '}
                                    <Button asChild variant="link" className="px-0 h-auto font-semibold text-emerald-600 dark:text-emerald-400">
                                        <Link href="/login">Sign in</Link>
                                    </Button>
                                </div>
                            </form>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
