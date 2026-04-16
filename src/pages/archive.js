import { getEntries, updateEntry } from '../store.js';
import { renderEntryRow, renderEmptyState, showToast } from '../components.js';

export function renderArchive() {
  const entries = getEntries().filter((e) => e.archived);
  const sorted = [...entries].sort((a, b) => b.date.localeCompare(a.date));
  const archiveCount = document.getElementById('archiveCount');
  const archiveEntries = document.getElementById('archiveEntries');

  if (archiveCount) {
    archiveCount.textContent = sorted.length ? `共 ${sorted.length} 条` : '';
  }

  if (!archiveEntries) return;
  if (!sorted.length) {
    const empty = renderEmptyState('📂', '暂无归档日志', '将不常用的日志归档，保持历史页面整洁');
    archiveEntries.innerHTML = '';
    archiveEntries.appendChild(empty);
    return;
  }
  archiveEntries.innerHTML = '';
  const fragment = document.createDocumentFragment();
  for (const entry of sorted) {
    fragment.appendChild(renderEntryRow(entry));
  }
  archiveEntries.appendChild(fragment);
}

export function toggleArchive(id) {
  const entries = getEntries();
  const entry = entries.find((e) => e.id === id);
  if (!entry) return;
  entry.archived = !entry.archived;
  updateEntry(id, { archived: entry.archived });
  showToast(entry.archived ? '已归档' : '已取消归档', 'success');
}
