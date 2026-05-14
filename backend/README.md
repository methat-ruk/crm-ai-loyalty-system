# Backend

NestJS backend for the CRM AI Loyalty demo application.

## Stack

- NestJS 11
- TypeScript
- Prisma ORM
- PostgreSQL
- Zod validation
- JWT authentication

## Purpose

This service exposes the REST API used by the frontend for:

- Authentication and role-aware access
- Customers CRUD
- Loyalty balances and transactions
- Rewards and reward redemptions
- Promotions and campaign management
- Analytics endpoints
- AI insights generation and history

## Local Setup

```bash
npm install
cp .env.example .env
```

Example `.env`:

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

Run migrations and seed data:

```bash
npx prisma migrate deploy
npm run seed
```

Start the API in development:

```bash
npm run start:dev
```

Swagger docs:

- [http://localhost:4000/api/docs](http://localhost:4000/api/docs)

## Available Scripts

```bash
npm run start
npm run start:dev
npm run start:prod
npm run build
npm run seed
npm run test
npm run test:e2e
```

## Production Start

`npm run start:prod` is configured to run the built server output from:

```text
dist/main.js
```

This matches the actual Nest build output in this project.

## Demo Accounts

Seeded demo users:

- `admin@crm.com / password123`
- `staff@crm.com / password123`
- `marketing@crm.com / password123`

## Role Rules

- `ADMIN`
  - Full access across customers, loyalty, rewards, promotions, analytics, AI
- `STAFF`
  - Can operate customers, loyalty, and rewards
  - Cannot create or manage promotions
- `MARKETING`
  - Can manage promotions
  - Cannot create customers or rewards

## Rewards Delete Behavior

Reward deletion behaves differently depending on history:

- If a reward has no redemptions, it is deleted normally
- If a reward has redemption history, it is archived instead:
  - `isActive = false`
  - `stock = 0`

This preserves historical data while keeping demo cleanup manageable.

## Verification Status

The backend has been verified with:

```bash
npm run test
npm run build
```

## Related Docs

- Root overview: [`../README.md`](../README.md)
- Frontend app setup: [`../frontend/README.md`](../frontend/README.md)
