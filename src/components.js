import { escapeHtml } from './sanitize.js';
import { formatDateShort } from './utils.js';

export function showToast(message, type = 'success') {
  const container = document.getElementById('toastContainer');
  if (!container) return;
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(() => {
    if (toast.parentNode) toast.remove();
  }, 3000);
}

export function showModal(title, text, actions) {
  const overlay = document.getElementById('modalOverlay');
  const titleEl = document.getElementById('modalTitle');
  const textEl = document.getElementById('modalText');
  const actionsEl = document.getElementById('modalActions');
  if (!overlay || !titleEl || !textEl || !actionsEl) return;

  titleEl.textContent = title;
  textEl.textContent = text;
  actionsEl.innerHTML = '';

  for (const action of actions) {
    const btn = document.createElement('button');
    btn.className = action.className;
    btn.textContent = action.text;
    btn.addEventListener('click', action.handler);
    actionsEl.appendChild(btn);
  }

  overlay.classList.add('active');
}

export function closeModal(event) {
  const overlay = document.getElementById('modalOverlay');
  if (!overlay) return;
  if (event && event.target !== event.currentTarget) return;
  overlay.classList.remove('active');
}

export function renderEntryRow(entry) {
  const preview = escapeHtml(
    entry.happy || entry.fulfilling || entry.improve || entry.reflection || entry.grateful || '无内容'
  );
  const tags = [];
  if (entry.happy) tags.push('<span class="tag tag-happy">快乐</span>');
  if (entry.fulfilling) tags.push('<span class="tag tag-fulfill">充实</span>');
  if (entry.improve) tags.push('<span class="tag tag-improve">改进</span>');
  if (entry.reflection) tags.push('<span class="tag tag-reflect">反思</span>');
  if (entry.grateful) tags.push('<span class="tag tag-grateful">感恩</span>');
  const archivedBadge = entry.archived ? '<span class="archived-badge">已归档</span>' : '';
  const escapedId = escapeHtml(entry.id);

  const row = document.createElement('div');
  row.className = 'entry-row';
  row.dataset.entryId = escapedId;
  row.innerHTML = `
    <div class="entry-row-date">${formatDateShort(entry.date)}</div>
    <div class="entry-row-preview">${preview}${archivedBadge}</div>
    <div class="entry-row-tags">${tags.join('')}</div>
    <div class="entry-actions">
      <button class="btn-icon" data-entry-action="edit" data-entry-id="${escapedId}" title="编辑">✏️</button>
      <button class="btn-icon" data-entry-action="archive" data-entry-id="${escapedId}" title="${entry.archived ? '取消归档' : '归档'}">${entry.archived ? '📂' : '📁'}</button>
      <button class="btn-icon" data-entry-action="delete" data-entry-id="${escapedId}" title="删除">🗑️</button>
    </div>`;
  return row;
}

export function renderEmptyState(icon, title, text, actionBtn) {
  const html = `
    <div class="empty-state">
      <div class="empty-state-icon">${icon}</div>
      <div class="empty-state-title">${escapeHtml(title)}</div>
      <div class="empty-state-text">${escapeHtml(text)}</div>
      ${actionBtn || ''}
    </div>`;
  const div = document.createElement('div');
  div.innerHTML = html;
  return div.firstElementChild;
}

export function renderPagination(paginationData, onPageChange) {
  const container = document.getElementById('historyPagination');
  if (!container) return;
  if (paginationData.totalPages <= 1) {
    container.innerHTML = '';
    return;
  }
  container.innerHTML = '';
  const wrapper = document.createElement('div');
  wrapper.className = 'pagination-inner';

  if (paginationData.hasPrev) {
    const prev = document.createElement('button');
    prev.className = 'btn btn-secondary btn-sm';
    prev.textContent = '上一页';
    prev.addEventListener('click', () => onPageChange(paginationData.currentPage - 1));
    wrapper.appendChild(prev);
  }

  const info = document.createElement('span');
  info.className = 'pagination-info';
  info.textContent = `${paginationData.currentPage} / ${paginationData.totalPages}`;
  wrapper.appendChild(info);

  if (paginationData.hasNext) {
    const next = document.createElement('button');
    next.className = 'btn btn-secondary btn-sm';
    next.textContent = '下一页';
    next.addEventListener('click', () => onPageChange(paginationData.currentPage + 1));
    wrapper.appendChild(next);
  }

  container.appendChild(wrapper);
}
