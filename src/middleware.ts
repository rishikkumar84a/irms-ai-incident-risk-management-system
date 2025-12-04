import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
    function middleware(req) {
        const token = req.nextauth.token;
        const { pathname } = req.nextUrl;

        // Admin-only routes
        const adminRoutes = ['/admin'];
        const isAdminRoute = adminRoutes.some(route => pathname.startsWith(route));

        if (isAdminRoute && token?.role !== 'ADMIN') {
            return NextResponse.redirect(new URL('/dashboard', req.url));
        }

        return NextResponse.next();
    },
    {
        callbacks: {
            authorized: ({ token, req }) => {
                const { pathname } = req.nextUrl;

                // Public routes
                if (pathname.startsWith('/login') || pathname === '/') {
                    return true;
                }

                // All other routes require authentication
                return !!token;
            },
        },
    }
);

export const config = {
    matcher: [
        '/dashboard/:path*',
        '/incidents/:path*',
        '/risks/:path*',
        '/tasks/:path*',
        '/admin/:path*',
    ],
};
