'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Plus, Loader2, CheckSquare, ChevronLeft, ChevronRight } from 'lucide-react';
import { formatRelativeTime, getStatusColor, formatDate } from '@/lib/utils';

interface Task {
    id: string;
    title: string;
    status: string;
    dueDate: string | null;
    createdAt: string;
    assignedTo: { id: string; name: string; email: string };
    relatedIncident: { id: string; title: string } | null;
    relatedRisk: { id: string; title: string } | null;
}

export default function TasksPage() {
    const { data: session } = useSession();
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const [status, setStatus] = useState<string>('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const isManagerOrAdmin = session?.user?.role === 'ADMIN' || session?.user?.role === 'MANAGER';

    useEffect(() => {
        async function fetchTasks() {
            setLoading(true);
            try {
                const params = new URLSearchParams({ page: page.toString(), limit: '10' });
                if (status) params.set('status', status);

                const res = await fetch(`/api/tasks?${params}`);
                if (res.ok) {
                    const data = await res.json();
                    setTasks(data.data);
                    setTotalPages(data.pagination.totalPages);
                }
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        }
        fetchTasks();
    }, [page, status]);

    const handleStatusUpdate = async (taskId: string, newStatus: string) => {
        await fetch(`/api/tasks/${taskId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: newStatus }),
        });
        setTasks(tasks.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Tasks</h1>
                    <p className="text-muted-foreground">Track and manage assigned tasks</p>
                </div>
                {isManagerOrAdmin && (
                    <Link href="/tasks/new"><Button><Plus className="size-4 mr-2" />Add Task</Button></Link>
                )}
            </div>

            <Card>
                <CardContent className="pt-6">
                    <Select value={status} onValueChange={(v) => { setStatus(v === 'all' ? '' : v); setPage(1); }}>
                        <SelectTrigger className="w-40">
                            <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Status</SelectItem>
                            <SelectItem value="TODO">To Do</SelectItem>
                            <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                            <SelectItem value="DONE">Done</SelectItem>
                        </SelectContent>
                    </Select>
                </CardContent>
            </Card>

            <Card>
                <CardContent className="p-0">
                    {loading ? (
                        <div className="flex items-center justify-center h-64">
                            <Loader2 className="size-8 animate-spin text-primary" />
                        </div>
                    ) : tasks.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-64">
                            <CheckSquare className="size-12 text-muted-foreground mb-4" />
                            <h3 className="font-semibold text-lg">No tasks found</h3>
                        </div>
                    ) : (
                        <>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Title</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Assigned To</TableHead>
                                        <TableHead>Related To</TableHead>
                                        <TableHead>Due Date</TableHead>
                                        <TableHead>Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {tasks.map((task) => (
                                        <TableRow key={task.id}>
                                            <TableCell className="font-medium">{task.title}</TableCell>
                                            <TableCell>
                                                <Select value={task.status} onValueChange={(v) => handleStatusUpdate(task.id, v)}>
                                                    <SelectTrigger className="w-32">
                                                        <Badge className={getStatusColor(task.status)}>{task.status}</Badge>
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="TODO">To Do</SelectItem>
                                                        <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                                                        <SelectItem value="DONE">Done</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </TableCell>
                                            <TableCell>{task.assignedTo.name}</TableCell>
                                            <TableCell>
                                                {task.relatedIncident && (
                                                    <Link href={`/incidents/${task.relatedIncident.id}`} className="text-primary hover:underline text-sm">
                                                        {task.relatedIncident.title}
                                                    </Link>
                                                )}
                                                {task.relatedRisk && (
                                                    <Link href={`/risks/${task.relatedRisk.id}`} className="text-primary hover:underline text-sm">
                                                        {task.relatedRisk.title}
                                                    </Link>
                                                )}
                                            </TableCell>
                                            <TableCell>{task.dueDate ? formatDate(task.dueDate) : '-'}</TableCell>
                                            <TableCell>
                                                <Link href={`/tasks/${task.id}`}>
                                                    <Button variant="ghost" size="sm">View</Button>
                                                </Link>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                            {totalPages > 1 && (
                                <div className="flex items-center justify-end gap-2 p-4 border-t">
                                    <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>
                                        <ChevronLeft className="size-4" />
                                    </Button>
                                    <span className="text-sm">Page {page} of {totalPages}</span>
                                    <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
                                        <ChevronRight className="size-4" />
                                    </Button>
                                </div>
                            )}
                        </>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
