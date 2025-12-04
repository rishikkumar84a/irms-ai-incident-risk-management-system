import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { updateUserSchema, idSchema } from '@/lib/validation';
import { isAdmin } from '@/lib/permissions';
import { createAuditLog } from '@/lib/audit';

interface RouteParams {
    params: Promise<{ id: string }>;
}

// GET /api/users/[id] - Get a single user
export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params;
        const currentUser = await getCurrentUser();

        if (!currentUser) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Users can view their own profile, admins can view anyone
        if (currentUser.id !== id && !isAdmin({ user: currentUser } as any)) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const user = await prisma.user.findUnique({
            where: { id },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                departmentId: true,
                department: {
                    select: { id: true, name: true },
                },
                createdAt: true,
                updatedAt: true,
            },
        });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        return NextResponse.json(user);
    } catch (error) {
        console.error('Error fetching user:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// PATCH /api/users/[id] - Update a user
export async function PATCH(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params;
        const currentUser = await getCurrentUser();

        if (!currentUser) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Users can update their own profile (limited fields), admins can update anyone
        const isSelf = currentUser.id === id;
        const isAdminUser = isAdmin({ user: currentUser } as any);

        if (!isSelf && !isAdminUser) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const body = await request.json();
        const validationResult = updateUserSchema.safeParse(body);

        if (!validationResult.success) {
            return NextResponse.json(
                { error: 'Validation failed', details: validationResult.error.flatten() },
                { status: 400 }
            );
        }

        const updateData = validationResult.data;

        // Non-admins cannot change role or department
        if (!isAdminUser) {
            delete updateData.role;
            delete updateData.departmentId;
        }

        // Handle password update
        if (updateData.password) {
            (updateData as any).passwordHash = await bcrypt.hash(updateData.password, 12);
            delete updateData.password;
        }

        // Check email uniqueness if updating email
        if (updateData.email) {
            const existingUser = await prisma.user.findFirst({
                where: { email: updateData.email, NOT: { id } },
            });
            if (existingUser) {
                return NextResponse.json(
                    { error: 'A user with this email already exists' },
                    { status: 409 }
                );
            }
        }

        const existingUser = await prisma.user.findUnique({ where: { id } });
        if (!existingUser) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const updatedUser = await prisma.user.update({
            where: { id },
            data: updateData,
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                departmentId: true,
                department: {
                    select: { id: true, name: true },
                },
                createdAt: true,
                updatedAt: true,
            },
        });

        await createAuditLog({
            entityType: 'USER',
            entityId: id,
            action: 'UPDATED',
            changedById: currentUser.id,
            metadata: { changes: Object.keys(updateData) },
        });

        return NextResponse.json(updatedUser);
    } catch (error) {
        console.error('Error updating user:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// DELETE /api/users/[id] - Delete a user (Admin only)
export async function DELETE(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params;
        const currentUser = await getCurrentUser();

        if (!currentUser || !isAdmin({ user: currentUser } as any)) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // Prevent self-deletion
        if (currentUser.id === id) {
            return NextResponse.json(
                { error: 'Cannot delete your own account' },
                { status: 400 }
            );
        }

        const user = await prisma.user.findUnique({ where: { id } });
        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        await prisma.user.delete({ where: { id } });

        await createAuditLog({
            entityType: 'USER',
            entityId: id,
            action: 'DELETED',
            changedById: currentUser.id,
            metadata: { email: user.email },
        });

        return NextResponse.json({ message: 'User deleted successfully' });
    } catch (error) {
        console.error('Error deleting user:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
