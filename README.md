# Dodo CRM — Product Demo Lead Tracker

A production-ready web CRM for tracking Dodo Payments product demo leads. Built with an Airtable-like UX featuring grouped/kanban views, a detail drawer with editable fields, an append-only notes timeline, and an analytics dashboard.

## Tech Stack

- **Framework:** Next.js 14 (App Router) + TypeScript
- **Styling:** TailwindCSS
- **Database:** PostgreSQL + Prisma ORM
- **Auth:** NextAuth.js (credentials + optional Google OAuth)
- **Charts:** Recharts

## Features

- **Leads Board** — grouped by stage (kanban-style) with card view
- **Table View** — sortable columns with Stage, Business Name, Tier, Owner, etc.
- **Filters** — by stage, tier, owner, date range, and full-text search
- **Lead Detail Drawer** — editable fields, stage pipeline selector, notes, history
- **Append-only Notes** — timeline with author and timestamps
- **Stage History** — automatic tracking of every stage change in a transaction
- **Analytics Dashboard** — KPIs, stage distribution, conversion funnel, avg time-in-stage, leads/week trend, at-risk leads
- **Auth** — credential-based login with role-based access (ADMIN / MEMBER)

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database
- npm or yarn

### 1. Clone & Install

```bash
git clone <repo-url>
cd dodo-crm
npm install
```

### 2. Environment Variables

Copy the example env file and fill in your values:

```bash
cp .env.example .env
```

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | Yes |
| `NEXTAUTH_URL` | App URL (e.g. `http://localhost:3000`) | Yes |
| `NEXTAUTH_SECRET` | Random secret for JWT signing | Yes |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID | No |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret | No |

Generate a secret:
```bash
openssl rand -base64 32
```

### 3. Database Setup

```bash
# Generate Prisma client + push schema + seed data
npm run setup
```

Or step by step:
```bash
npx prisma generate        # Generate Prisma client
npx prisma db push          # Push schema to database
npm run db:seed             # Seed sample data
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@dodopayments.com` | `admin123` |
| Member | `priya@dodopayments.com` | `member123` |
| Member | `alex@dodopayments.com` | `member123` |

## Lead Pipeline Stages

1. **Meeting Scheduled** — Initial meeting booked
2. **Meeting Done** — Meeting completed, evaluating fit
3. **Product Verification** — Business testing the product integration
4. **Payout Verification** — Verifying payout flows and settlement
5. **Transacting Business** — Live and processing transactions

## Data Model

```
User (id, name, email, role)
  └─ owns → Lead[]
  └─ authors → LeadNote[]
  └─ changes → LeadStageHistory[]

Lead (id, businessId, businessName, email, category, tier, stage, ...)
  └─ has → LeadNote[]
  └─ has → LeadStageHistory[]

LeadNote (id, leadId, content, createdBy, createdAt)  -- append-only

LeadStageHistory (id, leadId, fromStage, toStage, changedBy, changedAt)
```

Every stage change creates a `LeadStageHistory` row inside a database transaction.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run setup` | Generate + push + seed (one-shot) |
| `npm run db:generate` | Generate Prisma client |
| `npm run db:push` | Push schema to DB |
| `npm run db:seed` | Seed sample data |
| `npm run db:studio` | Open Prisma Studio |
| `npm run db:migrate` | Run Prisma migrations |

## Deployment (Vercel)

1. Push to GitHub
2. Import in Vercel
3. Set environment variables in Vercel dashboard
4. Vercel auto-detects Next.js and builds
5. Run `npx prisma db push` and seed against your production database

Ensure your PostgreSQL database is accessible from Vercel (e.g., Supabase, Neon, Railway).

## Project Structure

```
dodo-crm/
├── prisma/
│   ├── schema.prisma         # Database schema
│   └── seed.ts               # Seed script
├── src/
│   ├── app/
│   │   ├── (auth)/login/     # Login page
│   │   ├── (dashboard)/
│   │   │   ├── leads/        # Leads page
│   │   │   ├── analytics/    # Analytics page
│   │   │   └── layout.tsx    # Dashboard layout with sidebar
│   │   ├── api/auth/         # NextAuth API route
│   │   ├── layout.tsx        # Root layout
│   │   └── providers.tsx     # Session provider
│   ├── actions/
│   │   ├── leads.ts          # Lead CRUD + notes server actions
│   │   └── analytics.ts      # Analytics queries
│   ├── components/
│   │   ├── leads/
│   │   │   ├── leads-view.tsx      # Main leads container
│   │   │   ├── grouped-view.tsx    # Kanban/grouped view
│   │   │   ├── table-view.tsx      # Table view
│   │   │   ├── lead-drawer.tsx     # Detail panel
│   │   │   └── create-lead-modal.tsx
│   │   ├── analytics/
│   │   │   └── dashboard.tsx       # Charts + KPIs
│   │   └── ui/
│   │       └── sidebar.tsx         # Navigation sidebar
│   ├── lib/
│   │   ├── auth.ts           # NextAuth config
│   │   ├── prisma.ts         # Prisma client singleton
│   │   ├── utils.ts          # Helpers, constants
│   │   └── validations.ts    # Zod schemas
│   └── types/
│       └── next-auth.d.ts    # Type augmentations
├── .env.example
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```
