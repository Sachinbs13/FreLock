# FreLock — Detailed Project Description & Technology Stack

## 1. Project Overview

**FreLock — Secure Escrow Platform** is a full-stack fintech web application designed to eliminate trust risks in freelance payments. Instead of relying on direct upfront transfers (where clients risk non-delivery) or post-delivery transfers (where freelancers risk non-payment), FreLock acts as a neutral **Escrow Intermediary**:

1. **Clients** fund an INR (₹) digital wallet protected by a 4-digit PIN.
2. When a Client posts a job, the project budget is **atomically deducted** from their wallet and locked in an **Escrow Vault** (`HELD` state).
3. **Freelancers** browse open jobs, communicate with clients via job-scoped messaging, and apply.
4. Once hired, the Freelancer completes the work and submits deliverables (`SUBMITTED` state).
5. The Client reviews the work and approves it using their 4-digit wallet PIN, which **atomically releases** the funds to the Freelancer's wallet (`RELEASED` state).
6. If a conflict occurs while funds are held or submitted, either party can raise a **Dispute** (`DISPUTED` state), and a platform **Admin** reviews the case to either refund the Client or pay the Freelancer.

| Attribute | Details |
|-----------|---------|
| **Project Title** | FreLock — Secure Escrow Platform |
| **Domain** | Fintech / Freelance Marketplace |
| **Frontend Stack** | React 19, Vite 8, Tailwind CSS 4, React Router 7, Lucide Icons |
| **Backend Stack** | Node.js, Express 4, JSON Web Tokens (JWT), bcryptjs |
| **Database** | MongoDB Atlas with Mongoose ODM |
| **Currency** | Indian Rupees (INR ₹) |
| **Theme Support** | Global Light Mode & Dark Mode with CSS custom properties |

---

## 2. Detailed Technology Stack & Explanation

### 2.1 Frontend Technologies

#### 1. React 19 (`react`, `react-dom`)
* **What it is:** Component-based JavaScript library for building interactive user interfaces.
* **Why & how it is used in FreLock:**
  * Powers the entire Single Page Application (SPA) across 12 routes and 3 user roles (`Admin`, `Client`, `Freelancer`).
  * Uses **React Context API** (`AuthContext.jsx` and `ThemeContext.jsx`) to manage global authentication sessions, automatic token verification on startup, and global Light/Dark theme switching without prop drilling.
  * Custom reusable UI primitives (`Modal`, `PinInput`, `StatusBadge`, `Alert`, `ThemeToggle`, `WalletPanel`) keep pages modular and maintainable.

#### 2. Vite 8 (`vite`, `@vitejs/plugin-react`)
* **What it is:** Next-generation frontend build tool and development server using native ES modules.
* **Why & how it is used in FreLock:**
  * Provides instant dev-server startup (`npm run dev` on port `5173`) and sub-second production builds (`npm run build`).
  * Configured with a built-in **reverse proxy** (`/api` → `http://localhost:5000`) in `vite.config.js`, allowing frontend and backend to communicate seamlessly as same-origin requests during development on both desktop and mobile devices on the same Wi-Fi network.

#### 3. Tailwind CSS 4 (`tailwindcss`, `@tailwindcss/postcss`, `postcss`)
* **What it is:** Utility-first CSS framework for rapid, consistent UI styling.
* **Why & how it is used in FreLock:**
  * Implements a custom **Fintech Design System** in `index.css` and `tailwind.config.js` using semantic CSS variables (`--background`, `--foreground`, `--card`, `--muted`, `--border`, `--primary`, `--secondary`).
  * Enables instant **Global Dark Mode & Light Mode** switching by toggling `html.dark`, automatically re-theming all cards, inputs, tables, badges, and modals across the entire frontend.
  * Includes custom keyframe animations (`animate-fade-in`, `animate-slide-up`, `animate-scale-in`, `animate-float`, `animate-pulse-soft`) and micro-interactions (`.card-hover`, button press states).

#### 4. React Router 7 (`react-router-dom`)
* **What it is:** Declarative client-side routing library for React.
* **Why & how it is used in FreLock:**
  * Manages navigation between public pages (`/`, `/login`, `/register`), Client/Freelancer pages (`/dashboard`, `/jobs`, `/jobs/create`, `/jobs/my`, `/jobs/applied`, `/escrow`, `/messages`, `/history`), and the Admin portal (`/admin`).
  * Works with `ProtectedRoute.jsx` to enforce role-based access control on the client side and redirect unauthenticated users.

