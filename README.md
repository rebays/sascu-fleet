# SASCU Fleet

A vehicle rental & booking platform built for the Solomon Airlines Staff & Savings Credit Union (SASCU) fleet. The system lets customers browse vehicles and book them without creating an account, lets staff manage the fleet, bookings, payments and invoices from a dashboard, and exposes everything through a single REST API.

This is a monorepo with three independent apps:

| App | Path | What it's for | Stack |
|---|---|---|---|
| **Backend API** | [`backend/`](backend) | REST API — auth, vehicles, bookings, payments, invoices, reporting, transactional email | Node.js, Express, MongoDB (Mongoose) |
| **Admin Dashboard** | [`admin-dashboard/`](admin-dashboard) | Internal tool for staff to manage the fleet, bookings, customers and reports | Next.js (App Router), React 19, TypeScript, Tailwind CSS, shadcn/ui, Recharts |
| **Client** | [`client/`](client) | Public booking site customers use to browse vehicles and book — no account required | Next.js (App Router), React 19, TypeScript, Tailwind CSS, shadcn/ui |

## Documentation

- **[Admin User Guide](docs/ADMIN_GUIDE.md)** — how staff use the Admin Dashboard day to day (vehicles, bookings, payments, invoices, users, reports)
- **[Client User Guide](docs/CLIENT_GUIDE.md)** — how customers browse, book, and track a rental on the public site

## Features

### Customer-facing (client)
- Browse the full fleet or search availability by pickup/return date and vehicle type
- Vehicle detail pages with a photo carousel, daily & half-day rates, and a live date-conflict check against existing confirmed bookings
- Guest checkout — no login or account needed to book; identity is tracked via a booking reference
- Instant booking confirmation with a trackable reference (`BOOK-YYYYMMDD-###`)
- **Track Booking** — look up status, payment balance, and rental details at any time using just the booking reference
- Payment is arranged after staff review (a payment link/instructions is sent separately) — there is no online card payment step in the booking flow itself

### Staff (Admin Dashboard)
- Role-based login for staff (`admin` and `superadmin`)
- Dashboard overview with revenue/booking charts, KPIs, date-range filtering, and an Excel export
- Fleet management: add/edit vehicles, upload photos, set tiered pricing (day/half-day × in-town/out-of-town × regular/member), activate/deactivate, and delete with a safety check that blocks deleting vehicles that still have active bookings
- Booking management: create or edit bookings on a customer's behalf, approve/reject pending requests, cancel confirmed bookings, record payments, and preview/print invoices and receipts — with full status history and double-booking conflict checks
- Customer & staff management: search/filter users, toggle SASCU membership, manage roles and admin accounts (superadmin only)
- Self-service password reset and "forgot password" email flow
- Automatic email notifications to customers for booking received/updated/cancelled, status changes, and payments recorded

### Backend API
- JWT-based authentication with a three-tier role model (`user` / `admin` / `superadmin`)
- Vehicle, booking, payment, invoice, and user management endpoints
- Auto-generated booking references (`BOOK-YYYYMMDD-###`) and invoice numbers (`INV-YYYYMMDD-###`)
- PDF invoice/receipt generation
- Branded transactional email (booking lifecycle, password reset) via [Resend](https://resend.com)
- Reporting endpoints (revenue, bookings by status/vehicle type, top vehicles) with CSV/Excel export for the dashboard
- Vehicle photo storage via Vercel Blob

## Repository Structure

```
sascu-fleet/
├── backend/              # Express + MongoDB REST API
├── admin-dashboard/      # Next.js staff dashboard
├── client/               # Next.js public booking site
├── docs/
│   ├── ADMIN_GUIDE.md    # Staff-facing user guide
│   └── CLIENT_GUIDE.md   # Customer-facing user guide
└── invoice.html          # Static invoice design reference
```

## Getting Started

Each app has its own `package.json`, `.env.example`, and `README.md` — install and run them independently.

### Prerequisites

- Node.js LTS
- A MongoDB connection (local or Atlas)
- A [Resend](https://resend.com) account + API key (for transactional email)
- A [Vercel Blob](https://vercel.com/docs/storage/vercel-blob) read/write token (for vehicle photo uploads)

### 1. Backend API

```bash
cd backend
npm install
cp .env.example .env   # fill in real values
npm run dev             # http://localhost:5000
```

### 2. Admin Dashboard

```bash
cd admin-dashboard
npm install
cp .env.example .env   # points at the backend API
npm run dev             # http://localhost:3000 (or next available port)
```

### 3. Client (public booking site)

```bash
cd client
npm install
cp .env.example .env   # points at the backend API
npm run dev
```

> Run the admin dashboard and client on different ports if running all three apps locally at once — pass `-- -p <port>` to `npm run dev`, e.g. `npm run dev -- -p 3001`.

## Environment Variables

Each app ships a `.env.example` with placeholder values and inline comments — copy it to `.env` and fill in real values. **Never commit a real `.env` file.**

| App | Key variables |
|---|---|
| `backend` | `MONGO_URI`, `JWT_SECRET`, `FRONTEND_URL`, `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `ADMIN_NOTIFICATION_EMAIL`, `BLOB_READ_WRITE_TOKEN`, `COMPANY_*` (branding shown on emails/invoices) |
| `admin-dashboard` | `NEXT_PUBLIC_API_URL` (backend URL), `BLOB_READ_WRITE_TOKEN` |
| `client` | `NEXT_PUBLIC_API_URL` (backend URL) |

## License

MIT License — free to use commercially or modify.

## Author

Built by the Rebays team.
