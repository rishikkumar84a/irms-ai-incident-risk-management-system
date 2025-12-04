import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { createCommentSchema } from '@/lib/validation';
import { createAuditLog } from '@/lib/audit';

// GET /api/comments - Get comments for an incident or risk
export async function GET(request: NextRequest) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const incidentId = searchParams.get('incidentId');
        const riskId = searchParams.get('riskId');

        if (!incidentId && !riskId) {
            return NextResponse.json(
                { error: 'Either incidentId or riskId is required' },
                { status: 400 }
            );
        }

        const comments = await prisma.comment.findMany({
            where: {
                ...(incidentId && { incidentId }),
                ...(riskId && { riskId }),
            },
            include: {
                author: { select: { id: true, name: true, email: true } },
            },
            orderBy: { createdAt: 'desc' },
        });

        return NextResponse.json(comments);
    } catch (error) {
        console.error('Error fetching comments:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// POST /api/comments - Create a new comment
export async function POST(request: NextRequest) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const validationResult = createCommentSchema.safeParse(body);

        if (!validationResult.success) {
            return NextResponse.json(
                { error: 'Validation failed', details: validationResult.error.flatten() },
                { status: 400 }
            );
        }

        const { incidentId, riskId, body: commentBody } = validationResult.data;

        // Verify the incident/risk exists
        if (incidentId) {
            const incident = await prisma.incident.findUnique({ where: { id: incidentId } });
            if (!incident) {
                return NextResponse.json({ error: 'Incident not found' }, { status: 404 });
            }
        }

        if (riskId) {
            const risk = await prisma.risk.findUnique({ where: { id: riskId } });
            if (!risk) {
                return NextResponse.json({ error: 'Risk not found' }, { status: 404 });
            }
        }

        const comment = await prisma.comment.create({
            data: {
                body: commentBody,
                authorId: user.id,
                incidentId,
                riskId,
            },
            include: {
                author: { select: { id: true, name: true, email: true } },
            },
        });

        await createAuditLog({
            entityType: 'COMMENT',
            entityId: comment.id,
            action: 'CREATED',
            changedById: user.id,
            metadata: {
                incidentId,
                riskId,
                bodyPreview: commentBody.substring(0, 100),
            },
        });

        return NextResponse.json(comment, { status: 201 });
    } catch (error) {
        console.error('Error creating comment:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
