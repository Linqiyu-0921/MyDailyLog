import { getEntries, findEntry, updateEntry, deleteEntryById } from '../store.js';
import { formatDate, getWeekday } from '../utils.js';
import { escapeHtml } from '../sanitize.js';
import { showToast, showModal } from '../components.js';

let navigateFn = null;

export function setNavigate(fn) {
  navigateFn = fn;
}

export function renderDetail(id) {
  const entry = findEntry(id);
  if (!entry) {
    showToast('日志不存在', 'error');
    if (navigateFn) navigateFn('dashboard');
    return;
  }

  const detailDate = document.getElementById('detailDate');
  const detailWeekday = document.getElementById('detailWeekday');
  const detailContent = document.getElementById('detailContent');
  const detailActions = document.getElementById('detailActions');

  if (detailDate) detailDate.textContent = formatDate(entry.date);
  if (detailWeekday) detailWeekday.textContent = getWeekday(entry.date);

  if (detailContent) {
    const sections = [
      { title: '快乐的事', content: entry.happy },
      { title: '充实的事', content: entry.fulfilling },
      { title: '应该改进的事', content: entry.improve },
      { title: '今日反思', content: entry.reflection },
      { title: '感恩的人', content: entry.grateful },
    ];

    const filled = sections.filter((s) => s.content);
    if (!filled.length) {
      detailContent.innerHTML = '<div class="empty-state"><div class="empty-state-icon">📝</div><div class="empty-state-title">这条日志没有内容</div></div>';
    } else {
      detailContent.innerHTML = filled.map((s) => `
        <div class="detail-block">
          <div class="detail-block-title">${escapeHtml(s.title)}</div>
          <div class="detail-block-content">${escapeHtml(s.content)}</div>
        </div>`).join('');
    }
  }

  if (detailActions) {
    detailActions.innerHTML = '';
    const editBtn = document.createElement('button');
    editBtn.className = 'btn btn-secondary btn-sm';
    editBtn.textContent = '编辑';
    editBtn.addEventListener('click', () => {
      if (navigateFn) navigateFn('write', entry.id);
    });

    const archiveBtn = document.createElement('button');
    archiveBtn.className = 'btn btn-ghost btn-sm';
    archiveBtn.textContent = entry.archived ? '取消归档' : '归档';
    archiveBtn.addEventListener('click', () => {
      toggleArchive(entry.id);
    });

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'btn btn-danger btn-sm';
    deleteBtn.textContent = '删除';
    deleteBtn.addEventListener('click', () => {
      confirmDelete(entry.id);
    });

    detailActions.appendChild(editBtn);
    detailActions.appendChild(archiveBtn);
    detailActions.appendChild(deleteBtn);
  }
}

export function toggleArchive(id) {
  const entries = getEntries();
  const entry = entries.find((e) => e.id === id);
  if (!entry) return;
  entry.archived = !entry.archived;
  entry.updatedAt = new Date().toISOString();
  updateEntry(id, { archived: entry.archived });
  showToast(entry.archived ? '已归档' : '已取消归档', 'success');
  renderDetail(id);
}

export function confirmDelete(id) {
  showModal('确认删除', '删除后无法恢复，确定要删除这条日志吗？', [
    { text: '取消', className: 'btn btn-secondary', handler: () => closeModal() },
    { text: '删除', className: 'btn btn-danger', handler: () => { deleteEntry(id); closeModal(); } },
  ]);
}

function deleteEntry(id) {
  deleteEntryById(id);
  showToast('日志已删除', 'success');
  if (navigateFn) navigateFn('dashboard');
}

function closeModal() {
  const overlay = document.getElementById('modalOverlay');
  if (overlay) overlay.classList.remove('active');
}
