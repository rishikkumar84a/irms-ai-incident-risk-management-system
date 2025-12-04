'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Plus, Search, Loader2, Shield, Eye, ChevronLeft, ChevronRight } from 'lucide-react';
import { formatRelativeTime, getStatusColor } from '@/lib/utils';

interface Risk {
    id: string;
    title: string;
    category: string;
    status: string;
    likelihood: string;
    impact: string;
    createdAt: string;
    department: { id: string; name: string };
    owner: { id: string; name: string };
}

export default function RisksPage() {
    const [risks, setRisks] = useState<Risk[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [status, setStatus] = useState<string>('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    useEffect(() => {
        async function fetchRisks() {
            setLoading(true);
            try {
                const params = new URLSearchParams({ page: page.toString(), limit: '10' });
                if (search) params.set('search', search);
                if (status) params.set('status', status);

                const res = await fetch(`/api/risks?${params}`);
                if (res.ok) {
                    const data = await res.json();
                    setRisks(data.data);
                    setTotalPages(data.pagination.totalPages);
                }
            } catch (e) { console.error(e); }
            finally { setLoading(false); }
        }
        fetchRisks();
    }, [page, search, status]);

    const getRiskScore = (likelihood: string, impact: string) => {
        const lMap: Record<string, number> = { LOW: 1, MEDIUM: 2, HIGH: 3 };
        const iMap: Record<string, number> = { LOW: 1, MEDIUM: 2, HIGH: 3 };
        const score = lMap[likelihood] * iMap[impact];
        if (score >= 6) return { score, color: 'bg-red-500 text-white' };
        if (score >= 4) return { score, color: 'bg-orange-500 text-white' };
        return { score, color: 'bg-yellow-500 text-white' };
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Risk Register</h1>
                    <p className="text-muted-foreground">Monitor and manage organizational risks</p>
                </div>
                <Link href="/risks/new"><Button><Plus className="size-4 mr-2" />Add Risk</Button></Link>
            </div>

            <Card>
                <CardContent className="pt-6 flex gap-4 flex-wrap">
                    <div className="relative flex-1 min-w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                        <Input placeholder="Search..." className="pl-10" value={search}
                            onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
                    </div>
                    <Select value={status} onValueChange={(v) => { setStatus(v === 'all' ? '' : v); setPage(1); }}>
                        <SelectTrigger className="w-40"><SelectValue placeholder="Status" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All</SelectItem>
                            <SelectItem value="OPEN">Open</SelectItem>
                            <SelectItem value="MITIGATED">Mitigated</SelectItem>
                            <SelectItem value="CLOSED">Closed</SelectItem>
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
                    ) : risks.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-64">
                            <Shield className="size-12 text-muted-foreground mb-4" />
                            <h3 className="font-semibold">No risks found</h3>
                        </div>
                    ) : (
                        <>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Title</TableHead>
                                        <TableHead>Category</TableHead>
                                        <TableHead>Score</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Owner</TableHead>
                                        <TableHead>Created</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {risks.map((risk) => {
                                        const rs = getRiskScore(risk.likelihood, risk.impact);
                                        return (
                                            <TableRow key={risk.id}>
                                                <TableCell className="font-medium">{risk.title}</TableCell>
                                                <TableCell><Badge variant="outline">{risk.category}</Badge></TableCell>
                                                <TableCell><Badge className={rs.color}>{rs.score}</Badge></TableCell>
                                                <TableCell><Badge className={getStatusColor(risk.status)}>{risk.status}</Badge></TableCell>
                                                <TableCell>{risk.owner.name}</TableCell>
                                                <TableCell className="text-muted-foreground">{formatRelativeTime(risk.createdAt)}</TableCell>
                                                <TableCell className="text-right">
                                                    <Link href={`/risks/${risk.id}`}>
                                                        <Button variant="ghost" size="sm"><Eye className="size-4" /></Button>
                                                    </Link>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
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
