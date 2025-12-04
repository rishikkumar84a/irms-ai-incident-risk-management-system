# AI-Powered Incident & Risk Management System (IRMS)

A modern, full-stack application for managing organizational incidents, risks, and tasks, enhanced with AI capabilities for analysis and mitigation suggestions.

![Dashboard Preview](public/window.svg)

## 🚀 Features

-   **Incident Management**: Report, track, and manage workplace incidents with detailed workflows.
-   **Risk Register**: Identify, assess, and mitigate organizational risks.
-   **Task Management**: Assign and track tasks related to incident resolution and risk mitigation.
-   **AI-Powered Analysis**: Leverage OpenAI to analyze incidents and suggest mitigation strategies automatically.
-   **Role-Based Access Control (RBAC)**: Secure access for Admins, Managers, and Employees.
-   **Interactive Dashboard**: Real-time analytics and visualizations of key metrics.
-   **Audit Logging**: Comprehensive tracking of all critical system actions.
-   **Responsive Design**: Built with a mobile-first approach using Tailwind CSS and Shadcn UI.

## 🛠️ Tech Stack

-   **Framework**: [Next.js 16](https://nextjs.org/) (App Router)
-   **Language**: [TypeScript](https://www.typescriptlang.org/)
-   **Styling**: [Tailwind CSS](https://tailwindcss.com/) & [Shadcn UI](https://ui.shadcn.com/)
-   **Database**: [PostgreSQL](https://www.postgresql.org/) (via [Neon](https://neon.tech/))
-   **ORM**: [Prisma](https://www.prisma.io/)
-   **Authentication**: [NextAuth.js](https://next-auth.js.org/)
-   **AI Integration**: [OpenAI API](https://openai.com/)
-   **Validation**: [Zod](https://zod.dev/) & [React Hook Form](https://react-hook-form.com/)
-   **Testing**: Jest & Playwright

## 🏁 Getting Started

### Prerequisites

-   Node.js 18+ installed
-   PostgreSQL database (local or cloud)
-   OpenAI API Key

### Installation

1.  **Clone the repository**
    ```bash
    git clone https://github.com/rishikkumar84a/irms-ai-incident-risk-management-system.git
    cd irms-ai-incident-risk-management-system
    ```

2.  **Install dependencies**
    ```bash
    npm install
    ```

3.  **Set up Environment Variables**
    Copy `.env.example` to `.env` and fill in your credentials:
    ```bash
    cp .env.example .env
    ```

4.  **Database Setup**
    Push the Prisma schema to your database and seed initial data:
    ```bash
    npx prisma db push
    npx prisma db seed
    ```

5.  **Run the Development Server**
    ```bash
    npm run dev
    ```
    Open [http://localhost:3000](http://localhost:3000) to view the app.

## 🔑 Environment Variables

| Variable | Description |
| --- | --- |
| `DATABASE_URL` | PostgreSQL connection string |
| `NEXTAUTH_URL` | URL of your application (e.g., http://localhost:3000) |
| `NEXTAUTH_SECRET` | Random string for session encryption |
| `OPENAI_API_KEY` | API Key from OpenAI platform |

## 🧪 Running Tests

-   **Unit Tests**: `npm run test`
-   **E2E Tests**: `npx playwright test`

## 📂 Project Structure

```
src/
├── app/                # Next.js App Router pages and API routes
├── components/         # Reusable UI components
│   ├── layout/         # Sidebar, Header, Footer
│   └── ui/             # Shadcn UI primitives
├── lib/                # Utility functions, configs, and shared logic
│   ├── ai.ts           # OpenAI integration
│   ├── auth.ts         # NextAuth configuration
│   ├── prisma.ts       # Database client
│   └── utils.ts        # Helper functions
└── middleware.ts       # Route protection middleware
```

## 👥 Authors

-   **Rishi Kumar** - [GitHub](https://github.com/rishikkumar84a)

## 📄 License

This project is licensed under the MIT License.
