# FreLock — Secure Escrow Platform

A full-stack fintech web application that holds client payments in escrow until freelance work is delivered and approved. Built with **React + Vite**, **Tailwind CSS**, **Express**, and **MongoDB Atlas**.

---

## Features

- **Role-based access** — Admin, Client, and Freelancer dashboards
- **Global Light & Dark Mode** — Instant theme switching across the entire UI
- **Wallet system** — INR (₹) balances with 4-digit PIN protection and brute-force lockout
- **Job marketplace** — Post, browse, wishlist, apply, and accept jobs
- **Escrow payments** — Budget locked in escrow when a job is posted; released on client approval
- **Messaging** — Per-job chat, including questions before applying, with unread counts
- **Dispute handling** — Client or freelancer raises a dispute; admin awards the escrow to the rightful party
- **Transaction history** — Full audit trail of wallet and escrow activity
- **Atomic money movement** — No double-spend or double-payout under concurrent requests

---

## Tech Stack

| Layer    | Technology                                           |
|----------|------------------------------------------------------|
| Frontend | React 19, Vite 8, Tailwind CSS 4, React Router 7    |
| Backend  | Node.js, Express, JWT Authentication                 |
| Database | MongoDB Atlas (Mongoose)                             |
| Currency | INR (₹)                                              |

---

## Project Structure

```
FreLock/
├── backend/                  # Express REST API
│   ├── config/               # Database connection
│   ├── controllers/          # Business logic
│   ├── middleware/           # Auth + role guards, injection guard, error handler
│   ├── models/               # Mongoose schemas (incl. Dispute)
│   ├── routes/               # API route definitions
│   ├── utils/                # Atomic wallet/escrow ops, PIN, auth, seed
│   └── test/                 # Offline escrow logic test (npm test)
│
├── frontend/                 # React SPA (Light/Dark theme + responsive UI)
│   ├── public/               # Static assets
│   └── src/
│       ├── pages/            # Route pages
│       ├── components/       # UI primitives, dashboard layout, wallet panel
│       ├── context/          # AuthContext & ThemeContext
│       ├── services/         # Central API client (api.js)
│       └── constants/        # Roles, currency, navigation, landing copy
│
├── docs/                     # Project documentation
│   ├── PROJECT_DESCRIPTION.md # Detailed description & technology stack explanation
│   └── COMPLETE_REPORT.md     # Full consolidated project report
│
└── README.md
```

---

## Setup & Running Locally

### 1. Install dependencies

```bash
cd backend && npm install
cd ../frontend && npm install
```

### 2. Configure backend environment

Copy `backend/.env.example` to `backend/.env` and set your MongoDB connection string:

```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/frelock?retryWrites=true&w=majority
JWT_SECRET=your-secret-key-here
CORS_ORIGIN=
SEED_DEMO_USERS=true
```

### 3. Start Backend & Frontend (2 Terminals)

- **Terminal 1 — Backend (`http://localhost:5000`):**
  ```bash
  cd backend
  npm run dev
  ```
- **Terminal 2 — Frontend (`http://localhost:5173`):**
  ```bash
  cd frontend
  npm run dev
  ```

### 4. Run Offline Logic Tests (No Database Required)

```bash
cd backend
npm test
```

---

## Demo Accounts

| Role       | Email                   | Password              |
|------------|-------------------------|-----------------------|
| Admin      | admin@escrow.com        | Admin@FintechEL2026   |
| Client     | client@escrow.com       | client123             |
| Freelancer | freelancer@escrow.com   | freelancer123         |

---

## Documentation

- [Detailed Project Description & Tech Stack](./docs/PROJECT_DESCRIPTION.md)
- [Complete Project Report](./docs/COMPLETE_REPORT.md)
