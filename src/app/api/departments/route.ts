import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { createDepartmentSchema } from '@/lib/validation';
import { isAdmin } from '@/lib/permissions';
import { createAuditLog } from '@/lib/audit';

// GET /api/departments - List all departments
export async function GET() {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const departments = await prisma.department.findMany({
            select: {
                id: true,
                name: true,
                description: true,
                _count: {
                    select: {
                        users: true,
                        incidents: true,
                        risks: true,
                    },
                },
                createdAt: true,
            },
            orderBy: { name: 'asc' },
        });

        return NextResponse.json(departments);
    } catch (error) {
        console.error('Error fetching departments:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// POST /api/departments - Create a new department (Admin only)
export async function POST(request: NextRequest) {
    try {
        const currentUser = await getCurrentUser();
        if (!currentUser || !isAdmin({ user: currentUser } as any)) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const body = await request.json();
        const validationResult = createDepartmentSchema.safeParse(body);

        if (!validationResult.success) {
            return NextResponse.json(
                { error: 'Validation failed', details: validationResult.error.flatten() },
                { status: 400 }
            );
        }

        // Check for duplicate name
        const existing = await prisma.department.findUnique({
            where: { name: validationResult.data.name },
        });

        if (existing) {
            return NextResponse.json(
                { error: 'A department with this name already exists' },
                { status: 409 }
            );
        }

        const department = await prisma.department.create({
            data: validationResult.data,
        });

        await createAuditLog({
            entityType: 'DEPARTMENT',
            entityId: department.id,
            action: 'CREATED',
            changedById: currentUser.id,
            metadata: { name: department.name },
        });

        return NextResponse.json(department, { status: 201 });
    } catch (error) {
        console.error('Error creating department:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
