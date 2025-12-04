import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { updateCategorySchema } from '@/lib/validation';
import { isAdmin } from '@/lib/permissions';
import { createAuditLog } from '@/lib/audit';

interface RouteParams {
    params: Promise<{ id: string }>;
}

// GET /api/categories/[id]
export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params;
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const category = await prisma.incidentCategory.findUnique({
            where: { id },
            include: {
                _count: { select: { incidents: true } },
            },
        });

        if (!category) {
            return NextResponse.json({ error: 'Category not found' }, { status: 404 });
        }

        return NextResponse.json(category);
    } catch (error) {
        console.error('Error fetching category:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// PATCH /api/categories/[id]
export async function PATCH(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params;
        const currentUser = await getCurrentUser();
        if (!currentUser || !isAdmin({ user: currentUser } as any)) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const body = await request.json();
        const validationResult = updateCategorySchema.safeParse(body);

        if (!validationResult.success) {
            return NextResponse.json(
                { error: 'Validation failed', details: validationResult.error.flatten() },
                { status: 400 }
            );
        }

        if (validationResult.data.name) {
            const existing = await prisma.incidentCategory.findFirst({
                where: { name: validationResult.data.name, NOT: { id } },
            });
            if (existing) {
                return NextResponse.json(
                    { error: 'A category with this name already exists' },
                    { status: 409 }
                );
            }
        }

        const category = await prisma.incidentCategory.update({
            where: { id },
            data: validationResult.data,
        });

        await createAuditLog({
            entityType: 'CATEGORY',
            entityId: id,
            action: 'UPDATED',
            changedById: currentUser.id,
            metadata: { changes: Object.keys(validationResult.data) },
        });

        return NextResponse.json(category);
    } catch (error) {
        console.error('Error updating category:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// DELETE /api/categories/[id]
export async function DELETE(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params;
        const currentUser = await getCurrentUser();
        if (!currentUser || !isAdmin({ user: currentUser } as any)) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const category = await prisma.incidentCategory.findUnique({
            where: { id },
            include: { _count: { select: { incidents: true } } },
        });

        if (!category) {
            return NextResponse.json({ error: 'Category not found' }, { status: 404 });
        }

        if (category._count.incidents > 0) {
            return NextResponse.json(
                { error: 'Cannot delete category with associated incidents' },
                { status: 400 }
            );
        }

        await prisma.incidentCategory.delete({ where: { id } });

        await createAuditLog({
            entityType: 'CATEGORY',
            entityId: id,
            action: 'DELETED',
            changedById: currentUser.id,
            metadata: { name: category.name },
        });

        return NextResponse.json({ message: 'Category deleted successfully' });
    } catch (error) {
        console.error('Error deleting category:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
