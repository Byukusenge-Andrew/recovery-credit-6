# Recovery Credit 6 (Umusa)

Debt Recovery & Credit Portfolio Management System built with Next.js (App Router), TypeScript, and Tailwind CSS.

---

## Terminology

- **Client**: The **Bank / Lending Institution** (e.g. *Standard Bank*, *Absa*, *Nedbank*, *First National Bank*, etc.).
- **Debtor**: The **Bank Client** who owes the outstanding credit balance.

---

## Data Download & Upload Features

### 1. Download Information
- Accessible from both the **Dashboard** and **Debtors** pages via the **"Download All Data"** button.
- Exports a complete CSV report containing:
  - Client (Bank Name)
  - Debtor (Bank Client Name)
  - Account Number & Customer ID
  - Total Outstanding Amount & Paid Amount
  - Net Balance Due
  - Payment Due Date
  - WhatsApp Number
  - Category & Color Flag
  - Assigned Collector (if assigned)
  - Case Notes

### 2. Upload Information (Bulk CSV Import)
- On the **/upload** page, you can import debtor files in bulk.
- Click **"Download Sample CSV Template"** for the exact column headers:
  ```csv
  client,debtor,accountNumber,customerId,outstandingAmount,paidAmount,dateOfPayment,whatsappNumber,category,colorFlag,collector,notes
  ```

---

## Lifecycle Categories & Color Flags

### Categories:
- **Completed** (Fully paid)
- **Paying** (Active payment plan)
- **Promise to Pay** (Commitment date recorded)
- **Schedule Meeting** (Consultation scheduled)
- **Waiver Letter** (Settlement discount requested)
- **Disputed** (Disputed obligation)
- **Negotiation** (Ongoing settlement discussions)
- **Skip Tracing** (Location tracing in progress)

### Priority Flags:
- **Red** (High Priority / Urgent Action)
- **Blue** (Standard Follow-Up)
- **Yellow** (Pending Review)
- **Green** (On Track)

---

## Getting Started

```bash
cd d:\Tony\recovery-credit-6
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser:
- **Landing Page**: [http://localhost:3000/](http://localhost:3000/)
- **Agent Login**: [http://localhost:3000/login](http://localhost:3000/login)
  - Initial Administrator: `admin` / `admin`
