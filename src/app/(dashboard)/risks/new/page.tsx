'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { ArrowLeft, Loader2 } from 'lucide-react';

interface Dept { id: string; name: string; }
interface User { id: string; name: string; }

export default function NewRiskPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [departments, setDepartments] = useState<Dept[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [form, setForm] = useState({
        title: '', description: '', category: 'OPERATIONAL',
        likelihood: 'MEDIUM', impact: 'MEDIUM', departmentId: '', ownerId: '',
        mitigationPlan: '',
    });

    useEffect(() => {
        Promise.all([
            fetch('/api/departments').then(r => r.json()),
            fetch('/api/users?limit=100').then(r => r.json()),
        ]).then(([depts, usersData]) => {
            setDepartments(depts);
            setUsers(usersData.data);
        });
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        const res = await fetch('/api/risks', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(form),
        });
        if (res.ok) {
            const risk = await res.json();
            router.push(`/risks/${risk.id}`);
        }
        setLoading(false);
    };

    return (
        <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
            <div className="flex items-center gap-4">
                <Link href="/risks"><Button variant="ghost" size="icon"><ArrowLeft className="size-5" /></Button></Link>
                <h1 className="text-2xl font-bold">Add New Risk</h1>
            </div>

            <Card>
                <CardContent className="pt-6">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label>Title</Label>
                            <Input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
                        </div>
                        <div className="space-y-2">
                            <Label>Description</Label>
                            <Textarea required value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
                        </div>
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                                <Label>Category</Label>
                                <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="OPERATIONAL">Operational</SelectItem>
                                        <SelectItem value="FINANCIAL">Financial</SelectItem>
                                        <SelectItem value="COMPLIANCE">Compliance</SelectItem>
                                        <SelectItem value="STRATEGIC">Strategic</SelectItem>
                                        <SelectItem value="SECURITY">Security</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Department</Label>
                                <Select value={form.departmentId} onValueChange={(v) => setForm({ ...form, departmentId: v })}>
                                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                                    <SelectContent>
                                        {departments.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                                <Label>Likelihood</Label>
                                <Select value={form.likelihood} onValueChange={(v) => setForm({ ...form, likelihood: v })}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="LOW">Low</SelectItem>
                                        <SelectItem value="MEDIUM">Medium</SelectItem>
                                        <SelectItem value="HIGH">High</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Impact</Label>
                                <Select value={form.impact} onValueChange={(v) => setForm({ ...form, impact: v })}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="LOW">Low</SelectItem>
                                        <SelectItem value="MEDIUM">Medium</SelectItem>
                                        <SelectItem value="HIGH">High</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Risk Owner</Label>
                            <Select value={form.ownerId} onValueChange={(v) => setForm({ ...form, ownerId: v })}>
                                <SelectTrigger><SelectValue placeholder="Select owner" /></SelectTrigger>
                                <SelectContent>
                                    {users.map(u => <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Mitigation Plan</Label>
                            <Textarea value={form.mitigationPlan} onChange={(e) => setForm({ ...form, mitigationPlan: e.target.value })} />
                        </div>
                        <div className="flex justify-end gap-3 pt-4">
                            <Link href="/risks"><Button type="button" variant="outline">Cancel</Button></Link>
                            <Button type="submit" disabled={loading}>
                                {loading && <Loader2 className="size-4 animate-spin mr-2" />}Create Risk
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
