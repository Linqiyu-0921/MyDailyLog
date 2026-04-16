import { getEntries, addEntry } from './store.js';
import { generateId, getTodayStr } from './utils.js';
import { escapeHtml } from './sanitize.js';

export function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"' && line[i + 1] === '"') { current += '"'; i++; }
      else if (ch === '"') { inQuotes = false; }
      else { current += ch; }
    } else {
      if (ch === '"') { inQuotes = true; }
      else if (ch === ',') { result.push(current); current = ''; }
      else { current += ch; }
    }
  }
  result.push(current);
  return result;
}

export function entriesToCSV(entries) {
  const headers = ['日期', '快乐的事', '充实的事', '待改进的事', '今日反思', '感恩的人'];
  const escapeCSVField = (val) => {
    const str = val || '';
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return '"' + str.replace(/"/g, '""') + '"';
    }
    return str;
  };
  const rows = entries.map((e) => [
    e.date,
    escapeCSVField(e.happy),
    escapeCSVField(e.fulfilling),
    escapeCSVField(e.improve),
    escapeCSVField(e.reflection),
    escapeCSVField(e.grateful),
  ]);
  return '\uFEFF' + headers.join(',') + '\n' + rows.map((r) => r.join(',')).join('\n');
}

export function csvToEntries(text) {
  const cleaned = text.replace(/^\uFEFF/, '');
  const lines = cleaned.split('\n').filter((l) => l.trim());
  if (lines.length < 2) return [];
  const entries = [];
  for (let i = 1; i < lines.length; i++) {
    const fields = parseCSVLine(lines[i]);
    if (fields.length < 2) continue;
    const date = (fields[0] || '').trim();
    const happy = (fields[1] || '').trim();
    const fulfilling = (fields[2] || '').trim();
    const improve = (fields[3] || '').trim();
    const reflection = (fields[4] || '').trim();
    const grateful = (fields[5] || '').trim();
    if (!date || (!happy && !fulfilling)) continue;
    entries.push({
      id: generateId(),
      date,
      happy,
      fulfilling,
      improve,
      reflection,
      grateful,
      archived: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }
  return entries;
}

export function importCSVFromFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = function (e) {
      try {
        const entries = csvToEntries(e.target.result);
        resolve(entries);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error('文件读取失败'));
    reader.readAsText(file, 'utf-8');
  });
}

export function mergeImportedEntries(imported) {
  const existing = getEntries();
  const existingKeys = new Set(
    existing.map((e) => e.date + (e.happy || '') + (e.fulfilling || ''))
  );
  let count = 0;
  for (const entry of imported) {
    const key = entry.date + entry.happy + entry.fulfilling;
    if (!existingKeys.has(key)) {
      addEntry(entry);
      existingKeys.add(key);
      count++;
    }
  }
  return count;
}

export function downloadCSV() {
  const entries = getEntries();
  if (!entries.length) return false;
  const csv = entriesToCSV(entries);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `成长日志_${getTodayStr()}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  return true;
}

export async function loadLegacyCSV() {
  const entries = getEntries();
  if (entries.length > 0) return 0;
  try {
    const resp = await fetch('data/my_daily_log.csv');
    if (!resp.ok) return 0;
    const text = await resp.text();
    const imported = csvToEntries(text);
    if (imported.length > 0) {
      for (const entry of imported) {
        addEntry(entry);
      }
    }
    return imported.length;
  } catch {
    return 0;
  }
}
