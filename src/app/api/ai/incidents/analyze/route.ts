import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { aiAnalyzeIncidentSchema } from '@/lib/validation';
import { analyzeIncident } from '@/lib/ai';
import { createAuditLog } from '@/lib/audit';

// POST /api/ai/incidents/analyze - Analyze an incident with AI
export async function POST(request: NextRequest) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const validationResult = aiAnalyzeIncidentSchema.safeParse(body);

        if (!validationResult.success) {
            return NextResponse.json(
                { error: 'Validation failed', details: validationResult.error.flatten() },
                { status: 400 }
            );
        }

        const analysis = await analyzeIncident(validationResult.data);

        await createAuditLog({
            entityType: 'INCIDENT',
            entityId: 'ai-analysis',
            action: 'AI_ANALYZED',
            changedById: user.id,
            metadata: {
                title: validationResult.data.title,
                suggestedSeverity: analysis.suggestedSeverity,
            },
        });

        return NextResponse.json(analysis);
    } catch (error) {
        console.error('Error analyzing incident:', error);
        return NextResponse.json(
            { error: 'Failed to analyze incident' },
            { status: 500 }
        );
    }
}
