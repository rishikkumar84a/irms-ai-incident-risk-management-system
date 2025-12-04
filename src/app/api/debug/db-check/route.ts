
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        console.log('Debug: Attempting DB connection...');

        // Try to count users
        const userCount = await prisma.user.count();
        console.log('Debug: User count:', userCount);

        // Try to find the specific user
        const alice = await prisma.user.findUnique({
            where: { email: 'alice@irms.com' }
        });
        console.log('Debug: Alice found:', !!alice);

        if (alice) {
            console.log('Debug: Alice password hash length:', alice.passwordHash.length);
        }

        return NextResponse.json({
            status: 'ok',
            message: 'Database connection successful',
            userCount,
            aliceFound: !!alice,
            aliceEmail: alice?.email,
            envDatabaseUrlConfigured: !!process.env.DATABASE_URL
        });
    } catch (error: any) {
        console.error('Debug: DB Connection failed:', error);
        return NextResponse.json({
            status: 'error',
            message: 'Database connection failed',
            error: error.message,
            stack: error.stack
        }, { status: 500 });
    }
}
