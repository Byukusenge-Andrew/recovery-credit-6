import { Category, ColorFlag, ActivityType } from './types';

export const CATEGORIES: { value: Category; id: Category; label: string; color: string; bgLight: string }[] = [
  { value: 'completed', id: 'completed', label: 'Completed', color: '#16a34a', bgLight: '#f0fdf4' },
  { value: 'paying', id: 'paying', label: 'Paying', color: '#2563eb', bgLight: '#eff6ff' },
  { value: 'promise_to_pay', id: 'promise_to_pay', label: 'Promise to Pay', color: '#d97706', bgLight: '#fffbeb' },
  { value: 'schedule_meeting', id: 'schedule_meeting', label: 'Schedule Meeting', color: '#ea580c', bgLight: '#fff7ed' },
  { value: 'waiver_letter', id: 'waiver_letter', label: 'Waiver Letter', color: '#9333ea', bgLight: '#faf5ff' },
  { value: 'disputed', id: 'disputed', label: 'Disputed', color: '#e11d48', bgLight: '#fff1f2' },
  { value: 'negotiation', id: 'negotiation', label: 'Negotiation', color: '#0d9488', bgLight: '#f0fdfa' },
  { value: 'skip_tracing', id: 'skip_tracing', label: 'Skip Tracing', color: '#475569', bgLight: '#f8fafc' },
];

export const COLOR_FLAGS: { value: ColorFlag; id: ColorFlag; label: string; color: string }[] = [
  { value: 'none', id: 'none', label: 'None', color: '#94a3b8' },
  { value: 'red', id: 'red', label: 'Red', color: '#ef4444' },
  { value: 'blue', id: 'blue', label: 'Blue', color: '#3b82f6' },
  { value: 'yellow', id: 'yellow', label: 'Yellow', color: '#f59e0b' },
  { value: 'green', id: 'green', label: 'Green', color: '#10b981' },
];

export const ACTIVITY_TYPES: { value: ActivityType; id: ActivityType; label: string }[] = [
  { value: 'note', id: 'note', label: 'Note' },
  { value: 'meeting_scheduled', id: 'meeting_scheduled', label: 'Meeting Scheduled' },
  { value: 'reminder_sent', id: 'reminder_sent', label: 'Reminder Sent' },
  { value: 'call_made', id: 'call_made', label: 'Phone Call' },
  { value: 'email_sent', id: 'email_sent', label: 'Email' },
  { value: 'letter_sent', id: 'letter_sent', label: 'Letter' },
  { value: 'status_change', id: 'status_change', label: 'Status Update' },
  { value: 'payment_recorded', id: 'payment_recorded', label: 'Payment Recorded' },
];

export function getCategoryInfo(category: Category) {
  return CATEGORIES.find(c => c.value === category || c.id === category) || CATEGORIES[0];
}

export function getFlagInfo(flag: ColorFlag) {
  return COLOR_FLAGS.find(f => f.value === flag || f.id === flag) || COLOR_FLAGS[0];
}

export function formatCurrency(amount: number): string {
  const val = Number(amount) || 0;
  return 'R ' + new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(val);
}
