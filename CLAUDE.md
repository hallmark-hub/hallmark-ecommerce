# CLAUDE.md — ChefWare Enterprise E-Commerce Platform

## Project Overview
Full e-commerce platform for ChefWare Enterprise, a Ghanaian hospitality supply
business based in Accra. Sells chef uniforms, kitchen equipment, and embroidery/
branding services. Brand colors: green and white.

**Active development — 6-week timeline. GHS 8,000 project fee.**

---


## Behavioral Guidelines (Karpathy Rules — Always Active)

### 1. Think Before Coding
**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before writing a single line:
- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them — don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

### 2. Simplicity First
**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

Ask: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

### 3. Surgical Changes
**Touch only what you must. Clean up only your own mess.**

When editing existing code:
- Do not "improve" adjacent code, comments, or formatting.
- Do not refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it — don't delete it.

When your changes create orphans:
- Remove imports/variables/functions that YOUR changes made unused.
- Do not remove pre-existing dead code unless explicitly asked.

The test: Every changed line must trace directly to the current task.

### 4. Goal-Driven Execution
**Define success criteria. Loop until verified.**

Transform tasks into verifiable goals:
- "Add validation" → "Write tests for invalid inputs, then make them pass"
- "Fix the bug" → "Write a test that reproduces it, then make it pass"

For multi-step tasks, state a brief plan before starting:
```
1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
```

---

## Scope Control — Stay in Your Lane

Only modify files, functions, and lines directly related to the current task.
Do not refactor, rename, reorganize, reformat, or "improve" anything not explicitly asked for.
If you notice something worth fixing elsewhere, leave a note. Do not touch it.

---

## Destructive Actions — Full Stop

Before deleting any file, overwriting existing code, dropping database records,
or removing dependencies — stop completely. List exactly what will be affected.
Ask for explicit confirmation. Only proceed after Evans says yes in the current message.

---

## Hard Stops — These Never Happen Without Explicit Permission

The following require explicit in-session confirmation, no exceptions:
- Deploying or pushing to any environment (staging, production, etc.)
- Running migrations or schema changes on any database
- Sending any email, message, or external API call to real recipients
- Executing any command with irreversible external side effects

"You mentioned this earlier" is not confirmation. Confirmation must be in the current message.

---

Maintain a file called MEMORY.md. After any significant decision, about direction, format, content, approach, or strategy, add an entry:

## [Date], [Decision]
**What was decided:** [the choice made]
**Why:** [the reasoning]
**What was rejected:** [alternatives considered and why they were ruled out]

Read MEMORY.md at the start of every session before doing anything. Never contradict a logged decision without flagging it first.

## After Every Task — Status Report

After completing any coding task, always end with:
- **Files changed:** [list every file touched]
- **What was modified:** [one line per file]
- **Files intentionally not touched:** [if relevant]
- **Follow-up needed:** [anything requiring a decision or attention]

Keep it short. This is a status update, not a recap.

---


## Tech Stack (DO NOT deviate without explicit approval)

| Layer | Technology |
|---|---|
| Frontend | React.js + Vite |
| Backend | FastAPI (Python 3.11+) |
| Database | Supabase (PostgreSQL via supabase-py) |
| Payments | Paystack (MoMo, card) + manual bank transfer |
| AI Chatbot | OpenAI GPT API |
| Notifications | Africa's Talking (SMS + email) |
| Media Storage | Cloudinary |
| Frontend Hosting | Vercel |
| Backend Hosting | Render |
| Version Control | GitHub |

---

## Code Standards

### Python / FastAPI
- Always use Python type hints on all function signatures
- Use `supabase-py` client for ALL database operations — no raw SQL unless unavoidable
- Structure: `router → service → supabase` — no business logic in routers
- Use Pydantic v2 models for all request/response schemas
- Return consistent JSON: `{ "success": bool, "data": ..., "message": str }`
- All prices stored and returned in Ghana Cedis (GHS) as integers (pesewas) — display layer converts
- Every endpoint must have a docstring

### React / Vite
- Functional components only — no class components
- Custom hooks for all shared logic (cart, auth, notifications)
- Co-locate component styles (CSS modules or Tailwind — confirm with Evans before starting)
- No inline styles except for dynamic values
- All API calls go through a centralized `api/` service layer — never fetch directly in components
- Ghana phone numbers: always format/validate as `+233XXXXXXXXX`

### General
- Never hardcode secrets, API keys, or credentials — always use environment variables
- Flag any new env var introduced with a comment: `# ENV: VARIABLE_NAME`
- Keep diffs under 200 lines per iteration
- Do not remove or modify code/comments you don't understand
- List assumptions before any non-trivial implementation

---

## Verification Commands

Run these after every change to confirm nothing is broken:

