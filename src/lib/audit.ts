import { prisma } from './prisma';
import { Prisma } from '@prisma/client';

export type AuditAction =
    | 'CREATED'
    | 'UPDATED'
    | 'DELETED'
    | 'STATUS_CHANGED'
    | 'ASSIGNED'
    | 'AI_ANALYZED'
    | 'COMMENT_ADDED'
    | 'LOGIN'
    | 'LOGOUT';

export type EntityType =
    | 'INCIDENT'
    | 'RISK'
    | 'TASK'
    | 'USER'
    | 'DEPARTMENT'
    | 'CATEGORY'
    | 'COMMENT';

export interface AuditLogParams {
    entityType: EntityType;
    entityId: string;
    action: AuditAction;
    changedById: string;
    metadata?: Record<string, unknown>;
}

export async function createAuditLog(params: AuditLogParams): Promise<void> {
    try {
        await prisma.auditLog.create({
            data: {
                entityType: params.entityType,
                entityId: params.entityId,
                action: params.action,
                changedById: params.changedById,
                metadata: (params.metadata ?? {}) as Prisma.InputJsonValue,
            },
        });
    } catch (error) {
        // Log error but don't throw - audit logging shouldn't break main operations
        console.error('Failed to create audit log:', error);
    }
}

export async function getAuditLogs(
    entityType?: EntityType,
    entityId?: string,
    limit: number = 50
) {
    return prisma.auditLog.findMany({
        where: {
            ...(entityType && { entityType }),
            ...(entityId && { entityId }),
        },
        include: {
            changedBy: {
                select: { id: true, name: true, email: true },
            },
        },
        orderBy: { changedAt: 'desc' },
        take: limit,
    });
}
