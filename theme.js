/* =====================================================
   THEME SWITCH — cycles Minimal Dark (styles.css) → Paper (styles-paper.css)
   → Meadow (styles-meadow.css). Loaded synchronously in <head>, right after
   the theme stylesheets, so inactive ones are disabled before the first paint.
   ===================================================== */

(function () {
  const STORAGE_KEY = 'd2codex-theme';
  const THEMES = {
    minimal: { sheet: 'theme-minimal', name: 'Minimal Dark', next: 'paper' },
    paper:   { sheet: 'theme-paper',   name: 'Paper',        next: 'meadow' },
    meadow:  { sheet: 'theme-meadow',  name: 'Meadow',       next: 'minimal' },
  };

  function readTheme() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved in THEMES) return saved;
    } catch (e) { /* storage blocked (e.g. private mode) — fall back to default */ }
    return 'minimal';
  }

  function applyTheme(theme) {
    Object.keys(THEMES).forEach(name => {
      const link = document.getElementById(THEMES[name].sheet);
      if (link) link.disabled = name !== theme;
    });
    document.documentElement.dataset.theme = theme;

    const btn = document.getElementById('themeToggle');
    if (btn) {
      const next = THEMES[THEMES[theme].next].name;
      const label = btn.querySelector('.theme-toggle-label') || btn;
      label.textContent = `${next} theme`;
      btn.title = `Switch to the ${next} theme`;
      btn.setAttribute('aria-label', btn.title);
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
