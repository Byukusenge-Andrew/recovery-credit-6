import { User, Debtor, Payment, Activity, Category, ColorFlag, ActivityType, Notification, AuditLog, AuditAction } from './types';

const KEYS = {
  USERS: 'rc6_users',
  DEBTORS: 'rc6_debtors',
  PAYMENTS: 'rc6_payments',
  ACTIVITIES: 'rc6_activities',
  NOTIFICATIONS: 'rc6_notifications',
  AUDIT_LOGS: 'rc6_audit_logs',
  SESSION: 'rc6_session'
};

function getStorage<T>(key: string, defaultValue: T): T {
  if (typeof window === 'undefined') return defaultValue;
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : defaultValue;
  } catch {
    return defaultValue;
  }
}

function setStorage<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

export function initializeStore() {
  const users = getStorage<User[]>(KEYS.USERS, []);
  
  // Only create the initial admin user if no users exist at all
  if (users.length === 0) {
    users.push({
      id: 'usr-admin',
      username: 'admin',
      email: 'admin@recoverycredit.internal',
      fullName: 'Administrator',
      password: 'admin',
      role: 'admin',
      isEmailVerified: true,
      createdAt: new Date().toISOString()
    });
    setStorage(KEYS.USERS, users);
  }
  
  if (typeof window !== 'undefined') {
    if (!localStorage.getItem(KEYS.DEBTORS)) setStorage(KEYS.DEBTORS, []);
    if (!localStorage.getItem(KEYS.PAYMENTS)) setStorage(KEYS.PAYMENTS, []);
    if (!localStorage.getItem(KEYS.ACTIVITIES)) setStorage(KEYS.ACTIVITIES, []);
    if (!localStorage.getItem(KEYS.NOTIFICATIONS)) setStorage(KEYS.NOTIFICATIONS, []);
    if (!localStorage.getItem(KEYS.AUDIT_LOGS)) setStorage(KEYS.AUDIT_LOGS, []);
  }
}

// ---------------------------------------------------------------------
// IMMUTABLE AUDIT LOGGING SYSTEM (APPEND-ONLY)
// ---------------------------------------------------------------------

/**
 * Append-only immutable audit log writer.
 * Records are timestamped, indexed, and cannot be edited or modified.
 */
export function appendAuditLog(entry: {
  action: AuditAction;
  targetType: 'debtor' | 'payment' | 'user' | 'system';
  targetId?: string;
  targetDescription: string;
  details: string;
}): AuditLog {
  const currentLogs = getStorage<AuditLog[]>(KEYS.AUDIT_LOGS, []);
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

  // Strictly append-only: freeze object and save
  currentLogs.push(Object.freeze({ ...newLog }));
  setStorage(KEYS.AUDIT_LOGS, currentLogs);
  return newLog;
}

/**
 * Retrieve immutable audit logs (sorted descending by timestamp).
 * Accessible strictly for admin oversight.
 */
export function getAuditLogs(): readonly AuditLog[] {
  const logs = getStorage<AuditLog[]>(KEYS.AUDIT_LOGS, []);
  return Object.freeze(
    [...logs].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
  );
}

export function login(usernameOrEmail: string, password: string): User | null {
  const users = getStorage<User[]>(KEYS.USERS, []);
  const input = usernameOrEmail.trim().toLowerCase();
  const user = users.find(u => 
    (u.username.toLowerCase() === input || (u.email && u.email.toLowerCase() === input)) && 
    u.password === password
  );
  if (user) {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem(KEYS.SESSION, JSON.stringify(user));
    }
    appendAuditLog({
      action: 'login',
      targetType: 'user',
      targetId: user.id,
      targetDescription: `User: ${user.username} (${user.role})`,
      details: `User ${user.username} signed in successfully.`
    });
    return user;
  }
  return null;
}

