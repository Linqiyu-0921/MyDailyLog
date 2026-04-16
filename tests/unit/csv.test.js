import { describe, it, expect } from 'vitest';
import { parseCSVLine, entriesToCSV, csvToEntries } from '../../src/csv.js';

describe('parseCSVLine', () => {
  it('should parse simple CSV line', () => {
    expect(parseCSVLine('a,b,c')).toEqual(['a', 'b', 'c']);
  });

  it('should parse quoted fields', () => {
    expect(parseCSVLine('"hello, world",b')).toEqual(['hello, world', 'b']);
  });

  it('should parse escaped quotes', () => {
    expect(parseCSVLine('"say ""hello""",b')).toEqual(['say "hello"', 'b']);
  });

  it('should handle empty fields', () => {
    expect(parseCSVLine('a,,c')).toEqual(['a', '', 'c']);
  });

  it('should handle single field', () => {
    expect(parseCSVLine('hello')).toEqual(['hello']);
  });
});

describe('entriesToCSV', () => {
  it('should convert entries to CSV string', () => {
    const entries = [{
      date: '2025-11-25',
      happy: 'good day',
      fulfilling: 'learned a lot',
      improve: 'sleep earlier',
      reflection: 'need focus',
      grateful: 'family',
    }];
    const csv = entriesToCSV(entries);
    expect(csv).toContain('日期');
    expect(csv).toContain('2025-11-25');
    expect(csv).toContain('good day');
  });

  it('should handle fields with commas', () => {
    const entries = [{
      date: '2025-11-25',
      happy: 'a, b, c',
      fulfilling: '',
      improve: '',
      reflection: '',
      grateful: '',
    }];
    const csv = entriesToCSV(entries);
    expect(csv).toContain('"a, b, c"');
  });

  it('should include BOM for Excel compatibility', () => {
    const csv = entriesToCSV([]);
    expect(csv.charCodeAt(0)).toBe(0xFEFF);
  });
});

describe('csvToEntries', () => {
  it('should parse valid CSV text', () => {
    const csv = '日期,快乐的事,充实的事,待改进的事,今日反思,感恩的人\n2025-11-25,good,learn,improve,think,thanks';
    const entries = csvToEntries(csv);
    expect(entries).toHaveLength(1);
    expect(entries[0].date).toBe('2025-11-25');
    expect(entries[0].happy).toBe('good');
  });

  it('should skip header-only CSV', () => {
    const csv = '日期,快乐的事,充实的事,待改进的事,今日反思,感恩的人';
    expect(csvToEntries(csv)).toHaveLength(0);
  });

  it('should skip entries without date or content', () => {
    const csv = '日期,快乐的事,充实的事,待改进的事,今日反思,感恩的人\n,good,learn,,,';
    expect(csvToEntries(csv)).toHaveLength(0);
  });

  it('should handle BOM prefix', () => {
    const csv = '\uFEFF日期,快乐的事,充实的事,待改进的事,今日反思,感恩的人\n2025-11-25,good,learn,,,';
    const entries = csvToEntries(csv);
    expect(entries).toHaveLength(1);
  });

  it('should generate unique IDs for entries', () => {
    const csv = '日期,快乐的事,充实的事,待改进的事,今日反思,感恩的人\n2025-11-25,a,b,,,\n2025-11-26,c,d,,,';
    const entries = csvToEntries(csv);
    expect(entries[0].id).not.toBe(entries[1].id);
  });
});

describe('round-trip CSV', () => {
  it('should preserve data through export and import cycle', () => {
    const original = [{
      id: 'test1',
      date: '2025-11-25',
      happy: 'happy content',
      fulfilling: 'fulfilling content',
      improve: 'improve content',
      reflection: 'reflection content',
      grateful: 'grateful content',
      archived: false,
      createdAt: '2025-11-25T00:00:00.000Z',
      updatedAt: '2025-11-25T00:00:00.000Z',
    }];
    const csv = entriesToCSV(original);
    const reimported = csvToEntries(csv);
    expect(reimported[0].date).toBe(original[0].date);
    expect(reimported[0].happy).toBe(original[0].happy);
    expect(reimported[0].fulfilling).toBe(original[0].fulfilling);
  });
});
