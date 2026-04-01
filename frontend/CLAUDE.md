@AGENTS.md

<!-- BEGIN:nextjs-agent-rules -->

# crm-ai-loyalty-system Project Rules

## Project Overview

**Project Name:** crm-ai-loyalty-system  
**Description:**  
โปรเจกต์ระบบ CRM (Customer Relationship Management) และ Loyalty Management ที่พัฒนาแบบ Full-Stack สำหรับจัดการข้อมูลลูกค้า ระบบคะแนนสะสม (Loyalty Points) และสิทธิประโยชน์สำหรับสมาชิก (Rewards)  
ระบบมีการใช้ AI (Artificial Intelligence) เพื่อช่วยวิเคราะห์พฤติกรรมลูกค้าและสร้างข้อมูลเชิงลึก เพื่อช่วยในการทำการตลาดและออกแบบโปรโมชั่น

**Purpose:** Portfolio project demonstrating skills in:

- Full-Stack Development
- REST API Development
- Database Design
- AI Integration
- System Design
- Mini CRM + Loyalty + AI Assistant

---

## 1. Technical Stack & Versions

- **Frontend:** Next.js 16.x (App Router), TypeScript 5.x (Strict mode), Tailwind CSS 4.x, Shadcn UI (Radix UI), Lucide React
- **Backend:** Node.js 24.x, NestJS 11.x
- **Database:** PostgreSQL 18.x
- **ORM:** Prisma 7.x (with PostgreSQL)
- **AI:** Mock Mode (default) · Groq · OpenAI (via `AI_PROVIDER` env)
- **Validation:** Zod 4.x

---

## 2. General Principles

- **No 'any'**: Never use the `any` type. Define proper interfaces or types.
- **Functional Components**: Use arrow functions for all components.
- **Client vs Server**: Default to Server Components. Use `'use client'` only for interactivity (useState, useEffect) or browser APIs.
- **Clean Code**: Follow DRY and SOLID principles.

---

## 3. Naming Conventions

- **Folders/Files in App Router:** kebab-case (e.g., `customer-profile/page.tsx`). Used for route segments and URL mapping.
- **Components (Files & Folders):** PascalCase (e.g., `CustomerProfile.tsx`, `AIAssistantPanel.tsx`). Used for React components and UI structure.
- **Services:** camelCase (e.g., `customerService.ts`, `aiService.ts`). Used for API calls and business logic communication layer.
- **Constants:** camelCase files (e.g., `userRoles.ts`, `routes.ts`). Used for application-wide constant values.
- **Config:** camelCase (e.g., `api.ts`, `env.ts`). Used for environment setup and system configuration.
- **Store:** camelCase (e.g., `authStore.ts`, `customerStore.ts`). Used for global state management (e.g., Zustand, Redux).
- **Shared UI Components:** PascalCase (e.g., `Button.tsx`, `Card.tsx`, `Modal.tsx`). Used for reusable low-level UI components.
- **Hooks:** camelCase + prefix use (e.g., `useCustomerAnalytics.ts`). Used for reusable React stateful logic.
- **Utils:** camelCase (e.g., `formatDate.ts`). Used for pure helper functions.

---

## 4. Folder Structure Standards

- `/app`: All routes and layouts
- `/components/ui`: Atomic components (Shadcn)
- `/components/shared`: Reusable business components
- `/lib`: Server-side utilities, DB clients (Prisma/Drizzle)
- `/hooks`: Custom React hooks
- `/types`: Shared TypeScript definitions
- `/services`: Business logic and API services
- `/utils`: Helper functions and utility logic
- `/constants`: Application-wide constants
- `/config`: App configuration and environment setup
- `/store`: Global state management (e.g., Zustand)

---

## 5. Agent-Specific Instructions (MANDATORY)

- **Plan First (MANDATORY):**  
  AI MUST summarize the implementation plan and get explicit user confirmation before writing any code

