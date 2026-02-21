'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
    ShieldCheck,
    LayoutDashboard,
    Activity,
    AlertCircle,
    Settings,
    ChevronDown,
    Home,
    Bell,
    BarChart3,
    LogOut,
} from 'lucide-react';
import { useAuth } from '@/components/auth-provider';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

interface NavItem {
    name: string;
    href: string;
    icon?: React.ComponentType<{ className?: string }>;
    badge?: number;
    children?: NavItem[];
}

const navigation: NavItem[] = [
    { name: 'Dashboard', href: '/dashboard', icon: Home },
    { name: 'Monitors', href: '/dashboard/monitors', icon: Activity },
    { name: 'Incidents', href: '/dashboard/incidents', icon: AlertCircle },
    { name: 'Alerts', href: '/dashboard/alerts', icon: Bell },
    {
        name: 'Reports',
        href: '#',
        icon: BarChart3,
        children: [
            { name: 'Uptime', href: '/dashboard/reports/uptime' },
            { name: 'SLA', href: '/dashboard/reports/sla' },
            { name: 'Export', href: '/dashboard/reports/export' },
        ],
    },
    {
        name: 'Settings',
        href: '#',
        icon: Settings,
        children: [
            { name: 'Profile', href: '/dashboard/settings/profile' },
            { name: 'Security', href: '/dashboard/settings/security' },
            { name: 'Team', href: '/dashboard/settings/team' },
            { name: 'Integrations', href: '/dashboard/settings/integrations' },
        ],
    },
];

export function Sidebar({ isMobileOpen }: { isMobileOpen: boolean }) {
    const pathname = usePathname();
    const { user, logout } = useAuth();
    const [expandedItems, setExpandedItems] = useState<string[]>([]);

    const toggleExpanded = (name: string) => {
        setExpandedItems((prev) =>
            prev.includes(name) ? prev.filter((item) => item !== name) : [...prev, name]
        );
    };

    const isActive = (href: string) => {
        if (href === '#') return false;
        return pathname === href || pathname.startsWith(href + '/');
    };

    const NavItems = ({ items }: { items: NavItem[] }) => (
        <ul role="list" className="space-y-1">
            {items.map((item) => {
                const active = isActive(item.href);
                const hasChildren = item.children && item.children.length > 0;

                return (
                    <li key={item.name}>
                        {hasChildren ? (
                            <div>
                                <button
                                    onClick={() => toggleExpanded(item.name)}
                                    className={cn(
                                        'group flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm font-medium',
                                        active
                                            ? 'bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-white'
                                            : 'text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
                                    )}
                                >
                                    <span className="flex items-center gap-3">
                                        {item.icon ? (
                                            <item.icon
                                                className={cn(
                                                    'h-5 w-5 shrink-0',
                                                    active
                                                        ? 'text-slate-900 dark:text-white'
                                                        : 'text-slate-500 group-hover:text-slate-700 dark:text-slate-400 dark:group-hover:text-slate-300'
                                                )}
                                            />
                                        ) : null}
                                        {item.name}
                                    </span>
                                    <ChevronDown
                                        className={cn(
                                            'h-4 w-4 transition-transform',
                                            expandedItems.includes(item.name) ? 'rotate-180' : ''
                                        )}
                                    />
                                </button>

                                {expandedItems.includes(item.name) && (
                                    <ul className="ml-2 mt-1 space-y-1 border-l border-slate-200 pl-3 dark:border-slate-700">
                                        {item.children?.map((child) => (
                                            <li key={child.name}>
                                                <Link
                                                    href={child.href}
                                                    className={cn(
                                                        'block rounded px-2 py-1.5 text-sm font-medium',
                                                        isActive(child.href)
                                                            ? 'bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-white'
                                                            : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
                                                    )}
                                                >
                                                    {child.name}
                                                </Link>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        ) : (
                            <Link
                                href={item.href}
                                className={cn(
                                    'group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium',
                                    active
                                        ? 'bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-white'
                                        : 'text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
                                )}
                            >
                                {item.icon ? (
                                    <item.icon
                                        className={cn(
                                            'h-5 w-5 shrink-0',
                                            active
                                                ? 'text-slate-900 dark:text-white'
                                                : 'text-slate-500 group-hover:text-slate-700 dark:text-slate-400 dark:group-hover:text-slate-300'
                                        )}
                                    />
                                ) : null}
                                {item.name}
                                {item.badge && (
                                    <span className="ml-auto inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800 dark:bg-red-900 dark:text-red-200">
                                        {item.badge}
                                    </span>
                                )}
                            </Link>
                        )}
                    </li>
                );
            })}
        </ul>
    );

    return (
        <aside
            className={cn(
                'fixed inset-y-0 left-0 z-50 w-72 transform bg-white dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800 flex flex-col transition-transform duration-200 ease-in-out lg:relative lg:translate-x-0',
                isMobileOpen ? 'translate-x-0' : '-translate-x-full'
            )}
        >
            {/* Logo */}
            <div className="flex h-16 shrink-0 items-center gap-2 border-b border-slate-200 bg-white px-6 dark:border-slate-800 dark:bg-slate-950">
                <ShieldCheck className="h-8 w-8 text-emerald-600 dark:text-emerald-500" />
                <span className="text-xl font-bold text-slate-900 dark:text-white">NetPulse</span>
            </div>

            {/* Navigation */}
            <nav className="flex-1 space-y-8 overflow-y-auto px-6 py-8">
                {/* Primary Navigation */}
                <div>
                    <NavItems items={navigation} />
                </div>

                {/* Create Monitor CTA */}
                <Button asChild className="w-full bg-emerald-600 hover:bg-emerald-700 text-white">
                    <Link href="/dashboard/monitors/new">
                        + New Monitor
                    </Link>
                </Button>
            </nav>

            {/* User Footer */}
            <div className="border-t border-slate-200 bg-slate-50 px-6 py-4 dark:border-slate-800 dark:bg-slate-900">
                <div className="mb-4 flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-emerald-400 to-slate-400" />
                    <div className="flex-1 min-w-0">
                        <p className="truncate text-sm font-medium text-slate-900 dark:text-white">
                            {user?.name || 'User'}
                        </p>
                        <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                            {user?.email || 'user@example.com'}
                        </p>
                    </div>
                </div>
                <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start text-red-600 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-950"
                    onClick={logout}
                >
                    <LogOut className="h-4 w-4 mr-2" />
                    Logout
                </Button>
            </div>
        </aside>
    );
}
