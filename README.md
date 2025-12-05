# AI-Powered Incident & Risk Management System (IRMS)

A full-stack, production-grade platform for reporting, tracking, and analyzing organizational incidents and risks.  
Built with Next.js 16, TypeScript, PostgreSQL, Prisma, NextAuth, Tailwind, Shadcn UI, and OpenAI.

This project is designed to meet the requirements of a real-world enterprise SaaS application and fully satisfies the specifications of the Fullstack Developer Assignment.

------------------------------------------------------------
LIVE DEMO
------------------------------------------------------------

Live URL: https://irms-ai-incident-risk-management.netlify.app/

Demo Credentials:

Admin
Email: admin@example.com
Password: admin123

Manager
Email: manager@example.com
Password: manager123

Employee
Email: employee@example.com
Password: employee123

------------------------------------------------------------
KEY FEATURES
------------------------------------------------------------

1. Incident Management  
2. Risk Register  
3. Task Management  
4. AI-powered analysis for incidents and risks  
5. Role-Based Access Control (Admin, Manager, Employee)  
6. Secure authentication (NextAuth.js)  
7. Audit logging for critical actions  
8. Modern responsive UI using Tailwind + Shadcn  
9. Dashboard with analytics  
10. Validation using Zod

------------------------------------------------------------
ASSIGNMENT ALIGNMENT
------------------------------------------------------------

This project fulfills all requirements from the assignment:

TECH STACK REQUIREMENTS
- Next.js 16 (App Router)
- TypeScript
- PostgreSQL + Prisma
- Tailwind CSS + Shadcn UI
- Secure backend with REST APIs
- Full CRUD operations on multiple entities

FUNCTIONALITY REQUIREMENTS
- CRUD for Incidents, Risks, Tasks, Users, Departments, Categories
- Strong validation (Zod)
- Form handling with proper error messaging
- Protected API routes and UI
- Server-side rendering and server components where applicable

"GOOD TO HAVE" REQUIREMENTS
- Authentication with NextAuth
- Authorization with RBAC
- Unit tests (Jest)
- End-to-end tests (Playwright)
- CI/CD setup (GitHub Actions)
- Deployment on Netlify
- AI-powered features using OpenAI

UI/UX REQUIREMENTS
- Responsive dashboard layout
- Clean table and form components
- Filtering, pagination, and search capability
- Accessible and professional UI using Shadcn

REAL-WORLD CONSIDERATIONS
- Audit logging
- Department-based scoping for managers
- Secure data handling
- Production-ready project architecture

SUBMISSION REQUIREMENT
- Footer includes Name, GitHub Profile, LinkedIn Profile

------------------------------------------------------------
ARCHITECTURE OVERVIEW
------------------------------------------------------------

Frontend & Backend: Next.js 16 (App Router)  
Database: PostgreSQL (Neon)  
ORM: Prisma  
Auth: NextAuth.js  
AI: OpenAI API  
Testing: Jest + Playwright  
Deployment: Netlify  
CI/CD: GitHub Actions  

High-level architecture:
- Frontend: Server components + Client components
- Backend: API Route Handlers under /app/api/*
- Database access: Prisma client with relational schema
- Auth: Credential provider with RBAC
- AI: Server-side analysis handlers
- Testing: Unit, integration, and E2E flows

------------------------------------------------------------
PROJECT STRUCTURE
------------------------------------------------------------

src/
  app/
    api/
      incidents/
      risks/
      tasks/
      ai/
      auth/
    dashboard/
    incidents/
    risks/
    tasks/
    admin/
  components/
    ui/
    forms/
    tables/
    charts/
  lib/
    prisma.ts
    auth.ts
    ai.ts
    validations.ts
    permissions.ts
prisma/
  schema.prisma
tests/
  unit/
  e2e/

------------------------------------------------------------
DATA MODELS (PRISMA)
------------------------------------------------------------

Models include:

- User (Admin, Manager, Employee roles)
- Department
- Incident
- IncidentCategory
- Risk
- Task
- Comment
- AuditLog

Each model supports CRUD operations, validation, and role-based access where required.

------------------------------------------------------------
AI INTEGRATION
------------------------------------------------------------

OpenAI is used to improve incident and risk analysis.

AI features:
- Severity prediction
- Executive summary generation
- Suggested mitigation actions
- Root cause hints

AI calls are handled through server-side route handlers and integrated into incident workflows.

------------------------------------------------------------
AUTHENTICATION & AUTHORIZATION
------------------------------------------------------------

Authentication:
- NextAuth.js Credential Provider
- Secure password hashing (bcrypt)

Authorization:
- Admin: full system access
- Manager: department-level access
- Employee: limited access to assigned/reported items

Both backend and frontend enforce RBAC rules.

------------------------------------------------------------
REAL-WORLD CONSIDERATIONS
------------------------------------------------------------

Security:
- Role-based access control
- Zod validation
- Sanitized API handlers
- Audit logs for accountability
- Secure hashed passwords

Scalability:
- Relational DB with indexing capability
- Paginated lists for large datasets
- Server Components for reduced bundle size

Error Handling:
- Centralized server error responses
- Form-level validation and feedback
- UI fallback states

Maintainability:
- Modular folder structure
- Reusable components
- Consistent TypeScript types

------------------------------------------------------------
TESTING
------------------------------------------------------------

Unit testing (Jest):
- Validation logic
- Helpers and utilities
- Permission checks

Integration testing:
- Auth flow
- CRUD operations

End-to-end testing (Playwright):
- Login
- Incident creation
- RBAC behavior
- Dashboard access

------------------------------------------------------------
DEPLOYMENT
------------------------------------------------------------

Host: Netlify  
DB: Neon PostgreSQL  

Environment variables:
- DATABASE_URL
- NEXTAUTH_SECRET
- OPENAI_API_KEY

CI/CD:
- GitHub Actions workflow for linting, testing, and building

------------------------------------------------------------
GETTING STARTED
------------------------------------------------------------

1. Clone repository:
   git clone https://github.com/rishikkumar84a/irms-ai-incident-risk-management-system

2. Install dependencies:
   npm install

3. Configure environment:
   Create .env with:
   DATABASE_URL=
   NEXTAUTH_SECRET=
   OPENAI_API_KEY=

4. Run migrations:
   npx prisma migrate dev

5. Start development server:
   npm run dev

------------------------------------------------------------
AUTHOR
------------------------------------------------------------

Rishik Kumar Chaurasiya  
GitHub: https://github.com/rishikkumar84a  
LinkedIn: https://www.linkedin.com/in/rishikkumar84ya  
