import { z } from 'zod';
import { IncidentStatus, Severity, Likelihood, Impact, RiskStatus, TaskStatus, Role } from '@prisma/client';

// ============================================
// Common Schemas
// ============================================

export const idSchema = z.string().cuid();

export const paginationSchema = z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(10),
});

// ============================================
// Auth Schemas
// ============================================

export const loginSchema = z.object({
    email: z.string().email('Invalid email address').toLowerCase().trim(),
    password: z.string().min(6, 'Password must be at least 6 characters'),
});

// ============================================
// User Schemas
// ============================================

export const createUserSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters').max(100).trim(),
    email: z.string().email('Invalid email address').toLowerCase().trim(),
    password: z.string().min(8, 'Password must be at least 8 characters')
        .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
        .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
        .regex(/[0-9]/, 'Password must contain at least one number'),
    role: z.nativeEnum(Role).default(Role.EMPLOYEE),
    departmentId: z.string().cuid().nullable().optional(),
});

export const updateUserSchema = z.object({
    name: z.string().min(2).max(100).trim().optional(),
    email: z.string().email().toLowerCase().trim().optional(),
    password: z.string().min(8)
        .regex(/[A-Z]/)
        .regex(/[a-z]/)
        .regex(/[0-9]/)
        .optional(),
    role: z.nativeEnum(Role).optional(),
    departmentId: z.string().cuid().nullable().optional(),
});

// ============================================
// Department Schemas
// ============================================

export const createDepartmentSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters').max(100).trim(),
    description: z.string().max(500).trim().optional(),
});

export const updateDepartmentSchema = z.object({
    name: z.string().min(2).max(100).trim().optional(),
    description: z.string().max(500).trim().optional(),
});

// ============================================
// Incident Category Schemas
// ============================================

export const createCategorySchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters').max(100).trim(),
    description: z.string().max(500).trim().optional(),
});

export const updateCategorySchema = z.object({
    name: z.string().min(2).max(100).trim().optional(),
    description: z.string().max(500).trim().optional(),
});

// ============================================
// Incident Schemas
// ============================================

export const createIncidentSchema = z.object({
    title: z.string().min(5, 'Title must be at least 5 characters').max(200).trim(),
    description: z.string().min(20, 'Description must be at least 20 characters').max(5000).trim(),
    severity: z.nativeEnum(Severity).default(Severity.MEDIUM),
    categoryId: z.string().cuid().optional().nullable(),
    departmentId: z.string().cuid(),
    occurredAt: z.coerce.date().default(() => new Date()),
});

export const updateIncidentSchema = z.object({
    title: z.string().min(5).max(200).trim().optional(),
    description: z.string().min(20).max(5000).trim().optional(),
    status: z.nativeEnum(IncidentStatus).optional(),
    severity: z.nativeEnum(Severity).optional(),
    categoryId: z.string().cuid().optional().nullable(),
    assignedToId: z.string().cuid().optional().nullable(),
    resolvedAt: z.coerce.date().optional().nullable(),
    aiSummary: z.string().optional().nullable(),
    aiSeveritySuggestion: z.nativeEnum(Severity).optional().nullable(),
    aiRecommendedActions: z.string().optional().nullable(),
});

export const incidentFiltersSchema = z.object({
    status: z.nativeEnum(IncidentStatus).optional(),
    severity: z.nativeEnum(Severity).optional(),
    departmentId: z.string().cuid().optional(),
    categoryId: z.string().cuid().optional(),
    reportedById: z.string().cuid().optional(),
    assignedToId: z.string().cuid().optional(),
    search: z.string().optional(),
});

// ============================================
// Risk Schemas
// ============================================

