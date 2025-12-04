'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { ArrowLeft, Loader2 } from 'lucide-react';

interface User { id: string; name: string; }

function NewTaskForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [loading, setLoading] = useState(false);
    const [users, setUsers] = useState<User[]>([]);
    const [form, setForm] = useState({
        title: '', description: '', assignedToId: '', dueDate: '',
        incidentId: searchParams.get('incidentId') || '',
        riskId: searchParams.get('riskId') || '',
    });

    useEffect(() => {
        fetch('/api/users?limit=100').then(r => r.json()).then(d => setUsers(d.data || [])).catch(() => { });
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        const body = {
            ...form,
            incidentId: form.incidentId || null,
            riskId: form.riskId || null,
            dueDate: form.dueDate || null,
        };
        const res = await fetch('/api/tasks', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });
        if (res.ok) {
            const task = await res.json();
            router.push(`/tasks/${task.id}`);
        }
        setLoading(false);
    };

    return (
        <Card>
            <CardContent className="pt-6">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label>Title</Label>
                        <Input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                        <Label>Description</Label>
                        <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                            <Label>Assign To</Label>
                            <Select value={form.assignedToId} onValueChange={(v) => setForm({ ...form, assignedToId: v })}>
                                <SelectTrigger><SelectValue placeholder="Select user" /></SelectTrigger>
                                <SelectContent>
                                    {users.map(u => <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Due Date</Label>
                            <Input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
                        </div>
                    </div>
                    <div className="flex justify-end gap-3 pt-4">
                        <Link href="/tasks"><Button type="button" variant="outline">Cancel</Button></Link>
                        <Button type="submit" disabled={loading}>
                            {loading && <Loader2 className="size-4 animate-spin mr-2" />}Create Task
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}

export default function NewTaskPage() {
    return (
        <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
            <div className="flex items-center gap-4">
                <Link href="/tasks"><Button variant="ghost" size="icon"><ArrowLeft className="size-5" /></Button></Link>
                <h1 className="text-2xl font-bold">Create New Task</h1>
            </div>
            <Suspense fallback={<div className="flex justify-center p-8"><Loader2 className="size-8 animate-spin" /></div>}>
                <NewTaskForm />
            </Suspense>
        </div>
    );
}
