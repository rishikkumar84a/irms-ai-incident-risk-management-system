import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { createCategorySchema } from '@/lib/validation';
import { isAdmin } from '@/lib/permissions';
import { createAuditLog } from '@/lib/audit';

// GET /api/categories - List all incident categories
export async function GET() {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const categories = await prisma.incidentCategory.findMany({
            select: {
                id: true,
                name: true,
                description: true,
                _count: {
                    select: { incidents: true },
                },
                createdAt: true,
            },
            orderBy: { name: 'asc' },
        });

        return NextResponse.json(categories);
    } catch (error) {
        console.error('Error fetching categories:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// POST /api/categories - Create a new category (Admin only)
export async function POST(request: NextRequest) {
    try {
        const currentUser = await getCurrentUser();
        if (!currentUser || !isAdmin({ user: currentUser } as any)) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const body = await request.json();
        const validationResult = createCategorySchema.safeParse(body);

        if (!validationResult.success) {
            return NextResponse.json(
                { error: 'Validation failed', details: validationResult.error.flatten() },
                { status: 400 }
            );
        }

        // Check for duplicate name
        const existing = await prisma.incidentCategory.findUnique({
            where: { name: validationResult.data.name },
        });

        if (existing) {
            return NextResponse.json(
                { error: 'A category with this name already exists' },
                { status: 409 }
            );
        }

        const category = await prisma.incidentCategory.create({
            data: validationResult.data,
        });

        await createAuditLog({
            entityType: 'CATEGORY',
            entityId: category.id,
            action: 'CREATED',
            changedById: currentUser.id,
            metadata: { name: category.name },
        });

        return NextResponse.json(category, { status: 201 });
    } catch (error) {
        console.error('Error creating category:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
