# Recovery Credit 6 (Umusa)

A modern, clean debt collection and recovery portfolio management system built with Next.js (App Router), TypeScript, and Tailwind CSS.

---

## Features

- **Authentication & Authorization**
  - Secure sign-in system with preconfigured credentials (`admin` / `admin123`).
  - Auth guards protecting internal dashboard and management pages.

- **Minimalist Dashboard (Inspired by Modern Clean SaaS)**
  - Crisp white background layout with subtle borders and typography.
  - Quick KPI overview: **Total Debtors**, **Total Outstanding Amount**, **Collected Funds**, and **Net Due Balance**.
  - Recovery category statistics and priority flag counts.
  - Recent debtors table for fast access.

- **Debtor File Management**
  - Track complete debtor records:
    - Account Number & Customer ID
    - Debtor / Client Name
    - Bank Name
    - Outstanding Amount & Paid Amount
    - Outstanding Balance (auto-calculated)
    - Date of Payment
    - WhatsApp Contact Number
    - Notes & History
  - Search, filter by Category or Priority Flag, and sort files.
  - CSV export and bulk CSV import.

- **Status Categories**
  - **Completed**
  - **Paying**
  - **Promise to Pay**
  - **Schedule Meeting**
  - **Waiver Letter**
  - **Disputed**
  - **Negotiation**
  - **Skip Tracing**

- **Color Priority Flags**
  - Red, Blue, Yellow, and Green priority flags to highlight critical accounts.

- **WhatsApp Payment Reminders**
  - One-click payment reminder generator linking directly to `wa.me` with pre-filled debt details and outstanding balance.

- **Payment & Activity Tracking**
  - Record payments per debtor with instant balance recalculation.
  - Timeline of activities: notes, meetings scheduled, reminder letters, phone calls, and negotiations.

---

## Project Structure

```
recovery-credit-6/
├── src/
│   ├── app/
│   │   ├── (app)/
│   │   │   ├── dashboard/page.tsx       # Main analytics dashboard
│   │   │   ├── debtors/
│   │   │   │   ├── page.tsx             # Debtors list & search table
│   │   │   │   ├── add/page.tsx         # Add new debtor
│   │   │   │   └── [id]/
│   │   │   │       ├── page.tsx         # Debtor file details, payments & activity
│   │   │   │       └── edit/page.tsx    # Edit debtor file
│   │   │   ├── upload/page.tsx          # CSV bulk upload
│   │   │   └── layout.tsx               # Top bar header & hamburger navigation
│   │   ├── globals.css                  # Minimal typography and light styles
│   │   ├── layout.tsx                   # Root HTML wrapper
│   │   └── page.tsx                     # Clean login page
│   ├── components/
│   │   ├── AuthGuard.tsx                # Client session protector
│   │   ├── CategoryBadge.tsx            # Clean pill badge with status dot
│   │   ├── DebtorFormFields.tsx         # Form fields component
│   │   ├── FlagDot.tsx                  # Priority flag indicator
│   │   ├── Sidebar.tsx                  # Collapsible hamburger icon rail
│   │   └── StatsCard.tsx                # Dashboard metric cards
│   └── lib/
│       ├── constants.ts                 # Category styles, flag colors & action types
│       ├── store.ts                     # Local storage data layer, CSV parser & calculations
│       └── types.ts                     # TypeScript data interfaces
└── package.json
```

---

## Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Run the Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 3. Default Login Credentials
- **Username**: `admin`
- **Password**: `admin123`

---

## CSV Bulk Upload Format

When importing debtors in the **Upload** page, format your CSV with the following headers:

```csv
accountNumber,customerId,clientName,bankName,outstandingAmount,paidAmount,dateOfPayment,whatsappNumber,category,colorFlag,notes
ACC-1001,CUST-001,John Doe,Standard Bank,15000,5000,2026-09-15,+27821234567,paying,red,Contacted customer regarding remaining balance.
```

---

## Build for Production

```bash
npm run build
npm start
```