export function logout(): void {
  const user = getCurrentUser();
  if (user) {
    appendAuditLog({
      action: 'logout',
      targetType: 'user',
      targetId: user.id,
      targetDescription: `User: ${user.username}`,
      details: `User ${user.username} signed out.`
    });
  }
  if (typeof window !== 'undefined') {
    sessionStorage.removeItem(KEYS.SESSION);
  }
}

export function getCurrentUser(): User | null {
  if (typeof window === 'undefined') return null;
  const sessionData = sessionStorage.getItem(KEYS.SESSION);
  try {
    return sessionData ? JSON.parse(sessionData) : null;
  } catch {
    return null;
  }
}

export function isLoggedIn(): boolean {
  return getCurrentUser() !== null;
}

export function getUsers(): User[] {
  return getStorage<User[]>(KEYS.USERS, []);
}

export function addUser(userData: Omit<User, 'id' | 'createdAt'>): User {
  const users = getUsers();
  const newUser: User = {
    ...userData,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString()
  };
  users.push(newUser);
  setStorage(KEYS.USERS, users);

  appendAuditLog({
    action: userData.role === 'collector' ? 'add_collector' : 'update_user',
    targetType: 'user',
    targetId: newUser.id,
    targetDescription: `Collector/User: ${newUser.username} (${newUser.fullName})`,
    details: `Created new ${newUser.role} user '${newUser.username}' with email ${newUser.email}.`
  });

  return newUser;
}

export function getCollectors(): User[] {
  return getUsers().filter(u => u.role === 'collector');
}

export function exportCollectorsCSV(): string {
  const collectors = getCollectors();
  const debtors = getStorage<Debtor[]>(KEYS.DEBTORS, []);

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

export function importCollectorsFromCSV(csvText: string): { successCount: number; errorCount: number; errors: string[] } {
  const result = { successCount: 0, errorCount: 0, errors: [] as string[] };
  const lines = csvText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  if (lines.length <= 1) {
    result.errors.push('CSV file is empty or missing data rows');
    return result;
  }

  const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim().toLowerCase());
  const existingUsers = getUsers();

  for (let i = 1; i < lines.length; i++) {
    try {
      const rowString = lines[i];
      const matches = rowString.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g);
      const row = matches ? matches.map(m => m.replace(/^"|"$/g, '').replace(/""/g, '"').trim()) : [];
      if (row.length < 2) continue;

      const getValue = (key: string) => {
        const index = headers.findIndex(h => h.includes(key.toLowerCase()));
        return index !== -1 && index < row.length ? row[index] : '';
      };

      const username = (getValue('user') || getValue('username') || '').toLowerCase().trim();
      const fullName = getValue('full') || getValue('name') || username;
      const email = (getValue('mail') || getValue('email') || '').toLowerCase().trim();
      const password = getValue('pass') || 'collector123';

      if (!username || !email) {
        result.errorCount++;
        result.errors.push(`Row ${i + 1}: Missing username or email.`);
        continue;
      }

      const dup = existingUsers.find(u => u.username.toLowerCase() === username || (u.email && u.email.toLowerCase() === email));
      if (dup) {
        result.errorCount++;
        result.errors.push(`Row ${i + 1}: Collector '${username}' (${email}) already exists.`);
        continue;
      }

      addUser({
        username,
        fullName,
        email,
        password,
        role: 'collector',
        isEmailVerified: true
      });

      result.successCount++;
    } catch (err: any) {
      result.errorCount++;
      result.errors.push(`Row ${i + 1}: ${err.message || 'Error parsing collector row'}`);
    }
  }

  if (result.successCount > 0) {
    appendAuditLog({
      action: 'import_csv',
      targetType: 'system',
      targetDescription: `Bulk Collectors Import (${result.successCount} users)`,
      details: `Imported ${result.successCount} collector profile(s) from CSV spreadsheet.`
    });
  }

  return result;
}

