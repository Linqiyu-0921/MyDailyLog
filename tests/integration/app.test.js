import { describe, it, expect, beforeEach, vi } from 'vitest';
import { parseCSVLine, csvToEntries, entriesToCSV } from '../../src/csv.js';
import { escapeHtml, validateEntry, sanitizeEntryInput } from '../../src/sanitize.js';
import { generateId, formatDate, paginate, calcStreak, debounce } from '../../src/utils.js';

beforeEach(() => {
  localStorage.clear();
});

describe('Data Flow Integration', () => {
  it('should handle complete entry lifecycle', async () => {
    const { getEntries, setEntries, addEntry, updateEntry, deleteEntryById, findEntry } = await import('../../src/store.js');

    const raw = {
      date: '2025-11-25',
      happy: '<script>alert("xss")</script>',
      fulfilling: 'learned something',
      improve: '',
      reflection: '',
      grateful: '',
    };

    const sanitized = sanitizeEntryInput(raw);
    const validation = validateEntry(sanitized);
    expect(validation.valid).toBe(true);

    const entry = {
      id: generateId(),
      ...sanitized,
      archived: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    addEntry(entry);

    const stored = getEntries();
    expect(stored).toHaveLength(1);
    expect(stored[0].happy).toBe('<script>alert("xss")</script>');

    const escaped = escapeHtml(stored[0].happy);
    expect(escaped).toBe('&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;');

    updateEntry(entry.id, { improve: 'sleep earlier' });
    const updated = findEntry(entry.id);
    expect(updated.improve).toBe('sleep earlier');

    deleteEntryById(entry.id);
    expect(getEntries()).toHaveLength(0);
  });

  it('should handle CSV import/export cycle', async () => {
    const { getEntries, setEntries } = await import('../../src/store.js');

    const entries = [
      {
        id: generateId(),
        date: '2025-11-25',
        happy: 'happy day',
        fulfilling: 'productive',
        improve: 'need rest',
        reflection: 'deep thought',
        grateful: 'friends',
        archived: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];
    setEntries(entries);

    const csv = entriesToCSV(entries);
    const reimported = csvToEntries(csv);
    expect(reimported).toHaveLength(1);
    expect(reimported[0].happy).toBe('happy day');
    expect(reimported[0].date).toBe('2025-11-25');
  });
});

describe('Pagination Integration', () => {
  it('should paginate large entry lists', () => {
    const entries = Array.from({ length: 100 }, (_, i) => ({
      id: generateId(),
      date: `2025-${String(Math.floor(i / 30) + 1).padStart(2, '0')}-${String((i % 28) + 1).padStart(2, '0')}`,
      happy: `entry ${i}`,
    }));

    const page1 = paginate(entries, 1, 20);
    expect(page1.items).toHaveLength(20);
    expect(page1.totalPages).toBe(5);
    expect(page1.hasNext).toBe(true);

    const page5 = paginate(entries, 5, 20);
    expect(page5.items).toHaveLength(20);
    expect(page5.hasNext).toBe(false);
  });
});

describe('Security Integration', () => {
  it('should prevent XSS through all input paths', () => {
    const xssPayloads = [
      '<script>alert(1)</script>',
      '<img src=x onerror=alert(1)>',
      '"><script>alert(1)</script>',
      "'-alert(1)-'",
      '<svg/onload=alert(1)>',
    ];

    for (const payload of xssPayloads) {
      const escaped = escapeHtml(payload);
      expect(escaped).not.toContain('<script>');
      expect(escaped).not.toMatch(/<img[^>]*onerror/i);
      expect(escaped).not.toMatch(/<svg[^>]*onload/i);
      expect(escaped).not.toContain('<');
      expect(escaped).not.toContain('>');
    }
  });

  it('should validate and sanitize CSV imported data', () => {
    const maliciousCSV = '日期,快乐的事,充实的事,待改进的事,今日反思,感恩的人\n2025-11-25,<script>alert(1)</script>,test,,,';
    const entries = csvToEntries(maliciousCSV);
    expect(entries).toHaveLength(1);
    const escaped = escapeHtml(entries[0].happy);
    expect(escaped).not.toContain('<script>');
  });
});

describe('Debounce Integration', () => {
  it('should debounce search input', async () => {
    vi.useFakeTimers();
    const results = [];
    const searchFn = debounce((query) => results.push(query), 300);

    searchFn('a');
    searchFn('ab');
    searchFn('abc');

    expect(results).toHaveLength(0);
    vi.advanceTimersByTime(300);
    expect(results).toHaveLength(1);
    expect(results[0]).toBe('abc');
    vi.useRealTimers();
  });
});
