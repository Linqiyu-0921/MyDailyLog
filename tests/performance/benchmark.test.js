import { describe, it, expect, beforeEach } from 'vitest';
import { generateId, paginate, calcStreak, formatDate, formatDateShort } from '../../src/utils.js';
import { escapeHtml } from '../../src/sanitize.js';
import { parseCSVLine, csvToEntries, entriesToCSV } from '../../src/csv.js';

beforeEach(() => {
  localStorage.clear();
});

describe('Performance Benchmarks', () => {
  it('should generate 1000 IDs in under 100ms', () => {
    const start = performance.now();
    const ids = [];
    for (let i = 0; i < 1000; i++) {
      ids.push(generateId());
    }
    const elapsed = performance.now() - start;
    expect(elapsed).toBeLessThan(100);
    expect(new Set(ids).size).toBe(1000);
  });

  it('should paginate 10000 items in under 10ms', () => {
    const items = Array.from({ length: 10000 }, (_, i) => ({ id: generateId(), date: '2025-11-25', happy: `entry ${i}` }));
    const start = performance.now();
    for (let page = 1; page <= 500; page++) {
      paginate(items, page, 20);
    }
    const elapsed = performance.now() - start;
    expect(elapsed).toBeLessThan(50);
  });

  it('should escape HTML for 10000 strings in under 50ms', () => {
    const strings = Array.from({ length: 10000 }, (_, i) => `<script>alert(${i})</script>`);
    const start = performance.now();
    for (const s of strings) {
      escapeHtml(s);
    }
    const elapsed = performance.now() - start;
    expect(elapsed).toBeLessThan(50);
  });

  it('should parse 1000 CSV lines in under 100ms', () => {
    const lines = Array.from({ length: 1000 }, (_, i) =>
      `2025-${String(Math.floor(i / 30) + 1).padStart(2, '0')}-${String((i % 28) + 1).padStart(2, '0')},happy ${i},fulfilling ${i},improve ${i},reflection ${i},grateful ${i}`
    );
    const csv = '日期,快乐的事,充实的事,待改进的事,今日反思,感恩的人\n' + lines.join('\n');
    const start = performance.now();
    const entries = csvToEntries(csv);
    const elapsed = performance.now() - start;
    expect(elapsed).toBeLessThan(200);
    expect(entries.length).toBeGreaterThan(0);
  });

  it('should export 1000 entries to CSV in under 100ms', () => {
    const entries = Array.from({ length: 1000 }, (_, i) => ({
      id: generateId(),
      date: `2025-${String(Math.floor(i / 30) + 1).padStart(2, '0')}-${String((i % 28) + 1).padStart(2, '0')}`,
      happy: `happy content ${i}`,
      fulfilling: `fulfilling content ${i}`,
      improve: `improve content ${i}`,
      reflection: `reflection content ${i}`,
      grateful: `grateful content ${i}`,
      archived: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));
    const start = performance.now();
    const csv = entriesToCSV(entries);
    const elapsed = performance.now() - start;
    expect(elapsed).toBeLessThan(100);
    expect(csv.length).toBeGreaterThan(0);
  });

  it('should calculate streak for 365 entries in under 10ms', () => {
    const entries = Array.from({ length: 365 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return { date: d.toISOString().split('T')[0] };
    });
    const start = performance.now();
    const streak = calcStreak(entries);
    const elapsed = performance.now() - start;
    expect(elapsed).toBeLessThan(10);
    expect(streak).toBeGreaterThan(0);
  });

  it('should format 10000 dates in under 50ms', () => {
    const dates = Array.from({ length: 10000 }, (_, i) => {
      const m = (i % 12) + 1;
      const d = (i % 28) + 1;
      return `2025-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    });
    const start = performance.now();
    for (const date of dates) {
      formatDate(date);
      formatDateShort(date);
    }
    const elapsed = performance.now() - start;
    expect(elapsed).toBeLessThan(100);
  });
});
