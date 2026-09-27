/* =====================================================
   THEME SWITCH — cycles Minimal Dark (styles.css) → Stained Glass
   (styles-glass.css) → Star Atlas (styles-atlas.css) → Paper
   (styles-paper.css) → Meadow (styles-meadow.css).
   Loaded synchronously in <head>, right after the theme stylesheets, so
   inactive ones are disabled before the first paint.
   A ?theme= URL parameter (key or 1-based position) overrides the saved one.
   ===================================================== */

(function () {
  const STORAGE_KEY = 'd2codex-theme';
  const THEMES = {
    minimal: { sheet: 'theme-minimal', name: 'Minimal Dark',  next: 'glass' },
    glass:   { sheet: 'theme-glass',   name: 'Stained Glass', next: 'atlas' },
    atlas:   { sheet: 'theme-atlas',   name: 'Star Atlas',    next: 'paper' },
    paper:   { sheet: 'theme-paper',   name: 'Paper',         next: 'meadow' },
    meadow:  { sheet: 'theme-meadow',  name: 'Meadow',        next: 'minimal' },
  };

  // ?theme=atlas picks a theme by key; ?theme=3 by its 1-based position in
  // the switch order above.
  function urlTheme() {
    let param;
    try { param = new URLSearchParams(location.search).get('theme'); } catch (e) { return null; }
    if (!param) return null;
    param = param.trim().toLowerCase();
    if (param in THEMES) return param;
    const keys = Object.keys(THEMES);
    const n = Number(param);
    return Number.isInteger(n) && n >= 1 && n <= keys.length ? keys[n - 1] : null;
  }

  function readTheme() {
    const fromUrl = urlTheme();
    if (fromUrl) {
      // Saved so the choice carries over to the other pages' plain links.
      try { localStorage.setItem(STORAGE_KEY, fromUrl); } catch (e) { /* not persisted */ }
      return fromUrl;
    }
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
      try {
        const url = new URL(location.href);
        url.searchParams.set('theme', current);
        history.replaceState(history.state, '', url);
      } catch (e) { /* URL left as is */ }
    });
  });
})();
