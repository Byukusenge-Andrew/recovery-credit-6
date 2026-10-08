# Recovery Credit 6 (Umusa)

Debt Recovery & Credit Portfolio Management System built with Next.js (App Router), TypeScript, and Tailwind CSS.

---

## How the System Works & Assignment Notifications

```
┌────────────────────────────────────────────────────────────────────────┐
│                              ADMIN (You)                               │
│  - Registers Debt Collectors under /collectors                         │
│  - Enters Client (Financial institution / Bank) & Debtor               │
│  - Assigns Debtor to a Collector                                       │
│                                                                        │
│    ⚡ TRIGGER: As soon as a debtor is assigned or reassigned,           │
│    an automated notification message is dispatched to that collector.  │
└────────────────────────────────────┬───────────────────────────────────┘
                                     │
                      Instant Alert  │
                                     ▼
        ┌────────────────────────────────────────────────────────┐
        │                    DEBT COLLECTOR                      │
        │  1. Logs in with their assigned username & password     │
        │  2. Notification bell rings with unread counter badge   │
        │  3. Prominent real-time alert banner on their Dashboard │
        │  4. Clicking the notification opens the case directly   │
        └────────────────────────────────────────────────────────┘
```

---

## Notification System Architecture

1. **Automatic Assignment Notification**:
   - When a Debtor is created via `/debtors/add` and assigned to a collector, a notification is generated:
     > *"New Debtor Case Assigned: You have been assigned to recover a balance of R [amount] for debtor [Debtor Name] from client [Client Name]."*
   - When an existing Debtor is edited and reassigned to a new collector via `/debtors/[id]/edit`, an alert is dispatched to the new collector.
   - Bulk CSV uploads specifying `collector` will automatically send notifications to those collectors.

2. **Interactive Notification Bell (`NotificationBell.tsx`)**:
   - Located on the top navigation bar.
   - Displays real-time unread count badge.
   - Dropdown menu showing timestamps, case summary, unread indicator, and **"Open Case File →"** direct link.
   - Support for **"Mark all read"**.

3. **Dashboard Real-Time Alert Banner**:
   - Displays right at the top of the collector's dashboard when they sign in to immediately highlight their latest assigned account.

---

## Core Entities & Terminology

1. **Admin**:
   - The agency manager. Registers collectors, inputs clients & debtors, assigns/reassigns files, and exports reports.
   - Initial credentials: `admin` / `admin`

2. **Debt Collectors**:
   - Recovery officers registered by the Admin in `/collectors`.
   - Log in with their own credentials.
   - Receive instant notifications when cases are assigned to them.

3. **Client (Bank / Creditor)**:
   - The financial institution or creditor company claiming the debt (e.g. *Standard Bank*, *Absa*, *Nedbank*).

4. **Debtor (Bank Client)**:
   - The person who owes the money. Linked to a Client and assigned to a Collector.

---

## Running the Application

```bash
cd d:\Tony\recovery-credit-6
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser:
- **Landing Page**: [http://localhost:3000/](http://localhost:3000/)
- **Sign In Portal**: [http://localhost:3000/login](http://localhost:3000/login)
  - Admin: `admin` / `admin`
