import { Role } from '@prisma/client';
import type { Session } from 'next-auth';

export type Permission =
    | 'users:read'
    | 'users:write'
    | 'users:delete'
    | 'departments:read'
    | 'departments:write'
    | 'departments:delete'
    | 'categories:read'
    | 'categories:write'
    | 'categories:delete'
    | 'incidents:read'
    | 'incidents:read:own'
    | 'incidents:read:department'
    | 'incidents:write'
    | 'incidents:write:own'
    | 'incidents:delete'
    | 'incidents:assign'
    | 'risks:read'
    | 'risks:read:own'
    | 'risks:read:department'
    | 'risks:write'
    | 'risks:delete'
    | 'tasks:read'
    | 'tasks:read:own'
    | 'tasks:write'
    | 'tasks:delete'
    | 'comments:write'
    | 'dashboard:read'
    | 'dashboard:read:all'
    | 'ai:analyze'
    | 'audit:read';

const rolePermissions: Record<Role, Permission[]> = {
    ADMIN: [
        'users:read', 'users:write', 'users:delete',
        'departments:read', 'departments:write', 'departments:delete',
        'categories:read', 'categories:write', 'categories:delete',
        'incidents:read', 'incidents:write', 'incidents:delete', 'incidents:assign',
        'risks:read', 'risks:write', 'risks:delete',
        'tasks:read', 'tasks:write', 'tasks:delete',
        'comments:write',
        'dashboard:read', 'dashboard:read:all',
        'ai:analyze',
        'audit:read',
    ],
    MANAGER: [
        'departments:read',
        'categories:read',
        'incidents:read:department', 'incidents:write', 'incidents:assign',
        'risks:read:department', 'risks:write',
        'tasks:read', 'tasks:write',
        'comments:write',
        'dashboard:read',
        'ai:analyze',
    ],
    EMPLOYEE: [
        'departments:read',
        'categories:read',
        'incidents:read:own', 'incidents:write:own',
        'risks:read:own',
        'tasks:read:own',
        'comments:write',
        'dashboard:read',
        'ai:analyze',
    ],
};

export function hasPermission(role: Role, permission: Permission): boolean {
    return rolePermissions[role]?.includes(permission) ?? false;
}

export function hasAnyPermission(role: Role, permissions: Permission[]): boolean {
    return permissions.some(permission => hasPermission(role, permission));
}

export function hasAllPermissions(role: Role, permissions: Permission[]): boolean {
    return permissions.every(permission => hasPermission(role, permission));
}

export function canAccessResource(
    session: Session | null,
    resource: {
        reportedById?: string | null;
        ownerId?: string | null;
        assignedToId?: string | null;
        departmentId?: string | null;
    },
    action: 'read' | 'write' | 'delete'
): boolean {
    if (!session?.user) return false;

    const { role, id: userId, departmentId: userDepartmentId } = session.user;

    // Admins can do anything
    if (role === 'ADMIN') return true;

    // Managers can access resources in their department
    if (role === 'MANAGER') {
        if (resource.departmentId === userDepartmentId) {
            return action !== 'delete'; // Managers can read/write but not delete
        }
        return false;
    }

    // Employees can only access their own resources
    if (role === 'EMPLOYEE') {
        const isOwner =
            resource.reportedById === userId ||
            resource.ownerId === userId ||
            resource.assignedToId === userId;

        if (!isOwner) return false;
        return action === 'read' || action === 'write';
    }

    return false;
}

export function filterByRole<T extends { departmentId?: string | null; reportedById?: string; ownerId?: string; assignedToId?: string | null }>(
    items: T[],
    session: Session | null
): T[] {
    if (!session?.user) return [];

    const { role, id: userId, departmentId: userDepartmentId } = session.user;

    if (role === 'ADMIN') return items;

    if (role === 'MANAGER') {
        return items.filter(item => item.departmentId === userDepartmentId);
    }

    return items.filter(item =>
        item.reportedById === userId ||
        item.ownerId === userId ||
        item.assignedToId === userId
    );
}

export function isAdmin(session: Session | null): boolean {
    return session?.user?.role === 'ADMIN';
}

export function isManager(session: Session | null): boolean {
    return session?.user?.role === 'MANAGER';
}

export function isEmployee(session: Session | null): boolean {
    return session?.user?.role === 'EMPLOYEE';
}

export function isManagerOrAdmin(session: Session | null): boolean {
    return isAdmin(session) || isManager(session);
}
