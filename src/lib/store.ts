import { User, Debtor, Payment, Activity, Category, ColorFlag, ActivityType } from './types';

const KEYS = {
  USERS: 'rc6_users',
  DEBTORS: 'rc6_debtors',
  PAYMENTS: 'rc6_payments',
  ACTIVITIES: 'rc6_activities',
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
  if (users.length === 0) {
    users.push({
      id: crypto.randomUUID(),
      username: 'admin',
      password: 'admin123',
      role: 'admin',
      createdAt: new Date().toISOString()
    });
    setStorage(KEYS.USERS, users);
  }
  
  if (typeof window !== 'undefined') {
    if (!localStorage.getItem(KEYS.DEBTORS)) setStorage(KEYS.DEBTORS, []);
    if (!localStorage.getItem(KEYS.PAYMENTS)) setStorage(KEYS.PAYMENTS, []);
    if (!localStorage.getItem(KEYS.ACTIVITIES)) setStorage(KEYS.ACTIVITIES, []);
  }
}

export function login(username: string, password: string): User | null {
  const users = getStorage<User[]>(KEYS.USERS, []);
  const user = users.find(u => u.username === username && u.password === password);
  if (user) {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem(KEYS.SESSION, JSON.stringify(user));
    }
    return user;
  }
  return null;
}

