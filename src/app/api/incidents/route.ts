import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { createIncidentSchema, incidentFiltersSchema } from '@/lib/validation';
import { isAdmin, isManager } from '@/lib/permissions';
import { createAuditLog } from '@/lib/audit';
import { Prisma } from '@prisma/client';

// GET /api/incidents - List incidents with filters
export async function GET(request: NextRequest) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '10');

        const filters = incidentFiltersSchema.parse({
            status: searchParams.get('status') || undefined,
            severity: searchParams.get('severity') || undefined,
            departmentId: searchParams.get('departmentId') || undefined,
            categoryId: searchParams.get('categoryId') || undefined,
            reportedById: searchParams.get('reportedById') || undefined,
            assignedToId: searchParams.get('assignedToId') || undefined,
            search: searchParams.get('search') || undefined,
        });

        // Build where clause based on role
        const where: Prisma.IncidentWhereInput = {};

        if (isAdmin({ user } as any)) {
            // Admins see everything
        } else if (isManager({ user } as any)) {
            // Managers see their department's incidents
            where.departmentId = user.departmentId || undefined;
        } else {
            // Employees see only their own incidents
            where.OR = [
                { reportedById: user.id },
                { assignedToId: user.id },
            ];
        }

        // Apply filters
        if (filters.status) where.status = filters.status;
        if (filters.severity) where.severity = filters.severity;
        if (filters.departmentId && isAdmin({ user } as any)) where.departmentId = filters.departmentId;
        if (filters.categoryId) where.categoryId = filters.categoryId;
        if (filters.reportedById) where.reportedById = filters.reportedById;
        if (filters.assignedToId) where.assignedToId = filters.assignedToId;
        if (filters.search) {
            where.OR = [
                { title: { contains: filters.search, mode: 'insensitive' } },
                { description: { contains: filters.search, mode: 'insensitive' } },
            ];
        }

        const [incidents, total] = await Promise.all([
            prisma.incident.findMany({
                where,
                include: {
                    category: { select: { id: true, name: true } },
                    department: { select: { id: true, name: true } },
                    reportedBy: { select: { id: true, name: true, email: true } },
                    assignedTo: { select: { id: true, name: true, email: true } },
                    _count: { select: { tasks: true, comments: true } },
                },
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
            }),
            prisma.incident.count({ where }),
        ]);

        return NextResponse.json({
            data: incidents,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        console.error('Error fetching incidents:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// POST /api/incidents - Create a new incident
export async function POST(request: NextRequest) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const validationResult = createIncidentSchema.safeParse(body);

        if (!validationResult.success) {
            return NextResponse.json(
                { error: 'Validation failed', details: validationResult.error.flatten() },
                { status: 400 }
            );
        }

        // Employees can only create incidents for their own department
        const departmentId = validationResult.data.departmentId;
        if (!isAdmin({ user } as any) && !isManager({ user } as any)) {
            if (departmentId !== user.departmentId) {
                return NextResponse.json(
                    { error: 'You can only create incidents for your own department' },
                    { status: 403 }
                );
            }
        }

        const incident = await prisma.incident.create({
            data: {
                ...validationResult.data,
                reportedById: user.id,
            },
            include: {
                category: { select: { id: true, name: true } },
                department: { select: { id: true, name: true } },
                reportedBy: { select: { id: true, name: true, email: true } },
            },
        });

        await createAuditLog({
            entityType: 'INCIDENT',
            entityId: incident.id,
            action: 'CREATED',
            changedById: user.id,
            metadata: { title: incident.title, severity: incident.severity },
        });

        return NextResponse.json(incident, { status: 201 });
    } catch (error) {
        console.error('Error creating incident:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
