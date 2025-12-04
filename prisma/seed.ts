import { PrismaClient, Role, IncidentStatus, Severity, Likelihood, Impact, RiskStatus, TaskStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting database seed...');

    // Clear existing data
    await prisma.auditLog.deleteMany();
    await prisma.comment.deleteMany();
    await prisma.task.deleteMany();
    await prisma.incident.deleteMany();
    await prisma.risk.deleteMany();
    await prisma.incidentCategory.deleteMany();
    await prisma.user.deleteMany();
    await prisma.department.deleteMany();

    console.log('📦 Creating departments...');
    const departments = await Promise.all([
        prisma.department.create({
            data: { name: 'Engineering', description: 'Software development and IT operations' },
        }),
        prisma.department.create({
            data: { name: 'Operations', description: 'Day-to-day business operations' },
        }),
        prisma.department.create({
            data: { name: 'Human Resources', description: 'Employee management and workplace safety' },
        }),
        prisma.department.create({
            data: { name: 'Finance', description: 'Financial operations and reporting' },
        }),
        prisma.department.create({
            data: { name: 'Sales', description: 'Sales and customer relations' },
        }),
    ]);

    const [engineering, operations, hr, finance, sales] = departments;
    console.log(`✅ Created ${departments.length} departments`);

    console.log('📦 Creating incident categories...');
    const categories = await Promise.all([
        prisma.incidentCategory.create({
            data: { name: 'Security', description: 'Security-related incidents including breaches and vulnerabilities' },
        }),
        prisma.incidentCategory.create({
            data: { name: 'Safety', description: 'Workplace safety incidents and hazards' },
        }),
        prisma.incidentCategory.create({
            data: { name: 'IT Infrastructure', description: 'System outages, hardware failures, network issues' },
        }),
        prisma.incidentCategory.create({
            data: { name: 'Compliance', description: 'Regulatory and policy compliance issues' },
        }),
        prisma.incidentCategory.create({
            data: { name: 'Customer Impact', description: 'Incidents affecting customer service or satisfaction' },
        }),
        prisma.incidentCategory.create({
            data: { name: 'Data', description: 'Data loss, corruption, or privacy incidents' },
        }),
    ]);

    const [security, safety, itInfra, compliance, customerImpact, dataCategory] = categories;
    console.log(`✅ Created ${categories.length} incident categories`);

    console.log('👤 Creating users...');
    const passwordHash = await bcrypt.hash('password123', 12);

    const users = await Promise.all([
        // Admins
        prisma.user.create({
            data: {
                name: 'John Admin',
                email: 'admin@irms.com',
                passwordHash,
                role: Role.ADMIN,
                departmentId: engineering.id,
            },
        }),
        // Managers
        prisma.user.create({
            data: {
                name: 'Sarah Manager',
                email: 'manager.engineering@irms.com',
                passwordHash,
                role: Role.MANAGER,
                departmentId: engineering.id,
            },
        }),
        prisma.user.create({
            data: {
                name: 'Mike Operations Lead',
                email: 'manager.operations@irms.com',
                passwordHash,
                role: Role.MANAGER,
                departmentId: operations.id,
            },
        }),
        prisma.user.create({
            data: {
                name: 'Emily HR Manager',
                email: 'manager.hr@irms.com',
                passwordHash,
                role: Role.MANAGER,
                departmentId: hr.id,
            },
        }),
        // Employees
        prisma.user.create({
            data: {
                name: 'Alice Developer',
                email: 'alice@irms.com',
                passwordHash,
                role: Role.EMPLOYEE,
                departmentId: engineering.id,
            },
        }),
        prisma.user.create({
            data: {
                name: 'Bob Technician',
                email: 'bob@irms.com',
                passwordHash,
                role: Role.EMPLOYEE,
                departmentId: operations.id,
            },
        }),
        prisma.user.create({
            data: {
                name: 'Carol Analyst',
                email: 'carol@irms.com',
                passwordHash,
                role: Role.EMPLOYEE,
                departmentId: finance.id,
            },
        }),
        prisma.user.create({
            data: {
                name: 'Dave Sales Rep',
                email: 'dave@irms.com',
                passwordHash,
                role: Role.EMPLOYEE,
                departmentId: sales.id,
            },
        }),
    ]);

    const [admin, engManager, opsManager, hrManager, alice, bob, carol, dave] = users;
    console.log(`✅ Created ${users.length} users`);

    console.log('🚨 Creating incidents...');
    const incidents = await Promise.all([
        prisma.incident.create({
            data: {
                title: 'Production Database Outage',
                description: 'The main production database experienced an unexpected outage affecting all customer-facing applications. Preliminary investigation suggests a disk failure on the primary node.',
                status: IncidentStatus.IN_PROGRESS,
                severity: Severity.CRITICAL,
                categoryId: itInfra.id,
                reportedById: alice.id,
                assignedToId: engManager.id,
                departmentId: engineering.id,
                occurredAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
                aiSummary: 'Critical production database outage caused by disk failure affecting all customer applications. Requires immediate attention.',
                aiSeveritySuggestion: Severity.CRITICAL,
                aiRecommendedActions: '1. Initiate failover to secondary database node\n2. Notify affected customers about service disruption\n3. Engage database vendor support\n4. Prepare post-incident review documentation\n5. Consider implementing automated health monitoring',
            },
        }),
        prisma.incident.create({
            data: {
                title: 'Unauthorized Access Attempt Detected',
                description: 'Security monitoring detected multiple failed login attempts from suspicious IP addresses targeting the admin portal. No successful breach confirmed yet.',
                status: IncidentStatus.IN_REVIEW,
                severity: Severity.HIGH,
                categoryId: security.id,
                reportedById: engManager.id,
                assignedToId: admin.id,
                departmentId: engineering.id,
                occurredAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
            },
        }),
        prisma.incident.create({
            data: {
                title: 'Slip and Fall in Warehouse',
                description: 'An employee slipped on a wet floor in warehouse section B. Minor injury reported. First aid was administered on site.',
                status: IncidentStatus.RESOLVED,
                severity: Severity.MEDIUM,
                categoryId: safety.id,
                reportedById: bob.id,
                assignedToId: hrManager.id,
                departmentId: operations.id,
                occurredAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 1 week ago
                resolvedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
            },
        }),
        prisma.incident.create({
            data: {
                title: 'Customer Data Export Delay',
                description: 'Monthly customer data exports are running significantly slower than usual, causing delays in reporting to enterprise clients.',
                status: IncidentStatus.NEW,
                severity: Severity.LOW,
                categoryId: customerImpact.id,
                reportedById: carol.id,
                departmentId: finance.id,
                occurredAt: new Date(),
            },
        }),
        prisma.incident.create({
            data: {
                title: 'GDPR Compliance Gap Identified',
                description: 'Internal audit revealed that certain customer data retention practices may not be fully compliant with GDPR requirements.',
                status: IncidentStatus.IN_PROGRESS,
                severity: Severity.HIGH,
                categoryId: compliance.id,
                reportedById: carol.id,
                assignedToId: admin.id,
                departmentId: finance.id,
                occurredAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
            },
        }),
    ]);
    console.log(`✅ Created ${incidents.length} incidents`);

    console.log('⚠️ Creating risks...');
    const risks = await Promise.all([
        prisma.risk.create({
            data: {
                title: 'Single Point of Failure in Payment Processing',
                description: 'Current payment processing relies on a single third-party provider without backup. Provider outage would halt all transactions.',
                category: 'Operational',
                likelihood: Likelihood.MEDIUM,
                impact: Impact.HIGH,
                status: RiskStatus.MONITORING,
                ownerId: engManager.id,
                departmentId: engineering.id,
                mitigationPlan: 'Evaluate and integrate secondary payment provider. Target completion: Q2',
                aiMitigationSuggestions: '1. Implement payment provider failover mechanism\n2. Negotiate SLA with backup provider\n3. Create automated switching logic\n4. Test failover procedures monthly',
            },
        }),
        prisma.risk.create({
            data: {
                title: 'Key Personnel Dependency - Lead Architect',
                description: 'Critical system knowledge is concentrated in a single lead architect. Departure would significantly impact development velocity.',
                category: 'Human Resources',
                likelihood: Likelihood.LOW,
                impact: Impact.HIGH,
                status: RiskStatus.OPEN,
                ownerId: hrManager.id,
                departmentId: hr.id,
                mitigationPlan: 'Implement knowledge transfer sessions and comprehensive documentation program.',
            },
        }),
        prisma.risk.create({
            data: {
                title: 'Outdated Security Certificates',
                description: 'Several SSL certificates are approaching expiration. Failure to renew could cause service interruptions and security warnings.',
                category: 'Security',
                likelihood: Likelihood.HIGH,
                impact: Impact.MEDIUM,
                status: RiskStatus.MITIGATED,
                ownerId: admin.id,
                departmentId: engineering.id,
                mitigationPlan: 'Implemented automated certificate renewal with 60-day advance notifications.',
            },
        }),
        prisma.risk.create({
            data: {
                title: 'Data Center Geographic Concentration',
                description: 'All primary systems are hosted in a single geographic region, creating vulnerability to regional disasters.',
                category: 'Disaster Recovery',
                likelihood: Likelihood.LOW,
                impact: Impact.HIGH,
                status: RiskStatus.MONITORING,
                ownerId: opsManager.id,
                departmentId: operations.id,
                mitigationPlan: 'Multi-region deployment planned for next fiscal year.',
            },
        }),
    ]);
    console.log(`✅ Created ${risks.length} risks`);

    console.log('📋 Creating tasks...');
    const tasks = await Promise.all([
        prisma.task.create({
            data: {
                title: 'Implement database failover',
                description: 'Configure and test automatic failover to secondary database node',
                relatedIncidentId: incidents[0].id,
                assignedToId: alice.id,
                status: TaskStatus.IN_PROGRESS,
                dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
            },
        }),
        prisma.task.create({
            data: {
                title: 'Block suspicious IP ranges',
                description: 'Update firewall rules to block identified suspicious IP ranges',
                relatedIncidentId: incidents[1].id,
                assignedToId: engManager.id,
                status: TaskStatus.TODO,
                dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days
            },
        }),
        prisma.task.create({
            data: {
                title: 'Install wet floor warning signs',
                description: 'Place permanent warning signs in warehouse section B',
                relatedIncidentId: incidents[2].id,
                assignedToId: bob.id,
                status: TaskStatus.DONE,
                dueDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
            },
        }),
        prisma.task.create({
            data: {
                title: 'Evaluate backup payment providers',
                description: 'Research and create comparison report for alternative payment processors',
                relatedRiskId: risks[0].id,
                assignedToId: carol.id,
                status: TaskStatus.IN_PROGRESS,
                dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 2 weeks
            },
        }),
        prisma.task.create({
            data: {
                title: 'Schedule knowledge transfer sessions',
                description: 'Organize weekly knowledge sharing sessions with lead architect',
                relatedRiskId: risks[1].id,
                assignedToId: hrManager.id,
                status: TaskStatus.TODO,
                dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week
            },
        }),
    ]);
    console.log(`✅ Created ${tasks.length} tasks`);

    console.log('💬 Creating comments...');
    const comments = await Promise.all([
        prisma.comment.create({
            data: {
                body: 'Initial investigation complete. Confirmed disk failure on primary node. Failover initiated.',
                authorId: alice.id,
                incidentId: incidents[0].id,
            },
        }),
        prisma.comment.create({
            data: {
                body: 'Database is back online. Monitoring for any residual issues.',
                authorId: engManager.id,
                incidentId: incidents[0].id,
            },
        }),
        prisma.comment.create({
            data: {
                body: 'IP analysis complete. Attacks originated from known botnet infrastructure.',
                authorId: admin.id,
                incidentId: incidents[1].id,
            },
        }),
        prisma.comment.create({
            data: {
                body: 'First consideration: Stripe as backup provider. Investigating API compatibility.',
                authorId: carol.id,
                riskId: risks[0].id,
            },
        }),
    ]);
    console.log(`✅ Created ${comments.length} comments`);

    console.log('📝 Creating audit logs...');
    await prisma.auditLog.create({
        data: {
            entityType: 'INCIDENT',
            entityId: incidents[0].id,
            action: 'STATUS_CHANGED',
            changedById: engManager.id,
            metadata: { from: 'NEW', to: 'IN_PROGRESS' },
        },
    });
    console.log('✅ Created sample audit logs');

    console.log('\n🎉 Database seeding completed successfully!');
    console.log('\n📋 Test Accounts:');
    console.log('  Admin:    admin@irms.com / password123');
    console.log('  Manager:  manager.engineering@irms.com / password123');
    console.log('  Employee: alice@irms.com / password123');
}

main()
    .catch((e) => {
        console.error('❌ Error seeding database:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
