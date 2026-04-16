import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  getEntries,
  setEntries,
  addEntry,
  updateEntry,
  deleteEntryById,
  findEntry,
  getDataVersion,
  isLegacyData,
  getStorageUsage,
  exportAllData,
  importAllData,
  clearCache,
} from '../../src/store.js';

beforeEach(() => {
  localStorage.clear();
  clearCache();
});

describe('getEntries', () => {
  it('should return empty array when no data', () => {
    expect(getEntries()).toEqual([]);
  });

  it('should return parsed entries from localStorage', () => {
    const entries = [{ id: '1', date: '2025-11-25', happy: 'test' }];
    localStorage.setItem('growth_journal_entries', JSON.stringify(entries));
    expect(getEntries()).toEqual(entries);
  });

  it('should return empty array for invalid JSON', () => {
    localStorage.setItem('growth_journal_entries', 'invalid');
    expect(getEntries()).toEqual([]);
  });

  it('should return empty array for non-array data', () => {
    localStorage.setItem('growth_journal_entries', JSON.stringify({ key: 'value' }));
    expect(getEntries()).toEqual([]);
  });
});

describe('setEntries', () => {
  it('should save entries to localStorage', () => {
    const entries = [{ id: '1', date: '2025-11-25' }];
    setEntries(entries);
    expect(JSON.parse(localStorage.getItem('growth_journal_entries'))).toEqual(entries);
  });

  it('should update data version', () => {
    setEntries([]);
    expect(localStorage.getItem('growth_journal_version')).toBe('2');
  });
});

describe('addEntry', () => {
  it('should add entry to existing entries', () => {
    setEntries([{ id: '1', date: '2025-11-25' }]);
    const result = addEntry({ id: '2', date: '2025-11-26' });
    expect(result).toHaveLength(2);
    expect(result[1].id).toBe('2');
  });
});

describe('updateEntry', () => {
  it('should update existing entry', () => {
    setEntries([{ id: '1', date: '2025-11-25', happy: 'old' }]);
    const result = updateEntry('1', { happy: 'new' });
    expect(result.happy).toBe('new');
    expect(result.updatedAt).toBeDefined();
  });

  it('should return null for non-existent entry', () => {
    setEntries([]);
    const result = updateEntry('nonexistent', { happy: 'test' });
    expect(result).toBeNull();
  });
});

describe('deleteEntryById', () => {
  it('should remove entry by id', () => {
    setEntries([{ id: '1' }, { id: '2' }]);
    const result = deleteEntryById('1');
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('2');
  });
});

describe('findEntry', () => {
  it('should find entry by id', () => {
    setEntries([{ id: '1', date: '2025-11-25' }]);
    const result = findEntry('1');
    expect(result.date).toBe('2025-11-25');
  });

  it('should return null for non-existent entry', () => {
    setEntries([]);
    expect(findEntry('nonexistent')).toBeNull();
  });
});

describe('getDataVersion', () => {
  it('should return 1 for legacy data', () => {
    expect(getDataVersion()).toBe(1);
  });

  it('should return current version after setEntries', () => {
    setEntries([]);
    expect(getDataVersion()).toBe(2);
  });
});

describe('isLegacyData', () => {
  it('should return true for legacy data', () => {
    expect(isLegacyData()).toBe(true);
  });

  it('should return false after migration', () => {
    setEntries([]);
    expect(isLegacyData()).toBe(false);
  });
});

describe('getStorageUsage', () => {
  it('should return storage usage info', () => {
    setEntries([{ id: '1', date: '2025-11-25' }]);
    const usage = getStorageUsage();
    expect(usage.entries).toBe(1);
    expect(usage.usedBytes).toBeGreaterThan(0);
  });
});

describe('exportAllData / importAllData', () => {
  it('should export and import data correctly', () => {
    const entries = [{ id: '1', date: '2025-11-25', happy: 'test' }];
    setEntries(entries);
    const exported = exportAllData();
    const parsed = JSON.parse(exported);
    expect(parsed.version).toBe(2);
    expect(parsed.entries).toEqual(entries);

    localStorage.clear();
    const count = importAllData(exported);
    expect(count).toBe(1);
    expect(getEntries()).toEqual(entries);
  });

  it('should reject invalid import data', () => {
    expect(() => importAllData('{}')).toThrow('无效的数据格式');
    expect(() => importAllData('not json')).toThrow();
  });
});
