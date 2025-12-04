import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { updateRiskSchema } from '@/lib/validation';
import { canAccessResource, isAdmin } from '@/lib/permissions';
import { createAuditLog } from '@/lib/audit';

interface RouteParams {
    params: Promise<{ id: string }>;
}

// GET /api/risks/[id]
export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params;
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const risk = await prisma.risk.findUnique({
            where: { id },
            include: {
                department: { select: { id: true, name: true } },
                owner: { select: { id: true, name: true, email: true } },
                tasks: {
                    include: {
                        assignedTo: { select: { id: true, name: true } },
                    },
                    orderBy: { createdAt: 'desc' },
                },
                comments: {
                    include: {
                        author: { select: { id: true, name: true } },
                    },
                    orderBy: { createdAt: 'desc' },
                },
            },
        });

        if (!risk) {
            return NextResponse.json({ error: 'Risk not found' }, { status: 404 });
        }

        if (!canAccessResource({ user } as any, risk, 'read')) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        return NextResponse.json(risk);
    } catch (error) {
        console.error('Error fetching risk:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// PATCH /api/risks/[id]
export async function PATCH(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params;
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const existingRisk = await prisma.risk.findUnique({ where: { id } });
        if (!existingRisk) {
            return NextResponse.json({ error: 'Risk not found' }, { status: 404 });
        }

        if (!canAccessResource({ user } as any, existingRisk, 'write')) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const body = await request.json();
        const validationResult = updateRiskSchema.safeParse(body);

        if (!validationResult.success) {
            return NextResponse.json(
                { error: 'Validation failed', details: validationResult.error.flatten() },
                { status: 400 }
            );
        }

        const oldStatus = existingRisk.status;
        const risk = await prisma.risk.update({
            where: { id },
            data: validationResult.data,
            include: {
                department: { select: { id: true, name: true } },
                owner: { select: { id: true, name: true, email: true } },
            },
        });

        if (validationResult.data.status && validationResult.data.status !== oldStatus) {
            await createAuditLog({
                entityType: 'RISK',
                entityId: id,
                action: 'STATUS_CHANGED',
                changedById: user.id,
                metadata: { from: oldStatus, to: validationResult.data.status },
            });
        }

        await createAuditLog({
            entityType: 'RISK',
            entityId: id,
            action: 'UPDATED',
            changedById: user.id,
            metadata: { changes: Object.keys(validationResult.data) },
        });

        return NextResponse.json(risk);
    } catch (error) {
        console.error('Error updating risk:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// DELETE /api/risks/[id]
export async function DELETE(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params;
        const user = await getCurrentUser();
        if (!user || !isAdmin({ user } as any)) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const risk = await prisma.risk.findUnique({ where: { id } });
        if (!risk) {
            return NextResponse.json({ error: 'Risk not found' }, { status: 404 });
        }

        await prisma.risk.delete({ where: { id } });

        await createAuditLog({
            entityType: 'RISK',
            entityId: id,
            action: 'DELETED',
            changedById: user.id,
            metadata: { title: risk.title },
        });

        return NextResponse.json({ message: 'Risk deleted successfully' });
    } catch (error) {
        console.error('Error deleting risk:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
