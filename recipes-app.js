/* =====================================================
   SANCTUARY CODEX — Horadric Cube Recipes app.js
   Data loaded from data/recipes-data.js
   (RECIPES_DATA, RECIPE_CATEGORY_ORDER, RECIPE_CATEGORY_LABELS)
   ===================================================== */

'use strict';

const RUNE_NAMES = [
  'el', 'eld', 'tir', 'nef', 'eth', 'ith', 'tal', 'ral', 'ort', 'thul', 'amn',
  'sol', 'shael', 'dol', 'hel', 'io', 'lum', 'ko', 'fal', 'lem', 'pul', 'um',
  'mal', 'ist', 'gul', 'vex', 'ohm', 'lo', 'sur', 'ber', 'jah', 'cham', 'zod'
];

let state = {
  filters: {
    search: '',
    category: 'all',
    subcategory: 'all',
    content: 'all'
  },
  sort: 'category'
};

function init() {
  buildCategoryPills();
  wireEvents();
  buildSubcategoryPills();
  render();
}

function buildCategoryPills() {
  const container = document.getElementById('categoryFilter');
  const all = document.createElement('button');
  all.className = 'pill active';
  all.dataset.category = 'all';
  all.textContent = 'All';
  container.appendChild(all);

  RECIPE_CATEGORY_ORDER.forEach(cat => {
    if (!RECIPES_DATA.some(r => r.category === cat)) return;
    const btn = document.createElement('button');
    btn.className = 'pill';
    btn.dataset.category = cat;
    btn.textContent = RECIPE_CATEGORY_LABELS[cat];
    container.appendChild(btn);
  });

  container.addEventListener('click', e => {
    const btn = e.target.closest('.pill');
    if (!btn) return;
    container.querySelectorAll('.pill').forEach(p => p.classList.remove('active'));
    btn.classList.add('active');
    state.filters.category = btn.dataset.category;
    state.filters.subcategory = 'all';
    buildSubcategoryPills();
    render();
  });
}

/* Distinct subcategory labels for a category, in authored (data) order. */
function subcategoriesFor(cat) {
  const seen = [];
  RECIPES_DATA.forEach(r => {
    if (r.category === cat && r.subcategory && !seen.includes(r.subcategory)) seen.push(r.subcategory);
  });
  return seen;
}