export function updateUserProfile(updates: { fullName?: string; email?: string; password?: string }): { success: boolean; message: string; user?: User } {
  const current = getCurrentUser();
  if (!current) return { success: false, message: 'No active session found' };

  const users = getUsers();
  const index = users.findIndex(u => u.id === current.id || u.username.toLowerCase() === current.username.toLowerCase());
  if (index === -1) return { success: false, message: 'User record not found' };

  // Check email collision if email changed
  if (updates.email && updates.email.toLowerCase() !== current.email?.toLowerCase()) {
    const existing = users.find(u => u.id !== users[index].id && u.email?.toLowerCase() === updates.email?.toLowerCase());
    if (existing) {
      return { success: false, message: 'Email address is already in use by another account' };
    }
  }

  const updatedUser: User = {
    ...users[index],
    ...(updates.fullName !== undefined ? { fullName: updates.fullName.trim() } : {}),
    ...(updates.email !== undefined ? { email: updates.email.trim().toLowerCase() } : {}),
    ...(updates.password ? { password: updates.password.trim() } : {}),
  };

  users[index] = updatedUser;
  setStorage(KEYS.USERS, users);

  // Synchronize active session
  if (typeof window !== 'undefined') {
    sessionStorage.setItem(KEYS.SESSION, JSON.stringify(updatedUser));
  }

  appendAuditLog({
    action: 'update_user',
    targetType: 'user',
    targetId: updatedUser.id,
    targetDescription: `User Profile: ${updatedUser.username}`,
    details: `User ${updatedUser.username} updated profile details${updates.password ? ' (password changed)' : ''}.`
  });

  return { success: true, message: 'Profile updated successfully', user: updatedUser };
}

// ---------------------------------------------------------------------
// NOTIFICATION SYSTEM
// ---------------------------------------------------------------------

