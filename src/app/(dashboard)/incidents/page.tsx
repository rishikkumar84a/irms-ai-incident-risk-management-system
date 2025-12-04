'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Plus,
    Search,
    Filter,
    Loader2,
    AlertTriangle,
    ChevronLeft,
    ChevronRight,
    Eye
} from 'lucide-react';
import { formatRelativeTime, getStatusColor, getSeverityColor } from '@/lib/utils';

interface Incident {
    id: string;
    title: string;
    status: string;
    severity: string;
    createdAt: string;
    occurredAt: string;
    category: { id: string; name: string } | null;
    department: { id: string; name: string };
    reportedBy: { id: string; name: string; email: string };
    assignedTo: { id: string; name: string; email: string } | null;
    _count: { tasks: number; comments: number };
}

interface PaginationInfo {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}

export default function IncidentsPage() {
    const [incidents, setIncidents] = useState<Incident[]>([]);
    const [pagination, setPagination] = useState<PaginationInfo | null>(null);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [status, setStatus] = useState<string>('');
    const [severity, setSeverity] = useState<string>('');
    const [page, setPage] = useState(1);

    useEffect(() => {
        async function fetchIncidents() {
            setLoading(true);
            try {
                const params = new URLSearchParams();
                params.set('page', page.toString());
                params.set('limit', '10');
                if (search) params.set('search', search);
                if (status) params.set('status', status);
                if (severity) params.set('severity', severity);

                const response = await fetch(`/api/incidents?${params}`);
                if (response.ok) {
                    const result = await response.json();
                    setIncidents(result.data);
                    setPagination(result.pagination);
                }
            } catch (error) {
                console.error('Failed to fetch incidents:', error);
            } finally {
                setLoading(false);
            }
        }

        fetchIncidents();
    }, [page, search, status, severity]);

    const handleSearch = (value: string) => {
        setSearch(value);
        setPage(1);
    };

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Incidents</h1>
                    <p className="text-muted-foreground">
                        Manage and track all reported incidents
                    </p>
                </div>
                <Link href="/incidents/new">
                    <Button>
                        <Plus className="size-4 mr-2" />
                        Report Incident
                    </Button>
                </Link>
            </div>

            {/* Filters */}
            <Card>
                <CardContent className="pt-6">
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                            <Input
                                placeholder="Search incidents..."
                                className="pl-10"
                                value={search}
                                onChange={(e) => handleSearch(e.target.value)}
                            />
                        </div>
                        <Select value={status} onValueChange={(v) => { setStatus(v === 'all' ? '' : v); setPage(1); }}>
                            <SelectTrigger className="w-full sm:w-40">
                                <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Status</SelectItem>
                                <SelectItem value="NEW">New</SelectItem>
                                <SelectItem value="IN_REVIEW">In Review</SelectItem>
                                <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                                <SelectItem value="RESOLVED">Resolved</SelectItem>
                                <SelectItem value="CLOSED">Closed</SelectItem>
                            </SelectContent>
                        </Select>
                        <Select value={severity} onValueChange={(v) => { setSeverity(v === 'all' ? '' : v); setPage(1); }}>
                            <SelectTrigger className="w-full sm:w-40">
                                <SelectValue placeholder="Severity" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Severity</SelectItem>
                                <SelectItem value="LOW">Low</SelectItem>
                                <SelectItem value="MEDIUM">Medium</SelectItem>
                                <SelectItem value="HIGH">High</SelectItem>
                                <SelectItem value="CRITICAL">Critical</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {/* Table */}
            <Card>
                <CardContent className="p-0">
                    {loading ? (
                        <div className="flex items-center justify-center h-64">
                            <Loader2 className="size-8 animate-spin text-primary" />
                        </div>
                    ) : incidents.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-64 text-center">
                            <AlertTriangle className="size-12 text-muted-foreground mb-4" />
                            <h3 className="font-semibold text-lg">No incidents found</h3>
                            <p className="text-muted-foreground">
                                {search || status || severity
                                    ? 'Try adjusting your filters'
                                    : 'Report your first incident to get started'}
                            </p>
                        </div>
                    ) : (
                        <>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Title</TableHead>
                                        <TableHead>Severity</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Department</TableHead>
                                        <TableHead>Reported By</TableHead>
                                        <TableHead>Reported</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {incidents.map((incident) => (
                                        <TableRow key={incident.id}>
                                            <TableCell>
                                                <div className="max-w-xs">
                                                    <p className="font-medium truncate">{incident.title}</p>
                                                    {incident.category && (
                                                        <p className="text-xs text-muted-foreground">
                                                            {incident.category.name}
                                                        </p>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge className={getSeverityColor(incident.severity)}>
                                                    {incident.severity}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <Badge className={getStatusColor(incident.status)}>
                                                    {incident.status.replace('_', ' ')}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>{incident.department.name}</TableCell>
                                            <TableCell>
                                                <div>
                                                    <p className="text-sm">{incident.reportedBy.name}</p>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-muted-foreground">
                                                {formatRelativeTime(incident.createdAt)}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Link href={`/incidents/${incident.id}`}>
                                                    <Button variant="ghost" size="sm">
                                                        <Eye className="size-4 mr-1" />
                                                        View
                                                    </Button>
                                                </Link>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>

                            {/* Pagination */}
                            {pagination && pagination.totalPages > 1 && (
                                <div className="flex items-center justify-between px-4 py-4 border-t">
                                    <p className="text-sm text-muted-foreground">
                                        Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
                                        {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                                        {pagination.total} incidents
                                    </p>
                                    <div className="flex items-center gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            disabled={page === 1}
                                            onClick={() => setPage(page - 1)}
                                        >
                                            <ChevronLeft className="size-4" />
                                            Previous
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            disabled={page >= pagination.totalPages}
                                            onClick={() => setPage(page + 1)}
                                        >
                                            Next
                                            <ChevronRight className="size-4" />
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
