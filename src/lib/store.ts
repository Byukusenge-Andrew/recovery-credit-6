import { User, Debtor, Payment, Activity, Category, ColorFlag, ActivityType, Notification, AuditLog, AuditAction } from './types';

// ZERO user data or sensitive data is kept in browser storage.
// User details are loaded into memory via GET /api/auth/me from Neon PostgreSQL.
// Only the opaque signed session token is kept in sessionStorage ('rc6_token') as a fallback.
let inMemoryUser: User | null = null;

/**
 * Clean up legacy storage and ensure no sensitive data is retained in browser storage.
 */
export function initializeStore(): void {
  if (typeof window !== 'undefined') {
    try {
      localStorage.removeItem('rc6_users');
      localStorage.removeItem('rc6_debtors');
      localStorage.removeItem('rc6_payments');
      localStorage.removeItem('rc6_activities');
      localStorage.removeItem('rc6_notifications');
      localStorage.removeItem('rc6_audit_logs');
      sessionStorage.removeItem('rc6_session'); // Legacy full user session purged
    } catch {
      // ignore
    }
  }
}

// ---------------------------------------------------------------------
// AUTHENTICATION & SESSION MANAGEMENT (Pure Memory User + /api/auth/me)
// ---------------------------------------------------------------------

export function setAuthUser(user: User | null): void {
  inMemoryUser = user;
}

export function getCurrentUser(): User | null {
  return inMemoryUser;
}

export function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return sessionStorage.getItem('rc6_token');
  } catch {
    return null;
  }
}

export function setAuthToken(token: string | null): void {
  if (typeof window === 'undefined') return;
  try {
    if (token) {
      sessionStorage.setItem('rc6_token', token);
    } else {
      sessionStorage.removeItem('rc6_token');
    }
  } catch {
    // ignore
  }
}

export function isLoggedIn(): boolean {
  return inMemoryUser !== null || getAuthToken() !== null;
}

export function logout(): void {
  inMemoryUser = null;
  setAuthToken(null);
  if (typeof window !== 'undefined') {
    try {
      sessionStorage.removeItem('rc6_session');
      sessionStorage.removeItem('rc6_token');
    } catch {
      // ignore
    }
  }
}

export function login(usernameOrEmail: string, password: string): User | null {
  // Offline fallback if necessary; primary auth is handled via authApi.login()
  const user = inMemoryUser;
  if (user && (user.username.toLowerCase() === usernameOrEmail.trim().toLowerCase() || user.email.toLowerCase() === usernameOrEmail.trim().toLowerCase())) {
    return user;
  }
  return null;
}

// ---------------------------------------------------------------------
// AUDIT LOGGING (Memory / Server API driven)
// ---------------------------------------------------------------------

export function appendAuditLog(entry: {
  action: AuditAction;
  targetType: 'debtor' | 'payment' | 'user' | 'system' | 'institution';
  targetId?: string;
  targetDescription: string;
  details: string;
}): AuditLog {
  const currentUser = getCurrentUser();
  const newLog: AuditLog = {
    id: `aud-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`,
    timestamp: new Date().toISOString(),
    actorId: currentUser?.id || 'sys',
    actorUsername: currentUser?.username || 'system',
    actorFullName: currentUser?.fullName || 'System Automated',
    actorRole: currentUser?.role || 'admin',
    action: entry.action,
    targetType: entry.targetType,
    targetId: entry.targetId,
    targetDescription: entry.targetDescription,
    details: entry.details,
    ipAddress: typeof window !== 'undefined' ? (window.location.hostname || '127.0.0.1') : '127.0.0.1'
  };
  return newLog;
}

export function getAuditLogs(): readonly AuditLog[] {
  return [];
}

// ---------------------------------------------------------------------
// USERS & COLLECTORS (In-memory fallbacks; fetched via /api/collectors)
// ---------------------------------------------------------------------

export function getUsers(): User[] {
  const currentUser = getCurrentUser();
  return currentUser ? [currentUser] : [];
}

export function getCollectors(): User[] {
  const currentUser = getCurrentUser();
  return currentUser && currentUser.role === 'collector' ? [currentUser] : [];
}

export function addUser(userData: Omit<User, 'id' | 'createdAt'>): User {
  return {
    ...userData,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString()
  };
}

