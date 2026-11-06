# FreLock — Complete Project Report

**Project Title:** FreLock — Secure Escrow Platform

---

## Table of Contents

1. [Introduction](#1-introduction)
2. [Problem Statement & Scope](#2-problem-statement--scope)
3. [System Architecture & Security](#3-system-architecture--security)
4. [Modules, Roles & Features](#4-modules-roles--features)
5. [Escrow Workflow & Concurrency Safety](#5-escrow-workflow--concurrency-safety)
6. [Complete API Reference](#6-complete-api-reference)
7. [Technology Stack](#7-technology-stack)
8. [Setup, Execution & Deployment](#8-setup-execution--deployment)
9. [Conclusion, Limitations & Future Scope](#9-conclusion-limitations--future-scope)

---

## 1. Introduction

### 1.1 Overview
FreLock is a full-stack fintech web application that enables secure payments between clients and freelancers using an **escrow-based payment model**. Instead of direct bank or UPI transfers, the platform holds client funds in a protected escrow account until the client explicitly approves completed work.

### 1.2 Objectives
1. Design and implement a **role-based freelance marketplace** with three user types: **Admin**, **Client**, and **Freelancer**.
2. Build a **digital wallet system** with 4-digit PIN-protected financial operations in Indian Rupees (INR ₹).
3. Implement a complete, concurrency-safe **escrow lifecycle** — fund, hold, submit, approve, refund, and dispute.
4. Provide a modern, responsive UI with **Light Mode & Dark Mode** that works seamlessly on mobile, tablet, and desktop.
5. Maintain a complete **immutable audit trail** of every wallet and escrow transaction.

### 1.3 Target Users
* **Clients:** Individuals or businesses posting paid freelance jobs.
* **Freelancers:** Professionals browsing, applying for, and delivering paid work.
* **Admins:** Platform operators overseeing users, wallets, disputes, and platform-wide metrics.

---

## 2. Problem Statement & Scope

### 2.1 The Trust Problem in Freelance Payments
Freelance work involves two parties who often do not know each other personally:
* **Clients** fear paying upfront and receiving incomplete or no deliverables.
* **Freelancers** fear completing work and being denied payment after delivery.

Direct payment methods (UPI, bank transfer, cash) transfer funds immediately with no built-in hold mechanism or neutral dispute resolution.

### 2.2 Proposed Solution
FreLock introduces a **platform-managed escrow model**:
1. The client deposits funds into a platform wallet and sets a 4-digit PIN.
2. When a job is posted, the budget is **locked in escrow (`HELD`)** — deducted from the client's wallet so the freelancer knows the money exists, but not yet sent to the freelancer.
3. The freelancer completes and submits the work (`SUBMITTED`).
4. The client reviews and **approves with their PIN** — only then are funds released to the freelancer (`RELEASED`).
5. If a disagreement arises, either party raises a **Dispute (`DISPUTED`)**, and an **Admin** mediates and routes the funds to either the client (refund) or freelancer (payout).

### 2.3 Scope
* **In Scope:** JWT authentication, role-based dashboards, PIN-secured INR wallets, simulated top-ups, job marketplace, atomic escrow state machine, dispute resolution, job-scoped messaging, transaction history, and offline unit test suite (47 checks).
* **Out of Scope:** Live banking/UPI payment gateway settlement, KYC/AML verification, and multi-currency foreign exchange.

---

## 3. System Architecture & Security

### 3.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│            React 19 Frontend (Vite + Tailwind CSS 4)        │
│  Landing │ Auth │ Dashboards │ Jobs │ Escrow │ Messages     │
│  Global Light/Dark Theme │ Responsive Desktop & Mobile Nav  │
└──────────────────────────┬──────────────────────────────────┘
                           │ REST API (JWT Bearer token)
                           │ /api/* → Vite Proxy (dev)
┌──────────────────────────▼──────────────────────────────────┐
│                   Express Backend (Node.js)                 │
│  Auth │ Jobs │ Wallets │ Escrow │ Messages │ Admin │ Dispute│
│  Middleware: CORS, JSON limit, Operator Guard, Auth/Role    │
└──────────────────────────┬──────────────────────────────────┘
                           │ Mongoose ODM
┌──────────────────────────▼──────────────────────────────────┐
│                     MongoDB Atlas                           │
│  Users │ Wallets │ Jobs │ Escrows │ Disputes │ Transactions │
└─────────────────────────────────────────────────────────────┘
```

### 3.2 Project Folder Structure

```
FreLock/
├── backend/
│   ├── config/db.js           # MongoDB connection
│   ├── controllers/           # Route business logic (9 controllers)
│   ├── middleware/            # JWT auth, role guards, injection guard, error handler
│   ├── models/                # Mongoose schemas (8 models)
│   ├── routes/                # Express route definitions (9 route files)
│   ├── test/                  # Offline escrow logic test suite (47 checks)
│   ├── utils/                 # Atomic wallet/escrow ops, PIN lockout, rate limit, seed
│   └── server.js              # Express entry point
│
├── frontend/
│   ├── public/favicon.svg
│   ├── src/
│   │   ├── components/        # Auth, dashboard, landing, wallet, and UI primitives
│   │   ├── constants/         # Roles, navigation, currency, landing copy
│   │   ├── context/           # AuthContext & ThemeContext (Light/Dark mode)
│   │   ├── pages/             # 12 application route pages
│   │   ├── services/api.js    # Centralized HTTP client
│   │   ├── App.jsx            # Router & provider setup
│   │   ├── index.css          # Theme variables, animations & component classes
│   │   └── main.jsx           # React root mount
│   ├── index.html
│   ├── tailwind.config.js
│   └── vite.config.js
│
├── docs/
│   ├── PROJECT_DESCRIPTION.md # Detailed overview & technology stack explanation
│   └── COMPLETE_REPORT.md     # Complete consolidated project report
└── README.md
```

### 3.3 Database Schemas (MongoDB)

| Model | Key Fields & Purpose |
|-------|----------------------|
| `User` | `id`, `email`, `password` (bcrypt), `role` (`Admin`/`Client`/`Freelancer`), `name`, `status` (`ACTIVE`/`FROZEN`) |
| `Wallet` | `userId`, `balance` (INR), `currency`, `pinHash` (bcrypt), `pinFailedAttempts`, `pinLockedUntil` |
| `Job` | `jobId`, `title`, `description`, `budget`, `deadline`, `posterId`, `freelancerId`, `applicants[]`, `status` |
| `Escrow` | `escrowId`, `jobId`, `jobPosterId`, `freelancerId`, `amount`, `status` (`HELD`/`SUBMITTED`/`RELEASED`/`REFUNDED`/`DISPUTED`), `submissionNote` |
| `Dispute` | `disputeId`, `escrowId`, `jobId`, `raisedBy`, `reason`, `status` (`OPEN`/`RESOLVED`), `winnerId`, `resolution` |
| `Transaction` | `transactionId`, `from`, `to`, `amount`, `currency`, `type`, `relatedId`, `timestamp` |
| `Message` | `messageId`, `jobId`, `senderId`, `receiverId`, `text`, `read`, `timestamp` |
| `Wishlist` | `userId`, `jobId` |

### 3.4 Security Architecture

| Layer | Mechanism |
|-------|-----------|
| **Authentication** | JWT (1-day expiry) validated on startup via `/api/auth/me`; any 401 automatically logs out the session |
| **Live Frozen Check** | `protect` middleware reloads the user from MongoDB on every request so freezing an account takes effect immediately |
| **Role Enforcement** | `requireRole(...)` middleware on backend routes + `<ProtectedRoute>` on frontend routes |
| **4-Digit Wallet PIN** | Required for top-ups, job posting, escrow funding, and payment release; stored as a bcrypt hash |
| **PIN Brute-Force Lockout** | 5 wrong PIN attempts lock wallet actions for 15 minutes (`pinLockedUntil`) |
| **Login Rate Limiting** | 20 login/register attempts per 15 minutes per IP |
| **NoSQL Injection Guard** | `blockOperatorInjection` rejects any payload containing `$` keys or dotted paths with HTTP 400 |
| **Atomic Money Movement** | Conditional `findOneAndUpdate` prevents double-spend, double-approval, and double-dispute resolution |

---

## 4. Modules, Roles & Features

### 4.1 Role Capabilities

* **Admin:**
  * View platform-wide statistics (total clients, freelancers, wallet balances, active escrows, open disputes).
  * Freeze or unfreeze user accounts.
  * View all wallets and set any user's INR balance (recorded as `ADMIN_ADJUSTMENT`).
  * Inspect all escrows and resolve open disputes in favor of the Client or Freelancer.
* **Client:**
  * Set/change 4-digit wallet PIN and add simulated INR funds (UPI, Debit Card, Net Banking).
  * Post jobs (locks budget in escrow immediately).
  * Review applicants, chat with freelancers, and hire an applicant.
  * Review submitted deliverables and release payment with PIN, or raise a dispute.
* **Freelancer:**
  * Browse and search open jobs; save jobs to Wishlist.
  * Message clients before or after applying.
  * Submit completed work with a delivery note/link.
  * Receive escrow payout directly into their INR wallet upon approval.

### 4.2 Frontend Pages

| Page | Route | Role(s) | Purpose |
|------|-------|---------|---------|
| Home | `/` | Public | Landing page with animated escrow checkout preview |
| Login | `/login` | Public | Role-aware authentication + 1-click demo credentials |
| Register | `/register` | Public | Client & Freelancer account registration |
| Dashboard | `/dashboard` | Client, Freelancer | Role-specific overview, stats, and INR wallet panel |
| Post Job | `/jobs/create` | Client | Create job and lock budget in escrow |
| My Jobs | `/jobs/my` | Client | Manage posted jobs, applicants, and refunds |
| Find Jobs | `/jobs` | Freelancer | Search marketplace and manage wishlist |
| My Applications | `/jobs/applied` | Freelancer | Track application statuses (`PENDING` / `ACCEPTED`) |
| Escrow | `/escrow` | Client, Freelancer | Submit work, approve & release funds, or raise disputes |
| Messages | `/messages` | Client, Freelancer | Per-job real-time-style chat threads |
| History | `/history` | Client, Freelancer | Personal transaction ledger |
| Admin Dashboard | `/admin` | Admin | Disputes, users, wallets, escrows, and full ledger |

---

## 5. Escrow Workflow & Concurrency Safety

### 5.1 Escrow State Machine

```
Client Posts Job (+PIN)
         │
         ▼
      [ HELD ] ──────(Client deletes unassigned job)──────► [ REFUNDED ]
         │
   (Freelancer hired & submits work)
         │
         ▼
    [ SUBMITTED ] ───(Client approves + PIN)──────────────► [ RELEASED ]
         │
   (Either party raises dispute on HELD or SUBMITTED)
         │
         ▼
    [ DISPUTED ] ────(Admin awards Client)────────────────► [ REFUNDED ]
         │
         └───────────(Admin awards Freelancer)────────────► [ RELEASED ]
```

### 5.2 Rules Protecting Both Parties
1. **Locked Budget:** A job's budget cannot be edited after posting because those exact funds are locked in escrow.
2. **Pre-Hire Cancellation Only:** A client can delete a job and receive an automatic refund only while the job is `OPEN` (before a freelancer is hired).
3. **Post-Hire Protection:** Once a freelancer is accepted (`ASSIGNED`), the client cannot unilaterally cancel the job — funds can only leave escrow via Client Approval or Admin Dispute Resolution.
4. **Strict Dispute Recipients:** Admin dispute resolution validates that the winner is strictly either the job's `jobPosterId` (Client) or `freelancerId` (Freelancer).

### 5.3 Concurrency & Race-Condition Protection
All money-moving operations use MongoDB atomic conditional updates:
* **Wallet Debit:** `Wallet.findOneAndUpdate({ userId, balance: { $gte: amount } }, { $inc: { balance: -amount } })`
* **Escrow Release / Refund:** `Escrow.findOneAndUpdate({ escrowId, status: { $in: fromStatuses } }, { $set: { status: 'RELEASED' } })`
* **Dispute Resolution:** `Dispute.findOneAndUpdate({ disputeId, status: 'OPEN' }, { $set: { status: 'RESOLVED', ... } })`

If three concurrent requests attempt to approve the same escrow at the exact same millisecond, only one matches `status: 'SUBMITTED'`, so the freelancer is paid **exactly once**.

---

## 6. Complete API Reference

Base URL: `/api` (proxied to `http://localhost:5000/api` in development).  
Protected endpoints require `Authorization: Bearer <JWT>`.

### 6.1 Auth & Health
* `GET  /api/health` — Server and MongoDB connection status
* `POST /api/auth/login` — Authenticate with `{ email, password, role }`
* `POST /api/auth/register` — Register `{ name, email, password, role }`
* `GET  /api/auth/me` — Current authenticated user profile

### 6.2 Wallets
* `GET  /api/wallets/me` — Get current user's wallet balance and PIN status
* `POST /api/wallets/setup-pin` — Create or change 4-digit PIN (`{ pin, confirmPin, currentPin? }`)
* `POST /api/wallets/add-money` — Simulated top-up (`{ amount, pin, method }`)
* `GET  /api/wallets` — *(Admin)* List all user wallets (excludes `pinHash`)
* `POST /api/wallets/assign` — *(Admin)* Set a user's wallet balance (`{ userId, balance }`)

### 6.3 Jobs
* `GET    /api/jobs` — *(Freelancer)* List open jobs
* `POST   /api/jobs` — *(Client)* Create job and lock escrow (`{ title, description, budget, deadline, privacyLevel, pin }`)
* `GET    /api/jobs/myjobs` — *(Client)* List client's posted jobs with escrow status
* `GET    /api/jobs/applied` — *(Freelancer)* List jobs applied to
* `PUT    /api/jobs/:id` — *(Client/Admin)* Update title/description/deadline of an `OPEN` job
* `DELETE /api/jobs/:id` — *(Client/Admin)* Delete an `OPEN` job and refund escrow to poster
* `POST   /api/jobs/:id/apply` — *(Freelancer)* Apply to an open job
* `POST   /api/jobs/:id/accept` — *(Client)* Accept an applicant (`{ freelancerId }`)
* `GET    /api/jobs/wishlist` & `POST /api/jobs/wishlist` — *(Freelancer)* View or toggle saved jobs

### 6.4 Escrow & Disputes
* `POST /api/escrow/fund` — *(Client)* Fund escrow for an unfunded job
* `POST /api/escrow/submit` — *(Freelancer)* Submit work (`{ escrowId, note }`)
* `POST /api/escrow/approve` — *(Client)* Approve work with PIN and release payment (`{ escrowId, pin }`)
* `GET  /api/escrow/my` — *(Client/Freelancer)* List user's escrows
* `GET  /api/escrow` — *(Admin)* List all escrows
* `GET  /api/dispute` & `GET /api/dispute/my` — List all or personal disputes
* `POST /api/dispute/raise` — *(Client/Freelancer)* Raise dispute (`{ escrowId, reason }`)
* `POST /api/dispute/resolve` — *(Admin)* Resolve dispute (`{ disputeId, winnerId, resolution }`)
* `POST /api/dispute/cancel` — *(Client)* Cancel unassigned job and refund escrow

### 6.5 Messages, History & Admin
* `GET  /api/messages/conversations` — List chat threads with unread counts
* `GET  /api/messages/:jobId/:userId` — Fetch messages in a job thread
* `POST /api/messages/send` — Send message (`{ jobId, receiverId, text }`)
* `GET  /api/history/transactions/my` — Personal transaction ledger
* `GET  /api/history/transactions/all` — *(Admin)* Platform-wide transaction ledger
* `GET  /api/users` & `PUT /api/users/:id/freeze` — *(Admin)* List users and freeze/unfreeze accounts
* `GET  /api/admin/stats` — *(Admin)* Aggregated platform metrics

---

## 7. Technology Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Frontend UI** | React 19 + Vite 8 | Fast SPA rendering, Context state, and `/api` dev proxy |
| **Styling & Theme** | Tailwind CSS 4 | Utility-first styling, animations, and CSS-variable Light/Dark mode |
| **Routing & Icons** | React Router 7 + Lucide React | Protected client routing and fintech iconography |
| **Backend API** | Node.js + Express 4 | REST controllers, middleware pipeline, and error handling |
| **Database** | MongoDB Atlas + Mongoose 8 | Cloud document persistence and atomic conditional updates |
| **Security** | `jsonwebtoken` + `bcryptjs` | Stateless JWT auth and salted password/PIN hashing |
| **Testing** | Node `assert` (`test/escrow.test.js`) | 47-check offline test suite verifying escrow & concurrency logic |

---

## 8. Setup, Execution & Deployment

### 8.1 Local Setup

1. **Install Dependencies:**
   ```bash
   cd backend && npm install
   cd ../frontend && npm install
   ```

2. **Configure `backend/.env`:**
   ```env
   PORT=5000
   NODE_ENV=development
   MONGODB_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/frelock?retryWrites=true&w=majority
   JWT_SECRET=your-secret-key
   CORS_ORIGIN=
   SEED_DEMO_USERS=true
   ```

3. **Run Backend & Frontend (2 Terminals):**
   * **Terminal 1:** `cd backend && npm run dev` (`http://localhost:5000`)
   * **Terminal 2:** `cd frontend && npm run dev` (`http://localhost:5173`)

4. **Run Offline Logic Tests (No DB Required):**
   ```bash
   cd backend && npm test
   ```

### 8.2 Seeded Demo Accounts

| Role | Email | Password |
|------|-------|----------|
| **Admin** | `admin@escrow.com` | `Admin@FintechEL2026` |
| **Client** | `client@escrow.com` | `client123` |
| **Freelancer** | `freelancer@escrow.com` | `freelancer123` |

---

## 9. Conclusion, Limitations & Future Scope

### 9.1 Conclusion
FreLock demonstrates a complete, security-hardened **escrow-based freelance marketplace**. By combining atomic wallet/escrow operations, 4-digit PIN verification, role-based access control, an immutable transaction ledger, and a modern Light/Dark responsive UI, the platform effectively solves the trust gap between clients and freelancers.

### 9.2 Current Limitations
* Wallet top-ups are simulated for academic demonstration (no live Razorpay/Stripe banking settlement).
* Messaging uses periodic polling rather than persistent WebSockets.
* Single currency (`INR ₹`) by default.

### 9.3 Future Enhancements
* Integration with live UPI/Razorpay payment gateways and bank payouts.
* Real-time notifications and chat via Socket.IO / WebSockets.
* Milestone-based partial escrow releases for large projects.
* File attachment uploads for work deliverables and dispute evidence.

