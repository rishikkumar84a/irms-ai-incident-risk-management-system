'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Loader2, Building2, Edit, Trash2 } from 'lucide-react';
import { formatDate } from '@/lib/utils';

interface Department {
    id: string;
    name: string;
    description: string | null;
    createdAt: string;
    _count: { users: number; incidents: number; risks: number };
}

export default function DepartmentsAdminPage() {
    const [departments, setDepartments] = useState<Department[]>([]);
    const [loading, setLoading] = useState(true);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingDept, setEditingDept] = useState<Department | null>(null);
    const [formData, setFormData] = useState({ name: '', description: '' });

    useEffect(() => { fetchData(); }, []);

    async function fetchData() {
        setLoading(true);
        try {
            const res = await fetch('/api/departments');
            if (res.ok) setDepartments(await res.json());
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    }

    const openDialog = (dept?: Department) => {
        if (dept) {
            setEditingDept(dept);
            setFormData({ name: dept.name, description: dept.description || '' });
        } else {
            setEditingDept(null);
            setFormData({ name: '', description: '' });
        }
        setDialogOpen(true);
    };

    const handleSubmit = async () => {
        const url = editingDept ? `/api/departments/${editingDept.id}` : '/api/departments';
        const method = editingDept ? 'PATCH' : 'POST';

        const res = await fetch(url, {
            method, headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData),
        });

        if (res.ok) { setDialogOpen(false); fetchData(); }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this department?')) return;
        await fetch(`/api/departments/${id}`, { method: 'DELETE' });
        fetchData();
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Departments</h1>
                    <p className="text-muted-foreground">Manage organizational departments</p>
                </div>
                <Button onClick={() => openDialog()}>
                    <Plus className="size-4 mr-2" />Add Department
                </Button>
            </div>

            <Card>
                <CardContent className="p-0">
                    {loading ? (
                        <div className="flex items-center justify-center h-64">
                            <Loader2 className="size-8 animate-spin text-primary" />
                        </div>
                    ) : departments.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-64">
                            <Building2 className="size-12 text-muted-foreground mb-4" />
                            <h3 className="font-semibold">No departments found</h3>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Description</TableHead>
                                    <TableHead>Users</TableHead>
                                    <TableHead>Incidents</TableHead>
                                    <TableHead>Risks</TableHead>
                                    <TableHead>Created</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {departments.map((dept) => (
                                    <TableRow key={dept.id}>
                                        <TableCell className="font-medium">{dept.name}</TableCell>
                                        <TableCell className="max-w-xs truncate text-muted-foreground">
                                            {dept.description || '-'}
                                        </TableCell>
                                        <TableCell>{dept._count.users}</TableCell>
                                        <TableCell>{dept._count.incidents}</TableCell>
                                        <TableCell>{dept._count.risks}</TableCell>
                                        <TableCell className="text-muted-foreground">{formatDate(dept.createdAt)}</TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="ghost" size="icon" onClick={() => openDialog(dept)}>
                                                <Edit className="size-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon" onClick={() => handleDelete(dept.id)}
                                                disabled={dept._count.users > 0 || dept._count.incidents > 0}>
                                                <Trash2 className="size-4 text-destructive" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingDept ? 'Edit Department' : 'Add Department'}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label>Name</Label>
                            <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
                        </div>
                        <div className="space-y-2">
                            <Label>Description</Label>
                            <Textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleSubmit}>{editingDept ? 'Update' : 'Create'}</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
