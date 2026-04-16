import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  generateId,
  formatDate,
  formatDateShort,
  getWeekday,
  getTodayStr,
  getGreeting,
  debounce,
  calcStreak,
  paginate,
} from '../../src/utils.js';

describe('generateId', () => {
  it('should generate unique IDs', () => {
    const ids = new Set();
    for (let i = 0; i < 100; i++) {
      ids.add(generateId());
    }
    expect(ids.size).toBe(100);
  });

  it('should return a string', () => {
    expect(typeof generateId()).toBe('string');
  });
});

describe('formatDate', () => {
  it('should format date in Chinese', () => {
    expect(formatDate('2025-11-25')).toBe('2025年11月25日');
  });

  it('should handle single digit month/day', () => {
    expect(formatDate('2025-01-05')).toBe('2025年1月5日');
  });
});

describe('formatDateShort', () => {
  it('should format date as MM/DD', () => {
    expect(formatDateShort('2025-11-25')).toBe('11/25');
  });

  it('should pad single digits', () => {
    expect(formatDateShort('2025-01-05')).toBe('01/05');
  });
});

describe('getWeekday', () => {
  it('should return correct weekday', () => {
    expect(getWeekday('2025-11-25')).toBe('星期二');
  });
});

describe('getTodayStr', () => {
  it('should return date in YYYY-MM-DD format', () => {
    const result = getTodayStr();
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe('getGreeting', () => {
  it('should return a string', () => {
    expect(typeof getGreeting()).toBe('string');
  });
});

describe('debounce', () => {
  it('should delay function execution', async () => {
    vi.useFakeTimers();
    const fn = vi.fn();
    const debounced = debounce(fn, 300);
    debounced();
    debounced();
    debounced();
    expect(fn).not.toHaveBeenCalled();
    vi.advanceTimersByTime(300);
    expect(fn).toHaveBeenCalledTimes(1);
    vi.useRealTimers();
  });
});

describe('calcStreak', () => {
  it('should return 0 for empty entries', () => {
    expect(calcStreak([])).toBe(0);
  });

  it('should calculate consecutive days', () => {
    const today = getTodayStr();
    const d = new Date();
    d.setDate(d.getDate() - 1);
    const yesterday = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const entries = [
      { date: today },
      { date: yesterday },
    ];
    expect(calcStreak(entries)).toBeGreaterThanOrEqual(2);
  });
});

describe('paginate', () => {
  const items = Array.from({ length: 50 }, (_, i) => i);

  it('should return first page by default', () => {
    const result = paginate(items, 1, 20);
    expect(result.currentPage).toBe(1);
    expect(result.totalPages).toBe(3);
    expect(result.items).toHaveLength(20);
    expect(result.hasNext).toBe(true);
    expect(result.hasPrev).toBe(false);
  });

  it('should return correct page', () => {
    const result = paginate(items, 2, 20);
    expect(result.currentPage).toBe(2);
    expect(result.items[0]).toBe(20);
  });

  it('should handle last page with fewer items', () => {
    const result = paginate(items, 3, 20);
    expect(result.items).toHaveLength(10);
    expect(result.hasNext).toBe(false);
  });

  it('should handle empty items', () => {
    const result = paginate([], 1, 20);
    expect(result.totalPages).toBe(1);
    expect(result.items).toHaveLength(0);
  });

  it('should clamp out-of-range pages', () => {
    const result = paginate(items, 100, 20);
    expect(result.currentPage).toBe(3);
  });
});
