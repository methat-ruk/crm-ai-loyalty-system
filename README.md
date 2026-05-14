# CRM AI Loyalty System

CRM AI Loyalty is a full-stack demo application for customer management, loyalty operations, promotions, rewards, analytics, and AI-assisted insights.

It is designed to be:

- good for portfolio/demo presentation
- easy to run locally
- safe to demo with seeded accounts and mock AI mode

## Highlights

- JWT login with role-based access
- Customer CRUD and profile detail views
- Loyalty earn/redeem workflows
- Rewards catalog and redemptions
- Promotions management with role restrictions
- Analytics dashboard
- AI insights with `mock`, `groq`, or `openai`
- Frontend auth/session hardening for demo stability

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16, React 19, TypeScript, Tailwind CSS 4, Shadcn UI |
| Backend | NestJS 11, TypeScript, Zod |
| Database | PostgreSQL, Prisma ORM |
| AI | Mock mode, Groq, OpenAI |

## Project Structure

```text
crm-ai-loyalty/
|-- backend/
|   |-- prisma/
|   |-- src/
|   `-- README.md
|-- frontend/
|   |-- src/
|   `-- README.md
`-- README.md
```

## Quick Start

### 1. Install dependencies

```bash
cd backend
npm install

cd ../frontend
npm install
```

### 2. Configure environment

Backend:

```bash
cd backend
cp .env.example .env
```

Frontend:

```bash
cd frontend
cp .env.example .env.local
```

Minimum frontend env:

```env
NEXT_PUBLIC_API_URL=http://localhost:4000/api
```

Minimum backend env:

```env
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/crm_ai_db"
PORT=4000
JWT_SECRET="replace-me"
JWT_EXPIRES_IN="7d"
FRONTEND_URL="http://localhost:3000"
AI_PROVIDER=mock
AI_API_KEY=
AI_MODEL=
```

### 3. Prepare database

```bash
cd backend
npx prisma migrate deploy
npm run seed
```

### 4. Start the app

Backend:

```bash
cd backend
npm run start:dev
```

Frontend:

```bash
cd frontend
npm run dev
```

Open:

- Frontend: [http://localhost:3000](http://localhost:3000)
- API docs: [http://localhost:4000/api/docs](http://localhost:4000/api/docs)

## Demo Accounts

| Role | Email | Password |
|---|---|---|
| Admin | `admin@crm.com` | `password123` |
| Staff | `staff@crm.com` | `password123` |
| Marketing | `marketing@crm.com` | `password123` |

## Recommended Live Demo Flow

If you want the safest presentation flow, use this order:

1. Log in as `admin`
2. Show dashboard KPIs and charts
3. Open customer list and detail page
4. Demonstrate loyalty earn/redeem flow
5. Show rewards and a redemption flow
6. Show promotions
7. Show AI insights in `mock` mode
8. Log in as `marketing` to demonstrate promotion-only permissions

## Role Summary

### Admin

- Full access

### Staff

- Can manage customers, loyalty, and rewards
- Cannot create or manage promotions

### Marketing

- Can manage promotions
- Cannot create customers or rewards

## AI Mode

Default mode is:

```env
AI_PROVIDER=mock
```

This is recommended for demos because it avoids network/key dependency and still exercises the AI flows.

To use a real provider:

```env
AI_PROVIDER=groq
AI_API_KEY=your-key
AI_MODEL=llama-3.1-8b-instant
```

or

```env
AI_PROVIDER=openai
AI_API_KEY=sk-...
AI_MODEL=gpt-4o-mini
```

## Verification Status

This project has been checked for demo readiness with:

### Frontend

```bash
npm run lint
npm run build
```

### Backend

```bash
npm run test
npm run build
```

### Smoke Coverage

The latest readiness pass verified:

- frontend routes responding
- login for all three demo roles
- analytics endpoints
- customer CRUD
- loyalty earn/redeem
- rewards create/redeem
- promotions create/toggle
- AI insight endpoints
- role-based permission checks

## Important Behavior

### Production backend start

The backend production start command now runs from:

```text
dist/src/main.js
```

because that matches the actual build output.

### Reward delete policy

If a reward has redemption history, deleting it archives it instead of removing it outright. This keeps historical records intact while avoiding demo cleanup pain.

## Extra Docs

- Frontend details: [frontend/README.md](frontend/README.md)
- Backend details: [backend/README.md](backend/README.md)
