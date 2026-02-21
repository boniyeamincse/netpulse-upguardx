'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, Home } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BreadcrumbItem {
    label: string;
    href?: string;
}

export interface BreadcrumbProps {
    items?: BreadcrumbItem[];
    className?: string;
}

// Helper to generate breadcrumbs from pathname
export function useBreadcrumbs(): BreadcrumbItem[] {
    const pathname = usePathname();

    const routeLabels: Record<string, string> = {
        dashboard: 'Dashboard',
        monitors: 'Monitors',
        incidents: 'Incidents',
        alerts: 'Alerts',
        settings: 'Settings',
        profile: 'Profile',
        security: 'Security',
        team: 'Team',
        integrations: 'Integrations',
        reports: 'Reports',
        uptime: 'Uptime Report',
        sla: 'SLA Report',
        export: 'Export',
        new: 'New Monitor',
    };

    const items: BreadcrumbItem[] = [];
    const segments = pathname.split('/').filter(Boolean);

    // Always start with dashboard
    if (segments.length > 0) {
        items.push({ label: 'Dashboard', href: '/dashboard' });
    }

    segments.forEach((segment, index) => {
        // Skip 'dashboard' in path since we already added it
        if (segment === 'dashboard') return;

        // Skip UUID segments (they're details/IDs)
        if (segment.match(/^[a-f0-9-]{36}$/i)) {
            items.push({ label: 'Details' });
            return;
        }

        const label = routeLabels[segment] || segment.charAt(0).toUpperCase() + segment.slice(1);
        const href = '/' + segments.slice(0, index + 1).join('/');
        const isLast = index === segments.length - 1;

        items.push({
            label,
            href: isLast ? undefined : href,
        });
    });

    return items;
}

export function Breadcrumb({ items, className }: BreadcrumbProps) {
    const breadcrumbs = items || useBreadcrumbs();

    if (breadcrumbs.length === 0) {
        return null;
    }

    return (
        <nav
            className={cn('flex items-center space-x-1 text-sm text-slate-600 dark:text-slate-400', className)}
            aria-label="Breadcrumb"
        >
            {breadcrumbs.map((item, index) => (
                <div key={index} className="flex items-center space-x-1">
                    {index > 0 && (
                        <ChevronRight className="h-4 w-4 text-slate-400 dark:text-slate-500" />
                    )}
                    {item.href ? (
                        <Link
                            href={item.href}
                            className="hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
                        >
                            {item.label}
                        </Link>
                    ) : (
                        <span className="text-slate-900 dark:text-slate-200 font-medium">
                            {item.label}
                        </span>
                    )}
                </div>
            ))}
        </nav>
    );
}