- **Check Environment (REQUIRED):**  
  AI MUST verify that all required environment variables exist in `.env.example` before implementation

- **Verify Build (REQUIRED):**  
  AI MUST ensure both frontend and backend compile and run without errors

  - **Frontend:** `npm run build` or `next lint`
  - **Backend:** `npm run build` (NestJS) and ensure no runtime errors

- **Error Handling (REQUIRED):**  
  AI MUST wrap async operations (API routes, Server Actions) in try-catch and validate inputs using Zod

## 5.1 Mandatory Planning Workflow (CRITICAL)

Before writing any code, the AI MUST follow this workflow:

### Step 1: Understand the Task
- Analyze the user's request
- Identify scope, affected modules, and requirements

### Step 2: Create a Plan
- Break down the implementation into clear steps
- Specify:
  - Files to create or update
  - Components / services involved
  - Data flow and logic

### Step 3: Present the Plan
- Show the plan to the user clearly
- DO NOT start coding yet

### Step 4: Get Confirmation
- Wait for explicit user approval or feedback

### Step 5: Execute
- Only after confirmation, proceed with implementation

---

### Strict Rules

- No plan → No code
- No confirmation → Do not proceed
- If the task is unclear → ask questions BEFORE planning
- If the task changes → re-plan and confirm again
- If AI starts coding without a plan → STOP and restart with planning

---

## 6. CSS & UI & Responsive Design Rules

- Use Tailwind CSS for all styling
- Use `clsx` for conditional className handling
- Avoid inline styles
- The UI MUST follow mobile-first design
- Build layouts starting from mobile → tablet → desktop
- Use Tailwind responsive breakpoints (sm, md, lg, xl)

**Key Principle**
Design must adapt for usability, not just shrink the layout

---

## 7. CRM & Loyalty Features (Summary)

- **Authentication & Access Control:** User login/logout, RBAC (Admin, Staff, Marketing roles)
- **Customer Management:** Create, Update, Delete, Profile page, Activity timeline
- **Loyalty System:** Earn & Redeem points, Transaction history
- **Rewards Management:** Create Rewards, Rewards Catalog, Reward Redemption, Expiration dates
- **Promotions & Campaigns:** Create campaigns, 4 types (Points Multiplier, Bonus Points, Discount, Free Reward), active/inactive toggle
- **Analytics Dashboard:** Stats overview, bar chart (new customers trend), tier distribution, top customers
- **AI Insights:** Customer behavior summary + churn risk, promo recommendation, insight history — supports Mock/Groq/OpenAI
- **Dark Mode:** Light/Dark toggle with localStorage persistence, system preference fallback

---

## 8. Blocked Files (Blacklist)

AI MUST NOT read, scan, summarize, or include the following:

Dependencies

/node_modules/

Build outputs

/.next/
/dist/
/build/

Logs & temp

**/*.log
/logs/
/tmp/
/.cache/

Environment & secrets (CRITICAL)

.env*
.env.*
!.env.example

Lock files

**/package-lock.json

<!-- END:nextjs-agent-rules -->

<!-- BEGIN: api-strict-rules -->

## 1. API Rules (MANDATORY)
- All API endpoints MUST start with /api
- Use RESTful conventions only
- Use kebab-case and plural nouns
- **Example:** `GET /api/customers`, `POST /api/customers`, `GET /api/customers/:id`

<!-- END: api-strict-rules -->

## Git Rules
- AI MUST NOT execute any git commands (`commit`, `push`, `pull`, `branch`)

<!-- BEGIN: esm-rules -->

## 1. Backend uses ES Module (ESM).

Rules:
- Use import/export only
- Do NOT use require, module.exports, or exports
- Always include file extensions in imports (e.g., './file.js')
- Assume "type": "module" in package.json

Strictly no CommonJS allowed

<!-- END: esm-strict-rules -->

<!-- BEGIN: frontend-design-rules -->

Design Principles for a CRM + AI Loyalty System

