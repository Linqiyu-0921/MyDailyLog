const ESCAPE_MAP = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#x27;',
};

const ESCAPE_RE = /[&<>"']/g;

export function escapeHtml(str) {
  if (typeof str !== 'string') return '';
  return str.replace(ESCAPE_RE, (ch) => ESCAPE_MAP[ch]);
}

export function escapeAttribute(str) {
  return escapeHtml(str).replace(/\//g, '&#x2F;');
}

export function validateEntry(entry) {
  const errors = [];
  if (!entry.date || typeof entry.date !== 'string') {
    errors.push('日期格式无效');
  } else if (!/^\d{4}-\d{2}-\d{2}$/.test(entry.date)) {
    errors.push('日期格式必须为 YYYY-MM-DD');
  }
  const textFields = ['happy', 'fulfilling', 'improve', 'reflection', 'grateful'];
  for (const field of textFields) {
    if (entry[field] !== undefined && typeof entry[field] !== 'string') {
      errors.push(`${field} 必须为字符串`);
    }
    if (typeof entry[field] === 'string' && entry[field].length > 500) {
      errors.push(`${field} 内容不能超过500字`);
    }
  }
  const hasContent = textFields.some(
    (f) => typeof entry[f] === 'string' && entry[f].trim().length > 0
  );
  if (!hasContent) {
    errors.push('请至少填写一项内容');
  }
  return { valid: errors.length === 0, errors };
}

export function sanitizeEntryInput(raw) {
  return {
    date: String(raw.date || '').slice(0, 10),
    happy: String(raw.happy || '').slice(0, 500),
    fulfilling: String(raw.fulfilling || '').slice(0, 500),
    improve: String(raw.improve || '').slice(0, 500),
    reflection: String(raw.reflection || '').slice(0, 500),
    grateful: String(raw.grateful || '').slice(0, 500),
  };
}