#### 5. Lucide React (`lucide-react`)
* **What it is:** Clean, lightweight SVG icon library.
* **Why & how it is used in FreLock:**
  * Provides visual cues for fintech states (shields, locks, rupee symbols, wallets, dispute flags, and theme toggles).

---

### 2.2 Backend Technologies

#### 1. Node.js & Express (`express`)
* **What it is:** Event-driven JavaScript runtime and minimalist REST API framework.
* **Why & how it is used in FreLock:**
  * Exposes a modular RESTful API under `/api/*` structured into **Routes → Controllers → Models → Utils**.
  * Handles JSON parsing (capped at `100kb` to prevent payload abuse), request validation, and centralized error handling (`middleware/errorHandler.js`).

#### 2. MongoDB Atlas & Mongoose (`mongoose`)
* **What it is:** Cloud-hosted NoSQL document database and Object Data Modeling (ODM) library.
* **Why & how it is used in FreLock:**
  * Stores 8 core collections: `Users`, `Wallets`, `Jobs`, `Escrows`, `Disputes`, `Transactions`, `Messages`, and `Wishlists`.
  * **Concurrency & Atomic Money Safety:** Uses MongoDB's atomic `findOneAndUpdate` with conditional filters (e.g., `{ userId, balance: { $gte: amount } }` with `$inc: { balance: -amount }`, and conditional state transitions `status: { $in: ['SUBMITTED'] } → 'RELEASED'`) so that simultaneous requests can never double-spend a wallet or pay out an escrow twice.

#### 3. JSON Web Tokens (`jsonwebtoken`)
* **What it is:** Compact, cryptographically signed token standard (RFC 7519) for stateless authentication.
* **Why & how it is used in FreLock:**
  * Issued on login/registration with a 24-hour expiry containing `{ id, role }`.
  * Verified on every protected request by `middleware/authMiddleware.js`, which also checks the live database record to ensure frozen accounts are blocked immediately.

#### 4. Bcrypt (`bcryptjs`)
* **What it is:** Adaptive cryptographic hashing function with per-record salt.
* **Why & how it is used in FreLock:**
  * Hashes both user account passwords and 4-digit wallet PINs (`pinHash`). Plain-text passwords and PINs are never stored in MongoDB or returned in API responses.

#### 5. Built-in Security & Testing Utilities
* **PIN Brute-Force Lockout (`utils/walletPin.js`):** Automatically locks wallet operations for 15 minutes after 5 consecutive wrong PIN attempts.
* **NoSQL Operator Injection Guard (`middleware/security.js`):** Rejects any request payload containing `$`-prefixed keys or dotted paths (e.g., `{ "$ne": null }`).
* **Rate Limiter (`utils/rateLimit.js`):** Protects authentication endpoints against brute-force login attempts.
* **Offline Escrow Logic Test Suite (`test/escrow.test.js`):** Runs 47 automated assertions (`npm test`) testing the entire escrow lifecycle, race conditions, and money conservation without requiring a live database connection.

---

## 3. Core Functional Modules

1. **Authentication & Role Management:** Login, registration, and automatic seeding of Demo Admin, Client, and Freelancer accounts.
2. **INR Digital Wallet & 4-Digit PIN Vault:** Simulated UPI/Card/NetBanking top-ups, PIN setup/change, and Admin balance assignment.
3. **Job Marketplace & Wishlist:** Clients post jobs with budgets locked in escrow; Freelancers search, wishlist, and apply.
4. **Escrow State Engine:** Manages `HELD → SUBMITTED → RELEASED`, `REFUNDED`, and `DISPUTED` states with atomic guarantees.
5. **Dispute Resolution Center:** Clients or Freelancers raise disputes with reasons; Admin awards the locked escrow to the rightful party.
6. **Per-Job Messaging:** Pre-application and post-hire chat threads between Clients and Freelancers with unread badge counts.
7. **Immutable Audit Ledger:** Every fund movement (`ESCROW_FUND`, `PAYMENT_RELEASE`, `REFUND`, `ADMIN_ADJUSTMENT`, `WALLET_TOPUP_*`) writes a permanent `Transaction` record.

