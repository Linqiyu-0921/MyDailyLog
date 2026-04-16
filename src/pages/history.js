import { getEntries } from '../store.js';
import { paginate } from '../utils.js';
import { renderEntryRow, renderEmptyState, renderPagination } from '../components.js';

let currentFilter = 'all';
let currentPageNum = 1;
const PER_PAGE = 20;
let navigateFn = null;

export function setNavigate(fn) {
  navigateFn = fn;
}

export function renderHistory(pageNum) {
  if (pageNum !== undefined) currentPageNum = pageNum;
  const entries = getEntries().filter((e) => !e.archived);
  const searchInput = document.getElementById('searchInput');
  const search = (searchInput?.value || '').toLowerCase();
  let filtered = [...entries].sort((a, b) => b.date.localeCompare(a.date));

  if (search) {
    filtered = filtered.filter((e) =>
      (e.happy || '').toLowerCase().includes(search) ||
      (e.fulfilling || '').toLowerCase().includes(search) ||
      (e.improve || '').toLowerCase().includes(search) ||
      (e.reflection || '').toLowerCase().includes(search) ||
      (e.grateful || '').toLowerCase().includes(search) ||
      e.date.includes(search)
    );
  }

  if (currentFilter !== 'all') {
    filtered = filtered.filter((e) => {
      const field = currentFilter === 'happy' ? 'happy'
        : currentFilter === 'fulfilling' ? 'fulfilling'
        : currentFilter === 'improve' ? 'improve'
        : 'reflection';
      return e[field] && e[field].trim();
    });
  }

  const paginationData = paginate(filtered, currentPageNum, PER_PAGE);
  const container = document.getElementById('historyEntries');
  if (!container) return;

  if (!paginationData.items.length) {
    const empty = renderEmptyState(
      '🔍',
      search ? '没有找到匹配的日志' : '还没有日志记录',
      search ? '试试其他关键词' : '开始你的第一篇成长日志吧',
      !search ? '<button class="btn btn-primary" data-action="navigate" data-page="write">写第一篇日志</button>' : ''
    );
    container.innerHTML = '';
    container.appendChild(empty);
    renderPagination({ totalPages: 0, currentPage: 1, total: 0, hasNext: false, hasPrev: false }, () => {});
    return;
  }

  container.innerHTML = '';
  const fragment = document.createDocumentFragment();
  for (const entry of paginationData.items) {
    fragment.appendChild(renderEntryRow(entry));
  }
  container.appendChild(fragment);

  renderPagination(paginationData, (page) => renderHistory(page));
}

export function setFilter(filter, btn) {
  currentFilter = filter;
  currentPageNum = 1;
  document.querySelectorAll('.filter-btn').forEach((b) => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  renderHistory();
}
