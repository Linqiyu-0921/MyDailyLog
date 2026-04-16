const THEME_KEY = 'growth_journal_theme';

export function initTheme() {
  const saved = localStorage.getItem(THEME_KEY);
  const toggle = document.getElementById('themeToggle');
  if (saved) {
    document.documentElement.setAttribute('data-theme', saved);
    if (toggle) toggle.textContent = saved === 'dark' ? '🌙' : '☀️';
  } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
    document.documentElement.setAttribute('data-theme', 'dark');
    if (toggle) toggle.textContent = '🌙';
  }
}

export function toggleTheme() {
  const html = document.documentElement;
  const current = html.getAttribute('data-theme');
  const next = current === 'dark' ? 'light' : 'dark';
  html.setAttribute('data-theme', next);
  localStorage.setItem(THEME_KEY, next);
  const toggle = document.getElementById('themeToggle');
  if (toggle) toggle.textContent = next === 'dark' ? '🌙' : '☀️';
}
