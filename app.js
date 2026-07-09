/* =====================================================
   SANCTUARY CODEX — Runewords app.js
   Data loaded from data/runewords-data.js (RUNEWORDS_DATA, RUNE_ORDER, CATEGORY_ORDER)
   ===================================================== */

'use strict';

function runeImg(name) {
  return `assets/runes/${name.toLowerCase()}.webp`;
}

let state = {
  filters: {
    search: '',
    category: 'all',
    socket: 'all',
    content: 'all',
    ladder: 'all',
    selectedRunes: new Set()
  },
  sort: 'category'
};

function init() {
  buildCategoryPills();
  buildRuneGrid();
  wireEvents();
  initRuneViewToggle();
  render();
}

function buildCategoryPills() {
  const allTypes = new Set();
  RUNEWORDS_DATA.forEach(rw => rw.itemTypes.forEach(t => allTypes.add(t)));

  const container = document.getElementById('categoryFilter');
  const all = document.createElement('button');
  all.className = 'pill active';
  all.dataset.category = 'all';
  all.textContent = 'All Types';
  container.appendChild(all);

  CATEGORY_ORDER.forEach(cat => {
    if (!allTypes.has(cat)) return;
    const btn = document.createElement('button');
    btn.className = 'pill';
    btn.dataset.category = cat;
    btn.textContent = cat;
    container.appendChild(btn);
  });

  container.addEventListener('click', e => {
    const btn = e.target.closest('.pill');
    if (!btn) return;
    container.querySelectorAll('.pill').forEach(p => p.classList.remove('active'));
    btn.classList.add('active');
    state.filters.category = btn.dataset.category;
    render();
  });
}

function buildRuneGrid() {
  const grid = document.getElementById('runeGrid');
  RUNE_ORDER.forEach(rune => {
    const btn = document.createElement('button');
    btn.className = 'rune-btn';
    btn.dataset.rune = rune;
    btn.title = `Filter by ${rune} rune`;
    btn.innerHTML = `<img class="rune-icon-img" src="${runeImg(rune)}" alt="${rune}"><span class="rune-icon-label">${rune}</span>`;
    grid.appendChild(btn);
  });

  grid.addEventListener('click', e => {
    const btn = e.target.closest('.rune-btn');
    if (!btn) return;
    const rune = btn.dataset.rune;
    if (state.filters.selectedRunes.has(rune)) {
      state.filters.selectedRunes.delete(rune);
      btn.classList.remove('selected');
    } else {
      state.filters.selectedRunes.add(rune);
      btn.classList.add('selected');
    }
    render();
  });

  document.getElementById('clearRunesBtn').addEventListener('click', () => {
    state.filters.selectedRunes.clear();
    grid.querySelectorAll('.rune-btn').forEach(b => b.classList.remove('selected'));
    render();
  });
}

function wireEvents() {
  const searchInput = document.getElementById('searchInput');
  let searchTimer;
  searchInput.addEventListener('input', () => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
      state.filters.search = searchInput.value.toLowerCase().trim();
      render();
    }, 180);
  });

  document.getElementById('socketFilter').addEventListener('click', e => {
    const btn = e.target.closest('.pill');
    if (!btn) return;
    document.getElementById('socketFilter').querySelectorAll('.pill').forEach(p => p.classList.remove('active'));
    btn.classList.add('active');
    state.filters.socket = btn.dataset.socket;
    render();
  });

  document.getElementById('contentFilter').addEventListener('click', e => {
    const btn = e.target.closest('.pill');
    if (!btn) return;
    document.getElementById('contentFilter').querySelectorAll('.pill').forEach(p => p.classList.remove('active'));
    btn.classList.add('active');
    state.filters.content = btn.dataset.content;
    render();
  });

  document.getElementById('ladderFilter').addEventListener('click', e => {
    const btn = e.target.closest('.pill');
    if (!btn) return;
    document.getElementById('ladderFilter').querySelectorAll('.pill').forEach(p => p.classList.remove('active'));
    btn.classList.add('active');
    state.filters.ladder = btn.dataset.ladder;
    render();
  });

  document.querySelectorAll('.sort-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.sort-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.sort = btn.dataset.sort;
      render();
    });
  });

  document.getElementById('resetBtn').addEventListener('click', resetAll);

  document.getElementById('modalClose').addEventListener('click', closeModal);
  document.getElementById('modal').addEventListener('click', e => {
    if (e.target === document.getElementById('modal')) closeModal();
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeModal();
  });
}

