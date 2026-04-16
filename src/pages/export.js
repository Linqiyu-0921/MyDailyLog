import { getEntries } from '../store.js';
import { formatDate, calcStreak } from '../utils.js';
import { downloadCSV, importCSVFromFile, mergeImportedEntries } from '../csv.js';
import { showToast } from '../components.js';

export async function renderExport() {
  const entries = getEntries();
  const total = entries.length;
  const archived = entries.filter((e) => e.archived).length;
  const dates = entries.map((e) => e.date);
  const earliest = dates.length ? dates.sort()[0] : '-';
  const exportStats = document.getElementById('exportStats');
  if (exportStats) {
    exportStats.textContent = `共有 ${total} 条日志，其中 ${archived} 条已归档。最早记录：${earliest !== '-' ? formatDate(earliest) : '暂无'}。连续记录 ${calcStreak(entries)} 天。`;
  }
}

export function handleExportCSV() {
  const entries = getEntries();
  if (!entries.length) {
    showToast('暂无数据可导出', 'warning');
    return;
  }
  downloadCSV();
  showToast('CSV 文件已下载', 'success');
}

export async function handleImportCSV() {
  const fileInput = document.getElementById('importFile');
  if (!fileInput) return;
  fileInput.click();
}

export function setupImportHandler() {
  const fileInput = document.getElementById('importFile');
  if (!fileInput) return;
  fileInput.addEventListener('change', async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    try {
      const imported = await importCSVFromFile(file);
      const count = mergeImportedEntries(imported);
      showToast(`成功导入 ${count} 条日志`, 'success');
      renderExport();
    } catch (err) {
      showToast('导入失败：' + err.message, 'error');
    }
    fileInput.value = '';
  });
}
