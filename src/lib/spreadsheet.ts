// Reads an uploaded bulk-import file as CSV text so the existing CSV parsers
// in store.ts handle both .csv and Excel (.xlsx) uploads identically.

const quote = (v: unknown): string => {
  if (v === null || v === undefined) return '""';
  let s: string;
  if (v instanceof Date) {
    s = v.toISOString().split('T')[0];
  } else {
    s = String(v);
  }
  // Every field quoted: the store.ts row regex keeps empty cells and spaces intact.
  return `"${s.replace(/"/g, '""').replace(/[\r\n]+/g, ' ').trim()}"`;
};

export const BULK_UPLOAD_ACCEPT =
  '.csv,.xlsx,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

export async function readUploadAsCsv(file: File): Promise<string> {
  const name = file.name.toLowerCase();
  if (name.endsWith('.xlsx')) {
    const { readSheet } = await import('read-excel-file/browser');
    const rows = await readSheet(file);
    return rows
      .filter(row => row.some(cell => cell !== null && String(cell).trim() !== ''))
      .map(row => row.map(quote).join(','))
      .join('\n');
  }
  if (name.endsWith('.xls')) {
    throw new Error('Legacy .xls files are not supported. Save the sheet as .xlsx or .csv and upload again.');
  }
  return (await file.text()).replace(/^﻿/, '').replace(/\r/g, '');
}