```bash
# Backend
cd backend && pytest -x -q

# Frontend
cd frontend && npm run build && npm run lint

# Full check (run both)
make verify
```

**If no test exists for new code, write one before moving on.**

---

## Project Structure

```
chefware/
├── CLAUDE.md                  # ← you are here
├── .claude/
│   ├── settings.json          # pre-allowed bash commands
│   └── commands/              # slash commands
│       ├── verify.md
│       ├── new-endpoint.md
│       └── commit-pr.md
├── .mcp.json                  # MCP server config
├── frontend/                  # React + Vite
│   ├── src/
│   │   ├── api/               # all API calls centralized here
│   │   ├── components/        # reusable UI components
│   │   ├── pages/             # route-level components
│   │   ├── hooks/             # custom React hooks
│   │   ├── store/             # state management (Zustand recommended)
│   │   └── utils/             # formatting, validation helpers
│   └── CLAUDE.md              # frontend-specific rules (link from root)
├── backend/                   # FastAPI
│   ├── app/
│   │   ├── routers/           # FastAPI route handlers
│   │   ├── services/          # business logic layer
│   │   ├── models/            # Pydantic schemas
│   │   ├── db/                # Supabase client init
│   │   └── utils/             # helpers (formatting, ghana phone, etc.)
│   ├── tests/
│   └── CLAUDE.md              # backend-specific rules (link from root)
└── docs/                      # schema diagrams, API docs, client notes
```

---

## Domain Rules (Ghana-specific)

- All prices: Ghana Cedis (GHS). Store as integers (pesewas). Display formatted: `GHS 250.00`
- Phone numbers: validate and store as `+233XXXXXXXXX`
- Payment methods: MTN MoMo, Vodafone Cash, AirtelTigo Money (via Paystack), GCB Bank transfer, Stanbic Bank transfer
- Delivery: 24 hours after full payment confirmed; 6–8 weeks for preorders
- Returns policy: **No refunds. Exchange only within 3 days of purchase.** This must appear at checkout and in order confirmation.
- SMS notifications target Ghanaian numbers via Africa's Talking

---

## Product Categories & Checkout Rules

| Category | Checkout Type |
|---|---|
| Chef Uniforms | Direct checkout |
| Restaurant Staff Uniforms & Branding | Direct checkout |
| Industrial Kitchen Equipment & Tools | Direct checkout |
| Industrial Kitchen Setup | **Request a Quote** (TBC with client) |
| Customized Machine Pre-Orders | **Request a Quote** (TBC with client) |
| Machine Customization | **Request a Quote** (TBC with client) |
| Embroidery Services | **Request a Quote** (TBC with client) |
| Logo Printing & Garment Branding | **Request a Quote** (TBC with client) |

⚠️ Categories 4–8 are pending client confirmation. Build the quote flow as a separate, optional pathway — do not block categories 1–3 on this decision.

---

## Payment Integration Notes

- Paystack handles: MTN MoMo, Vodafone Cash, AirtelTigo Money, card
- Bank transfers (GCB + Stanbic): generate unique reference code, show instructions, mark as "pending" until manually confirmed by admin
- Never store full payment credentials — only store Paystack transaction references and status
- Webhook verification: always validate Paystack webhook signature before processing

---

## AI Chatbot Scope
- Product discovery (search by category, use case)
- FAQ responses (delivery, returns, payment)
- Order status lookup (by order ID or phone)
- Escalation path: if chatbot can't resolve, capture contact info and notify admin via SMS

---

## Admin Dashboard Scope
- Product management (CRUD, images via Cloudinary)
- Order management (status updates, manual bank transfer confirmation)
- Inventory tracking
- Discount/promo code management
- Basic analytics (revenue, orders by category)

---

## Environment Variables Checklist

Every integration needs these — never commit to git:

```
# Supabase
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Paystack
PAYSTACK_SECRET_KEY=
PAYSTACK_PUBLIC_KEY=

# OpenAI
OPENAI_API_KEY=

# Africa's Talking
AT_API_KEY=
AT_USERNAME=
AT_SENDER_ID=

# Cloudinary
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# App
FRONTEND_URL=
BACKEND_URL=
JWT_SECRET=
```

---

## What to Flag to Evans Immediately

- Any decision that expands scope or affects the 6-week timeline
- Any third-party API behaviour that differs from documentation
- If a "Request a Quote" category needs to be added to direct checkout
- If Paystack MoMo integration requires additional merchant verification steps
- Any Supabase schema change that affects existing data

---

## Context Window Discipline
- 0–50%: work freely
- 50–70%: start wrapping up current task
- 70–90%: run `/compact`
- 90%+: run `/clear` — mandatory

---

*Last updated: project start — update after each session with anything Claude got wrong.*
