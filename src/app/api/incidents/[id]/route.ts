import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { updateIncidentSchema } from '@/lib/validation';
import { canAccessResource, isAdmin, isManagerOrAdmin } from '@/lib/permissions';
import { createAuditLog } from '@/lib/audit';

interface RouteParams {
    params: Promise<{ id: string }>;
}

// GET /api/incidents/[id]
export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params;
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const incident = await prisma.incident.findUnique({
            where: { id },
            include: {
                category: { select: { id: true, name: true } },
                department: { select: { id: true, name: true } },
                reportedBy: { select: { id: true, name: true, email: true } },
                assignedTo: { select: { id: true, name: true, email: true } },
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

        if (!incident) {
            return NextResponse.json({ error: 'Incident not found' }, { status: 404 });
        }

        // Check access
        if (!canAccessResource({ user } as any, incident, 'read')) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        return NextResponse.json(incident);
    } catch (error) {
        console.error('Error fetching incident:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// PATCH /api/incidents/[id]
export async function PATCH(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params;
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const existingIncident = await prisma.incident.findUnique({
            where: { id },
        });

        if (!existingIncident) {
            return NextResponse.json({ error: 'Incident not found' }, { status: 404 });
        }

        if (!canAccessResource({ user } as any, existingIncident, 'write')) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const body = await request.json();
        const validationResult = updateIncidentSchema.safeParse(body);

        if (!validationResult.success) {
            return NextResponse.json(
                { error: 'Validation failed', details: validationResult.error.flatten() },
                { status: 400 }
            );
        }

        const updateData = validationResult.data;

        // Only managers/admins can assign incidents
        if (updateData.assignedToId && !isManagerOrAdmin({ user } as any)) {
            delete updateData.assignedToId;
        }

        // Only managers/admins can change status
        if (updateData.status && !isManagerOrAdmin({ user } as any)) {
            delete updateData.status;
        }

        // Auto-set resolvedAt when status changes to RESOLVED or CLOSED
        if (updateData.status === 'RESOLVED' || updateData.status === 'CLOSED') {
            updateData.resolvedAt = new Date();
        }

        const oldStatus = existingIncident.status;
        const incident = await prisma.incident.update({
            where: { id },
            data: updateData,
            include: {
                category: { select: { id: true, name: true } },
                department: { select: { id: true, name: true } },
                reportedBy: { select: { id: true, name: true, email: true } },
                assignedTo: { select: { id: true, name: true, email: true } },
            },
        });

        // Log status change separately
        if (updateData.status && updateData.status !== oldStatus) {
            await createAuditLog({
                entityType: 'INCIDENT',
                entityId: id,
                action: 'STATUS_CHANGED',
                changedById: user.id,
                metadata: { from: oldStatus, to: updateData.status },
            });
        }

        await createAuditLog({
            entityType: 'INCIDENT',
            entityId: id,
            action: 'UPDATED',
            changedById: user.id,
            metadata: { changes: Object.keys(updateData) },
        });

        return NextResponse.json(incident);
    } catch (error) {
        console.error('Error updating incident:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// DELETE /api/incidents/[id]
export async function DELETE(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params;
        const user = await getCurrentUser();
        if (!user || !isAdmin({ user } as any)) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const incident = await prisma.incident.findUnique({ where: { id } });
        if (!incident) {
            return NextResponse.json({ error: 'Incident not found' }, { status: 404 });
        }

        await prisma.incident.delete({ where: { id } });

        await createAuditLog({
            entityType: 'INCIDENT',
            entityId: id,
            action: 'DELETED',
            changedById: user.id,
            metadata: { title: incident.title },
        });

        return NextResponse.json({ message: 'Incident deleted successfully' });
    } catch (error) {
        console.error('Error deleting incident:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
