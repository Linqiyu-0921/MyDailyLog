import { getEntries, addEntry, updateEntry, findEntry } from '../store.js';
import { getTodayStr, generateId } from '../utils.js';
import { validateEntry, sanitizeEntryInput } from '../sanitize.js';
import { showToast } from '../components.js';

const FIELD_IDS = [
  { id: 'entryHappy', countId: 'happyCount' },
  { id: 'entryFulfilling', countId: 'fulfillingCount' },
  { id: 'entryImprove', countId: 'improveCount' },
  { id: 'entryReflection', countId: 'reflectionCount' },
  { id: 'entryGrateful', countId: 'gratefulCount' },
];

export function initWritePage(editId) {
  const writeTitle = document.getElementById('writeTitle');
  const entryDate = document.getElementById('entryDate');
  const editIdInput = document.getElementById('editId');
  const saveBtn = document.getElementById('saveBtn');

  if (editId) {
    const entry = findEntry(editId);
    if (entry) {
      if (writeTitle) writeTitle.textContent = '编辑日志';
      if (entryDate) entryDate.value = entry.date;
      document.getElementById('entryHappy').value = entry.happy || '';
      document.getElementById('entryFulfilling').value = entry.fulfilling || '';
      document.getElementById('entryImprove').value = entry.improve || '';
      document.getElementById('entryReflection').value = entry.reflection || '';
      document.getElementById('entryGrateful').value = entry.grateful || '';
      if (editIdInput) editIdInput.value = editId;
      if (saveBtn) saveBtn.textContent = '更新日志';
      updateAllCharCounts();
      updateProgress();
      return;
    }
  }
  if (writeTitle) writeTitle.textContent = '今天的复盘';
  if (entryDate) entryDate.value = getTodayStr();
  document.getElementById('entryHappy').value = '';
  document.getElementById('entryFulfilling').value = '';
  document.getElementById('entryImprove').value = '';
  document.getElementById('entryReflection').value = '';
  document.getElementById('entryGrateful').value = '';
  if (editIdInput) editIdInput.value = '';
  if (saveBtn) saveBtn.textContent = '保存日志';
  updateAllCharCounts();
  updateProgress();
}

export function shiftDate(delta) {
  const input = document.getElementById('entryDate');
  if (!input || !input.value) return;
  const d = new Date(input.value + 'T00:00:00');
  d.setDate(d.getDate() + delta);
  input.value = d.toISOString().split('T')[0];
}

export function updateCharCount(textarea) {
  if (!textarea) return;
  const id = textarea.id;
  const countId = id.replace('entry', '').toLowerCase() + 'Count';
  const countEl = document.getElementById(countId);
  if (countEl) countEl.textContent = textarea.value.length;
  updateProgress();
}

export function updateAllCharCounts() {
  for (const f of FIELD_IDS) {
    const el = document.getElementById(f.id);
    const countEl = document.getElementById(f.countId);
    if (el && countEl) countEl.textContent = el.value.length;
  }
}

export function updateProgress() {
  const fields = ['entryHappy', 'entryFulfilling', 'entryImprove', 'entryReflection', 'entryGrateful'];
  let filled = 0;
  for (const f of fields) {
    const el = document.getElementById(f);
    if (el && el.value.trim()) filled++;
  }
  const pct = Math.round((filled / fields.length) * 100);
  const progressEl = document.getElementById('formProgress');
  const hintEl = document.getElementById('formProgressHint');
  if (progressEl) progressEl.style.width = pct + '%';
  const hints = ['填写更多内容来提升完成度', '继续加油', '快要完成了', '就差一点了', '几乎完美', '完美，所有字段都已填写'];
  if (hintEl) hintEl.textContent = hints[filled];
}

export function saveEntry(navigateTo) {
  const raw = {
    date: document.getElementById('entryDate')?.value || '',
    happy: document.getElementById('entryHappy')?.value || '',
    fulfilling: document.getElementById('entryFulfilling')?.value || '',
    improve: document.getElementById('entryImprove')?.value || '',
    reflection: document.getElementById('entryReflection')?.value || '',
    grateful: document.getElementById('entryGrateful')?.value || '',
  };

  const sanitized = sanitizeEntryInput(raw);
  const validation = validateEntry(sanitized);
  if (!validation.valid) {
    showToast(validation.errors[0], 'warning');
    return;
  }

  const editId = document.getElementById('editId')?.value;

  if (editId) {
    const updated = updateEntry(editId, sanitized);
    if (updated) {
      showToast('日志已更新', 'success');
      navigateTo('detail', editId);
      return;
    }
  }

  const newEntry = {
    id: generateId(),
    ...sanitized,
    archived: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  addEntry(newEntry);
  showToast(`${sanitized.date} 的日志已保存`, 'success');
  resetForm();
  navigateTo('dashboard');
}

export function resetForm() {
  const entryDate = document.getElementById('entryDate');
  const editIdInput = document.getElementById('editId');
  const writeTitle = document.getElementById('writeTitle');
  const saveBtn = document.getElementById('saveBtn');

  if (entryDate) entryDate.value = getTodayStr();
  document.getElementById('entryHappy').value = '';
  document.getElementById('entryFulfilling').value = '';
  document.getElementById('entryImprove').value = '';
  document.getElementById('entryReflection').value = '';
  document.getElementById('entryGrateful').value = '';
  if (editIdInput) editIdInput.value = '';
  if (writeTitle) writeTitle.textContent = '今天的复盘';
  if (saveBtn) saveBtn.textContent = '保存日志';
  updateAllCharCounts();
  updateProgress();
}
