'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { AlertCircle, Copy, Eye, EyeOff, Shield, CheckCircle2, AlertTriangle } from "lucide-react"
import { api } from '@/lib/api'

interface TwoFactorState {
    enabled: boolean
    qrCode?: string
    secret?: string
    backupCodes?: string[]
    verified: boolean
}

export function TwoFactorSetup() {
    const [twoFactor, setTwoFactor] = useState<TwoFactorState>({
        enabled: false,
        verified: false,
    })
    const [verificationCode, setVerificationCode] = useState('')
    const [showSecret, setShowSecret] = useState(false)
    const [copied, setCopied] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [step, setStep] = useState<'setup' | 'verify' | 'complete'>('setup')

    const handleEnableTwoFactor = async () => {
        setIsLoading(true)
        setError(null)
        try {
            const response: any = await api.post('auth/2fa/generate', {}).json()
            setTwoFactor({
                enabled: true,
                qrCode: response.qrCode,
                secret: response.secret,
                verified: false,
            })
            setStep('verify')
        } catch (err: any) {
            const errorData = await err.response?.json()
            setError(errorData?.message || 'Failed to generate 2FA setup')
        } finally {
            setIsLoading(false)
        }
    }

    const handleVerify = async () => {
        if (verificationCode.length !== 6) {
            setError('Please enter a 6-digit code')
            return
        }

        setIsLoading(true)
        setError(null)
        try {
            const response: any = await api.post('auth/2fa/verify', {
                json: {
                    token: verificationCode,
                    secret: twoFactor.secret,
                }
            }).json()

            setTwoFactor(prev => ({
                ...prev,
                verified: true,
                backupCodes: response.backupCodes,
            }))
            setStep('complete')
        } catch (err: any) {
            const errorData = await err.response?.json()
            setError(errorData?.message || 'Invalid verification code')
        } finally {
            setIsLoading(false)
        }
    }

    const handleDisableTwoFactor = async () => {
        if (!confirm('Are you sure? You will no longer require 2FA to log in.')) return

        setIsLoading(true)
        setError(null)
        try {
            await api.post('auth/2fa/disable', {}).json()
            setTwoFactor({ enabled: false, verified: false })
            setStep('setup')
            setVerificationCode('')
        } catch (err: any) {
            const errorData = await err.response?.json()
            setError(errorData?.message || 'Failed to disable 2FA')
        } finally {
            setIsLoading(false)
        }
    }

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    return (
        <div className="space-y-6">
            {/* Setup Step */}
            {step === 'setup' && !twoFactor.verified && (
                <Card className="border-slate-200 dark:border-slate-800">
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <Shield className="h-5 w-5 text-emerald-600" />
                            <div>
                                <CardTitle>Two-Factor Authentication</CardTitle>
                                <CardDescription>Add an extra layer of security to your account</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 flex gap-3">
                            <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                            <div className="text-sm text-blue-900 dark:text-blue-200">
                                Two-factor authentication adds an extra layer of security. You'll need your phone to sign in.
                            </div>
                        </div>

                        <div className="space-y-2">
                            <h4 className="font-semibold">What you'll need:</h4>
                            <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                                <li>• An authenticator app (Google Authenticator, Authy, Microsoft Authenticator)</li>
                                <li>• A secure location to store backup codes</li>
                            </ul>
                        </div>
                    </CardContent>
                    <CardFooter className="border-t pt-6">
                        <Button onClick={handleEnableTwoFactor} disabled={isLoading} className="ml-auto bg-emerald-600 hover:bg-emerald-500 text-white">
                            {isLoading ? 'Setting up...' : 'Enable 2FA'}
                        </Button>
                    </CardFooter>
                </Card>
            )}

            {/* Verification Step */}
            {step === 'verify' && !twoFactor.verified && (
                <Card className="border-emerald-200 dark:border-emerald-900/50">
                    <CardHeader>
                        <CardTitle>Scan QR Code</CardTitle>
                        <CardDescription>Use your authenticator app to scan this code</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {error && (
                            <div className="p-3 text-sm bg-destructive/10 border border-destructive/20 text-destructive rounded-md">
                                {error}
                            </div>
                        )}

                        {/* QR Code Display */}
                        <div className="flex justify-center">
                            <div className="bg-white p-4 rounded-lg border-2 border-slate-200">
                                {twoFactor.qrCode && (
                                    <img src={twoFactor.qrCode} alt="2FA QR Code" className="h-48 w-48" />
                                )}
                            </div>
                        </div>

                        {/* Manual Entry */}
                        <div className="space-y-2">
                            <Label htmlFor="secret">Or enter manually:</Label>
                            <div className="flex gap-2">
                                <div className="flex-1 relative">
                                    <Input
                                        id="secret"
                                        type={showSecret ? "text" : "password"}
                                        value={twoFactor.secret || ''}
                                        readOnly
                                        className="font-mono text-sm"
                                    />
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8"
                                        onClick={() => setShowSecret(!showSecret)}
                                    >
                                        {showSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </Button>
                                </div>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={() => copyToClipboard(twoFactor.secret || '')}
                                >
                                    <Copy className={`h-4 w-4 ${copied ? 'text-emerald-600' : ''}`} />
                                </Button>
                            </div>
                        </div>

                        {/* Verification Code Input */}
                        <Separator />

                        <div className="space-y-2">
                            <Label htmlFor="code">Enter 6-digit verification code</Label>
                            <Input
                                id="code"
                                type="text"
                                placeholder="000000"
                                maxLength={6}
                                value={verificationCode}
                                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                                className="text-center text-2xl font-bold tracking-widest"
                            />
                            <p className="text-xs text-muted-foreground">The code changes every 30 seconds</p>
                        </div>
                    </CardContent>
                    <CardFooter className="border-t pt-6 gap-3">
                        <Button variant="outline" onClick={() => setStep('setup')}>
                            Cancel
                        </Button>
                        <Button onClick={handleVerify} disabled={isLoading || verificationCode.length !== 6} className="ml-auto bg-emerald-600 hover:bg-emerald-500 text-white">
                            {isLoading ? 'Verifying...' : 'Verify & Enable'}
                        </Button>
                    </CardFooter>
                </Card>
            )}

            {/* Complete Step - Backup Codes */}
            {step === 'complete' && twoFactor.verified && (
                <Card className="border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/50 dark:bg-emerald-900/20">
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                            <div>
                                <CardTitle>2FA Enabled Successfully!</CardTitle>
                                <CardDescription>Save your backup codes in a secure location</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4 flex gap-3">
                            <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                            <div className="text-sm text-amber-900 dark:text-amber-200">
                                <strong>Important:</strong> Save these backup codes somewhere safe. Use them if you lose access to authenticator.
                            </div>
                        </div>

                        {/* Backup Codes */}
                        <div className="bg-slate-900 dark:bg-slate-950 text-slate-50 p-4 rounded-lg font-mono text-sm space-y-2">
                            {twoFactor.backupCodes?.map((code, idx) => (
                                <div key={idx} className="flex items-center justify-between group">
                                    <span className="text-slate-400">{idx + 1}.</span>
                                    <code className="tracking-wider">{code}</code>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                        onClick={() => copyToClipboard(code)}
                                    >
                                        <Copy className="h-3 w-3" />
                                    </Button>
                                </div>
                            ))}
                        </div>

                        <div className="space-y-2">
                            <Label className="flex items-center gap-2">
                                <input type="checkbox" className="rounded" />
                                <span className="text-sm">I have saved my backup codes in a secure location</span>
                            </Label>
                        </div>
                    </CardContent>
                    <CardFooter className="border-t pt-6">
                        <Button onClick={() => setStep('setup')} className="ml-auto bg-emerald-600 hover:bg-emerald-500 text-white">
                            Complete Setup
                        </Button>
                    </CardFooter>
                </Card>
            )}

            {/* Active 2FA Section */}
            {twoFactor.verified && step === 'setup' && (
                <Card className="border-emerald-200 dark:border-emerald-900/50">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                                <div>
                                    <CardTitle>Two-Factor Authentication Active</CardTitle>
                                    <CardDescription>Your account is protected with 2FA</CardDescription>
                                </div>
                            </div>
                            <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400">
                                Enabled
                            </Badge>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="text-sm text-muted-foreground">
                            Your authenticator app is synced with your NetPulse account. You'll be asked to enter your verification code when signing in.
                        </div>
                    </CardContent>
                    <CardFooter className="border-t pt-6">
                        <Button
                            variant="destructive"
                            onClick={handleDisableTwoFactor}
                            disabled={isLoading}
                            className="ml-auto"
                        >
                            {isLoading ? 'Disabling...' : 'Disable 2FA'}
                        </Button>
                    </CardFooter>
                </Card>
            )}
        </div>
    )
}
