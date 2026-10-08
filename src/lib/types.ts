export interface User {
  id: string;
  username: string;
  email: string;
  password: string;
  fullName: string;
  role: 'admin' | 'collector';
  isEmailVerified?: boolean;
  createdAt: string;
}

export interface Debtor {
  id: string;
  accountNumber: string;
  customerId: string;
  debtorName: string;       // Bank client (Debtor)
  clientName: string;       // Bank (Client)
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

export type Category = 'completed' | 'paying' | 'promise_to_pay' | 'schedule_meeting' | 'waiver_letter' | 'disputed' | 'negotiation' | 'skip_tracing';

export type ColorFlag = 'none' | 'red' | 'blue' | 'yellow' | 'green';

export type ActivityType = 'note' | 'meeting_scheduled' | 'reminder_sent' | 'call_made' | 'email_sent' | 'letter_sent' | 'status_change' | 'payment_recorded';