export function exportCollectorsCSV(collectorsList?: User[], debtorsList?: Debtor[]): string {
  const collectors = collectorsList || [];
  const debtors = debtorsList || [];

  const headers = ['Username', 'Full Name', 'Email', 'Role', 'Email Verified', 'Assigned Debtors Count', 'Created At'];
  const rows = collectors.map(c => {
    const assignedCount = debtors.filter(d => d.assignedCollector?.toLowerCase() === c.username.toLowerCase()).length;
    return [
      c.username,
      c.fullName,
      c.email || '',
      c.role,
      c.isEmailVerified ? 'Yes' : 'No',
      assignedCount.toString(),
      c.createdAt || ''
    ].map(field => `"${field}"`).join(',');
  });

  return [headers.join(','), ...rows].join('\n');
}

export function parseCollectorsCSV(csvText: string): {
  parsedCollectors: { username: string; fullName: string; email: string; password: string }[];
  successCount: number;
  errorCount: number;
  errors: string[];
} {
  const result = {
    parsedCollectors: [] as { username: string; fullName: string; email: string; password: string }[],
    successCount: 0,
    errorCount: 0,
    errors: [] as string[]
  };

  const lines = csvText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  if (lines.length <= 1) {
    result.errors.push('CSV file is empty or missing data rows');
    return result;
  }

  const headers = lines[0].split(',').map(h => h.replace(/^["'\s]+|["'\s]+$/g, '').trim().toLowerCase());
  const getHeaderIdx = (...aliases: string[]) => {
    return headers.findIndex(h => aliases.some(alias => h.includes(alias.toLowerCase())));
  };

  const userIdx = getHeaderIdx('username', 'user', 'uname', 'login');
  const nameIdx = getHeaderIdx('full_name', 'fullname', 'full name', 'name', 'officer', 'collector');
  const emailIdx = getHeaderIdx('email', 'mail', 'e-mail');
  const passIdx = getHeaderIdx('password', 'pass', 'pwd');

  for (let i = 1; i < lines.length; i++) {
    try {
      const rowString = lines[i];
      const matches = rowString.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g);
      const row = matches ? matches.map(m => m.replace(/^"|"$/g, '').replace(/""/g, '"').trim()) : [];
      if (row.length < 2) continue;

      const getVal = (idx: number) => (idx !== -1 && idx < row.length ? row[idx].trim() : '');

      let fullName = getVal(nameIdx);
      let email = getVal(emailIdx).toLowerCase();
      let username = getVal(userIdx).toLowerCase();
      const password = getVal(passIdx) || 'collector123';

      if (!username) {
        if (email) {
          username = email.split('@')[0].replace(/[^a-z0-9_]/g, '_');
        } else if (fullName) {
          username = fullName.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
        }
      }

      if (!fullName && username) {
        fullName = username.replace(/[._]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      }

      if (!email && username) {
        email = `${username}@recoverycredit.internal`;
      }

      if (!username || !email) {
        result.errorCount++;
        result.errors.push(`Row ${i + 1}: Could not determine valid username or email.`);
        continue;
      }

      result.parsedCollectors.push({ username, fullName, email, password });
      result.successCount++;
    } catch (err: any) {
      result.errorCount++;
      result.errors.push(`Row ${i + 1}: ${err.message || 'Error parsing line'}`);
    }
  }

  return result;
}

export function importCollectorsFromCSV(csvText: string): { successCount: number; errorCount: number; errors: string[] } {
  const parsed = parseCollectorsCSV(csvText);
  return {
    successCount: parsed.successCount,
    errorCount: parsed.errorCount,
    errors: parsed.errors
  };
}

// ---------------------------------------------------------------------
// NOTIFICATIONS (Fetched via /api/notifications)
// ---------------------------------------------------------------------

export function getNotifications(recipientUsername?: string): Notification[] {
  return [];
}

export function getUnreadNotificationsCount(recipientUsername?: string): number {
  return 0;
}

export function markNotificationAsRead(id: string): void {}

export function markAllNotificationsAsRead(recipientUsername?: string): void {}

export function createNotification(notif: {
  recipientUsername: string;
  title: string;
  message: string;
  debtorId?: string;
  debtorName?: string;
  clientName?: string;
  amount?: number;
}): Notification {
  return {
    id: crypto.randomUUID(),
    recipientUsername: notif.recipientUsername,
    title: notif.title,
    message: notif.message,
    debtorId: notif.debtorId,
    debtorName: notif.debtorName,
    clientName: notif.clientName,
    amount: notif.amount,
    isRead: false,
    createdAt: new Date().toISOString()
  };
}

// ---------------------------------------------------------------------
// DEBTORS & PAYMENTS (Fetched via /api/debtors and /api/debtors/[id])
// ---------------------------------------------------------------------

export function getDebtors(): Debtor[] {
  return [];
}

export function getDebtor(id: string): Debtor | null {
  return null;
}

export function addDebtor(debtorData: Omit<Debtor, 'id' | 'createdAt' | 'updatedAt' | 'outstandingBalance'>): Debtor {
  const outstandingAmount = Math.max(0, Number(debtorData.outstandingAmount || 0));
  const paidAmount = Math.min(outstandingAmount, Math.max(0, Number(debtorData.paidAmount || 0)));
  const outstandingBalance = outstandingAmount - paidAmount;
  const now = new Date().toISOString();

  return {
    ...debtorData,
    outstandingAmount,
    paidAmount,
    id: crypto.randomUUID(),
    outstandingBalance,
    createdAt: now,
    updatedAt: now
  };
}

export function updateDebtor(id: string, updates: Partial<Debtor>): Debtor | null {
  return null;
}

export function deleteDebtor(id: string): void {}

export function searchDebtors(query: string, categoryFilter?: Category, flagFilter?: ColorFlag, clientFilter?: string): Debtor[] {
  return [];
}

export function getPayments(debtorId: string): Payment[] {
  return [];
}

export function addPayment(paymentData: {
  debtorId: string;
  amountPaid: number;
  paymentDate: string;
  recordedBy: string;
  notes?: string;
}): Payment {
  return {
    id: crypto.randomUUID(),
    debtorId: paymentData.debtorId,
    amountPaid: Number(paymentData.amountPaid || 0),
    paymentDate: paymentData.paymentDate || new Date().toISOString(),
    recordedBy: paymentData.recordedBy || 'Collector',
    notes: paymentData.notes || ''
  };
}

export function updatePayment(paymentId: string, updates: Partial<Payment>): Payment | null {
  return null;
}

export function deletePayment(paymentId: string): boolean {
  return true;
}

export function getActivities(debtorId: string): Activity[] {
  return [];
}

export function addActivity(activityData: {
  debtorId: string;
  activityType: ActivityType;
  description: string;
  scheduledDate?: string;
  createdBy: string;
}): Activity {
  return {
    id: crypto.randomUUID(),
    debtorId: activityData.debtorId,
    activityType: activityData.activityType,
    description: activityData.description,
    scheduledDate: activityData.scheduledDate,
    createdAt: new Date().toISOString(),
    createdBy: activityData.createdBy
  };
}

export interface DashboardStats {
  totalDebtors: number;
  totalOutstanding: number;
  totalPaid: number;
  totalBalance: number;
  outstandingBalance: number;
  clientsCount?: number;
  categoryCounts: Record<Category, number>;
  flagCounts: Record<ColorFlag, number>;
}

export function getDashboardStats(): DashboardStats {
  return {
    totalDebtors: 0,
    totalOutstanding: 0,
    totalPaid: 0,
    totalBalance: 0,
    outstandingBalance: 0,
    clientsCount: 0,
    categoryCounts: {
      completed: 0,
      paying: 0,
      promise_to_pay: 0,
      schedule_meeting: 0,
      waiver_letter: 0,
      disputed: 0,
      negotiation: 0,
      skip_tracing: 0
    },
    flagCounts: {
      none: 0,
      red: 0,
      blue: 0,
      yellow: 0,
      green: 0
    }
  };
}

export function updateUserProfile(updates: { fullName?: string; email?: string; password?: string }): { success: boolean; message: string; user?: User } {
  const user = getCurrentUser();
  if (!user) return { success: false, message: 'No active session' };

  const updatedUser: User = {
    ...user,
    fullName: updates.fullName || user.fullName,
    email: updates.email !== undefined ? updates.email : user.email
  };

  inMemoryUser = updatedUser;

  return { success: true, message: 'Profile updated successfully.', user: updatedUser };
}

// ---------------------------------------------------------------------
// CSV EXPORT (Memory / Direct Data Passed)
// ---------------------------------------------------------------------

export function exportClientsDebtorsCSV(debtorsList?: Debtor[]): string {
  const debtors = debtorsList || [];
  if (debtors.length === 0) return '';

  const headers = [
    'Client (Bank Name)',
    'Debtor (Bank Client)',
    'Account Number',
    'Customer ID',
    'Outstanding Amount',
    'Paid Amount',
    'Outstanding Balance',
    'Date of Payment',
    'WhatsApp Number',
    'Category',
    'Color Flag',
    'Assigned Collector',
    'Notes'
  ];

  const rows = debtors.map(d => [
    d.clientName || '',
    d.debtorName || '',
    d.accountNumber || '',
    d.customerId || '',
    (d.outstandingAmount || 0).toString(),
    (d.paidAmount || 0).toString(),
    (d.outstandingBalance || 0).toString(),
    d.dateOfPayment || '',
    d.whatsappNumber || '',
    d.category || '',
    d.colorFlag || '',
    d.assignedCollector || '',
    (d.notes || '').replace(/"/g, '""')
  ].map(field => `"${field}"`).join(','));

  return [headers.join(','), ...rows].join('\n');
}

// ---------------------------------------------------------------------
// SMART AUTO-CATEGORIZING CSV PARSER (Zero browser storage, outputs payload)
// ---------------------------------------------------------------------

export function parseClientsDebtorsCSV(
  csvText: string,
  defaultClientName?: string,
  defaultInstitutionId?: string
): {
  parsedDebtors: Debtor[];
  successCount: number;
  errorCount: number;
  errors: string[];
} {
  const result = {
    parsedDebtors: [] as Debtor[],
    successCount: 0,
    errorCount: 0,
    errors: [] as string[]
  };

  const user = getCurrentUser();
  const createdBy = user ? user.fullName : 'Admin';

  try {
    const lines = csvText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    if (lines.length <= 1) {
      result.errors.push('CSV file is empty or missing data rows');
      return result;
    }

    const rawHeaders = lines[0].split(',').map(h => h.replace(/^["'\s]+|["'\s]+$/g, '').trim().toLowerCase());
    const cleanHeaders = rawHeaders.map(h => h.replace(/[^a-z0-9]/g, ''));

    // Helper: finds first header index matching predicate while excluding specified indices
    const findHeader = (predicate: (clean: string, raw: string) => boolean, excludeIndices: number[] = []) => {
      return rawHeaders.findIndex((raw, idx) => {
        if (excludeIndices.includes(idx)) return false;
        return predicate(cleanHeaders[idx], raw);
      });
    };

    // 1. Debtor / Borrower Name (The individual owing debt)
    // Specifically matches debtor/borrower keywords (never client/bank)
    let debtorIdx = findHeader(c => 
      c.includes('debtor') || 
      c.includes('borrower') || 
      c === 'customername' || 
      c === 'custname' ||
      c === 'accountname'
    );

    // 2. Client / Bank / Financial Institution (The creditor bank)
    // Specifically matches bank/creditor keywords, excluding debtorIdx
    let clientIdx = findHeader(c => 
      c.includes('bank') || 
      c.includes('institution') || 
      c.includes('funder') || 
      c.includes('lender') || 
      c === 'clientname' || 
      c === 'client',
      debtorIdx !== -1 ? [debtorIdx] : []
    );

    // 3. Fallback for Debtor Name if no explicit 'debtor'/'borrower' column was found
    if (debtorIdx === -1) {
      // Look for generic name columns (excluding whichever column was claimed by bank/client)
      debtorIdx = findHeader(c => 
        c === 'name' || 
        c === 'fullname' || 
        c === 'personname' || 
        c === 'customer',
        clientIdx !== -1 ? [clientIdx] : []
      );
    }

    // Safety: ensure debtor and bank NEVER resolve to the same column
    if (debtorIdx !== -1 && debtorIdx === clientIdx) {
      if (cleanHeaders[debtorIdx].includes('debtor') || cleanHeaders[debtorIdx].includes('borrower')) {
        clientIdx = findHeader(c => c.includes('bank') || c.includes('institution') || c.includes('client'), [debtorIdx]);
      } else {
        debtorIdx = findHeader(c => c.includes('debtor') || c.includes('borrower') || c.includes('name'), [clientIdx]);
      }
    }

    const getHeaderIdx = (...aliases: string[]) => {
      const cleanAliases = aliases.map(a => a.toLowerCase().replace(/[^a-z0-9]/g, ''));
      return cleanHeaders.findIndex(h => cleanAliases.some(alias => h.includes(alias)));
    };

    const accountIdx = getHeaderIdx('accountnumber', 'account_number', 'account', 'acc', 'loan_id', 'loanid', 'loan');
    const customerIdx = getHeaderIdx('customerid', 'customer_id', 'cif', 'idnumber', 'national_id', 'nationalid', 'custid', 'cifnumber');
    const outstandingIdx = getHeaderIdx('outstandingamount', 'outstanding_amount', 'outstanding', 'loanamount', 'claim', 'principal', 'totalamount');
    const paidIdx = getHeaderIdx('paidamount', 'paid_amount', 'paid', 'amountpaid', 'recovered', 'repaid');
    const dateIdx = getHeaderIdx('dateofpayment', 'date_of_payment', 'paymentdate', 'duedate', 'date', 'lastpayment');
    const phoneIdx = getHeaderIdx('whatsappnumber', 'whatsapp_number', 'whatsapp', 'phone', 'mobile', 'tel', 'cell');
    const categoryIdx = getHeaderIdx('category', 'status', 'stage', 'casestatus');
    const flagIdx = getHeaderIdx('colorflag', 'color_flag', 'priorityflag', 'flag', 'priority');
    const collectorIdx = getHeaderIdx('assignedcollector', 'assigned_collector', 'collector', 'officer', 'agent');
    const notesIdx = getHeaderIdx('notes', 'note', 'remarks', 'comment', 'description');

    for (let i = 1; i < lines.length; i++) {
      try {
        const rowString = lines[i];
        const matches = rowString.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g);
        const row = matches ? matches.map(m => m.replace(/^"|"$/g, '').replace(/""/g, '"').trim()) : [];
        if (row.length < 2) continue;

        const getVal = (idx: number) => (idx !== -1 && idx < row.length ? row[idx].trim() : '');

        const clientName = getVal(clientIdx) || defaultClientName || 'Financial Institution';
        let debtorName = getVal(debtorIdx);

        // Safety fallback: if debtorName is missing or matches clientName, check other text columns
        if (!debtorName || (debtorName.toLowerCase() === clientName.toLowerCase() && row.length > 2)) {
          const candidateIdx = row.findIndex((val, idx) => {
            if (idx === clientIdx || idx === accountIdx || idx === customerIdx || idx === dateIdx || idx === phoneIdx) return false;
            const v = val.trim();
            return v.length > 0 && v.toLowerCase() !== clientName.toLowerCase() && isNaN(Number(v)) && !v.includes('http');
          });
          if (candidateIdx !== -1) {
            debtorName = row[candidateIdx].trim();
          }
        }
        if (!debtorName) {
          debtorName = `Debtor ${i}`;
        }
        const accountNumber = getVal(accountIdx) || `ACC-${Date.now()}-${i}`;
        const customerId = getVal(customerIdx) || `CIF-${i}`;

        const rawOutstanding = getVal(outstandingIdx).replace(/[^0-9.-]+/g, '');
        const rawPaid = getVal(paidIdx).replace(/[^0-9.-]+/g, '');

        const outstandingAmount = Math.max(0, parseFloat(rawOutstanding) || 0);
        let paidAmount = Math.max(0, parseFloat(rawPaid) || 0);
        if (paidAmount > outstandingAmount) {
          paidAmount = outstandingAmount;
        }
        const outstandingBalance = Math.max(0, outstandingAmount - paidAmount);

        // INTELLIGENT AUTO-CATEGORIZATION
        let category: Category = 'paying';
        const rawCat = getVal(categoryIdx).toLowerCase();

        if (rawCat) {
          if (rawCat.includes('complete') || rawCat.includes('settled') || rawCat.includes('closed') || rawCat.includes('paid off')) {
            category = 'completed';
          } else if (rawCat.includes('promise') || rawCat.includes('ptp')) {
            category = 'promise_to_pay';
          } else if (rawCat.includes('meet') || rawCat.includes('appointment')) {
            category = 'schedule_meeting';
          } else if (rawCat.includes('waiver') || rawCat.includes('hardship') || rawCat.includes('relief')) {
            category = 'waiver_letter';
          } else if (rawCat.includes('dispute') || rawCat.includes('fraud') || rawCat.includes('legal')) {
            category = 'disputed';
          } else if (rawCat.includes('negot') || rawCat.includes('restruct')) {
            category = 'negotiation';
          } else if (rawCat.includes('skip') || rawCat.includes('unreach') || rawCat.includes('trace') || rawCat.includes('lost')) {
            category = 'skip_tracing';
          } else {
            category = 'paying';
          }
        } else {
          // Auto-categorize based on loan balance
          if (outstandingBalance === 0 && outstandingAmount > 0) {
            category = 'completed';
          } else if (paidAmount > 0 && outstandingBalance > 0) {
            category = 'paying';
          } else if (paidAmount === 0) {
            category = 'promise_to_pay';
          }
        }

        // INTELLIGENT AUTO-FLAGGING
        let colorFlag: ColorFlag = 'none';
        const rawFlag = getVal(flagIdx).toLowerCase();
        if (rawFlag.includes('red') || rawFlag.includes('high') || rawFlag.includes('urgent') || rawFlag.includes('critical')) {
          colorFlag = 'red';
        } else if (rawFlag.includes('yellow') || rawFlag.includes('medium') || rawFlag.includes('warn')) {
          colorFlag = 'yellow';
        } else if (rawFlag.includes('blue') || rawFlag.includes('normal')) {
          colorFlag = 'blue';
        } else if (rawFlag.includes('green') || rawFlag.includes('low') || rawFlag.includes('clear')) {
          colorFlag = 'green';
        } else {
          if (category === 'disputed' || category === 'skip_tracing') {
            colorFlag = 'red';
          } else if (category === 'promise_to_pay' || category === 'schedule_meeting') {
            colorFlag = 'yellow';
          } else if (category === 'completed') {
            colorFlag = 'green';
          } else {
            colorFlag = 'blue';
          }
        }

        const dateOfPayment = getVal(dateIdx) || new Date().toISOString().split('T')[0];
        const whatsappNumber = getVal(phoneIdx);
        const assignedCollector = getVal(collectorIdx);
        const notes = getVal(notesIdx) || 'Imported via CSV batch upload';

        result.parsedDebtors.push({
          id: crypto.randomUUID(),
          clientName,
          bankName: clientName,
          institutionId: defaultInstitutionId,
          debtorName,
          accountNumber,
          customerId,
          outstandingAmount,
          paidAmount,
          outstandingBalance,
          dateOfPayment,
          whatsappNumber,
          category,
          colorFlag,
          assignedCollector,
          notes,
          createdBy,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });

        result.successCount++;
      } catch (err: any) {
        result.errorCount++;
        result.errors.push(`Row ${i + 1}: ${err.message || 'Error parsing row'}`);
      }
    }
  } catch (e: any) {
    result.errors.push(e.message || 'Failed to parse CSV');
  }

  return result;
}

export function importClientsDebtorsFromCSV(
  csvText: string,
  defaultClientName?: string,
  defaultInstitutionId?: string
): { successCount: number; errorCount: number; errors: string[]; success: number; parsedDebtors: Debtor[] } {
  const parsed = parseClientsDebtorsCSV(csvText, defaultClientName, defaultInstitutionId);
  return {
    successCount: parsed.successCount,
    errorCount: parsed.errorCount,
    errors: parsed.errors,
    success: parsed.successCount,
    parsedDebtors: parsed.parsedDebtors
  };
}

export const importDebtorsFromCSV = importClientsDebtorsFromCSV;

// ---------------------------------------------------------------------
// WHATSAPP MESSAGING LINK GENERATOR
// ---------------------------------------------------------------------

export function generateWhatsAppLink(debtorOrPhone: Debtor | string, customMessage?: string): string {
  let rawPhone = typeof debtorOrPhone === 'string' ? debtorOrPhone : (debtorOrPhone.whatsappNumber || '');
  let phone = (rawPhone || '').replace(/[^0-9+]/g, '');
  if (!phone) return '#';

  if (!phone.startsWith('+')) {
    if (phone.startsWith('0')) {
      if (phone.length === 10 && phone.startsWith('07')) {
        phone = '+250' + phone.slice(1);
      } else if (phone.length === 10 && (phone.startsWith('08') || phone.startsWith('06'))) {
        phone = '+27' + phone.slice(1);
      } else {
        phone = '+250' + phone.slice(1);
      }
    } else {
      phone = '+' + phone;
    }
  }
  const cleanPhone = phone.replace('+', '');
  
  let msg = customMessage;
  if (!msg && typeof debtorOrPhone !== 'string') {
    msg = `Dear ${debtorOrPhone.debtorName}, this is an official message from Recovery Credit regarding your ${debtorOrPhone.clientName} account (${debtorOrPhone.accountNumber}). The remaining balance due is R ${debtorOrPhone.outstandingBalance.toFixed(2)}. Please contact your assigned recovery officer to arrange settlement or meeting. Thank you.`;
  }
  
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg || '')}`;
}

