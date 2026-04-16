import { generateId } from './utils.js';

const STORAGE_KEY = 'growth_journal_entries';
const DATA_VERSION_KEY = 'growth_journal_version';
const CURRENT_VERSION = 2;

let cache = null;
let cacheValid = false;

function invalidateCache() {
  cache = null;
  cacheValid = false;
}

export function clearCache() {
  invalidateCache();
}

export function getEntries() {
  if (cacheValid && cache !== null) return cache;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) { cache = []; cacheValid = true; return cache; }
    const entries = JSON.parse(raw);
    if (!Array.isArray(entries)) { cache = []; cacheValid = true; return cache; }
    cache = entries;
    cacheValid = true;
    return cache;
  } catch {
    cache = [];
    cacheValid = true;
    return cache;
  }
}

export function setEntries(entries) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  localStorage.setItem(DATA_VERSION_KEY, String(CURRENT_VERSION));
  cache = entries;
  cacheValid = true;
}

export function addEntry(entry) {
  const entries = getEntries();
  entries.push(entry);
  setEntries(entries);
  return entries;
}

export function updateEntry(id, updates) {
  const entries = getEntries();
  const idx = entries.findIndex((e) => e.id === id);
  if (idx === -1) return null;
  entries[idx] = { ...entries[idx], ...updates, updatedAt: new Date().toISOString() };
  setEntries(entries);
  return entries[idx];
}

export function deleteEntryById(id) {
  const entries = getEntries().filter((e) => e.id !== id);
  setEntries(entries);
  return entries;
}

export function findEntry(id) {
  return getEntries().find((e) => e.id === id) || null;
}

export function getDataVersion() {
  return parseInt(localStorage.getItem(DATA_VERSION_KEY) || '1', 10);
}

export function isLegacyData() {
  return getDataVersion() < CURRENT_VERSION;
}

export function migrateData() {
  const entries = getEntries();
  const migrated = entries.map((e) => ({
    id: e.id || generateId(),
    date: e.date || '',
    happy: e.happy || '',
    fulfilling: e.fulfilling || '',
    improve: e.improve || '',
    reflection: e.reflection || '',
    grateful: e.grateful || '',
    archived: e.archived || false,
    createdAt: e.createdAt || new Date().toISOString(),
    updatedAt: e.updatedAt || new Date().toISOString(),
  }));
  setEntries(migrated);
  return migrated;
}

export function getStorageUsage() {
  try {
    const data = localStorage.getItem(STORAGE_KEY) || '';
    return {
      usedBytes: new Blob([data]).size,
      entries: getEntries().length,
    };
  } catch {
    return { usedBytes: 0, entries: 0 };
  }
}

export function exportAllData() {
  return JSON.stringify({
    version: CURRENT_VERSION,
    exportedAt: new Date().toISOString(),
    entries: getEntries(),
  }, null, 2);
}

export function importAllData(jsonStr) {
  const data = JSON.parse(jsonStr);
  if (!data.entries || !Array.isArray(data.entries)) {
    throw new Error('无效的数据格式');
  }
  setEntries(data.entries);
  return data.entries.length;
}
