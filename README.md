# Building Secure Payment Infrastructure for AI Agentic Commerce

A working demo of how an AI shopping agent could transact on a user's behalf
within guardrails set by that user — with automatic fraud scoring and a
human-in-the-loop approval step for anything risky.

## What it does

1. A user **authorizes an agent** with limits: per-transaction cap, daily
   spending cap, hourly transaction-rate cap, and a merchant allowlist.
2. The agent gets a **signed JWT identity token** — this is what it presents
   on every payment request. Nothing downstream trusts a raw agent ID.
3. When the agent tries to pay a merchant, the request runs through a
   **rule-based risk engine** that checks: limit breaches, untrusted
   merchants, transaction velocity, and cumulative daily spend.
4. Based on the score, the transaction is **auto-approved**, **auto-declined**,
   or **held for the human owner to approve/decline** from the dashboard.
5. The dashboard shows a live ledger, lets you revoke an agent instantly
   (kill switch), and lets you simulate purchases to see the engine work.

## Project structure

```
secure-agentic-commerce/
├── backend/          Node/Express API, JWT auth, risk engine, JSON datastore
└── frontend/         React (Vite) dashboard
```

## Running it locally

You'll need Node.js 18+ installed.

### 1. Backend

```bash
cd backend
npm install
npm start
```

Runs on **http://localhost:4000**. Health check: `GET /health`.

### 2. Frontend

In a second terminal:

```bash
cd frontend
npm install
npm start
```

Runs on **http://localhost:5173** and proxies `/api` calls to the backend.

### 3. Try it

1. Open the dashboard, click **"+ Authorize new agent"**.
2. Give it a name, a low per-transaction limit (e.g. ₹1500), and tick
   "Amazon" as a pre-approved merchant.
3. Select the agent, then simulate a purchase:
   - A ₹1000 Amazon purchase → **auto-approved**.
   - A ₹2500 Amazon purchase → **held for review** (exceeds per-txn limit).
   - A purchase at "QuickCoinExchange" (untrusted, not allowlisted) →
     **held or auto-declined** depending on amount.
4. Approve/decline held transactions from the ledger, or hit **Revoke agent**
   to cut off an agent immediately.

## API overview

| Endpoint | Method | Purpose |
|---|---|---|
| `/api/agents` | POST | Create an agent, returns identity + JWT token |
| `/api/agents` | GET | List agents for an owner |
| `/api/agents/:id` | PATCH | Update an agent's limits/permissions |
| `/api/agents/:id/revoke` | POST | Kill switch — revoke an agent instantly |
| `/api/transactions` | POST | Agent-initiated payment (requires Bearer token) |
| `/api/transactions` | GET | List transactions (dashboard ledger) |
| `/api/transactions/:id/approve` | POST | Human approves a held transaction |
| `/api/transactions/:id/decline` | POST | Human declines a held transaction |
| `/api/merchants` | GET | List known merchants and trust status |

## What to extend for a real internship submission

- Swap the JSON-file datastore (`backend/data/db.js`) for Postgres/MongoDB —
  the function signatures are already DB-agnostic.
- Replace the demo JWT secret with a proper secrets manager.
- Wire the risk engine to a real ML anomaly-detection model instead of
  fixed rules (the rules are there so every decision stays explainable).
- Integrate an actual Razorpay test-mode payment call once a transaction is
  approved, instead of just logging it.
- Add real user auth (currently a single hardcoded `ownerId` for the demo).
- Add rate limiting and request signing (HMAC) on top of the JWT for
  agent-to-agent (A2A) scenarios.

## Why this design

The core idea behind "agentic commerce" is that an AI agent — not a human —
initiates the transaction. That shifts the security question from "is this
person who they say they are" to "is this agent allowed to spend this much,
with this merchant, at this rate, on this person's behalf, right now." The
architecture here (scoped tokens + explainable risk rules + a human circuit
breaker) is a minimal answer to that question that a payments company like
Razorpay would recognize as directionally correct.
