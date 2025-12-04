'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { cn } from '@/lib/utils';
import {
    LayoutDashboard,
    AlertTriangle,
    Shield,
    CheckSquare,
    Users,
    Building2,
    Tag,
    ChevronLeft,
    ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useState } from 'react';

interface NavItem {
    title: string;
    href: string;
    icon: React.ComponentType<{ className?: string }>;
    roles?: string[];
}

const navItems: NavItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
        icon: LayoutDashboard,
    },
    {
        title: 'Incidents',
        href: '/incidents',
        icon: AlertTriangle,
    },
    {
        title: 'Risks',
        href: '/risks',
        icon: Shield,
    },
    {
        title: 'Tasks',
        href: '/tasks',
        icon: CheckSquare,
    },
];

const adminItems: NavItem[] = [
    {
        title: 'Users',
        href: '/admin/users',
        icon: Users,
        roles: ['ADMIN'],
    },
    {
        title: 'Departments',
        href: '/admin/departments',
        icon: Building2,
        roles: ['ADMIN'],
    },
    {
        title: 'Categories',
        href: '/admin/categories',
        icon: Tag,
        roles: ['ADMIN'],
    },
];

export function Sidebar() {
    const pathname = usePathname();
    const { data: session } = useSession();
    const [collapsed, setCollapsed] = useState(false);
    const userRole = session?.user?.role;

    const isActive = (href: string) => {
        if (href === '/dashboard') {
            return pathname === '/dashboard';
        }
        return pathname.startsWith(href);
    };

    return (
        <aside
            className={cn(
                'bg-card border-r flex flex-col h-screen sticky top-0 transition-all duration-300',
                collapsed ? 'w-16' : 'w-64'
            )}
        >
            {/* Logo */}
            <div className="h-16 flex items-center justify-between px-4 border-b">
                {!collapsed && (
                    <Link href="/dashboard" className="flex items-center gap-2">
                        <div className="size-8 rounded-lg bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
                            <Shield className="size-5 text-white" />
                        </div>
                        <span className="font-bold text-lg">IRMS</span>
                    </Link>
                )}
                {collapsed && (
                    <div className="size-8 rounded-lg bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center mx-auto">
                        <Shield className="size-5 text-white" />
                    </div>
                )}
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
                {navItems.map((item) => (
                    <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                            'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                            isActive(item.href)
                                ? 'bg-primary text-primary-foreground'
                                : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                        )}
                    >
                        <item.icon className="size-5 shrink-0" />
                        {!collapsed && <span>{item.title}</span>}
                    </Link>
                ))}

                {userRole === 'ADMIN' && (
                    <>
                        <Separator className="my-4" />
                        {!collapsed && (
                            <p className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                                Administration
                            </p>
                        )}
                        {adminItems.map((item) => (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={cn(
                                    'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                                    isActive(item.href)
                                        ? 'bg-primary text-primary-foreground'
                                        : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                                )}
                            >
                                <item.icon className="size-5 shrink-0" />
                                {!collapsed && <span>{item.title}</span>}
                            </Link>
                        ))}
                    </>
                )}
            </nav>

            {/* Collapse Toggle */}
            <div className="p-3 border-t">
                <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-center"
                    onClick={() => setCollapsed(!collapsed)}
                >
                    {collapsed ? (
                        <ChevronRight className="size-4" />
                    ) : (
                        <>
                            <ChevronLeft className="size-4" />
                            <span className="ml-2">Collapse</span>
                        </>
                    )}
                </Button>
            </div>
        </aside>
    );
}