Designing a CRM and AI-powered loyalty platform is fundamentally different from designing a marketing website. This system is a data-driven tool used for managing customers, analyzing behavior, and making business decisions. Therefore, the design must prioritize clarity, speed, and usability over visual decoration.

The goal is not just to make something look good, but to build a system that helps users understand information quickly and act efficiently.

Core Design Rules
## 1. App-First Layout

The interface must follow a structured application layout, not a landing page style.

- Use a sidebar for primary navigation
- Use a top bar for context, actions, and user controls
- Reserve the main area as a workspace for content and data

The first screen should feel like a tool interface, not a promotional page.

## 2. Function Over Branding

Branding should exist but must not dominate the interface.

- Place branding in the sidebar and login page
- Inside the system, prioritize data visibility and usability

Users come to the platform to perform tasks, not to engage with branding.

## 3. First Viewport = Immediate Insight

The first visible area should communicate system status instantly.

Include high-level metrics such as:

- Total Customers
- Active Customers
- Total Loyalty Points
- Top Customers

Users should understand what’s happening in the system within seconds.

## 4. Purposeful Use of Cards

Cards are allowed, but only when they serve a clear function.

Use cards for:

- KPI and metrics
- Customer summaries
- Reward items

Avoid cards that are purely decorative. If removing the card styling does not reduce clarity, it should not be a card.

## 5. One Section, One Responsibility

Each section must have a single clear purpose.

One heading
One primary function
Minimal supporting text

Examples:

- Customer Profile
- Loyalty Balance
- Transaction History

Avoid mixing multiple responsibilities in one section.

## 6. Reduce Clutter, Not Information

CRM systems require dense information, but it must be structured.

- Use visual hierarchy to guide attention
- Use spacing to separate groups
- Organize data logically

Do not remove important data—make it easier to scan and understand.

## 7. Strong Visual System

Avoid generic or default UI styles.

Define a consistent design system:

- Color variables (--primary, --accent, --bg, --surface)
- Typography scale
- Spacing system

Choose a clear visual direction such as:

- Clean SaaS
- Fintech-style dark interface
- AI-focused futuristic UI

The interface should feel intentional and cohesive.

## 8. Make AI a Visible Feature

AI should not be hidden in the background. It must be clearly presented in the UI.

Include elements like:

- AI Insight Panel
- Recommendation sections
- Optional AI assistant interface

Example:

“Customers in this segment show high churn risk. Recommend a re-engagement campaign.”

AI should help users make decisions, not just process data silently.

## 9. Clear and Predictable Navigation

Navigation must be simple and consistent.

Include core sections such as:

- Dashboard
- Customers
- Loyalty
- Rewards
- Promotions
- Analytics
- AI Insights

Users should always know where they are and how to move through the system.

## 10. Functional Motion Only

Use motion to support usability, not decoration.

Appropriate uses:

- Loading states (skeletons)
- Chart animations
- Hover and interaction feedback
- Smooth transitions

Avoid unnecessary or distracting animations.

## 11. Complete UX States

A professional system must handle all user states.

Include:

- Empty states
- Loading states
- Error states
- Confirmation dialogs
- Notifications (toasts)

These elements make the system feel complete and reliable.


## 12. Theme Direction

The interface should primarily use a light theme as the main design direction.

- The background should be light and neutral, such as white or soft gray tones.
- Avoid backgrounds that are too bright (pure white) or too dark, as they can cause visual fatigue during long usage sessions.
- Use soft contrast and subtle color variations to maintain readability while keeping the interface comfortable for extended use.
- Emphasize clarity and readability, especially since the system will display data-heavy content.

This system is intended for daily operational use, so comfort, clarity, and long-term readability should take priority over stylistic themes.

## Final Principle

Design this system with the mindset:

“This is a tool for decision-making and operations.”

Not:

“This is a visually impressive website.”

A successful CRM + AI system is one that allows users to:

- Understand data quickly
- Navigate effortlessly
- Take action with confidence

<!-- END: frontend-design-rules -->