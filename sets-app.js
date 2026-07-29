/* =====================================================
   SANCTUARY CODEX — Item Sets app.js
   Data loaded from data/sets-data.js (SETS_DATA, SET_CLASS_ORDER)
   ===================================================== */

'use strict';

let state = {
  filters: {
    search: '',
    tier: 'all',
    klass: 'all',
    content: 'all'
  },
  sort: 'name',
  showAllStats: false
};

function init() {
  buildTierPills();
  buildClassPills();
  wireEvents();
  initStatViewToggle();
  render();
}

function statPreviewHtml(items, mapFn, moreClass) {
  if (state.showAllStats) return items.map(mapFn).join('');
  const shown = items.slice(0, 3).map(mapFn).join('');
  const more = items.length > 3 ? `<div class="${moreClass}">+${items.length - 3} more…</div>` : '';
  return shown + more;
}

function initStatViewToggle() {
  const btn = document.getElementById('statViewToggle');
  const label = document.getElementById('statToggleLabel');

  const saved = localStorage && localStorage.getItem('statPreviewView');
  state.showAllStats = saved === 'all';
  updateStatToggleUI(btn, label);

  btn.addEventListener('click', () => {
    state.showAllStats = !state.showAllStats;
    if (localStorage) localStorage.setItem('statPreviewView', state.showAllStats ? 'all' : 'preview');
    updateStatToggleUI(btn, label);
    render();
  });
}

function updateStatToggleUI(btn, label) {
  btn.classList.toggle('active', state.showAllStats);
  label.textContent = state.showAllStats ? 'Collapse Stats' : 'Expand All Stats';
}

function buildTierPills() {
  const container = document.getElementById('tierFilter');
  const all = document.createElement('button');
  all.className = 'pill active';
  all.dataset.tier = 'all';
  all.textContent = 'All';
  container.appendChild(all);

  SET_TIER_ORDER.forEach(tier => {
    if (!SETS_DATA.some(s => s.tier === tier)) return;
    const btn = document.createElement('button');
    btn.className = 'pill';
    btn.dataset.tier = tier;
    btn.textContent = tier;
    container.appendChild(btn);
  });

  container.addEventListener('click', e => {
    const btn = e.target.closest('.pill');
    if (!btn) return;
    container.querySelectorAll('.pill').forEach(p => p.classList.remove('active'));
    btn.classList.add('active');
    state.filters.tier = btn.dataset.tier;
    render();
  });
}