function getFilteredRunewords() {
  const { search, category, socket, content, ladder, selectedRunes } = state.filters;

  return RUNEWORDS_DATA.filter(rw => {
    if (category !== 'all' && !rw.itemTypes.includes(category)) return false;
    if (socket !== 'all' && rw.sockets !== parseInt(socket)) return false;
    if (content === 'new' && !rw.isNew) return false;
    if (content === 'classic' && rw.isNew) return false;
    if (ladder === 'true' && !rw.ladder) return false;
    if (ladder === 'false' && rw.ladder) return false;

    if (selectedRunes.size > 0) {
      const rwRuneSet = new Set(rw.runes);
      if (selectedRunes.size === 1) {
        const hasAny = [...selectedRunes].some(r => rwRuneSet.has(r));
        if (!hasAny) return false;
      } else {
        const hasAll = [...selectedRunes].every(r => rwRuneSet.has(r));
        if (!hasAll) return false;
      }
    }

    if (search) {
      const hay = [rw.name, rw.runes.join(' '), rw.itemTypes.join(' '), ...rw.stats]
        .join(' ').toLowerCase();
      if (!hay.includes(search)) return false;
    }

    return true;
  });
}

function sortRunewords(list) {
  const sorted = [...list];
  const categoryIndex = rw => {
    for (let i = 0; i < CATEGORY_ORDER.length; i++) {
      if (rw.itemTypes.includes(CATEGORY_ORDER[i])) return i;
    }
    return 99;
  };

  switch (state.sort) {
    case 'level':
      sorted.sort((a, b) => a.level - b.level || a.name.localeCompare(b.name));
      break;
    case 'name':
      sorted.sort((a, b) => a.name.localeCompare(b.name));
      break;
    case 'sockets':
      sorted.sort((a, b) => a.sockets - b.sockets || a.level - b.level);
      break;
    default:
      sorted.sort((a, b) => categoryIndex(a) - categoryIndex(b) || a.level - b.level);
  }
  return sorted;
}

function render() {
  const filtered = getFilteredRunewords();
  const sorted = sortRunewords(filtered);

  document.getElementById('statTotal').textContent = `${RUNEWORDS_DATA.length} runewords`;
  document.getElementById('statShown').textContent = `${sorted.length} shown`;

  const grid = document.getElementById('runewordGrid');
  const emptyState = document.getElementById('emptyState');
  grid.innerHTML = '';

  if (sorted.length === 0) {
    emptyState.classList.remove('hidden');
    return;
  }
  emptyState.classList.add('hidden');

  if (state.sort === 'category') {
    renderGrouped(sorted, grid);
  } else {
    sorted.forEach(rw => grid.appendChild(buildCard(rw)));
  }
}

function renderGrouped(list, container) {
  list.forEach(rw => container.appendChild(buildCard(rw)));
}

function buildCard(rw) {
  const card = document.createElement('div');
  card.className = 'rw-card' + (rw.isNew ? ' is-new' : '');
  card.innerHTML = `
    <div class="rw-card-head">
      <div class="rw-card-top">
        <div class="rw-name">${rw.name}</div>
        <div class="rw-level">Req. Lvl ${rw.level}</div>
      </div>
      <div class="rw-badges">
        ${rw.itemTypes.map(t => `<span class="badge badge-type">${t}</span>`).join('')}
        ${rw.ladder ? `<span class="badge badge-ladder">Ladder Only</span>` : ''}
        ${rw.ladderDisabled ? `<span class="badge badge-disabled">Disabled in Ladder</span>` : ''}
        ${rw.isNew ? `<span class="badge badge-new">Reign of the Warlock</span>` : ''}
      </div>
    </div>
    <div class="rw-runes">${formatRunes(rw.runes)}</div>
    <div class="rw-stats-preview">
      ${rw.stats.slice(0, 3).map(s => `<div class="rw-stat-line">${s}</div>`).join('')}
      ${rw.stats.length > 3 ? `<div class="rw-stat-more">+${rw.stats.length - 3} more…</div>` : ''}
    </div>
  `;
  card.addEventListener('click', () => openModal(rw));
  return card;
}

function formatRunes(runes) {
  return runes.map((r, i) =>
    `<span class="rune-tag">
       <img class="rune-tag-img" src="${runeImg(r)}" alt="${r}" title="${r}">
       <span class="rune-tag-label">${r}</span>
     </span>${i < runes.length - 1 ? '<span class="rune-arrow">›</span>' : ''}`
  ).join('');
}

