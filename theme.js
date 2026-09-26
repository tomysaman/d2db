/* =====================================================
   THEME SWITCH — "dark" (styles.css) or "paper" (styles-paper.css)
   Loaded synchronously in <head>, right after both theme stylesheets,
   so the inactive one is disabled before the first paint (no flash).
   ===================================================== */

(function () {
  const STORAGE_KEY = 'd2codex-theme';
  const THEMES = {
    dark:  { sheet: 'theme-dark',  next: 'paper', label: 'Paper theme' },
    paper: { sheet: 'theme-paper', next: 'dark',  label: 'Dark theme' },
  };

  function readTheme() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved in THEMES) return saved;
    } catch (e) { /* storage blocked (e.g. private mode) — fall back to default */ }
    return 'dark';
  }

  function applyTheme(theme) {
    Object.keys(THEMES).forEach(name => {
      const link = document.getElementById(THEMES[name].sheet);
      if (link) link.disabled = name !== theme;
    });
    document.documentElement.dataset.theme = theme;

    const btn = document.getElementById('themeToggle');
    if (btn) {
      btn.textContent = THEMES[theme].label;
      btn.title = `Switch to the ${THEMES[theme].next} theme`;
    }
  }

  let current = readTheme();
  applyTheme(current);

  document.addEventListener('DOMContentLoaded', () => {
    applyTheme(current);
    const btn = document.getElementById('themeToggle');
    if (!btn) return;
    btn.addEventListener('click', () => {
      current = THEMES[current].next;
      applyTheme(current);
      try { localStorage.setItem(STORAGE_KEY, current); } catch (e) { /* not persisted */ }
    });
  });
})();
