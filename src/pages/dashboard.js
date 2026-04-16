import { getEntries } from '../store.js';
import { getGreeting, getTodayStr, calcStreak } from '../utils.js';
import { escapeHtml } from '../sanitize.js';
import { renderEntryRow, renderEmptyState } from '../components.js';

export function renderDashboard() {
  const entries = getEntries();
  const today = getTodayStr();
  const todayEntry = entries.find((e) => e.date === today);
  const streak = calcStreak(entries);
  const thisWeek = entries.filter((e) => {
    const d = new Date(e.date + 'T00:00:00');
    const now = new Date();
    return (now - d) / (1000 * 60 * 60 * 24) < 7;
  });

  const greetingText = document.getElementById('greetingText');
  const greetingSub = document.getElementById('greetingSub');
  const streakBadge = document.getElementById('streakBadge');
  const statsGrid = document.getElementById('statsGrid');
  const recentEntries = document.getElementById('recentEntries');

  if (greetingText) greetingText.textContent = getGreeting();
  if (greetingSub) greetingSub.textContent = todayEntry
    ? '今天已经记录过了，去看看吧'
    : '今天还没有写日志，开始记录吧';

  if (streakBadge) {
    streakBadge.innerHTML = streak > 0
      ? `<div class="streak-badge">🔥 连续 ${streak} 天</div>`
      : '';
  }

  if (statsGrid) {
    statsGrid.innerHTML = `
      <div class="stat-item">
        <div class="stat-value">${entries.length}</div>
        <div class="stat-label">总日志</div>
      </div>
      <div class="stat-item">
        <div class="stat-value">${streak}</div>
        <div class="stat-label">连续天数</div>
      </div>
      <div class="stat-item">
        <div class="stat-value">${thisWeek.length}</div>
        <div class="stat-label">本周</div>
      </div>
      <div class="stat-item">
        <div class="stat-value">${entries.filter((e) => e.archived).length}</div>
        <div class="stat-label">已归档</div>
      </div>`;
  }

  if (!recentEntries) return;
  const recent = [...entries].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 8);
  if (!recent.length) {
    const empty = renderEmptyState(
      '🌱', '还没有日志记录', '开始你的第一篇成长日志吧',
      '<button class="btn btn-primary" data-action="navigate" data-page="write">写第一篇日志</button>'
    );
    recentEntries.innerHTML = '';
    recentEntries.appendChild(empty);
    return;
  }
  recentEntries.innerHTML = '';
  const fragment = document.createDocumentFragment();
  for (const entry of recent) {
    fragment.appendChild(renderEntryRow(entry));
  }
  recentEntries.appendChild(fragment);
}
