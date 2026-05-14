# Frontend

Next.js frontend for the CRM AI Loyalty demo application.

## Stack

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS 4
- Shadcn UI
- Zustand
- Recharts

## Purpose

This app provides the operator-facing UI for:

- Login and session handling
- Dashboard and analytics
- Customer management
- Loyalty points operations
- Rewards catalog and redemptions
- Promotions management
- AI insights in mock or real provider mode

## Local Setup

```bash
npm install
cp .env.example .env.local
```

Set the API URL in `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:4000/api
```

Start the dev server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Available Scripts

```bash
npm run dev
npm run build
npm run start
npm run lint
```

## Demo Notes

- Unauthenticated users are redirected to `/login`.
- API `401` responses clear the local session and redirect back to login.
- Promotions UI follows backend role rules:
  - `ADMIN` and `MARKETING` can manage campaigns
  - `STAFF` can view campaigns but cannot create or edit them
- The app no longer depends on fetching Google Fonts during production build.

## Main Routes

- `/login`
- `/dashboard`
- `/customers`
- `/loyalty`
- `/rewards`
- `/promotions`
- `/ai-insights`

## Build Status

The frontend has been verified with:

```bash
npm run lint
npm run build
```

## Related Docs

- Root overview: [`../README.md`](../README.md)
- Backend API/service setup: [`../backend/README.md`](../backend/README.md)
