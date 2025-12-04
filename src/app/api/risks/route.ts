import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { createRiskSchema, riskFiltersSchema } from '@/lib/validation';
import { isAdmin, isManager } from '@/lib/permissions';
import { createAuditLog } from '@/lib/audit';
import { Prisma } from '@prisma/client';

// GET /api/risks - List risks with filters
export async function GET(request: NextRequest) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '10');

        const filters = riskFiltersSchema.parse({
            status: searchParams.get('status') || undefined,
            likelihood: searchParams.get('likelihood') || undefined,
            impact: searchParams.get('impact') || undefined,
            departmentId: searchParams.get('departmentId') || undefined,
            ownerId: searchParams.get('ownerId') || undefined,
            search: searchParams.get('search') || undefined,
        });

        let where: Prisma.RiskWhereInput = {};

        if (isAdmin({ user } as any)) {
            // Admins see everything
        } else if (isManager({ user } as any)) {
            where.departmentId = user.departmentId || undefined;
        } else {
            where.ownerId = user.id;
        }

        if (filters.status) where.status = filters.status;
        if (filters.likelihood) where.likelihood = filters.likelihood;
        if (filters.impact) where.impact = filters.impact;
        if (filters.departmentId && isAdmin({ user } as any)) where.departmentId = filters.departmentId;
        if (filters.ownerId) where.ownerId = filters.ownerId;
        if (filters.search) {
            where.OR = [
                { title: { contains: filters.search, mode: 'insensitive' } },
                { description: { contains: filters.search, mode: 'insensitive' } },
            ];
        }

        const [risks, total] = await Promise.all([
            prisma.risk.findMany({
                where,
                include: {
                    department: { select: { id: true, name: true } },
                    owner: { select: { id: true, name: true, email: true } },
                    _count: { select: { tasks: true, comments: true } },
                },
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
            }),
            prisma.risk.count({ where }),
        ]);

        return NextResponse.json({
            data: risks,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        console.error('Error fetching risks:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// POST /api/risks - Create a new risk
export async function POST(request: NextRequest) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Only managers and admins can create risks
        if (!isManager({ user } as any) && !isAdmin({ user } as any)) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const body = await request.json();
        const validationResult = createRiskSchema.safeParse(body);

        if (!validationResult.success) {
            return NextResponse.json(
                { error: 'Validation failed', details: validationResult.error.flatten() },
                { status: 400 }
            );
        }

        const risk = await prisma.risk.create({
            data: {
                ...validationResult.data,
                ownerId: user.id,
            },
            include: {
                department: { select: { id: true, name: true } },
                owner: { select: { id: true, name: true, email: true } },
            },
        });

        await createAuditLog({
            entityType: 'RISK',
            entityId: risk.id,
            action: 'CREATED',
            changedById: user.id,
            metadata: { title: risk.title, likelihood: risk.likelihood, impact: risk.impact },
        });

        return NextResponse.json(risk, { status: 201 });
    } catch (error) {
        console.error('Error creating risk:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
