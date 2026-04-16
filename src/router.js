let currentPage = 'dashboard';
let previousPage = 'dashboard';
let currentDetailId = null;

const pageRenderers = {};

export function registerPage(name, renderer) {
  pageRenderers[name] = renderer;
}

export function getCurrentPage() {
  return currentPage;
}

export function getPreviousPage() {
  return previousPage;
}

export function getCurrentDetailId() {
  return currentDetailId;
}

export function navigateTo(page, params) {
  previousPage = currentPage;
  currentPage = page;
  if (page === 'detail' && params) {
    currentDetailId = params;
  }
  document.querySelectorAll('.page').forEach((p) => p.classList.remove('active'));
  document.querySelectorAll('.nav-link').forEach((t) => t.classList.remove('active'));
  const target = document.getElementById('page-' + page);
  if (target) target.classList.add('active');
  const tab = document.querySelector(`.nav-link[data-page="${page}"]`);
  if (tab) tab.classList.add('active');
  const navGroup = document.getElementById('navGroup');
  if (navGroup) navGroup.classList.remove('mobile-open');
  const renderer = pageRenderers[page];
  if (renderer) renderer(params);
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

export function goBack() {
  navigateTo(previousPage === 'detail' ? 'dashboard' : previousPage);
}

export function toggleMobileMenu() {
  const navGroup = document.getElementById('navGroup');
  if (navGroup) navGroup.classList.toggle('mobile-open');
}