export function logout(): void {
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

export function getDebtors(): Debtor[] {
  return getStorage<Debtor[]>(KEYS.DEBTORS, []);
}

export function getDebtor(id: string): Debtor | null {
  const debtors = getDebtors();
  return debtors.find(d => d.id === id) || null;
}

export function addDebtor(debtorData: Omit<Debtor, 'id' | 'createdAt' | 'updatedAt' | 'outstandingBalance'>): Debtor {
  const debtors = getDebtors();
  const outstandingBalance = Number(debtorData.outstandingAmount || 0) - Number(debtorData.paidAmount || 0);
  const now = new Date().toISOString();
  
  const newDebtor: Debtor = {
    ...debtorData,
    id: crypto.randomUUID(),
    outstandingBalance,
    createdAt: now,
    updatedAt: now
  };
  
  debtors.push(newDebtor);
  setStorage(KEYS.DEBTORS, debtors);
  return newDebtor;
}

export function updateDebtor(id: string, updates: Partial<Omit<Debtor, 'id' | 'createdAt' | 'updatedAt'>>): Debtor | null {
  const debtors = getDebtors();
  const index = debtors.findIndex(d => d.id === id);
  if (index === -1) return null;
  
  const debtor = debtors[index];
  const updatedDebtor = { ...debtor, ...updates, updatedAt: new Date().toISOString() };
  
  if ('outstandingAmount' in updates || 'paidAmount' in updates) {
    updatedDebtor.outstandingBalance = Number(updatedDebtor.outstandingAmount || 0) - Number(updatedDebtor.paidAmount || 0);
  }
  
  debtors[index] = updatedDebtor;
  setStorage(KEYS.DEBTORS, debtors);
  return updatedDebtor;
}

export function deleteDebtor(id: string): void {
  const debtors = getDebtors();
  setStorage(KEYS.DEBTORS, debtors.filter(d => d.id !== id));
  
  const payments = getStorage<Payment[]>(KEYS.PAYMENTS, []);
  setStorage(KEYS.PAYMENTS, payments.filter(p => p.debtorId !== id));
  
  const activities = getStorage<Activity[]>(KEYS.ACTIVITIES, []);
  setStorage(KEYS.ACTIVITIES, activities.filter(a => a.debtorId !== id));
}

export function searchDebtors(query: string, categoryFilter?: Category, flagFilter?: ColorFlag): Debtor[] {
  let debtors = getDebtors();
  
  if (categoryFilter) {
    debtors = debtors.filter(d => d.category === categoryFilter);
  }
  
  if (flagFilter && flagFilter !== 'none') {
    debtors = debtors.filter(d => d.colorFlag === flagFilter);
  }
  
  if (query) {
    const q = query.toLowerCase();
    debtors = debtors.filter(d => 
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
  const amountPaid = Number(paymentData.amountPaid || paymentData.amount || 0);
  const paymentDate = paymentData.paymentDate || paymentData.date || new Date().toISOString();
  
  const newPayment: Payment = {
    id: crypto.randomUUID(),
    debtorId: paymentData.debtorId,
    amountPaid,
    paymentDate,
    recordedBy: paymentData.recordedBy || 'Admin',
    notes: paymentData.notes || ''
  };
  
  payments.push(newPayment);
  setStorage(KEYS.PAYMENTS, payments);
  
  const debtor = getDebtor(paymentData.debtorId);
  if (debtor) {
    const newPaidAmount = Number(debtor.paidAmount || 0) + amountPaid;
    updateDebtor(paymentData.debtorId, { paidAmount: newPaidAmount });
  }
  
  return newPayment;
}

export function getActivities(debtorId: string): Activity[] {
  const activities = getStorage<Activity[]>(KEYS.ACTIVITIES, []);
  return activities.filter(a => a.debtorId === debtorId);
}

export function addActivity(activityData: any): Activity {
  const activities = getStorage<Activity[]>(KEYS.ACTIVITIES, []);
  const newActivity: Activity = {
    id: crypto.randomUUID(),
    debtorId: activityData.debtorId,
    activityType: activityData.activityType || activityData.type || 'note',
    description: activityData.description || '',
    scheduledDate: activityData.scheduledDate || activityData.date,
    createdAt: new Date().toISOString(),
    createdBy: activityData.createdBy || 'Admin'
  };
  
  activities.push(newActivity);
  setStorage(KEYS.ACTIVITIES, activities);
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
  byCategory: Record<string, number>;
  byFlag: Record<string, number>;
}

export function getDashboardStats(): DashboardStats {
  const debtors = getDebtors();
  
  const stats: DashboardStats = {
    totalDebtors: debtors.length,
    totalOutstanding: 0,
    totalPaid: 0,
    totalBalance: 0,
    outstandingBalance: 0,
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
    },
    byCategory: {},
    byFlag: {}
  };
  
  debtors.forEach(d => {
    stats.totalOutstanding += Number(d.outstandingAmount || 0);
    stats.totalPaid += Number(d.paidAmount || 0);
    stats.totalBalance += Number(d.outstandingBalance || 0);
    
    if (d.category && d.category in stats.categoryCounts) {
      stats.categoryCounts[d.category]++;
    }
    stats.byCategory[d.category] = (stats.byCategory[d.category] || 0) + 1;
    
    if (d.colorFlag && d.colorFlag in stats.flagCounts) {
      stats.flagCounts[d.colorFlag]++;
    }
    stats.byFlag[d.colorFlag] = (stats.byFlag[d.colorFlag] || 0) + 1;
  });
  
  stats.outstandingBalance = stats.totalBalance;
  return stats;
}

export function exportDebtorsCSV(): string {
  const debtors = getDebtors();
  if (debtors.length === 0) return '';
  
  const headers = [
    'Account Number', 'Customer ID', 'Client Name', 'Bank Name',
    'Outstanding Amount', 'Paid Amount', 'Date of Payment',
    'Outstanding Balance', 'WhatsApp Number', 'Category', 'Color Flag', 'Notes'
  ];
  
  const rows = debtors.map(d => [
    d.accountNumber || '',
    d.customerId || '',
    d.clientName || '',
    d.bankName || '',
    (d.outstandingAmount || 0).toString(),
    (d.paidAmount || 0).toString(),
    d.dateOfPayment || '',
    (d.outstandingBalance || 0).toString(),
    d.whatsappNumber || '',
    d.category || '',
    d.colorFlag || '',
    (d.notes || '').replace(/"/g, '""')
  ].map(field => `"${field}"`).join(','));
  
  return [headers.join(','), ...rows].join('\n');
}

export function importDebtorsFromCSV(csvText: string): { successCount: number; errorCount: number; errors: string[]; success: number } {
  const result = { successCount: 0, errorCount: 0, errors: [] as string[], success: 0 };
  const user = getCurrentUser();
  const createdBy = user ? user.username : 'system';
  
  try {
    const lines = csvText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    if (lines.length <= 1) {
      result.errors.push('CSV is empty or missing data rows');
      return result;
    }
    
    const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim().toLowerCase());
    
    for (let i = 1; i < lines.length; i++) {
      try {
        const rowString = lines[i];
        const matches = rowString.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g);
        const row = matches ? matches.map(m => m.replace(/^"|"$/g, '').replace(/""/g, '"').trim()) : [];
        if (row.length < 3) continue;
        
        const getValue = (headerName: string) => {
          const index = headers.findIndex(h => h.includes(headerName.toLowerCase()));
          return index !== -1 && index < row.length ? row[index] : '';
        };
        
        const outstandingAmount = parseFloat(getValue('outstanding') || '0');
        const paidAmount = parseFloat(getValue('paid') || '0');
        
        addDebtor({
          accountNumber: getValue('account') || `ACC-${Date.now()}-${i}`,
          customerId: getValue('customer') || getValue('cust') || `CUST-${i}`,
          clientName: getValue('client') || getValue('name') || `Debtor ${i}`,
          bankName: getValue('bank') || 'Bank',
          outstandingAmount: isNaN(outstandingAmount) ? 0 : outstandingAmount,
          paidAmount: isNaN(paidAmount) ? 0 : paidAmount,
          dateOfPayment: getValue('date') || new Date().toISOString().split('T')[0],
          whatsappNumber: getValue('whatsapp') || '',
          category: (getValue('category') as Category) || 'paying',
          colorFlag: (getValue('color') || getValue('flag') as ColorFlag) || 'none',
          notes: getValue('note'),
          createdBy
        });
        
        result.successCount++;
      } catch (err: any) {
        result.errorCount++;
        result.errors.push(`Row ${i + 1}: ${err.message || 'Parse error'}`);
      }
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
  const message = `Dear ${debtor.clientName}, this is a reminder from Recovery Credit 6 regarding your account ${debtor.accountNumber} with an outstanding balance of R${balance}. Please contact us or arrange payment. Thank you.`;
  return `https://wa.me/${cleanNumber}?text=${encodeURIComponent(message)}`;
}

export const store = {
  get isAuthenticated() { return isLoggedIn(); },
  initializeStore,
  login,
  logout,
  getCurrentUser,
  isLoggedIn,
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
  exportDebtorsCSV,
  importDebtorsFromCSV,
  generateWhatsAppLink
};

export function useStore() {
  return store;
}
