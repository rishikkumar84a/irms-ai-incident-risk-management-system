import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { isAdmin, isManager } from '@/lib/permissions';

// GET /api/dashboard/overview - Get dashboard metrics
export async function GET() {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Build department filter for managers
        const departmentFilter = isAdmin({ user } as any)
            ? {}
            : isManager({ user } as any)
                ? { departmentId: user.departmentId || undefined }
                : {
                    OR: [
                        { reportedById: user.id },
                        { assignedToId: user.id },
                    ]
                };

        const riskDepartmentFilter = isAdmin({ user } as any)
            ? {}
            : isManager({ user } as any)
                ? { departmentId: user.departmentId || undefined }
                : { ownerId: user.id };

        const taskFilter = isAdmin({ user } as any) || isManager({ user } as any)
            ? {}
            : { assignedToId: user.id };

        // Fetch all metrics in parallel
        const [
            totalIncidents,
            incidentsByStatus,
            incidentsBySeverity,
            incidentsByDepartment,
            totalRisks,
            risksByStatus,
            riskHeatmap,
            totalTasks,
            tasksByStatus,
            recentIncidents,
            upcomingTasks,
        ] = await Promise.all([
            // Total incidents
            prisma.incident.count({ where: departmentFilter }),

            // Incidents by status
            prisma.incident.groupBy({
                by: ['status'],
                where: departmentFilter,
                _count: true,
            }),

            // Incidents by severity
            prisma.incident.groupBy({
                by: ['severity'],
                where: departmentFilter,
                _count: true,
            }),

            // Incidents by department (admin only)
            isAdmin({ user } as any)
                ? prisma.incident.groupBy({
                    by: ['departmentId'],
                    _count: true,
                })
                : Promise.resolve([]),

            // Total risks
            prisma.risk.count({ where: riskDepartmentFilter }),

            // Risks by status
            prisma.risk.groupBy({
                by: ['status'],
                where: riskDepartmentFilter,
                _count: true,
            }),

            // Risk heatmap data (likelihood x impact)
            prisma.risk.groupBy({
                by: ['likelihood', 'impact'],
                where: riskDepartmentFilter,
                _count: true,
            }),

            // Total tasks
            prisma.task.count({ where: taskFilter }),

            // Tasks by status
            prisma.task.groupBy({
                by: ['status'],
                where: taskFilter,
                _count: true,
            }),

            // Recent incidents
            prisma.incident.findMany({
                where: departmentFilter,
                select: {
                    id: true,
                    title: true,
                    status: true,
                    severity: true,
                    createdAt: true,
                    department: { select: { name: true } },
                },
                orderBy: { createdAt: 'desc' },
                take: 5,
            }),

            // Upcoming tasks
            prisma.task.findMany({
                where: {
                    ...taskFilter,
                    status: { not: 'DONE' },
                    dueDate: { not: null },
                },
                select: {
                    id: true,
                    title: true,
                    status: true,
                    dueDate: true,
                    assignedTo: { select: { name: true } },
                },
                orderBy: { dueDate: 'asc' },
                take: 5,
            }),
        ]);

        // Get department names for chart
        let departmentData: { departmentId: string; name: string; count: number }[] = [];
        if (isAdmin({ user } as any) && incidentsByDepartment.length > 0) {
            const departments = await prisma.department.findMany({
                where: { id: { in: incidentsByDepartment.map(d => d.departmentId) } },
                select: { id: true, name: true },
            });
            const deptMap = new Map(departments.map(d => [d.id, d.name]));
            departmentData = incidentsByDepartment.map(d => ({
                departmentId: d.departmentId,
                name: deptMap.get(d.departmentId) || 'Unknown',
                count: d._count,
            }));
        }

        // Calculate summary stats
        const openIncidents = incidentsByStatus
            .filter(s => !['RESOLVED', 'CLOSED'].includes(s.status))
            .reduce((acc, s) => acc + s._count, 0);

        const criticalIncidents = incidentsBySeverity
            .find(s => s.severity === 'CRITICAL')?._count || 0;

        const openRisks = risksByStatus
            .filter(s => !['MITIGATED', 'CLOSED'].includes(s.status))
            .reduce((acc, s) => acc + s._count, 0);

        const pendingTasks = tasksByStatus
            .filter(s => s.status !== 'DONE')
            .reduce((acc, s) => acc + s._count, 0);

        return NextResponse.json({
            summary: {
                totalIncidents,
                openIncidents,
                criticalIncidents,
                totalRisks,
                openRisks,
                totalTasks,
                pendingTasks,
            },
            charts: {
                incidentsByStatus: incidentsByStatus.map(s => ({
                    status: s.status,
                    count: s._count,
                })),
                incidentsBySeverity: incidentsBySeverity.map(s => ({
                    severity: s.severity,
                    count: s._count,
                })),
                incidentsByDepartment: departmentData,
                risksByStatus: risksByStatus.map(s => ({
                    status: s.status,
                    count: s._count,
                })),
                riskHeatmap: riskHeatmap.map(r => ({
                    likelihood: r.likelihood,
                    impact: r.impact,
                    count: r._count,
                })),
                tasksByStatus: tasksByStatus.map(s => ({
                    status: s.status,
                    count: s._count,
                })),
            },
            recentActivity: {
                recentIncidents,
                upcomingTasks,
            },
        });
    } catch (error) {
        console.error('Error fetching dashboard data:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
