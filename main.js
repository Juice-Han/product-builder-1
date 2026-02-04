// 테마 관리
const THEME_KEY = 'mainTheme';

function getCurrentTheme() {
  return localStorage.getItem(THEME_KEY) || 'light';
}

function setTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem(THEME_KEY, theme);
  updateThemeIcon(theme);
}

function updateThemeIcon(theme) {
  const themeIcon = document.getElementById('themeIcon');
  if (themeIcon) {
    themeIcon.textContent = theme === 'dark' ? '☀️' : '🌙';
  }
}

function toggleTheme() {
  const currentTheme = getCurrentTheme();
  const newTheme = currentTheme === 'light' ? 'dark' : 'light';
  setTheme(newTheme);
}

function initializeTheme() {
  const savedTheme = getCurrentTheme();
  setTheme(savedTheme);
}

// 이벤트 리스너
document.addEventListener('DOMContentLoaded', () => {
  initializeTheme();

  const themeToggle = document.getElementById('themeToggle');
  if (themeToggle) {
    themeToggle.addEventListener('click', toggleTheme);
  }
});