function openModal(rw) {
  history.replaceState(null, '', '#' + encodeURIComponent(rw.name));
  const nameClass = rw.isNew ? 'modal-expansion-name' : '';
  const html = `
    <div class="modal-inner">
      <div class="modal-name ${nameClass}">${rw.name}</div>
      <div class="modal-meta">
        <span class="badge badge-type" style="font-size:0.82rem;padding:4px 12px;">Req. Level ${rw.level}</span>
        <span class="badge badge-type" style="font-size:0.82rem;padding:4px 12px;">${rw.sockets} Socket${rw.sockets > 1 ? 's' : ''}</span>
        ${rw.ladder ? `<span class="badge badge-ladder" style="font-size:0.82rem;padding:4px 12px;">Ladder Only</span>` : ''}
        ${rw.ladderDisabled ? `<span class="badge badge-disabled" style="font-size:0.82rem;padding:4px 12px;">Disabled in Ladder</span>` : ''}
        ${rw.isNew ? `<span class="badge badge-new" style="font-size:0.82rem;padding:4px 12px;">Reign of the Warlock</span>` : ''}
      </div>

      <div class="modal-section-label">Rune Order</div>
      <div class="modal-runes">
        ${rw.runes.map((r, i) =>
          `<span class="modal-rune-tag">
             <img class="rune-tag-img" src="${runeImg(r)}" alt="${r}" title="${r}">
             <span class="rune-tag-label">${r}</span>
           </span>${i < rw.runes.length - 1 ? '<span class="modal-rune-arrow">›</span>' : ''}`
        ).join('')}
      </div>

      <div class="modal-section-label">Item Types</div>
      <div class="modal-types">
        ${rw.itemTypes.map(t => `<span class="modal-type-tag">${t}</span>`).join('')}
      </div>

      <div class="modal-section-label">Properties</div>
      <ul class="modal-stats">
        ${rw.stats.map(s => `<li class="modal-stat-item">${s}</li>`).join('')}
      </ul>

      ${rw.ladder ? `<div class="modal-ladder-note">⚠ This runeword can only be created on Ladder-mode characters during an active season.</div>` : ''}
      ${rw.ladderDisabled ? `<div class="modal-disabled-note">⚠ This runeword is currently disabled on Ladder.</div>` : ''}
      ${rw.isNew ? `<div class="modal-expansion-note">✦ New in Diablo II: Resurrected — <em>Reign of the Warlock</em>.</div>` : ''}
      ${rw.url ? `<a class="modal-source-link" href="${rw.url}" target="_blank" rel="noopener">View source ↗</a>` : ''}
    </div>
  `;
  document.getElementById('modalContent').innerHTML = html;
  document.getElementById('modal').classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  document.getElementById('modal').classList.add('hidden');
  document.body.style.overflow = '';
  history.replaceState(null, '', window.location.pathname + window.location.search);
}

function resetAll() {
  state.filters = {
    search: '', category: 'all', socket: 'all',
    content: 'all', ladder: 'all', selectedRunes: new Set()
  };
  state.sort = 'category';

  document.getElementById('searchInput').value = '';

  document.querySelectorAll('#categoryFilter .pill').forEach((p, i) => p.classList.toggle('active', i === 0));
  document.querySelectorAll('#socketFilter .pill').forEach((p, i) => p.classList.toggle('active', i === 0));
  document.querySelectorAll('#contentFilter .pill').forEach((p, i) => p.classList.toggle('active', i === 0));
  document.querySelectorAll('#ladderFilter .pill').forEach((p, i) => p.classList.toggle('active', i === 0));
  document.querySelectorAll('.sort-btn').forEach((b, i) => b.classList.toggle('active', i === 0));
  document.querySelectorAll('.rune-btn').forEach(b => b.classList.remove('selected'));

  render();
}

function initRuneViewToggle() {
  const btn = document.getElementById('runeViewToggle');
  const label = document.getElementById('toggleLabel');

  const saved = localStorage && localStorage.getItem('runeView');
  if (saved === 'icons') {
    document.body.classList.add('rune-icons');
    label.textContent = 'Show Text';
  }

  btn.addEventListener('click', () => {
    const isIcons = document.body.classList.toggle('rune-icons');
    label.textContent = isIcons ? 'Show Text' : 'Show Icons';
    if (localStorage) localStorage.setItem('runeView', isIcons ? 'icons' : 'text');
  });
}

window.resetAll = resetAll;

init();

window.addEventListener('load', () => {
  if (!window.location.hash) return;
  const name = decodeURIComponent(window.location.hash.slice(1));
  const rw = RUNEWORDS_DATA.find(r => r.name === name);
  if (rw) openModal(rw);
});
