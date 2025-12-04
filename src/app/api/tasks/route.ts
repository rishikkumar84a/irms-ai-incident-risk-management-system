import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { createTaskSchema, taskFiltersSchema } from '@/lib/validation';
import { isAdmin, isManager } from '@/lib/permissions';
import { createAuditLog } from '@/lib/audit';
import { Prisma } from '@prisma/client';

// GET /api/tasks - List tasks
export async function GET(request: NextRequest) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '10');
        const myTasks = searchParams.get('myTasks') === 'true';

        const filters = taskFiltersSchema.parse({
            status: searchParams.get('status') || undefined,
            assignedToId: searchParams.get('assignedToId') || undefined,
            relatedIncidentId: searchParams.get('relatedIncidentId') || undefined,
            relatedRiskId: searchParams.get('relatedRiskId') || undefined,
        });

        let where: Prisma.TaskWhereInput = {};

        // Show only assigned tasks for employees
        if (!isAdmin({ user } as any) && !isManager({ user } as any)) {
            where.assignedToId = user.id;
        } else if (myTasks) {
            where.assignedToId = user.id;
        }

        if (filters.status) where.status = filters.status;
        if (filters.assignedToId) where.assignedToId = filters.assignedToId;
        if (filters.relatedIncidentId) where.relatedIncidentId = filters.relatedIncidentId;
        if (filters.relatedRiskId) where.relatedRiskId = filters.relatedRiskId;

        const [tasks, total] = await Promise.all([
            prisma.task.findMany({
                where,
                include: {
                    assignedTo: { select: { id: true, name: true, email: true } },
                    relatedIncident: { select: { id: true, title: true } },
                    relatedRisk: { select: { id: true, title: true } },
                },
                orderBy: [
                    { dueDate: 'asc' },
                    { createdAt: 'desc' },
                ],
                skip: (page - 1) * limit,
                take: limit,
            }),
            prisma.task.count({ where }),
        ]);

        return NextResponse.json({
            data: tasks,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        console.error('Error fetching tasks:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// POST /api/tasks - Create a new task
export async function POST(request: NextRequest) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Only managers and admins can create tasks
        if (!isManager({ user } as any) && !isAdmin({ user } as any)) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const body = await request.json();
        const validationResult = createTaskSchema.safeParse(body);

        if (!validationResult.success) {
            return NextResponse.json(
                { error: 'Validation failed', details: validationResult.error.flatten() },
                { status: 400 }
            );
        }

        const task = await prisma.task.create({
            data: validationResult.data,
            include: {
                assignedTo: { select: { id: true, name: true, email: true } },
                relatedIncident: { select: { id: true, title: true } },
                relatedRisk: { select: { id: true, title: true } },
            },
        });

        await createAuditLog({
            entityType: 'TASK',
            entityId: task.id,
            action: 'CREATED',
            changedById: user.id,
            metadata: { title: task.title, assignedToId: task.assignedToId },
        });

        return NextResponse.json(task, { status: 201 });
    } catch (error) {
        console.error('Error creating task:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
