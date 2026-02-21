'use client'

import { useAuth } from '@/components/auth-provider'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
    Bell,
    Search,
    Menu,
    Sun,
    Moon,
    LogOut,
    User,
    Settings,
    ChevronDown,
} from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'

interface BreadcrumbItem {
    label: string
    href?: string
}

const routeLabels: Record<string, string> = {
    'dashboard': 'Dashboard',
    'monitors': 'Monitors',
    'incidents': 'Incidents',
    'settings': 'Settings',
    'new': 'New Monitor',
}

export function Header({
    onMenuClick,
    isMobileMenuOpen,
    className,
}: {
    onMenuClick?: () => void
    isMobileMenuOpen?: boolean
    className?: string
}) {
    const { user, logout } = useAuth()
    const pathname = usePathname()
    const [isDark, setIsDark] = useState(false)
    const [showUserMenu, setShowUserMenu] = useState(false)
    const [showNotifications, setShowNotifications] = useState(false)

    // Generate breadcrumbs from pathname
    const breadcrumbs: BreadcrumbItem[] = []
    const pathSegments = pathname.split('/').filter(Boolean)

    pathSegments.forEach((segment, index) => {
        const label = routeLabels[segment] || segment
        const href = '/' + pathSegments.slice(0, index + 1).join('/')
        const isLast = index === pathSegments.length - 1

        // Skip dynamic route segments (UUIDs)
        if (segment.match(/^[a-f0-9-]{36}$/i)) {
            breadcrumbs.push({ label: 'Details' })
        } else {
            breadcrumbs.push({
                label,
                href: isLast ? undefined : href,
            })
        }
    })

    // Initialize dark mode from localStorage or system preference
    useEffect(() => {
        const stored = localStorage.getItem('theme')
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
        const shouldBeDark = stored === 'dark' || (!stored && prefersDark)
        
        setIsDark(shouldBeDark)
        document.documentElement.classList.toggle('dark', shouldBeDark)
    }, [])

    const toggleDarkMode = () => {
        const newDarkMode = !isDark
        setIsDark(newDarkMode)
        document.documentElement.classList.toggle('dark', newDarkMode)
        localStorage.setItem('theme', newDarkMode ? 'dark' : 'light')
    }

    return (
        <header className={cn(
            "sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-4 sm:px-6 lg:px-8",
            className
        )}>
            {/* Mobile menu button */}
            <button
                type="button"
                onClick={onMenuClick}
                className="lg:hidden -ml-2 p-2.5 text-slate-700 dark:text-slate-300"
            >
                <Menu className="h-6 w-6" aria-hidden="true" />
            </button>

            {/* Breadcrumbs */}
            <nav className="hidden sm:flex items-center gap-2 text-sm">
                {breadcrumbs.map((crumb, index) => (
                    <div key={index} className="flex items-center gap-2">
                        {index > 0 && (
                            <span className="text-slate-400 dark:text-slate-600">/</span>
                        )}
                        {crumb.href ? (
                            <Link
                                href={crumb.href}
                                className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                            >
                                {crumb.label}
                            </Link>
                        ) : (
                            <span className="font-medium text-slate-900 dark:text-white">
                                {crumb.label}
                            </span>
                        )}
                    </div>
                ))}
            </nav>

            <div className="flex-1" />

            {/* Search */}
            <div className="hidden md:flex items-center">
                <div className="relative w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                        type="search"
                        placeholder="Search monitors..."
                        className="pl-9 h-9 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 focus-visible:ring-emerald-500"
                    />
                </div>
            </div>

            {/* Dark mode toggle */}
            <Button
                variant="ghost"
                size="icon"
                onClick={toggleDarkMode}
                className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            >
                {isDark ? (
                    <Sun className="h-5 w-5" />
                ) : (
                    <Moon className="h-5 w-5" />
                )}
            </Button>

            {/* Notifications */}
            <div className="relative">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowNotifications(!showNotifications)}
                    className="relative text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                >
                    <Bell className="h-5 w-5" />
                    <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-rose-500" />
                </Button>

                {showNotifications && (
                    <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-900 rounded-lg shadow-lg border border-slate-200 dark:border-slate-800 py-2 z-50">
                        <div className="px-4 py-2 border-b border-slate-200 dark:border-slate-800">
                            <h3 className="font-semibold text-sm">Notifications</h3>
                        </div>
                        <div className="max-h-64 overflow-y-auto">
                            <div className="px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer">
                                <p className="text-sm font-medium">Monitor Down: API Server</p>
                                <p className="text-xs text-slate-500 mt-1">2 minutes ago</p>
                            </div>
                            <div className="px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer">
                                <p className="text-sm font-medium">Incident Resolved: Website</p>
                                <p className="text-xs text-slate-500 mt-1">1 hour ago</p>
                            </div>
                        </div>
                        <div className="px-4 py-2 border-t border-slate-200 dark:border-slate-800">
                            <Link href="/notifications" className="text-xs text-emerald-600 hover:text-emerald-500">
                                View all notifications
                            </Link>
                        </div>
                    </div>
                )}
            </div>

            {/* User menu */}
            <div className="relative">
                <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                    <div className="h-8 w-8 rounded-full bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center text-emerald-700 dark:text-emerald-300 font-semibold text-sm">
                        {user?.name?.charAt(0) || 'U'}
                    </div>
                    <span className="hidden lg:block text-sm font-medium text-slate-700 dark:text-slate-300">
                        {user?.name || 'User'}
                    </span>
                    <ChevronDown className="hidden lg:block h-4 w-4 text-slate-400" />
                </button>

                {showUserMenu && (
                    <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-900 rounded-lg shadow-lg border border-slate-200 dark:border-slate-800 py-1 z-50">
                        <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800">
                            <p className="text-sm font-medium">{user?.name}</p>
                            <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                        </div>
                        <Link
                            href="/settings"
                            className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                            onClick={() => setShowUserMenu(false)}
                        >
                            <User className="h-4 w-4" />
                            Profile
                        </Link>
                        <Link
                            href="/settings"
                            className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                            onClick={() => setShowUserMenu(false)}
                        >
                            <Settings className="h-4 w-4" />
                            Settings
                        </Link>
                        <div className="border-t border-slate-200 dark:border-slate-800 mt-1 pt-1">
                            <button
                                onClick={() => {
                                    setShowUserMenu(false)
                                    logout()
                                }}
                                className="flex items-center gap-2 w-full px-4 py-2 text-sm text-rose-600 hover:bg-slate-50 dark:hover:bg-slate-800"
                            >
                                <LogOut className="h-4 w-4" />
                                Sign out
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </header>
    )
}
