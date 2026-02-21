'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
    ShieldCheck,
    LayoutDashboard,
    Activity,
    AlertCircle,
    Settings,
    LogOut,
    PlusCircle,
    X,
} from 'lucide-react'
import { useAuth } from '@/components/auth-provider'
import { Button } from '@/components/ui/button'

const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Monitors', href: '/monitors', icon: Activity },
    { name: 'Incidents', href: '/incidents', icon: AlertCircle },
    { name: 'Settings', href: '/settings', icon: Settings },
]

export function Sidebar({ onClose }: { onClose?: () => void }) {
    const pathname = usePathname()
    const { user, logout } = useAuth()

    return (
        <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-slate-900 px-6 pb-4 h-full">
            {/* Logo */}
            <div className="flex h-16 shrink-0 items-center justify-between">
                <div className="flex items-center gap-2">
                    <ShieldCheck className="h-8 w-8 text-emerald-500" />
                    <span className="text-xl font-bold text-white">NetPulse</span>
                </div>
                {onClose && (
                    <button
                        type="button"
                        className="lg:hidden p-2 text-slate-400 hover:text-white"
                        onClick={onClose}
                    >
                        <X className="h-6 w-6" />
                    </button>
                )}
            </div>

            <nav className="flex flex-1 flex-col">
                <ul role="list" className="flex flex-1 flex-col gap-y-7">
                    {/* New Monitor Button */}
                    <li>
                        <Button
                            asChild
                            className="w-full justify-start gap-2 mb-4 bg-emerald-600 hover:bg-emerald-500 text-white border-none"
                        >
                            <Link href="/monitors/new" onClick={onClose}>
                                <PlusCircle className="h-4 w-4" />
                                New Monitor
                            </Link>
                        </Button>

                        {/* Navigation Links */}
                        <ul role="list" className="-mx-2 space-y-1">
                            {navigation.map((item) => {
                                const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
                                return (
                                    <li key={item.name}>
                                        <Link
                                            href={item.href}
                                            onClick={onClose}
                                            className={cn(
                                                isActive
                                                    ? 'bg-slate-800 text-white'
                                                    : 'text-slate-400 hover:text-white hover:bg-slate-800',
                                                'group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold'
                                            )}
                                        >
                                            <item.icon className="h-6 w-6 shrink-0" aria-hidden="true" />
                                            {item.name}
                                        </Link>
                                    </li>
                                )
                            })}
                        </ul>
                    </li>

                    {/* User Section */}
                    <li className="mt-auto">
                        <div className="flex flex-col gap-4 border-t border-slate-800 pt-4">
                            <div className="flex items-center gap-x-4 px-2 py-3 text-sm font-semibold leading-6 text-white overflow-hidden">
                                <div className="h-8 w-8 rounded-full bg-slate-800 flex items-center justify-center text-emerald-400 shrink-0">
                                    {user?.name?.charAt(0) || 'U'}
                                </div>
                                <div className="flex flex-col truncate">
                                    <span aria-hidden="true" className="truncate">{user?.name || 'User'}</span>
                                    <span className="text-xs text-slate-500 truncate">{user?.email}</span>
                                </div>
                            </div>
                            <Button
                                variant="ghost"
                                className="w-full justify-start gap-2 text-slate-400 hover:text-white hover:bg-slate-800 px-2"
                                onClick={() => {
                                    onClose?.()
                                    logout()
                                }}
                            >
                                <LogOut className="h-5 w-5" />
                                Sign out
                            </Button>
                        </div>
                    </li>
                </ul>
            </nav>
        </div>
    )
}
