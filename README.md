# CRM AI Loyalty System

A full-stack **CRM + Loyalty Management** platform with AI-powered customer insights. Built as a portfolio project demonstrating Full-Stack Development, REST API Design, Database Design, and AI Integration.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16, TypeScript, Tailwind CSS 4, Shadcn UI |
| Backend | NestJS 11, TypeScript, Zod |
| Database | PostgreSQL, Prisma ORM |
| AI | Mock Mode (default) · Groq (free) · OpenAI |

## Features

- **Authentication** — JWT login, role-based access (Admin / Staff / Marketing)
- **Customer Management** — CRUD, profile, activity timeline
- **Loyalty System** — Earn & redeem points, transaction history
- **Rewards Management** — Catalog, stock, redemptions
- **Promotions** — Campaign CRUD, 4 types, active/inactive toggle
- **Analytics Dashboard** — Stats, charts, tier distribution, top customers
- **AI Insights** — Customer behavior summary, churn risk, promo recommendations
- **Dark Mode** — System preference + manual toggle with persistence

---

## Prerequisites

- Node.js 20+
- PostgreSQL 15+
- npm

---

## Getting Started

### 1. Clone the repository

```bash
git clone <repo-url>
cd crm-ai-loyalty
```

### 2. Setup Backend

```bash
cd backend
npm install
```

Copy environment file and fill in your values:

```bash
cp .env.example .env
```

Edit `.env`:

```env
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/crm_ai_db"
PORT=4000
JWT_SECRET="any-random-secret-string"
JWT_EXPIRES_IN="7d"
FRONTEND_URL="http://localhost:3000"

# AI Provider: mock (no key needed) | groq | openai
AI_PROVIDER=mock
AI_API_KEY=
AI_MODEL=
```

Run database migration:

```bash
npx prisma migrate deploy
```

Seed demo data:

```bash
npm run seed
```

Start backend:

```bash
npm run start:dev
```

Backend runs at `http://localhost:4000`

---

### 3. Setup Frontend

```bash
cd ../frontend
npm install
```

Copy environment file:

```bash
cp .env.example .env.local
```

`.env.local` should contain:

```env
NEXT_PUBLIC_API_URL=http://localhost:4000/api
```

Start frontend:

```bash
npm run dev
```

Frontend runs at `http://localhost:3000`

---

## Demo Accounts

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@crm.com | password123 |
| Staff | staff@crm.com | password123 |
| Marketing | marketing@crm.com | password123 |

---

## AI Insights Setup

By default the app runs in **Mock Mode** — no API key required. AI responses are pre-written samples.

To use real AI, update `AI_PROVIDER` in `backend/.env`:

**Groq (Free)**
```env
AI_PROVIDER=groq
AI_API_KEY=your-groq-api-key
AI_MODEL=llama-3.1-8b-instant
```
Get a free key at [console.groq.com](https://console.groq.com)

**OpenAI**
```env
AI_PROVIDER=openai
AI_API_KEY=sk-...
AI_MODEL=gpt-4o-mini
```

---

## Project Structure

```
crm-ai-loyalty/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma
│   │   ├── seed.ts
│   │   └── migrations/
│   └── src/
│       ├── api/
│       │   ├── ai/
│       │   ├── analytics/
│       │   ├── auth/
│       │   ├── customers/
│       │   ├── loyalty/
│       │   ├── promotions/
│       │   └── rewards/
│       └── main.ts
└── frontend/
    └── src/
        ├── app/(dashboard)/
        │   ├── ai-insights/
        │   ├── customers/
        │   ├── dashboard/
        │   ├── loyalty/
        │   ├── promotions/
        │   └── rewards/
        ├── components/
        └── services/
```

## API Endpoints

| Module | Endpoints |
|--------|-----------|
| Auth | `POST /api/auth/login` |
| Customers | `GET/POST /api/customers` · `GET/PATCH/DELETE /api/customers/:id` |
| Loyalty | `GET /api/loyalty/:customerId` · `POST /api/loyalty/adjust` |
| Rewards | `GET/POST /api/rewards` · `GET/PATCH/DELETE /api/rewards/:id` |
| Promotions | `GET/POST /api/promotions` · `PATCH /api/promotions/:id/toggle` |
| Analytics | `GET /api/analytics/overview` · `/tier-distribution` · `/top-customers` |
| AI | `POST /api/ai/customer-insight` · `POST /api/ai/promo-recommendation` · `GET /api/ai/insights` |
