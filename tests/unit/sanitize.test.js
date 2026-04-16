import { describe, it, expect } from 'vitest';
import { escapeHtml, escapeAttribute, validateEntry, sanitizeEntryInput } from '../../src/sanitize.js';

describe('escapeHtml', () => {
  it('should escape HTML special characters', () => {
    expect(escapeHtml('<script>alert("xss")</script>')).toBe(
      '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;'
    );
  });

  it('should escape ampersands', () => {
    expect(escapeHtml('a & b')).toBe('a &amp; b');
  });

  it('should escape single quotes', () => {
    expect(escapeHtml("it's")).toBe('it&#x27;s');
  });

  it('should return empty string for non-string input', () => {
    expect(escapeHtml(null)).toBe('');
    expect(escapeHtml(undefined)).toBe('');
    expect(escapeHtml(123)).toBe('');
  });

  it('should not modify safe text', () => {
    expect(escapeHtml('hello world')).toBe('hello world');
  });

  it('should handle complex XSS payloads', () => {
    expect(escapeHtml('<img src=x onerror=alert(1)>')).toBe(
      '&lt;img src=x onerror=alert(1)&gt;'
    );
  });
});

describe('escapeAttribute', () => {
  it('should escape forward slashes in addition to HTML chars', () => {
    expect(escapeAttribute('path/to/file')).toBe('path&#x2F;to&#x2F;file');
  });
});

describe('validateEntry', () => {
  it('should validate a correct entry', () => {
    const result = validateEntry({
      date: '2025-11-25',
      happy: 'test content',
    });
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should reject entry without date', () => {
    const result = validateEntry({ happy: 'test' });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('日期格式无效');
  });

  it('should reject entry with invalid date format', () => {
    const result = validateEntry({ date: '11-25-2025', happy: 'test' });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('日期格式必须为 YYYY-MM-DD');
  });

  it('should reject entry with no content', () => {
    const result = validateEntry({ date: '2025-11-25' });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('请至少填写一项内容');
  });

  it('should reject entry with content exceeding 500 chars', () => {
    const result = validateEntry({
      date: '2025-11-25',
      happy: 'a'.repeat(501),
    });
    expect(result.valid).toBe(false);
  });

  it('should reject non-string fields', () => {
    const result = validateEntry({
      date: '2025-11-25',
      happy: 123,
    });
    expect(result.valid).toBe(false);
  });
});

describe('sanitizeEntryInput', () => {
  it('should sanitize and truncate fields', () => {
    const result = sanitizeEntryInput({
      date: '2025-11-25extra',
      happy: 'a'.repeat(600),
    });
    expect(result.date).toBe('2025-11-25');
    expect(result.happy).toHaveLength(500);
  });

  it('should handle missing fields', () => {
    const result = sanitizeEntryInput({});
    expect(result.date).toBe('');
    expect(result.happy).toBe('');
  });

  it('should convert non-string values to strings', () => {
    const result = sanitizeEntryInput({
      date: 20251125,
      happy: null,
    });
    expect(typeof result.date).toBe('string');
    expect(typeof result.happy).toBe('string');
  });
});
