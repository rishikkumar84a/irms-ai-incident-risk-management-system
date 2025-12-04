import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { updateDepartmentSchema } from '@/lib/validation';
import { isAdmin } from '@/lib/permissions';
import { createAuditLog } from '@/lib/audit';

interface RouteParams {
    params: Promise<{ id: string }>;
}

// GET /api/departments/[id]
export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params;
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const department = await prisma.department.findUnique({
            where: { id },
            include: {
                _count: {
                    select: {
                        users: true,
                        incidents: true,
                        risks: true,
                    },
                },
            },
        });

        if (!department) {
            return NextResponse.json({ error: 'Department not found' }, { status: 404 });
        }

        return NextResponse.json(department);
    } catch (error) {
        console.error('Error fetching department:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// PATCH /api/departments/[id]
export async function PATCH(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params;
        const currentUser = await getCurrentUser();
        if (!currentUser || !isAdmin({ user: currentUser } as any)) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const body = await request.json();
        const validationResult = updateDepartmentSchema.safeParse(body);

        if (!validationResult.success) {
            return NextResponse.json(
                { error: 'Validation failed', details: validationResult.error.flatten() },
                { status: 400 }
            );
        }

        // Check for duplicate name
        if (validationResult.data.name) {
            const existing = await prisma.department.findFirst({
                where: { name: validationResult.data.name, NOT: { id } },
            });
            if (existing) {
                return NextResponse.json(
                    { error: 'A department with this name already exists' },
                    { status: 409 }
                );
            }
        }

        const department = await prisma.department.update({
            where: { id },
            data: validationResult.data,
        });

        await createAuditLog({
            entityType: 'DEPARTMENT',
            entityId: id,
            action: 'UPDATED',
            changedById: currentUser.id,
            metadata: { changes: Object.keys(validationResult.data) },
        });

        return NextResponse.json(department);
    } catch (error) {
        console.error('Error updating department:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// DELETE /api/departments/[id]
export async function DELETE(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params;
        const currentUser = await getCurrentUser();
        if (!currentUser || !isAdmin({ user: currentUser } as any)) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // Check for related records
        const department = await prisma.department.findUnique({
            where: { id },
            include: {
                _count: {
                    select: { users: true, incidents: true, risks: true },
                },
            },
        });

        if (!department) {
            return NextResponse.json({ error: 'Department not found' }, { status: 404 });
        }

        const totalRelated = department._count.users + department._count.incidents + department._count.risks;
        if (totalRelated > 0) {
            return NextResponse.json(
                { error: 'Cannot delete department with associated records. Remove or reassign them first.' },
                { status: 400 }
            );
        }

        await prisma.department.delete({ where: { id } });

        await createAuditLog({
            entityType: 'DEPARTMENT',
            entityId: id,
            action: 'DELETED',
            changedById: currentUser.id,
            metadata: { name: department.name },
        });

        return NextResponse.json({ message: 'Department deleted successfully' });
    } catch (error) {
        console.error('Error deleting department:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
