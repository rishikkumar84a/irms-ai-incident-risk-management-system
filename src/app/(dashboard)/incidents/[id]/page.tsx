'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
    ArrowLeft,
    Loader2,
    Calendar,
    User,
    Building2,
    Tag,
    Clock,
    MessageSquare,
    Sparkles,
    CheckSquare,
    Send
} from 'lucide-react';
import { formatDateTime, formatRelativeTime, getStatusColor, getSeverityColor } from '@/lib/utils';

interface Incident {
    id: string;
    title: string;
    description: string;
    status: string;
    severity: string;
    createdAt: string;
    occurredAt: string;
    resolvedAt: string | null;
    aiSummary: string | null;
    aiSeveritySuggestion: string | null;
    aiRecommendedActions: string | null;
    category: { id: string; name: string } | null;
    department: { id: string; name: string };
    reportedBy: { id: string; name: string; email: string };
    assignedTo: { id: string; name: string; email: string } | null;
    tasks: {
        id: string;
        title: string;
        status: string;
        assignedTo: { id: string; name: string };
    }[];
    comments: {
        id: string;
        body: string;
        createdAt: string;
        author: { id: string; name: string };
    }[];
}

export default function IncidentDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();
    const { data: session } = useSession();
    const [incident, setIncident] = useState<Incident | null>(null);
    const [loading, setLoading] = useState(true);
    const [newComment, setNewComment] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [updatingStatus, setUpdatingStatus] = useState(false);

    const isManagerOrAdmin = session?.user?.role === 'ADMIN' || session?.user?.role === 'MANAGER';

    useEffect(() => {
        async function fetchIncident() {
            try {
                const response = await fetch(`/api/incidents/${id}`);
                if (response.ok) {
                    const data = await response.json();
                    setIncident(data);
                } else if (response.status === 404) {
                    router.push('/incidents');
                }
            } catch (error) {
                console.error('Failed to fetch incident:', error);
            } finally {
                setLoading(false);
            }
        }

        fetchIncident();
    }, [id, router]);

    const handleStatusChange = async (newStatus: string) => {
        if (!incident) return;
        setUpdatingStatus(true);

        try {
            const response = await fetch(`/api/incidents/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus }),
            });

            if (response.ok) {
                const updated = await response.json();
                setIncident({ ...incident, status: updated.status, resolvedAt: updated.resolvedAt });
            }
        } catch (error) {
            console.error('Failed to update status:', error);
        } finally {
            setUpdatingStatus(false);
        }
    };

    const handleAddComment = async () => {
        if (!newComment.trim()) return;
        setSubmitting(true);

        try {
            const response = await fetch('/api/comments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    body: newComment,
                    incidentId: id,
                }),
            });

            if (response.ok) {
                const comment = await response.json();
                setIncident(prev => prev ? {
                    ...prev,
                    comments: [comment, ...prev.comments],
                } : null);
                setNewComment('');
            }
        } catch (error) {
            console.error('Failed to add comment:', error);
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <Loader2 className="size-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!incident) {
        return null;
    }

    return (
        <div className="max-w-6xl mx-auto space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                    <Link href="/incidents">
                        <Button variant="ghost" size="icon">
                            <ArrowLeft className="size-5" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold">{incident.title}</h1>
                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                            <Badge className={getSeverityColor(incident.severity)}>
                                {incident.severity}
                            </Badge>
                            <Badge className={getStatusColor(incident.status)}>
                                {incident.status.replace('_', ' ')}
                            </Badge>
                            {incident.category && (
                                <Badge variant="outline">{incident.category.name}</Badge>
                            )}
                        </div>
                    </div>
                </div>

                {isManagerOrAdmin && (
                    <div className="flex items-center gap-2">
                        <Select
                            value={incident.status}
                            onValueChange={handleStatusChange}
                            disabled={updatingStatus}
                        >
                            <SelectTrigger className="w-40">
                                {updatingStatus ? (
                                    <Loader2 className="size-4 animate-spin" />
                                ) : (
                                    <SelectValue />
                                )}
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="NEW">New</SelectItem>
                                <SelectItem value="IN_REVIEW">In Review</SelectItem>
                                <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                                <SelectItem value="RESOLVED">Resolved</SelectItem>
                                <SelectItem value="CLOSED">Closed</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                )}
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Description */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Description</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="whitespace-pre-wrap">{incident.description}</p>
                        </CardContent>
                    </Card>

                    {/* AI Analysis */}
                    {incident.aiSummary && (
                        <Card className="border-purple-200 bg-purple-50/50">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Sparkles className="size-5 text-purple-500" />
                                    AI Analysis
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <p className="text-sm font-medium mb-1">Summary</p>
                                    <p className="text-sm text-muted-foreground">{incident.aiSummary}</p>
                                </div>
                                {incident.aiRecommendedActions && (
                                    <div>
                                        <p className="text-sm font-medium mb-1">Recommended Actions</p>
                                        <ul className="text-sm text-muted-foreground space-y-1">
                                            {incident.aiRecommendedActions.split('\n').map((action, i) => (
                                                <li key={i} className="flex items-start gap-2">
                                                    <span className="text-purple-500">•</span>
                                                    {action}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}

                    {/* Tasks */}
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle className="flex items-center gap-2">
                                    <CheckSquare className="size-5" />
                                    Related Tasks
                                </CardTitle>
                                <CardDescription>
                                    {incident.tasks.length} task(s) associated with this incident
                                </CardDescription>
                            </div>
                            {isManagerOrAdmin && (
                                <Link href={`/tasks/new?incidentId=${id}`}>
                                    <Button variant="outline" size="sm">
                                        Add Task
                                    </Button>
                                </Link>
                            )}
                        </CardHeader>
                        <CardContent>
                            {incident.tasks.length === 0 ? (
                                <p className="text-sm text-muted-foreground text-center py-4">
                                    No tasks yet
                                </p>
                            ) : (
                                <div className="space-y-3">
                                    {incident.tasks.map((task) => (
                                        <div
                                            key={task.id}
                                            className="flex items-center justify-between p-3 rounded-lg border"
                                        >
                                            <div>
                                                <p className="font-medium">{task.title}</p>
                                                <p className="text-sm text-muted-foreground">
                                                    Assigned to {task.assignedTo.name}
                                                </p>
                                            </div>
                                            <Badge className={getStatusColor(task.status)}>
                                                {task.status}
                                            </Badge>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Comments */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <MessageSquare className="size-5" />
                                Comments ({incident.comments.length})
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {/* Add Comment */}
                            <div className="flex gap-3">
                                <Avatar className="size-9">
                                    <AvatarFallback>
                                        {session?.user?.name?.charAt(0).toUpperCase()}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="flex-1 space-y-2">
                                    <Textarea
                                        placeholder="Add a comment..."
                                        value={newComment}
                                        onChange={(e) => setNewComment(e.target.value)}
                                        className="min-h-20"
                                    />
                                    <div className="flex justify-end">
                                        <Button
                                            size="sm"
                                            onClick={handleAddComment}
                                            disabled={submitting || !newComment.trim()}
                                        >
                                            {submitting ? (
                                                <Loader2 className="size-4 animate-spin" />
                                            ) : (
                                                <>
                                                    <Send className="size-4 mr-1" />
                                                    Comment
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                </div>
                            </div>

                            <Separator />

                            {/* Comments List */}
                            {incident.comments.length === 0 ? (
                                <p className="text-sm text-muted-foreground text-center py-4">
                                    No comments yet
                                </p>
                            ) : (
                                <div className="space-y-4">
                                    {incident.comments.map((comment) => (
                                        <div key={comment.id} className="flex gap-3">
                                            <Avatar className="size-9">
                                                <AvatarFallback>
                                                    {comment.author.name.charAt(0).toUpperCase()}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-medium text-sm">
                                                        {comment.author.name}
                                                    </span>
                                                    <span className="text-xs text-muted-foreground">
                                                        {formatRelativeTime(comment.createdAt)}
                                                    </span>
                                                </div>
                                                <p className="text-sm mt-1 whitespace-pre-wrap">
                                                    {comment.body}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Details</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-muted">
                                    <Building2 className="size-4 text-muted-foreground" />
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Department</p>
                                    <p className="font-medium">{incident.department.name}</p>
                                </div>
                            </div>

                            <Separator />

                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-muted">
                                    <User className="size-4 text-muted-foreground" />
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Reported By</p>
                                    <p className="font-medium">{incident.reportedBy.name}</p>
                                    <p className="text-xs text-muted-foreground">{incident.reportedBy.email}</p>
                                </div>
                            </div>

                            {incident.assignedTo && (
                                <>
                                    <Separator />
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-lg bg-muted">
                                            <User className="size-4 text-muted-foreground" />
                                        </div>
                                        <div>
                                            <p className="text-sm text-muted-foreground">Assigned To</p>
                                            <p className="font-medium">{incident.assignedTo.name}</p>
                                            <p className="text-xs text-muted-foreground">{incident.assignedTo.email}</p>
                                        </div>
                                    </div>
                                </>
                            )}

                            <Separator />

                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-muted">
                                    <Calendar className="size-4 text-muted-foreground" />
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Occurred At</p>
                                    <p className="font-medium">{formatDateTime(incident.occurredAt)}</p>
                                </div>
                            </div>

                            <Separator />

                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-muted">
                                    <Clock className="size-4 text-muted-foreground" />
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Created</p>
                                    <p className="font-medium">{formatDateTime(incident.createdAt)}</p>
                                </div>
                            </div>

                            {incident.resolvedAt && (
                                <>
                                    <Separator />
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-lg bg-green-100">
                                            <Clock className="size-4 text-green-600" />
                                        </div>
                                        <div>
                                            <p className="text-sm text-muted-foreground">Resolved</p>
                                            <p className="font-medium">{formatDateTime(incident.resolvedAt)}</p>
                                        </div>
                                    </div>
                                </>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