function buildSubcategoryPills() {
  const block = document.getElementById('subcategoryFilterBlock');
  const container = document.getElementById('subcategoryFilter');
  const cat = state.filters.category;
  const subcats = cat !== 'all' ? subcategoriesFor(cat) : [];

  container.innerHTML = '';
  if (subcats.length < 2) {
    block.classList.add('hidden');
    return;
  }
  block.classList.remove('hidden');

  const all = document.createElement('button');
  all.className = 'pill active';
  all.dataset.subcategory = 'all';
  all.textContent = 'All';
  container.appendChild(all);

  subcats.forEach(sub => {
    const btn = document.createElement('button');
    btn.className = 'pill';
    btn.dataset.subcategory = sub;
    btn.textContent = sub;
    container.appendChild(btn);
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

  document.getElementById('subcategoryFilter').addEventListener('click', e => {
    const btn = e.target.closest('.pill');
    if (!btn) return;
    document.getElementById('subcategoryFilter').querySelectorAll('.pill').forEach(p => p.classList.remove('active'));
    btn.classList.add('active');
    state.filters.subcategory = btn.dataset.subcategory;
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

function getFilteredRecipes() {
  const { search, category, subcategory, content } = state.filters;

  return RECIPES_DATA.filter(r => {
    if (category !== 'all' && r.category !== category) return false;
    if (subcategory !== 'all' && r.subcategory !== subcategory) return false;
    if (content === 'new' && !r.isNew) return false;
    if (content === 'classic' && r.isNew) return false;

    if (search) {
      const hay = [
        r.name, r.description, r.subcategory,
        RECIPE_CATEGORY_LABELS[r.category],
        r.notes || '',
        ...(r.guaranteed || []),
        ...r.inputs.map(i => i.item),
        ...r.outputs.map(o => o.item)
      ].join(' ').toLowerCase();
      if (!hay.includes(search)) return false;
    }

    return true;
  });
}

function sortRecipes(list) {
  const sorted = [...list];
  if (state.sort === 'name') {
    sorted.sort((a, b) => a.name.localeCompare(b.name));
  } else {
    // Within a category group: keep the rune chain in El → Zod order,
    // everything else falls back to the authored order.
    sorted.sort((a, b) => {
      if (a.runeLevel != null && b.runeLevel != null) return a.runeLevel - b.runeLevel;
      return a.id - b.id;
    });
  }
  return sorted;
}

function render() {
  const filtered = getFilteredRecipes();

  document.getElementById('statTotal').textContent = `${RECIPES_DATA.length} recipes`;
  document.getElementById('statShown').textContent = `${filtered.length} shown`;

  const grid = document.getElementById('recipesGrid');
  const emptyState = document.getElementById('emptyState');
  grid.innerHTML = '';

  if (filtered.length === 0) {
    emptyState.classList.remove('hidden');
    return;
  }
  emptyState.classList.add('hidden');

  if (state.sort === 'name') {
    const wrapper = document.createElement('div');
    wrapper.className = 'recipes-grid';
    sortRecipes(filtered).forEach(r => wrapper.appendChild(buildCard(r)));
    grid.appendChild(wrapper);
    return;
  }

  const groups = {};
  RECIPE_CATEGORY_ORDER.forEach(c => groups[c] = []);
  filtered.forEach(r => { if (groups[r.category]) groups[r.category].push(r); });

  RECIPE_CATEGORY_ORDER.forEach(cat => {
    const recipes = groups[cat];
    if (!recipes || recipes.length === 0) return;

    const wrapper = document.createElement('div');
    wrapper.className = `recipes-category-section category-${cat}`;
    wrapper.innerHTML = `
      <div class="category-header">
        <span class="category-header-text">${RECIPE_CATEGORY_LABELS[cat]}</span>
        <span class="category-header-count">${recipes.length}</span>
        <span class="category-header-line"></span>
      </div>
      <div class="recipes-grid category-grid"></div>`;

    const innerGrid = wrapper.querySelector('.category-grid');
    sortRecipes(recipes).forEach(r => innerGrid.appendChild(buildCard(r)));
    grid.appendChild(wrapper);
  });
}

/* Any ingredient or result that names a rune gets its icon from assets/runes/. */
function runeSlug(item) {
  const m = item.match(/\b([a-z]+)\s+rune\b/i);
  if (!m) return null;
  const slug = m[1].toLowerCase();
  return RUNE_NAMES.includes(slug) ? slug : null;
}

function itemMarkup(item) {
  const slug = runeSlug(item);
  const icon = slug
    ? `<img class="recipe-rune-icon" src="assets/runes/${slug}.webp" alt="" loading="lazy">`
    : '';
  return `${icon}<span class="recipe-item-name">${item}</span>`;
}

function inputLine(i) {
  const qty = i.quantity > 1 ? `<span class="recipe-qty">${i.quantity}×</span>` : '';
  return `<div class="recipe-line">${qty}${itemMarkup(i.item)}</div>`;
}

function outputLine(o) {
  return `<div class="recipe-line recipe-line-output">${itemMarkup(o.item)}</div>`;
}

function badgesHtml(r) {
  const subcat = r.subcategory && r.subcategory !== RECIPE_CATEGORY_LABELS[r.category]
    ? `<span class="badge badge-type">${r.subcategory}</span>`
    : '';
  return `
    <span class="badge badge-cat badge-cat-${r.category}">${RECIPE_CATEGORY_LABELS[r.category]}</span>
    ${subcat}
    ${r.isNew ? `<span class="badge badge-new">Reign of the Warlock</span>` : ''}`;
}

function guaranteedHtml(r) {
  if (!r.guaranteed || !r.guaranteed.length) return '';
  return `
    <div class="recipe-guaranteed">
      <div class="recipe-column-label">Guaranteed Stats</div>
      ${r.guaranteed.map(s => `<div class="recipe-guaranteed-line">${s}</div>`).join('')}
    </div>`;
}

function buildCard(r) {
  const card = document.createElement('div');
  card.className = `recipe-card category-${r.category}` + (r.isNew ? ' is-new' : '');
  card.innerHTML = `
    <div class="recipe-card-top">
      <div class="recipe-name">${r.name}</div>
    </div>
    <div class="recipe-badges">${badgesHtml(r)}</div>
    ${r.category !== 'crafting' ? `<p class="recipe-desc">${r.description}</p>` : ''}
    ${guaranteedHtml(r)}
    <div class="recipe-formula">
      <div class="recipe-column">
        <div class="recipe-column-label">Ingredients</div>
        ${r.inputs.map(inputLine).join('')}
      </div>
      <div class="recipe-arrow">→</div>
      <div class="recipe-column recipe-column-result">
        <div class="recipe-column-label">Result</div>
        ${r.outputs.map(outputLine).join('')}
      </div>
    </div>
    ${r.notes || r.tables ? `<div class="recipe-more">Details ↗</div>` : ''}
  `;
  card.addEventListener('click', () => openModal(r));
  return card;
}

function tableHtml(t) {
  return `
    <div class="modal-section-label">${t.title}</div>
    <div class="recipe-table-wrap">
      <table class="recipe-table">
        <thead><tr>${t.headers.map(h => `<th>${h}</th>`).join('')}</tr></thead>
        <tbody>
          ${t.rows.map(row => `<tr>${row.map(c => `<td>${c}</td>`).join('')}</tr>`).join('')}
        </tbody>
      </table>
    </div>`;
}

function openModal(r) {
  history.replaceState(null, '', '#' + encodeURIComponent(r.name));
  const html = `
    <div class="modal-inner">
      <div class="modal-name ${r.isNew ? 'modal-expansion-name' : ''}">${r.name}</div>
      <div class="modal-meta">${badgesHtml(r)}</div>

      ${r.category !== 'crafting' ? `<p class="modal-recipe-desc">${r.description}</p>` : ''}

      ${r.guaranteed && r.guaranteed.length ? `
      <div class="modal-section-label">Guaranteed Stats</div>
      <ul class="modal-guaranteed">
        ${r.guaranteed.map(s => `<li>${s}</li>`).join('')}
      </ul>` : ''}

      <div class="modal-section-label">Transmute</div>
      <div class="recipe-formula modal-recipe-formula">
        <div class="recipe-column">
          <div class="recipe-column-label">Ingredients</div>
          ${r.inputs.map(inputLine).join('')}
        </div>
        <div class="recipe-arrow">→</div>
        <div class="recipe-column recipe-column-result">
          <div class="recipe-column-label">Result</div>
          ${r.outputs.map(outputLine).join('')}
        </div>
      </div>

      ${r.notes ? `
      <div class="modal-section-label">Notes</div>
      <p class="modal-recipe-notes">${r.notes}</p>` : ''}

      ${(r.tables || []).map(tableHtml).join('')}

      ${r.isNew ? `<div class="modal-expansion-note">✦ New in Diablo II: Resurrected — <em>Reign of the Warlock</em>.</div>` : ''}
    </div>`;

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
  state.filters = { search: '', category: 'all', subcategory: 'all', content: 'all' };
  state.sort = 'category';

  document.getElementById('searchInput').value = '';
  document.querySelectorAll('#categoryFilter .pill').forEach((p, i) => p.classList.toggle('active', i === 0));
  document.querySelectorAll('#contentFilter .pill').forEach((p, i) => p.classList.toggle('active', i === 0));
  document.querySelectorAll('.sort-btn').forEach((b, i) => b.classList.toggle('active', i === 0));
  buildSubcategoryPills();

  render();
}

window.resetAll = resetAll;

init();

window.addEventListener('load', () => {
  if (!window.location.hash) return;
  const name = decodeURIComponent(window.location.hash.slice(1));
  const r = RECIPES_DATA.find(x => x.name === name);
  if (r) openModal(r);
});