export const createRiskSchema = z.object({
    title: z.string().min(5, 'Title must be at least 5 characters').max(200).trim(),
    description: z.string().min(20, 'Description must be at least 20 characters').max(5000).trim(),
    category: z.string().min(2).max(100).trim(),
    likelihood: z.nativeEnum(Likelihood).default(Likelihood.MEDIUM),
    impact: z.nativeEnum(Impact).default(Impact.MEDIUM),
    departmentId: z.string().cuid(),
    mitigationPlan: z.string().max(5000).trim().optional(),
});

export const updateRiskSchema = z.object({
    title: z.string().min(5).max(200).trim().optional(),
    description: z.string().min(20).max(5000).trim().optional(),
    category: z.string().min(2).max(100).trim().optional(),
    likelihood: z.nativeEnum(Likelihood).optional(),
    impact: z.nativeEnum(Impact).optional(),
    status: z.nativeEnum(RiskStatus).optional(),
    mitigationPlan: z.string().max(5000).trim().optional().nullable(),
    aiMitigationSuggestions: z.string().optional().nullable(),
});

export const riskFiltersSchema = z.object({
    status: z.nativeEnum(RiskStatus).optional(),
    likelihood: z.nativeEnum(Likelihood).optional(),
    impact: z.nativeEnum(Impact).optional(),
    departmentId: z.string().cuid().optional(),
    ownerId: z.string().cuid().optional(),
    search: z.string().optional(),
});

// ============================================
// Task Schemas
// ============================================

export const createTaskSchema = z.object({
    title: z.string().min(3, 'Title must be at least 3 characters').max(200).trim(),
    description: z.string().max(2000).trim().optional(),
    relatedIncidentId: z.string().cuid().optional().nullable(),
    relatedRiskId: z.string().cuid().optional().nullable(),
    assignedToId: z.string().cuid(),
    dueDate: z.coerce.date().optional().nullable(),
});

export const updateTaskSchema = z.object({
    title: z.string().min(3).max(200).trim().optional(),
    description: z.string().max(2000).trim().optional(),
    status: z.nativeEnum(TaskStatus).optional(),
    assignedToId: z.string().cuid().optional(),
    dueDate: z.coerce.date().optional().nullable(),
});

export const taskFiltersSchema = z.object({
    status: z.nativeEnum(TaskStatus).optional(),
    assignedToId: z.string().cuid().optional(),
    relatedIncidentId: z.string().cuid().optional(),
    relatedRiskId: z.string().cuid().optional(),
});

// ============================================
// Comment Schemas
// ============================================

export const createCommentSchema = z.object({
    body: z.string().min(1, 'Comment cannot be empty').max(2000).trim(),
    incidentId: z.string().cuid().optional(),
    riskId: z.string().cuid().optional(),
}).refine(
    (data) => data.incidentId || data.riskId,
    { message: 'Either incidentId or riskId must be provided' }
);

// ============================================
// AI Analysis Schema
// ============================================

export const aiAnalyzeIncidentSchema = z.object({
    title: z.string().min(5).max(200),
    description: z.string().min(20).max(5000),
    category: z.string().optional(),
    department: z.string().optional(),
});

// ============================================
// Type Exports
// ============================================

export type LoginInput = z.infer<typeof loginSchema>;
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type CreateDepartmentInput = z.infer<typeof createDepartmentSchema>;
export type UpdateDepartmentInput = z.infer<typeof updateDepartmentSchema>;
export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
export type CreateIncidentInput = z.infer<typeof createIncidentSchema>;
export type UpdateIncidentInput = z.infer<typeof updateIncidentSchema>;
export type IncidentFilters = z.infer<typeof incidentFiltersSchema>;
export type CreateRiskInput = z.infer<typeof createRiskSchema>;
export type UpdateRiskInput = z.infer<typeof updateRiskSchema>;
export type RiskFilters = z.infer<typeof riskFiltersSchema>;
export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type TaskFilters = z.infer<typeof taskFiltersSchema>;
export type CreateCommentInput = z.infer<typeof createCommentSchema>;
export type AIAnalyzeIncidentInput = z.infer<typeof aiAnalyzeIncidentSchema>;
