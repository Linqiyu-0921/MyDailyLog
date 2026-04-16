import './styles/main.css';
import { navigateTo, goBack, toggleMobileMenu, registerPage } from './router.js';
import { initTheme, toggleTheme } from './theme.js';
import { renderDashboard } from './pages/dashboard.js';
import { initWritePage, shiftDate, updateCharCount, updateProgress, saveEntry, resetForm } from './pages/write.js';
import { renderHistory, setFilter } from './pages/history.js';
import { renderDetail, toggleArchive as toggleDetailArchive, confirmDelete as confirmDetailDelete } from './pages/detail.js';
import { renderArchive, toggleArchive as toggleArchiveAction } from './pages/archive.js';
import { renderExport, handleExportCSV, handleImportCSV, setupImportHandler } from './pages/export.js';
import { loadLegacyCSV } from './csv.js';
import { getEntries, updateEntry, deleteEntryById, isLegacyData, migrateData } from './store.js';
import { debounce } from './utils.js';
import { showToast, closeModal } from './components.js';

registerPage('dashboard', renderDashboard);
registerPage('write', initWritePage);
registerPage('history', renderHistory);
registerPage('detail', renderDetail);
registerPage('archive', renderArchive);
registerPage('export', renderExport);

import { setNavigate as setHistoryNavigate } from './pages/history.js';
import { setNavigate as setDetailNavigate } from './pages/detail.js';
setHistoryNavigate(navigateTo);
setDetailNavigate(navigateTo);

function handleEntryAction(action, entryId) {
  if (action === 'edit') {
    navigateTo('write', entryId);
  } else if (action === 'archive') {
    const entries = getEntries();
    const entry = entries.find((e) => e.id === entryId);
    if (entry) {
      entry.archived = !entry.archived;
      updateEntry(entryId, { archived: entry.archived });
      showToast(entry.archived ? '已归档' : '已取消归档', 'success');
      const currentPage = document.querySelector('.page.active');
      if (currentPage) {
        const pageId = currentPage.id.replace('page-', '');
        if (pageId === 'dashboard') renderDashboard();
        else if (pageId === 'history') renderHistory();
        else if (pageId === 'archive') renderArchive();
      }
    }
  } else if (action === 'delete') {
    showModal('确认删除', '删除后无法恢复，确定要删除这条日志吗？', [
      { text: '取消', className: 'btn btn-secondary', handler: () => closeModal() },
      { text: '删除', className: 'btn btn-danger', handler: () => {
        deleteEntryById(entryId);
        showToast('日志已删除', 'success');
        closeModal();
        const currentPage = document.querySelector('.page.active');
        if (currentPage) {
          const pageId = currentPage.id.replace('page-', '');
          if (pageId === 'detail') navigateTo('dashboard');
          else if (pageId === 'dashboard') renderDashboard();
          else if (pageId === 'history') renderHistory();
          else if (pageId === 'archive') renderArchive();
        }
      }},
    ]);
  }
}

function showModal(title, text, actions) {
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

function setupGlobalEvents() {
  document.addEventListener('click', (e) => {
    const target = e.target.closest('[data-action]');
    if (target) {
      const action = target.dataset.action;
      if (action === 'navigate') {
        e.preventDefault();
        navigateTo(target.dataset.page);
      } else if (action === 'shift-date') {
        shiftDate(parseInt(target.dataset.delta, 10));
      } else if (action === 'reset-form') {
        resetForm();
      } else if (action === 'save-entry') {
        saveEntry(navigateTo);
      } else if (action === 'go-back') {
        goBack();
      } else if (action === 'export-csv') {
        handleExportCSV();
      } else if (action === 'import-csv') {
        handleImportCSV();
      }
    }

    const entryAction = e.target.closest('[data-entry-action]');
    if (entryAction) {
      e.stopPropagation();
      const action = entryAction.dataset.entryAction;
      const entryId = entryAction.dataset.entryId;
      const row = entryAction.closest('.entry-row');
      if (row) {
        e.stopPropagation();
      }
      handleEntryAction(action, entryId);
    }

    const entryRow = e.target.closest('.entry-row');
    if (entryRow && !e.target.closest('[data-entry-action]')) {
      const entryId = entryRow.dataset.entryId;
      if (entryId) navigateTo('detail', entryId);
    }

    const filterBtn = e.target.closest('.filter-btn');
    if (filterBtn) {
      setFilter(filterBtn.dataset.filter, filterBtn);
    }
  });

  const themeToggle = document.getElementById('themeToggle');
  if (themeToggle) {
    themeToggle.addEventListener('click', toggleTheme);
  }

  const mobileMenuBtn = document.getElementById('mobileMenuBtn');
  if (mobileMenuBtn) {
    mobileMenuBtn.addEventListener('click', toggleMobileMenu);
  }

  const searchInput = document.getElementById('searchInput');
  if (searchInput) {
    searchInput.addEventListener('input', debounce(() => renderHistory(), 300));
  }

  const modalOverlay = document.getElementById('modalOverlay');
  if (modalOverlay) {
    modalOverlay.addEventListener('click', (e) => closeModal(e));
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeModal();
  });

  document.querySelectorAll('.form-textarea').forEach((el) => {
    el.addEventListener('input', () => updateCharCount(el));
  });

  setupImportHandler();
}

async function init() {
  if (isLegacyData()) {
    migrateData();
  }

  initTheme();
  setupGlobalEvents();

  const loaded = await loadLegacyCSV();
  if (loaded > 0) {
    showToast(`已从遗留数据导入 ${loaded} 条日志`, 'success');
  }

  renderDashboard();
}

init();
