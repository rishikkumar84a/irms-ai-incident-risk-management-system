import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { updateTaskSchema } from '@/lib/validation';
import { isAdmin, isManagerOrAdmin } from '@/lib/permissions';
import { createAuditLog } from '@/lib/audit';

interface RouteParams {
    params: Promise<{ id: string }>;
}

// GET /api/tasks/[id]
export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params;
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const task = await prisma.task.findUnique({
            where: { id },
            include: {
                assignedTo: { select: { id: true, name: true, email: true } },
                relatedIncident: {
                    select: { id: true, title: true, status: true, severity: true }
                },
                relatedRisk: {
                    select: { id: true, title: true, status: true }
                },
            },
        });

        if (!task) {
            return NextResponse.json({ error: 'Task not found' }, { status: 404 });
        }

        // Employees can only view their assigned tasks
        if (!isManagerOrAdmin({ user } as any) && task.assignedToId !== user.id) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        return NextResponse.json(task);
    } catch (error) {
        console.error('Error fetching task:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// PATCH /api/tasks/[id]
export async function PATCH(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params;
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const existingTask = await prisma.task.findUnique({ where: { id } });
        if (!existingTask) {
            return NextResponse.json({ error: 'Task not found' }, { status: 404 });
        }

        // Employees can only update their own tasks (status only)
        if (!isManagerOrAdmin({ user } as any) && existingTask.assignedToId !== user.id) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const body = await request.json();
        const validationResult = updateTaskSchema.safeParse(body);

        if (!validationResult.success) {
            return NextResponse.json(
                { error: 'Validation failed', details: validationResult.error.flatten() },
                { status: 400 }
            );
        }

        let updateData = validationResult.data;

        // Employees can only change status
        if (!isManagerOrAdmin({ user } as any)) {
            updateData = { status: updateData.status };
        }

        const oldStatus = existingTask.status;
        const task = await prisma.task.update({
            where: { id },
            data: updateData,
            include: {
                assignedTo: { select: { id: true, name: true, email: true } },
                relatedIncident: { select: { id: true, title: true } },
                relatedRisk: { select: { id: true, title: true } },
            },
        });

        if (updateData.status && updateData.status !== oldStatus) {
            await createAuditLog({
                entityType: 'TASK',
                entityId: id,
                action: 'STATUS_CHANGED',
                changedById: user.id,
                metadata: { from: oldStatus, to: updateData.status },
            });
        }

        await createAuditLog({
            entityType: 'TASK',
            entityId: id,
            action: 'UPDATED',
            changedById: user.id,
            metadata: { changes: Object.keys(updateData) },
        });

        return NextResponse.json(task);
    } catch (error) {
        console.error('Error updating task:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// DELETE /api/tasks/[id]
export async function DELETE(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params;
        const user = await getCurrentUser();
        if (!user || !isAdmin({ user } as any)) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const task = await prisma.task.findUnique({ where: { id } });
        if (!task) {
            return NextResponse.json({ error: 'Task not found' }, { status: 404 });
        }

        await prisma.task.delete({ where: { id } });

        await createAuditLog({
            entityType: 'TASK',
            entityId: id,
            action: 'DELETED',
            changedById: user.id,
            metadata: { title: task.title },
        });

        return NextResponse.json({ message: 'Task deleted successfully' });
    } catch (error) {
        console.error('Error deleting task:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
