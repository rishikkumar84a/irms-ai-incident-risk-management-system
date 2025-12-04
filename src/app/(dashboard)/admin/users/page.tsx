'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Plus, Search, Loader2, Users, Edit, Trash2 } from 'lucide-react';
import { getRoleColor, formatDate } from '@/lib/utils';

interface User {
    id: string;
    name: string;
    email: string;
    role: string;
    department: { id: string; name: string } | null;
    createdAt: string;
}

interface Department {
    id: string;
    name: string;
}

export default function UsersAdminPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [formData, setFormData] = useState({
        name: '', email: '', password: '', role: 'EMPLOYEE', departmentId: '',
    });

    useEffect(() => {
        fetchData();
    }, [search]);

    async function fetchData() {
        setLoading(true);
        try {
            const params = new URLSearchParams({ limit: '100' });
            if (search) params.set('search', search);

            const [usersRes, deptsRes] = await Promise.all([
                fetch(`/api/users?${params}`),
                fetch('/api/departments'),
            ]);

            if (usersRes.ok) setUsers((await usersRes.json()).data);
            if (deptsRes.ok) setDepartments(await deptsRes.json());
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    }

    const openDialog = (user?: User) => {
        if (user) {
            setEditingUser(user);
            setFormData({
                name: user.name, email: user.email, password: '',
                role: user.role, departmentId: user.department?.id || '',
            });
        } else {
            setEditingUser(null);
            setFormData({ name: '', email: '', password: '', role: 'EMPLOYEE', departmentId: '' });
        }
        setDialogOpen(true);
    };

    const handleSubmit = async () => {
        const url = editingUser ? `/api/users/${editingUser.id}` : '/api/users';
        const method = editingUser ? 'PATCH' : 'POST';
        const body = { ...formData };
        if (!body.password) delete (body as any).password;
        if (!body.departmentId) (body as any).departmentId = null;

        const res = await fetch(url, {
            method, headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });

        if (res.ok) {
            setDialogOpen(false);
            fetchData();
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this user?')) return;
        await fetch(`/api/users/${id}`, { method: 'DELETE' });
        fetchData();
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">User Management</h1>
                    <p className="text-muted-foreground">Manage system users and roles</p>
                </div>
                <Button onClick={() => openDialog()}>
                    <Plus className="size-4 mr-2" />Add User
                </Button>
            </div>

            <Card>
                <CardContent className="pt-6">
                    <div className="relative max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                        <Input placeholder="Search users..." className="pl-10" value={search}
                            onChange={(e) => setSearch(e.target.value)} />
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardContent className="p-0">
                    {loading ? (
                        <div className="flex items-center justify-center h-64">
                            <Loader2 className="size-8 animate-spin text-primary" />
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Email</TableHead>
                                    <TableHead>Role</TableHead>
                                    <TableHead>Department</TableHead>
                                    <TableHead>Created</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {users.map((user) => (
                                    <TableRow key={user.id}>
                                        <TableCell className="font-medium">{user.name}</TableCell>
                                        <TableCell>{user.email}</TableCell>
                                        <TableCell><Badge className={getRoleColor(user.role)}>{user.role}</Badge></TableCell>
                                        <TableCell>{user.department?.name || '-'}</TableCell>
                                        <TableCell className="text-muted-foreground">{formatDate(user.createdAt)}</TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="ghost" size="icon" onClick={() => openDialog(user)}>
                                                <Edit className="size-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon" onClick={() => handleDelete(user.id)}>
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
                        <DialogTitle>{editingUser ? 'Edit User' : 'Add New User'}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label>Name</Label>
                            <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
                        </div>
                        <div className="space-y-2">
                            <Label>Email</Label>
                            <Input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
                        </div>
                        <div className="space-y-2">
                            <Label>Password {editingUser && '(leave blank to keep)'}</Label>
                            <Input type="password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} />
                        </div>
                        <div className="space-y-2">
                            <Label>Role</Label>
                            <Select value={formData.role} onValueChange={(v) => setFormData({ ...formData, role: v })}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ADMIN">Admin</SelectItem>
                                    <SelectItem value="MANAGER">Manager</SelectItem>
                                    <SelectItem value="EMPLOYEE">Employee</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Department</Label>
                            <Select value={formData.departmentId} onValueChange={(v) => setFormData({ ...formData, departmentId: v })}>
                                <SelectTrigger><SelectValue placeholder="Select department" /></SelectTrigger>
                                <SelectContent>
                                    {departments.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleSubmit}>{editingUser ? 'Update' : 'Create'}</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