function buildClassPills() {
  const container = document.getElementById('classFilter');
  const all = document.createElement('button');
  all.className = 'pill active';
  all.dataset.class = 'all';
  all.textContent = 'All';
  container.appendChild(all);

  SET_CLASS_ORDER.forEach(c => {
    if (c === 'Any') return;
    if (!SETS_DATA.some(s => s.class === c)) return;
    const btn = document.createElement('button');
    btn.className = 'pill';
    btn.dataset.class = c;
    btn.textContent = c;
    container.appendChild(btn);
  });

  container.addEventListener('click', e => {
    const btn = e.target.closest('.pill');
    if (!btn) return;
    container.querySelectorAll('.pill').forEach(p => p.classList.remove('active'));
    btn.classList.add('active');
    state.filters.klass = btn.dataset.class;
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

  document.getElementById('contentFilter').addEventListener('click', e => {
    const btn = e.target.closest('.pill');
    if (!btn) return;
    document.getElementById('contentFilter').querySelectorAll('.pill').forEach(p => p.classList.remove('active'));
    btn.classList.add('active');
    state.filters.content = btn.dataset.content;
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

function getFilteredSets() {
  const { search, tier, klass, content } = state.filters;

  return SETS_DATA.filter(s => {
    if (tier !== 'all' && s.tier !== tier) return false;
    if (klass !== 'all' && s.class !== klass) return false;
    if (content === 'new' && !s.isNew) return false;
    if (content === 'classic' && s.isNew) return false;

    if (search) {
      const hay = [
        s.name, s.class, s.tier,
        ...s.pieces.map(p => p.name + ' ' + p.type),
        ...s.pieces.flatMap(p => p.stats),
        ...s.fullBonuses
      ].join(' ').toLowerCase();
      if (!hay.includes(search)) return false;
    }

    return true;
  });
}

function sortSets(list) {
  const sorted = [...list];
  switch (state.sort) {
    case 'level':
      sorted.sort((a, b) => (a.level || 0) - (b.level || 0) || a.name.localeCompare(b.name));
      break;
    default:
      sorted.sort((a, b) => a.name.localeCompare(b.name));
  }
  return sorted;
}

function render() {
  const filtered = getFilteredSets();

  document.getElementById('statTotal').textContent = `${SETS_DATA.length} sets`;
  document.getElementById('statShown').textContent = `${filtered.length} shown`;

  const grid = document.getElementById('setsGrid');
  const emptyState = document.getElementById('emptyState');
  grid.innerHTML = '';
  grid.className = 'sets-tier-groups';

  if (filtered.length === 0) {
    emptyState.classList.remove('hidden');
    return;
  }
  emptyState.classList.add('hidden');

  const groups = {};
  SET_TIER_ORDER.forEach(t => groups[t] = []);
  filtered.forEach(s => { if (groups[s.tier]) groups[s.tier].push(s); });

  SET_TIER_ORDER.forEach(tier => {
    const sets = groups[tier];
    if (!sets || sets.length === 0) return;

    const sorted = sortSets(sets);

    const wrapper = document.createElement('div');
    wrapper.className = `sets-tier-section tier-${tier}`;
    wrapper.innerHTML = `
      <div class="tier-header">
        <span class="tier-header-text">${tier} Sets</span>
        <span class="tier-header-line"></span>
      </div>
      <div class="sets-grid tier-grid"></div>`;

    const innerGrid = wrapper.querySelector('.tier-grid');
    sorted.forEach(s => innerGrid.appendChild(buildCard(s)));
    grid.appendChild(wrapper);
  });
}

function iconMarkup(icon, name, sizeClass) {
  if (icon) return `<img src="${icon}" alt="${name}" loading="lazy">`;
  return `<span class="${sizeClass}">✦</span>`;
}

function formatPartialBonus(line) {
  const m = line.match(/^(.*)\s+\((\d+)\s*Items?\)$/i);
  if (!m) return `<div class="partial-bonus-line">${line}</div>`;
  return `<div class="partial-bonus-line"><span class="partial-bonus-tag">${m[2]} Items</span>${m[1]}</div>`;
}

function buildCard(s) {
  const card = document.createElement('div');
  card.className = `set-card tier-${s.tier}` + (s.isNew ? ' is-new' : '');
  card.innerHTML = `
    <div class="set-card-top">
      <div class="set-name">${s.name}</div>
      ${s.level ? `<div class="set-level">Req. Lvl ${s.level}</div>` : ''}
    </div>
    <div class="set-badges">
      <span class="badge badge-tier-${s.tier}">${s.tier}</span>
      <span class="badge badge-class">${s.class === 'Any' ? 'Any Class' : s.class}</span>
      <span class="badge badge-type">${s.pieceCount} Piece${s.pieceCount > 1 ? 's' : ''}</span>
      ${s.isNew ? `<span class="badge badge-new">Reign of the Warlock</span>` : ''}
    </div>
    <div class="set-pieces-row">
      ${s.pieces.map(p => `
        <div class="set-piece-thumb" title="${p.name}">
          <div class="set-piece-icon-wrap">${iconMarkup(p.icon, p.name, 'set-piece-icon-fallback')}</div>
          <div class="set-piece-name">${p.name}</div>
        </div>
      `).join('')}
    </div>
    ${s.partialBonuses.length ? `
    <div class="set-bonus-preview set-partial-bonus-preview">
      <div class="set-bonus-label">Partial Set Bonuses</div>
      ${statPreviewHtml(s.partialBonuses, formatPartialBonus, 'set-bonus-more')}
    </div>` : ''}
    <div class="set-bonus-preview">
      <div class="set-bonus-label">Full Set Bonus</div>
      ${statPreviewHtml(s.fullBonuses, b => `<div class="set-bonus-line">${b}</div>`, 'set-bonus-more')}
    </div>
  `;
  card.addEventListener('click', () => openModal(s));
  return card;
}

function openModal(s) {
  history.replaceState(null, '', '#' + encodeURIComponent(s.name));
  const nameClass = s.isNew ? 'modal-expansion-name' : '';
  const html = `
    <div class="modal-inner">
      <div class="modal-name ${nameClass}">${s.name}</div>
      <div class="modal-meta">
        <span class="badge badge-tier-${s.tier}" style="font-size:0.82rem;padding:4px 12px;">${s.tier}</span>
        <span class="badge badge-class" style="font-size:0.82rem;padding:4px 12px;">${s.class === 'Any' ? 'Any Class' : s.class}</span>
        ${s.level ? `<span class="badge badge-type" style="font-size:0.82rem;padding:4px 12px;">Req. Level ${s.level}</span>` : ''}
        <span class="badge badge-type" style="font-size:0.82rem;padding:4px 12px;">${s.pieceCount} Piece${s.pieceCount > 1 ? 's' : ''}</span>
        ${s.isNew ? `<span class="badge badge-new" style="font-size:0.82rem;padding:4px 12px;">Reign of the Warlock</span>` : ''}
      </div>

      ${s.partialBonuses.length ? `
      <div class="modal-bonus-columns">
        <div class="modal-bonus-col">
          <div class="modal-section-label">Partial Set Bonuses</div>
          <div class="modal-partial-bonuses">
            ${s.partialBonuses.map(formatPartialBonus).join('')}
          </div>
        </div>
        <div class="modal-bonus-col">
          <div class="modal-section-label">Full Set Bonus</div>
          <ul class="modal-full-bonus">
            ${s.fullBonuses.map(b => `<li>${b}</li>`).join('')}
          </ul>
        </div>
      </div>` : `
      <div class="modal-section-label">Full Set Bonus</div>
      <ul class="modal-full-bonus">
        ${s.fullBonuses.map(b => `<li>${b}</li>`).join('')}
      </ul>`}

      <div class="modal-section-label">Pieces</div>
      <div class="modal-set-pieces">
        ${s.pieces.map(p => `
          <div class="modal-piece">
            <div class="modal-piece-icon-wrap">${iconMarkup(p.icon, p.name, 'modal-piece-icon-fallback')}</div>
            <div class="modal-piece-body">
              <div class="modal-piece-head">
                <span class="modal-piece-name">${p.name}</span>
                <span class="modal-piece-type">${p.type}${p.reqLevel ? ` · Lvl ${p.reqLevel}` : ''}</span>
              </div>
              <ul class="modal-piece-stats">
                ${p.stats.map(st => `<li>${st}</li>`).join('')}
              </ul>
              ${p.url ? `<a class="modal-source-link" href="${p.url}" target="_blank" rel="noopener">View source ↗</a>` : ''}
            </div>
          </div>
        `).join('')}
      </div>

      ${s.isNew ? `<div class="modal-expansion-note">✦ New in Diablo II: Resurrected — <em>Reign of the Warlock</em>.</div>` : ''}
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
  state.filters = { search: '', tier: 'all', klass: 'all', content: 'all' };
  state.sort = 'name';

  document.getElementById('searchInput').value = '';
  document.querySelectorAll('#tierFilter .pill').forEach((p, i) => p.classList.toggle('active', i === 0));
  document.querySelectorAll('#classFilter .pill').forEach((p, i) => p.classList.toggle('active', i === 0));
  document.querySelectorAll('#contentFilter .pill').forEach((p, i) => p.classList.toggle('active', i === 0));
  document.querySelectorAll('.sort-btn').forEach((b, i) => b.classList.toggle('active', i === 0));

  render();
}

window.resetAll = resetAll;

init();

window.addEventListener('load', () => {
  if (!window.location.hash) return;
  const name = decodeURIComponent(window.location.hash.slice(1));
  const s = SETS_DATA.find(x => x.name === name);
  if (s) openModal(s);
});
