'use client';

import { ReactNode, useState, useCallback } from 'react';
import { Header } from './header';
import { Sidebar } from './sidebar-new';

interface DashboardLayoutProps {
    children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const handleMenuClick = useCallback(() => {
        setIsMobileMenuOpen((prev) => !prev);
    }, []);

    // Close mobile menu when clicking outside (handled with overlay click)
    const handleSidebarOverlayClick = useCallback(() => {
        setIsMobileMenuOpen(false);
    }, []);

    return (
        <div className="flex flex-col h-screen bg-white dark:bg-slate-950">
            {/* Mobile overlay */}
            {isMobileMenuOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black/50 lg:hidden"
                    onClick={handleSidebarOverlayClick}
                    aria-hidden="true"
                />
            )}

            {/* Sidebar */}
            <Sidebar isMobileOpen={isMobileMenuOpen} />

            {/* Main content area */}
            <div className="flex flex-col flex-1 overflow-hidden lg:ml-0">
                {/* Header */}
                <Header onMenuClick={handleMenuClick} isMobileMenuOpen={isMobileMenuOpen} />

                {/* Page content */}
                <main className="flex-1 overflow-y-auto bg-white dark:bg-slate-950">
                    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