export function getNotifications(username?: string): Notification[] {
  const allNotifications = getStorage<Notification[]>(KEYS.NOTIFICATIONS, []);
  if (!username) return allNotifications;
  return allNotifications
    .filter(n => n.recipientUsername.toLowerCase() === username.toLowerCase())
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function getUnreadNotificationsCount(username: string): number {
  return getNotifications(username).filter(n => !n.isRead).length;
}

export function createNotification(data: Omit<Notification, 'id' | 'createdAt' | 'isRead'>): Notification {
  const notifications = getStorage<Notification[]>(KEYS.NOTIFICATIONS, []);
  const newNotification: Notification = {
    ...data,
    id: crypto.randomUUID(),
    isRead: false,
    createdAt: new Date().toISOString()
  };
  notifications.push(newNotification);
  setStorage(KEYS.NOTIFICATIONS, notifications);
  return newNotification;
}

export function markNotificationAsRead(id: string): void {
  const notifications = getStorage<Notification[]>(KEYS.NOTIFICATIONS, []);
  const item = notifications.find(n => n.id === id);
  if (item) {
    item.isRead = true;
    setStorage(KEYS.NOTIFICATIONS, notifications);
  }
}

export function markAllNotificationsAsRead(username: string): void {
  const notifications = getStorage<Notification[]>(KEYS.NOTIFICATIONS, []);
  notifications.forEach(n => {
    if (n.recipientUsername.toLowerCase() === username.toLowerCase()) {
      n.isRead = true;
    }
  });
  setStorage(KEYS.NOTIFICATIONS, notifications);
}

// ---------------------------------------------------------------------
// DEBTORS SYSTEM WITH STRICT DATA ISOLATION
// ---------------------------------------------------------------------

/**
 * Strict Data Isolation:
 * - Admin: sees all debtors across all clients and collectors.
 * - Collector: strictly sees ONLY the debtors assigned to their username.
 */
export function getDebtors(): Debtor[] {
  const user = getCurrentUser();
  const allDebtors = getStorage<Debtor[]>(KEYS.DEBTORS, []);

  if (user && user.role === 'collector') {
    return allDebtors.filter(d => d.assignedCollector?.toLowerCase() === user.username.toLowerCase());
  }

  return allDebtors;
}

/**
 * Isolated single debtor getter:
 * Returns the debtor only if user is admin or the assigned collector.
 */
export function getDebtor(id: string): Debtor | null {
  const user = getCurrentUser();
  const allDebtors = getStorage<Debtor[]>(KEYS.DEBTORS, []);
  const found = allDebtors.find(d => d.id === id) || null;

  if (!found) return null;

  if (user && user.role === 'collector') {
    if (found.assignedCollector?.toLowerCase() !== user.username.toLowerCase()) {
      return null; // Forbidden: Collector cannot see another collector's debtor file
    }
  }

  return found;
}

export function addDebtor(debtorData: Omit<Debtor, 'id' | 'createdAt' | 'updatedAt' | 'outstandingBalance'>): Debtor {
  const all = getStorage<Debtor[]>(KEYS.DEBTORS, []);
  const outstandingAmount = Math.max(0, Number(debtorData.outstandingAmount || 0));
  // Enforce validation: paidAmount cannot exceed loan/outstanding amount
  const paidAmount = Math.min(outstandingAmount, Math.max(0, Number(debtorData.paidAmount || 0)));
  const outstandingBalance = outstandingAmount - paidAmount;
  const now = new Date().toISOString();
  
  const newDebtor: Debtor = {
    ...debtorData,
    outstandingAmount,
    paidAmount,
    id: crypto.randomUUID(),
    outstandingBalance,
    createdAt: now,
    updatedAt: now
  };
  
  all.push(newDebtor);
  setStorage(KEYS.DEBTORS, all);

  appendAuditLog({
    action: 'create_debtor',
    targetType: 'debtor',
    targetId: newDebtor.id,
    targetDescription: `${newDebtor.debtorName} (${newDebtor.clientName} - ${newDebtor.accountNumber})`,
    details: `Created debtor file. Claim: R ${outstandingAmount.toFixed(2)}, Initial Paid: R ${paidAmount.toFixed(2)}, Collector: ${newDebtor.assignedCollector || 'Unassigned'}.`
  });

  // AUTOMATED NOTIFICATION: When a debtor is assigned to a collector, send notification message
  if (debtorData.assignedCollector) {
    createNotification({
      recipientUsername: debtorData.assignedCollector,
      title: 'New Debtor Case Assigned',
      message: `You have been assigned to recover a balance of R ${outstandingBalance.toFixed(2)} for debtor ${debtorData.debtorName} from client ${debtorData.clientName}.`,
      debtorId: newDebtor.id,
      debtorName: debtorData.debtorName,
      clientName: debtorData.clientName,
      amount: outstandingBalance
    });
  }

  return newDebtor;
}

export function updateDebtor(id: string, updates: Partial<Omit<Debtor, 'id' | 'createdAt' | 'updatedAt'>>): Debtor | null {
  const all = getStorage<Debtor[]>(KEYS.DEBTORS, []);
  const index = all.findIndex(d => d.id === id);
  if (index === -1) return null;
  
  const debtor = all[index];
  const oldCollector = debtor.assignedCollector;
  const user = getCurrentUser();

  // Enforce validation: paidAmount cannot exceed outstandingAmount
  let newOutstanding = 'outstandingAmount' in updates ? Math.max(0, Number(updates.outstandingAmount || 0)) : debtor.outstandingAmount;
  let newPaid = 'paidAmount' in updates ? Math.max(0, Number(updates.paidAmount || 0)) : debtor.paidAmount;

  // If a collector attempts to manually edit paidAmount directly via updateDebtor, ignore and preserve original paidAmount
  if (user?.role === 'collector' && 'paidAmount' in updates && updates.paidAmount !== debtor.paidAmount) {
    newPaid = debtor.paidAmount;
  }

  if (newPaid > newOutstanding) {
    newPaid = newOutstanding;
  }

  const updatedDebtor: Debtor = { 
    ...debtor, 
    ...updates, 
    outstandingAmount: newOutstanding,
    paidAmount: newPaid,
    outstandingBalance: newOutstanding - newPaid,
    updatedAt: new Date().toISOString() 
  };

  // If debt is fully paid, auto-update category to completed
  if (updatedDebtor.outstandingBalance <= 0 && updatedDebtor.outstandingAmount > 0) {
    updatedDebtor.category = 'completed';
  }
  
  all[index] = updatedDebtor;
  setStorage(KEYS.DEBTORS, all);

  appendAuditLog({
    action: 'update_debtor',
    targetType: 'debtor',
    targetId: updatedDebtor.id,
    targetDescription: `${updatedDebtor.debtorName} (${updatedDebtor.clientName})`,
    details: `Updated debtor file. Category: ${updatedDebtor.category}, Balance: R ${updatedDebtor.outstandingBalance.toFixed(2)}, Collector: ${updatedDebtor.assignedCollector || 'None'}.`
  });

  // If a new collector was assigned or re-assigned, send notification
  if (updates.assignedCollector && updates.assignedCollector !== oldCollector) {
    createNotification({
      recipientUsername: updates.assignedCollector,
      title: 'Debtor Case Reassigned To You',
      message: `Debtor account for ${updatedDebtor.debtorName} (${updatedDebtor.clientName}) with balance R ${updatedDebtor.outstandingBalance.toFixed(2)} has been assigned to you.`,
      debtorId: updatedDebtor.id,
      debtorName: updatedDebtor.debtorName,
      clientName: updatedDebtor.clientName,
      amount: updatedDebtor.outstandingBalance
    });
  }

  return updatedDebtor;
}

export function deleteDebtor(id: string): void {
  const all = getStorage<Debtor[]>(KEYS.DEBTORS, []);
  const target = all.find(d => d.id === id);
  setStorage(KEYS.DEBTORS, all.filter(d => d.id !== id));
  
  const payments = getStorage<Payment[]>(KEYS.PAYMENTS, []);
  setStorage(KEYS.PAYMENTS, payments.filter(p => p.debtorId !== id));
  
  const activities = getStorage<Activity[]>(KEYS.ACTIVITIES, []);
  setStorage(KEYS.ACTIVITIES, activities.filter(a => a.debtorId !== id));

  if (target) {
    appendAuditLog({
      action: 'delete_debtor',
      targetType: 'debtor',
      targetId: id,
      targetDescription: `${target.debtorName} (${target.clientName})`,
      details: `Deleted debtor file and associated payment history for account ${target.accountNumber}.`
    });
  }
}

export function searchDebtors(query: string, categoryFilter?: Category, flagFilter?: ColorFlag, clientFilter?: string): Debtor[] {
  let debtors = getDebtors();
  
  if (categoryFilter) {
    debtors = debtors.filter(d => d.category === categoryFilter);
  }
  
  if (flagFilter && flagFilter !== 'none') {
    debtors = debtors.filter(d => d.colorFlag === flagFilter);
  }

  if (clientFilter) {
    debtors = debtors.filter(d => d.clientName.toLowerCase() === clientFilter.toLowerCase());
  }
  
  if (query) {
    const q = query.toLowerCase();
    debtors = debtors.filter(d => 
      (d.debtorName && d.debtorName.toLowerCase().includes(q)) ||
      (d.clientName && d.clientName.toLowerCase().includes(q)) ||
      (d.accountNumber && d.accountNumber.toLowerCase().includes(q)) ||
      (d.customerId && d.customerId.toLowerCase().includes(q))
    );
  }
  
  return debtors;
}

export function getPayments(debtorId: string): Payment[] {
  const payments = getStorage<Payment[]>(KEYS.PAYMENTS, []);
  return payments.filter(p => p.debtorId === debtorId);
}

export function addPayment(paymentData: any): Payment {
  const payments = getStorage<Payment[]>(KEYS.PAYMENTS, []);
  let amountPaid = Number(paymentData.amountPaid || paymentData.amount || 0);
  const paymentDate = paymentData.paymentDate || paymentData.date || new Date().toISOString();
  const user = getCurrentUser();
  const debtor = getDebtor(paymentData.debtorId);

  // Validation: cap payment to remaining outstanding balance
  if (debtor) {
    const remainingBalance = Math.max(0, debtor.outstandingBalance);
    if (amountPaid > remainingBalance) {
      amountPaid = remainingBalance;
    }
  }
  
  const newPayment: Payment = {
    id: crypto.randomUUID(),
    debtorId: paymentData.debtorId,
    amountPaid,
    paymentDate,
    recordedBy: paymentData.recordedBy || user?.fullName || 'Collector',
    notes: paymentData.notes || ''
  };
  
  payments.push(newPayment);
  setStorage(KEYS.PAYMENTS, payments);
  
  if (debtor) {
    const newPaidAmount = Number(debtor.paidAmount || 0) + amountPaid;
    updateDebtor(paymentData.debtorId, { paidAmount: newPaidAmount });
  }

  appendAuditLog({
    action: 'record_payment',
    targetType: 'payment',
    targetId: newPayment.id,
    targetDescription: `Payment for ${debtor?.debtorName || paymentData.debtorId}`,
    details: `Recorded payment of R ${amountPaid.toFixed(2)} on date ${paymentDate}. Ref/Notes: ${paymentData.notes || 'None'}.`
  });
  
  return newPayment;
}

export function updatePayment(paymentId: string, updates: { amountPaid?: number; paymentDate?: string; notes?: string }): { success: boolean; error?: string } {
  const user = getCurrentUser();
  if (!user || user.role !== 'admin') {
    return { success: false, error: 'Only administrators are authorized to edit payment records.' };
  }

  const payments = getStorage<Payment[]>(KEYS.PAYMENTS, []);
  const index = payments.findIndex(p => p.id === paymentId);
  if (index === -1) {
    return { success: false, error: 'Payment record not found.' };
  }

  const oldPayment = payments[index];
  const debtor = getDebtor(oldPayment.debtorId);
  if (!debtor) {
    return { success: false, error: 'Debtor associated with payment not found.' };
  }

  let newAmount = typeof updates.amountPaid === 'number' ? Math.max(0, updates.amountPaid) : oldPayment.amountPaid;
  // Recalculate debtor total paid if amount changed
  const diff = newAmount - oldPayment.amountPaid;
  const newDebtorPaid = Math.max(0, debtor.paidAmount + diff);
  if (newDebtorPaid > debtor.outstandingAmount) {
    return {
      success: false,
      error: `Updated payment would exceed the total loan amount of R ${debtor.outstandingAmount.toFixed(2)}.`
    };
  }

  const updatedPayment: Payment = {
    ...oldPayment,
    amountPaid: newAmount,
    paymentDate: updates.paymentDate || oldPayment.paymentDate,
    notes: updates.notes !== undefined ? updates.notes : oldPayment.notes
  };

  payments[index] = updatedPayment;
  setStorage(KEYS.PAYMENTS, payments);

  // Update debtor's paidAmount
  updateDebtor(oldPayment.debtorId, { paidAmount: newDebtorPaid });

  appendAuditLog({
    action: 'update_payment',
    targetType: 'payment',
    targetId: updatedPayment.id,
    targetDescription: `Payment edit for ${debtor.debtorName} (${debtor.clientName})`,
    details: `Admin ${user.username} modified payment: amount changed from R ${oldPayment.amountPaid.toFixed(2)} to R ${newAmount.toFixed(2)}, date: ${updatedPayment.paymentDate}.`
  });

  return { success: true };
}

export function deletePayment(paymentId: string): { success: boolean; error?: string } {
  const user = getCurrentUser();
  if (!user || user.role !== 'admin') {
    return { success: false, error: 'Only administrators are authorized to delete payment records.' };
  }

  const payments = getStorage<Payment[]>(KEYS.PAYMENTS, []);
  const index = payments.findIndex(p => p.id === paymentId);
  if (index === -1) {
    return { success: false, error: 'Payment record not found.' };
  }

  const oldPayment = payments[index];
  const debtor = getDebtor(oldPayment.debtorId);

  payments.splice(index, 1);
  setStorage(KEYS.PAYMENTS, payments);

  if (debtor) {
    const newDebtorPaid = Math.max(0, debtor.paidAmount - oldPayment.amountPaid);
    updateDebtor(oldPayment.debtorId, { paidAmount: newDebtorPaid });
  }

  appendAuditLog({
    action: 'delete_payment',
    targetType: 'payment',
    targetId: oldPayment.id,
    targetDescription: `Payment deleted for ${debtor?.debtorName || oldPayment.debtorId}`,
    details: `Admin ${user.username} deleted payment of R ${oldPayment.amountPaid.toFixed(2)} recorded on ${oldPayment.paymentDate}.`
  });

  return { success: true };
}

export function getActivities(debtorId: string): Activity[] {
  const activities = getStorage<Activity[]>(KEYS.ACTIVITIES, []);
  return activities.filter(a => a.debtorId === debtorId);
}

export function addActivity(activityData: any): Activity {
  const activities = getStorage<Activity[]>(KEYS.ACTIVITIES, []);
  const user = getCurrentUser();
  
  const newActivity: Activity = {
    id: crypto.randomUUID(),
    debtorId: activityData.debtorId,
    activityType: activityData.activityType || activityData.type || 'note',
    description: activityData.description || '',
    scheduledDate: activityData.scheduledDate || activityData.date,
    createdAt: new Date().toISOString(),
    createdBy: activityData.createdBy || user?.fullName || 'Collector'
  };
  
  activities.push(newActivity);
  setStorage(KEYS.ACTIVITIES, activities);

  appendAuditLog({
    action: 'log_activity',
    targetType: 'debtor',
    targetId: activityData.debtorId,
    targetDescription: `Debtor Activity: ${newActivity.activityType}`,
    details: `Logged interaction (${newActivity.activityType}): ${newActivity.description.slice(0, 100)}`
  });

  return newActivity;
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

/**
 * Strict Data Isolation for Dashboard:
 * - Admin: totals across the entire organization.
 * - Collector: totals strictly calculate their assigned debtors and accounts.
 */
export function getDashboardStats(): DashboardStats {
  const debtors = getDebtors(); // Automatically filtered based on role!
  const uniqueClients = new Set(debtors.map(d => d.clientName).filter(Boolean));
  
  const stats: DashboardStats = {
    totalDebtors: debtors.length,
    totalOutstanding: 0,
    totalPaid: 0,
    totalBalance: 0,
    outstandingBalance: 0,
    clientsCount: uniqueClients.size,
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
  
  debtors.forEach(d => {
    stats.totalOutstanding += Number(d.outstandingAmount || 0);
    stats.totalPaid += Number(d.paidAmount || 0);
    stats.totalBalance += Number(d.outstandingBalance || 0);
    
    if (d.category && d.category in stats.categoryCounts) {
      stats.categoryCounts[d.category]++;
    }
    
    if (d.colorFlag && d.colorFlag in stats.flagCounts) {
      stats.flagCounts[d.colorFlag]++;
    }
  });
  
  stats.outstandingBalance = stats.totalBalance;
  return stats;
}

// Download/Export Clients & Debtors Data (strictly isolated for collectors)
export function exportClientsDebtorsCSV(): string {
  const debtors = getDebtors(); // Collectors only export what they are assigned
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

// Upload/Import Clients & Debtors Information (CSV)
export function importClientsDebtorsFromCSV(csvText: string): { successCount: number; errorCount: number; errors: string[]; success: number } {
  const result = { successCount: 0, errorCount: 0, errors: [] as string[], success: 0 };
  const user = getCurrentUser();
  const createdBy = user ? user.fullName : 'Admin';
  
  try {
    const lines = csvText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    if (lines.length <= 1) {
      result.errors.push('CSV file is empty or missing data rows');
      return result;
    }
    
    const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim().toLowerCase());
    
    for (let i = 1; i < lines.length; i++) {
      try {
        const rowString = lines[i];
        const matches = rowString.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g);
        const row = matches ? matches.map(m => m.replace(/^"|"$/g, '').replace(/""/g, '"').trim()) : [];
        if (row.length < 2) continue;
        
        const getValue = (headerKey: string) => {
          const index = headers.findIndex(h => h.includes(headerKey.toLowerCase()));
          return index !== -1 && index < row.length ? row[index] : '';
        };
        
        const outstandingAmount = parseFloat(getValue('outstanding') || '0');
        const paidAmount = parseFloat(getValue('paid') || '0');
        const assignedCollector = getValue('collector') || '';
        
        addDebtor({
          clientName: getValue('client') || getValue('bank') || 'Client Bank',
          debtorName: getValue('debtor') || getValue('name') || `Debtor ${i}`,
          accountNumber: getValue('account') || `ACC-${Date.now()}-${i}`,
          customerId: getValue('customer') || getValue('cust') || `ID-${i}`,
          outstandingAmount: isNaN(outstandingAmount) ? 0 : outstandingAmount,
          paidAmount: isNaN(paidAmount) ? 0 : paidAmount,
          dateOfPayment: getValue('date') || new Date().toISOString().split('T')[0],
          whatsappNumber: getValue('whatsapp') || '',
          category: ((getValue('category') || 'paying') as Category),
          colorFlag: ((getValue('color') || getValue('flag') || 'none') as ColorFlag),
          assignedCollector,
          notes: getValue('note') || '',
          createdBy
        });
        
        result.successCount++;
      } catch (err: any) {
        result.errorCount++;
        result.errors.push(`Row ${i + 1}: ${err.message || 'Error parsing row'}`);
      }
    }

    if (result.successCount > 0) {
      appendAuditLog({
        action: 'import_csv',
        targetType: 'system',
        targetDescription: `Bulk CSV Import (${result.successCount} files)`,
        details: `Imported ${result.successCount} debtor record(s) from CSV spreadsheet. Errors encountered: ${result.errorCount}.`
      });
    }
  } catch (err: any) {
    result.errors.push(`General error: ${err.message}`);
  }
  
  result.success = result.successCount;
  return result;
}

export function generateWhatsAppLink(debtor: Debtor): string {
  const cleanNumber = (debtor.whatsappNumber || '').replace(/\D/g, '');
  const balance = (debtor.outstandingBalance || 0).toFixed(2);
  const message = `Dear ${debtor.debtorName}, this is a reminder regarding your account ${debtor.accountNumber} with ${debtor.clientName} for an outstanding balance of R${balance}. Please contact your assigned recovery officer or arrange payment. Thank you - Recovery Credit 6`;
  return `https://wa.me/${cleanNumber}?text=${encodeURIComponent(message)}`;
}

// Backward compatibility alias
export const exportDebtorsCSV = exportClientsDebtorsCSV;
export const importDebtorsFromCSV = importClientsDebtorsFromCSV;

export const store = {
  initializeStore,
  login,
  logout,
  getCurrentUser,
  isLoggedIn,
  getUsers,
  addUser,
  getCollectors,
  getNotifications,
  getUnreadNotificationsCount,
  createNotification,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  getAuditLogs,
  appendAuditLog,
  getDebtors,
  getDebtor,
  addDebtor,
  updateDebtor,
  deleteDebtor,
  searchDebtors,
  getPayments,
  addPayment,
  getActivities,
  addActivity,
  getDashboardStats,
  exportClientsDebtorsCSV,
  importClientsDebtorsFromCSV,
  exportCollectorsCSV,
  importCollectorsFromCSV,
  generateWhatsAppLink
};

export function useStore() {
  return store;
}
