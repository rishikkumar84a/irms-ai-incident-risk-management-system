'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    AlertTriangle,
    Shield,
    CheckSquare,
    TrendingUp,
    AlertCircle,
    Clock,
    ArrowRight,
    Loader2
} from 'lucide-react';
import Link from 'next/link';
import { formatRelativeTime, getStatusColor, getSeverityColor } from '@/lib/utils';

interface DashboardData {
    summary: {
        totalIncidents: number;
        openIncidents: number;
        criticalIncidents: number;
        totalRisks: number;
        openRisks: number;
        totalTasks: number;
        pendingTasks: number;
    };
    charts: {
        incidentsByStatus: { status: string; count: number }[];
        incidentsBySeverity: { severity: string; count: number }[];
        incidentsByDepartment: { departmentId: string; name: string; count: number }[];
        risksByStatus: { status: string; count: number }[];
        tasksByStatus: { status: string; count: number }[];
    };
    recentActivity: {
        recentIncidents: {
            id: string;
            title: string;
            status: string;
            severity: string;
            createdAt: string;
            department: { name: string };
        }[];
        upcomingTasks: {
            id: string;
            title: string;
            status: string;
            dueDate: string;
            assignedTo: { name: string };
        }[];
    };
}

export default function DashboardPage() {
    const { data: session } = useSession();
    const [data, setData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchDashboard() {
            try {
                const response = await fetch('/api/dashboard/overview');
                if (response.ok) {
                    const result = await response.json();
                    setData(result);
                }
            } catch (error) {
                console.error('Failed to fetch dashboard:', error);
            } finally {
                setLoading(false);
            }
        }

        fetchDashboard();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <Loader2 className="size-8 animate-spin text-primary" />
            </div>
        );
    }

    const stats = [
        {
            title: 'Total Incidents',
            value: data?.summary.totalIncidents || 0,
            subValue: `${data?.summary.openIncidents || 0} open`,
            icon: AlertTriangle,
            color: 'text-orange-600',
            bgColor: 'bg-orange-100',
        },
        {
            title: 'Critical Incidents',
            value: data?.summary.criticalIncidents || 0,
            subValue: 'Require attention',
            icon: AlertCircle,
            color: 'text-red-600',
            bgColor: 'bg-red-100',
        },
        {
            title: 'Active Risks',
            value: data?.summary.openRisks || 0,
            subValue: `of ${data?.summary.totalRisks || 0} total`,
            icon: Shield,
            color: 'text-purple-600',
            bgColor: 'bg-purple-100',
        },
        {
            title: 'Pending Tasks',
            value: data?.summary.pendingTasks || 0,
            subValue: `of ${data?.summary.totalTasks || 0} total`,
            icon: CheckSquare,
            color: 'text-blue-600',
            bgColor: 'bg-blue-100',
        },
    ];

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Welcome Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">
                        Welcome back, {session?.user?.name?.split(' ')[0]}!
                    </h1>
                    <p className="text-muted-foreground">
                        Here's what's happening in your organization today.
                    </p>
                </div>
                <Link href="/incidents/new">
                    <Button>
                        <AlertTriangle className="size-4 mr-2" />
                        Report Incident
                    </Button>
                </Link>
            </div>

            {/* Stats Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {stats.map((stat) => (
                    <Card key={stat.title}>
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">
                                        {stat.title}
                                    </p>
                                    <p className="text-3xl font-bold mt-1">{stat.value}</p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        {stat.subValue}
                                    </p>
                                </div>
                                <div className={`p-3 rounded-full ${stat.bgColor}`}>
                                    <stat.icon className={`size-6 ${stat.color}`} />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Charts Row */}
            <div className="grid gap-6 md:grid-cols-2">
                {/* Incidents by Severity */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Incidents by Severity</CardTitle>
                        <CardDescription>Distribution of incident severity levels</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {data?.charts.incidentsBySeverity.map((item) => (
                                <div key={item.severity} className="flex items-center gap-4">
                                    <div className="w-24">
                                        <Badge className={getSeverityColor(item.severity)}>
                                            {item.severity}
                                        </Badge>
                                    </div>
                                    <div className="flex-1">
                                        <div className="h-3 bg-muted rounded-full overflow-hidden">
                                            <div
                                                className={`h-full ${item.severity === 'CRITICAL' ? 'bg-red-500' :
                                                        item.severity === 'HIGH' ? 'bg-orange-500' :
                                                            item.severity === 'MEDIUM' ? 'bg-yellow-500' :
                                                                'bg-green-500'
                                                    }`}
                                                style={{
                                                    width: `${Math.min(100, (item.count / (data?.summary.totalIncidents || 1)) * 100)}%`
                                                }}
                                            />
                                        </div>
                                    </div>
                                    <span className="text-sm font-medium w-8 text-right">{item.count}</span>
                                </div>
                            ))}
                            {(!data?.charts.incidentsBySeverity || data.charts.incidentsBySeverity.length === 0) && (
                                <p className="text-sm text-muted-foreground text-center py-4">
                                    No incidents to display
                                </p>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Incidents by Status */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Incidents by Status</CardTitle>
                        <CardDescription>Current status of all incidents</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {data?.charts.incidentsByStatus.map((item) => (
                                <div key={item.status} className="flex items-center gap-4">
                                    <div className="w-28">
                                        <Badge className={getStatusColor(item.status)}>
                                            {item.status.replace('_', ' ')}
                                        </Badge>
                                    </div>
                                    <div className="flex-1">
                                        <div className="h-3 bg-muted rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-primary"
                                                style={{
                                                    width: `${Math.min(100, (item.count / (data?.summary.totalIncidents || 1)) * 100)}%`
                                                }}
                                            />
                                        </div>
                                    </div>
                                    <span className="text-sm font-medium w-8 text-right">{item.count}</span>
                                </div>
                            ))}
                            {(!data?.charts.incidentsByStatus || data.charts.incidentsByStatus.length === 0) && (
                                <p className="text-sm text-muted-foreground text-center py-4">
                                    No incidents to display
                                </p>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Recent Activity */}
            <div className="grid gap-6 md:grid-cols-2">
                {/* Recent Incidents */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle className="text-lg">Recent Incidents</CardTitle>
                            <CardDescription>Latest reported incidents</CardDescription>
                        </div>
                        <Link href="/incidents">
                            <Button variant="ghost" size="sm">
                                View all <ArrowRight className="size-4 ml-1" />
                            </Button>
                        </Link>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {data?.recentActivity.recentIncidents.map((incident) => (
                                <Link
                                    key={incident.id}
                                    href={`/incidents/${incident.id}`}
                                    className="flex items-start gap-4 p-3 rounded-lg hover:bg-muted transition-colors"
                                >
                                    <div className={`p-2 rounded-full ${incident.severity === 'CRITICAL' ? 'bg-red-100' :
                                            incident.severity === 'HIGH' ? 'bg-orange-100' :
                                                incident.severity === 'MEDIUM' ? 'bg-yellow-100' :
                                                    'bg-green-100'
                                        }`}>
                                        <AlertTriangle className={`size-4 ${incident.severity === 'CRITICAL' ? 'text-red-600' :
                                                incident.severity === 'HIGH' ? 'text-orange-600' :
                                                    incident.severity === 'MEDIUM' ? 'text-yellow-600' :
                                                        'text-green-600'
                                            }`} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium truncate">{incident.title}</p>
                                        <div className="flex items-center gap-2 mt-1">
                                            <Badge variant="outline" className="text-xs">
                                                {incident.department.name}
                                            </Badge>
                                            <span className="text-xs text-muted-foreground">
                                                {formatRelativeTime(incident.createdAt)}
                                            </span>
                                        </div>
                                    </div>
                                    <Badge className={getStatusColor(incident.status)}>
                                        {incident.status.replace('_', ' ')}
                                    </Badge>
                                </Link>
                            ))}
                            {(!data?.recentActivity.recentIncidents || data.recentActivity.recentIncidents.length === 0) && (
                                <p className="text-sm text-muted-foreground text-center py-4">
                                    No recent incidents
                                </p>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Upcoming Tasks */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle className="text-lg">Upcoming Tasks</CardTitle>
                            <CardDescription>Tasks due soon</CardDescription>
                        </div>
                        <Link href="/tasks">
                            <Button variant="ghost" size="sm">
                                View all <ArrowRight className="size-4 ml-1" />
                            </Button>
                        </Link>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {data?.recentActivity.upcomingTasks.map((task) => (
                                <div
                                    key={task.id}
                                    className="flex items-start gap-4 p-3 rounded-lg hover:bg-muted transition-colors"
                                >
                                    <div className="p-2 rounded-full bg-blue-100">
                                        <CheckSquare className="size-4 text-blue-600" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium truncate">{task.title}</p>
                                        <div className="flex items-center gap-2 mt-1">
                                            <Clock className="size-3 text-muted-foreground" />
                                            <span className="text-xs text-muted-foreground">
                                                Due {formatRelativeTime(task.dueDate)}
                                            </span>
                                        </div>
                                    </div>
                                    <Badge className={getStatusColor(task.status)}>
                                        {task.status.replace('_', ' ')}
                                    </Badge>
                                </div>
                            ))}
                            {(!data?.recentActivity.upcomingTasks || data.recentActivity.upcomingTasks.length === 0) && (
                                <p className="text-sm text-muted-foreground text-center py-4">
                                    No upcoming tasks
                                </p>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
