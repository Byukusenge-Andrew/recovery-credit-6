export interface User {
  id: string;
  username: string;
  email: string;
  password: string;
  fullName: string;
  role: 'admin' | 'collector';
  isEmailVerified?: boolean;
  mustChangePassword?: boolean;
  createdAt: string;
}

export interface FinancialInstitution {
  id: string;
  name: string;
  code?: string;
  institutionType?: 'commercial_bank' | 'microfinance' | 'credit_union' | 'fintech' | 'other';
  contactPerson?: string;
  email?: string;
  phone?: string;
  address?: string;
  notes?: string;
  createdAt: string;
}

export interface Debtor {
  id: string;
  accountNumber: string;
  customerId: string;
  debtorName: string;       // Bank client (Debtor)
  clientName: string;       // Bank (Client)
  bankName?: string;
  institutionId?: string;
  outstandingAmount: number;
  paidAmount: number;
  dateOfPayment: string;
  outstandingBalance: number;
  whatsappNumber: string;
  category: Category;
  colorFlag: ColorFlag;
  assignedCollector?: string; // Optional assigned collector username
  notes: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

export interface Notification {
  id: string;
  recipientUsername: string; // The collector who receives the notification
  title: string;
  message: string;
  debtorId?: string;
  debtorName?: string;
  clientName?: string;
  amount?: number;
  isRead: boolean;
  createdAt: string;
}

export interface Payment {
  id: string;
  debtorId: string;
  amountPaid: number;
  paymentDate: string;
  recordedBy: string;
  notes: string;
}

export interface Activity {
  id: string;
  debtorId: string;
  activityType: ActivityType;
  description: string;
  scheduledDate?: string;
  createdAt: string;
  createdBy: string;
}

export interface EnrichedActivity extends Activity {
  debtorName?: string;
  accountNumber?: string;
  clientName?: string;
  bankName?: string;
  customerId?: string;
  collectorFullName?: string;
}

export interface ActivitySummary {
  totalActivities: number;
  callsMade: number;
  meetingsScheduled: number;
  notesLogged: number;
  debtorsReached: number;
}

export interface CollectorPerformance {
  id: string;
  username: string;
  fullName: string;
  email: string;
  role: 'collector' | 'admin';
  createdAt: string;
  assignedDebtorsCount: number;
  totalOutstanding: number;
  totalPaid: number;
  remainingBalance: number;
  recoveryRate: number;
  uncontactedCount: number;
  totalInteractions: number;
  callsMade: number;
  meetingsScheduled: number;
  notesLogged: number;
  lastActiveAt?: string | null;
  activityStatus: 'top_performer' | 'active' | 'needs_attention' | 'inactive';
}

export interface AgencyCollectorDashboardSummary {
  totalCollectors: number;
  activeCollectors: number;
  inactiveCollectors: number;
  totalAssignedDebtors: number;
  totalAssignedClaim: number;
  totalAssignedPaid: number;
  totalRemainingBalance: number;
  overallRecoveryRate: number;
  totalInteractions: number;
  totalUncontactedDebtors: number;
  unassignedDebtorsCount: number;
  unassignedBalance: number;
}

export type Category = 'completed' | 'paying' | 'promise_to_pay' | 'schedule_meeting' | 'waiver_letter' | 'disputed' | 'negotiation' | 'skip_tracing';

export type ColorFlag = 'none' | 'red' | 'blue' | 'yellow' | 'green';

export type ActivityType = 'note' | 'meeting_scheduled' | 'reminder_sent' | 'call_made' | 'email_sent' | 'letter_sent' | 'status_change' | 'payment_recorded';

export type AuditAction = 
  | 'create_debtor'
  | 'update_debtor'
  | 'delete_debtor'
  | 'record_payment'
  | 'update_payment'
  | 'delete_payment'
  | 'log_activity'
  | 'import_csv'
  | 'add_collector'
  | 'create_institution'
  | 'update_institution'
  | 'delete_institution'
  | 'update_user'
  | 'login'
  | 'logout';

export interface AuditLog {
  id: string;
  timestamp: string;
  actorId: string;
  actorUsername: string;
  actorFullName: string;
  actorRole: 'admin' | 'collector';
  action: AuditAction;
  targetType: 'debtor' | 'payment' | 'user' | 'system' | 'institution';
  targetId?: string;
  targetDescription: string;
  details: string;
  ipAddress?: string;
}

export interface DashboardStats {
  totalDebtors: number;
  totalOutstanding: number;
  totalPaid: number;
  totalBalance: number;
  outstandingBalance: number;
  categoryCounts: Record<Category, number>;
  flagCounts: Record<ColorFlag, number>;
  clientsCount: number;
}

