import { MANIFEST, TIERS, keyOf } from './data.js';
import {
  state, myWatched, watchersOf, standings, initialsOf, colorFor,
  progress, daysToTarget, me,
} from './state.js';

const $ = (sel) => document.querySelector(sel);
const RING_CIRCUMFERENCE = 2 * Math.PI * 82;

const rowsByKey = new Map();
let filterButtons = [];

/* ============================================================
   MANIFEST — built once, repainted on every change
   ============================================================ */

export function mountManifest(root, onToggle) {
  root.textContent = '';

  TIERS.forEach((tier, ti) => {
    const section = document.createElement('section');
    section.className = 'tier deploy';
    section.dataset.tier = tier.id;
    section.style.setProperty('--tier', tier.color);
    section.style.setProperty('--tier-dim', tier.dim);
    section.style.animationDelay = `${ti * 90}ms`;

    const header = document.createElement('header');
    header.innerHTML =
      '<span class="glyph"></span>' +
      `<h2>${tier.name}</h2>` +
      '<span class="note" data-count></span>';
    section.appendChild(header);

    const rows = document.createElement('div');
    rows.className = 'rows';

    MANIFEST.filter((m) => m.t === tier.id).forEach((m, i) => {
      const key = keyOf(m);
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'row';
      btn.dataset.key = key;
      btn.innerHTML =
        `<span class="idx">${String(i + 1).padStart(2, '0')}</span>` +
        '<span class="body">' +
          `<span class="name">${m.n}</span>` +
          `<span class="intel">${m.i}</span>` +
          '<span class="chips" data-chips hidden></span>' +
        '</span>' +
        `<span class="meta"><b>${m.y}</b><span>${m.f}</span></span>` +
        '<span class="mark"></span>';
      btn.addEventListener('click', () => onToggle(key));
      rows.appendChild(btn);
      rowsByKey.set(key, btn);
    });

    section.appendChild(rows);
    root.appendChild(section);
  });
}

/* ============================================================
   FILTERS
   ============================================================ */

export function mountFilters(root, onPick) {
  root.textContent = '';
  filterButtons = [];

  const options = [
    { id: 'all', name: 'All transmissions' },
    ...TIERS.map((t) => ({ id: t.id, name: t.name })),
    { id: 'todo', name: 'Unwatched by me' },
    { id: 'gap', name: 'Nobody has seen it', squadOnly: true },
  ];

  options.forEach((o) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.dataset.filter = o.id;
    if (o.squadOnly) b.dataset.squadOnly = 'true';
    b.setAttribute('aria-pressed', String(state.filter === o.id));
    b.innerHTML = `<span>${o.name}</span><i data-tally></i>`;
    b.addEventListener('click', () => onPick(o.id));
    root.appendChild(b);
    filterButtons.push(b);
  });
}

function matchesFilter(m, key, watched) {
  switch (state.filter) {
    case 'all':  return true;
    case 'todo': return !watched.has(key);
    case 'gap':  return state.mode === 'squad' ? watchersOf(key).length === 0 : !watched.has(key);
    default:     return m.t === state.filter;
  }
}

/* ============================================================
   PAINT
   ============================================================ */

export function paint() {
  const watched = myWatched();
  const squad = state.mode === 'squad';

  /* ---- rows ---- */
  for (const m of MANIFEST) {
    const key = keyOf(m);
    const row = rowsByKey.get(key);
    if (!row) continue;

    row.setAttribute('aria-pressed', String(watched.has(key)));
    row.classList.toggle('hidden', !matchesFilter(m, key, watched));

    const chips = row.querySelector('[data-chips]');
    const watchers = watchersOf(key);
    chips.hidden = !squad || watchers.length === 0;
    if (!chips.hidden) {
      chips.textContent = '';
      for (const w of watchers) {
        const chip = document.createElement('span');
        chip.className = 'chip';
        chip.style.setProperty('--c', colorFor(w.id));
        chip.textContent = initialsOf(w.name);
        chip.title = `${w.name} has logged this`;
        if (w.id === state.identity.id) chip.classList.add('is-me');
        chips.appendChild(chip);
      }
    }
  }

  /* ---- tier headers ---- */
  document.querySelectorAll('.tier').forEach((section) => {
    const tierId = section.dataset.tier;
    const tier = TIERS.find((t) => t.id === tierId);
    const set = MANIFEST.filter((m) => m.t === tierId);
    const done = set.filter((m) => watched.has(keyOf(m))).length;
    section.querySelector('[data-count]').textContent =
      `${done}/${set.length} logged · ${tier.note}`;

    const visible = [...section.querySelectorAll('.row')].some((r) => !r.classList.contains('hidden'));
    section.style.display = visible ? '' : 'none';
  });

  /* ---- reactor + stats ---- */
  const p = progress();
  const ring = $('#ring');
  ring.setAttribute('stroke-dasharray', RING_CIRCUMFERENCE.toFixed(2));
  ring.style.strokeDashoffset = (RING_CIRCUMFERENCE * (1 - p.done / p.total)).toFixed(2);

  $('#pct').textContent = p.pct;
  $('#s-crit').textContent = `${p.crit} / ${p.critTotal}`;
  $('#s-total').textContent = `${p.done} / ${p.total}`;
  $('#s-time').textContent = p.minutesLeft ? formatRuntime(p.minutesLeft) : 'CLEAR';

  const days = daysToTarget(new Date('2026-12-18T00:00:00'));
  $('#s-rate').textContent = p.minutesLeft
    ? `${Math.round(p.minutesLeft / days)} min`
    : 'STAND DOWN';

  /* ---- filter tallies ---- */
  for (const b of filterButtons) {
    const f = b.dataset.filter;
    b.hidden = b.dataset.squadOnly === 'true' && !squad;
    b.setAttribute('aria-pressed', String(state.filter === f));

    const tally = b.querySelector('[data-tally]');
    if (f === 'all') {
      tally.textContent = `${p.done}/${p.total}`;
    } else if (f === 'todo') {
      tally.textContent = String(p.total - p.done);
    } else if (f === 'gap') {
      tally.textContent = String(MANIFEST.filter((m) => watchersOf(keyOf(m)).length === 0).length);
    } else {
      const set = MANIFEST.filter((m) => m.t === f);
      tally.textContent = `${set.filter((m) => watched.has(keyOf(m))).length}/${set.length}`;
    }
  }

  paintSquad();
  paintStatus();
}

function formatRuntime(mins) {
  return `${Math.floor(mins / 60)}h ${String(mins % 60).padStart(2, '0')}m`;
}

/* ============================================================
   SQUAD PANEL
   ============================================================ */

function paintSquad() {
  const squad = state.mode === 'squad';
  $('#squad-solo').hidden = squad;
  $('#squad-active').hidden = !squad;

  if (!squad) return;

  $('#room-code').textContent = state.room.code;

  const list = $('#squad-list');
  list.textContent = '';

  standings().forEach((m, rank) => {
    const li = document.createElement('li');
    li.className = 'agent';
    if (m.id === state.identity.id) li.classList.add('is-me');
    li.style.setProperty('--c', m.color);

    const pct = Math.round((m.count / MANIFEST.length) * 100);
    li.innerHTML =
      `<span class="agent-rank">${rank + 1}</span>` +
      '<span class="agent-dot"></span>' +
      '<span class="agent-name"></span>' +
      `<span class="agent-score">${m.count}<i>/${MANIFEST.length}</i></span>` +
      `<span class="agent-bar"><b style="width:${pct}%"></b></span>`;
    li.querySelector('.agent-name').textContent =
      m.id === state.identity.id ? `${m.name} (you)` : m.name;
    list.appendChild(li);
  });
}

function paintStatus() {
  const el = $('#sync-status');
  el.dataset.status = state.status;
  el.textContent =
    state.status === 'syncing' ? 'SYNCING'
    : state.status === 'offline' ? 'OFFLINE: LOCAL ONLY'
    : state.mode === 'squad' ? 'SQUAD LINKED'
    : 'SOLO';
}

/* ============================================================
   DIALOG + TOAST
   ============================================================ */

/**
 * Resolves to { callsign, code } or null if dismissed.
 * `needCode` adds the squad-code field for the join flow.
 */
export function askAgent({ title, hint, confirm, needCode, defaultCode = '' }) {
  const dlg = $('#prompt');
  $('#prompt-title').textContent = title;
  $('#prompt-hint').textContent = hint;
  $('#prompt-confirm').textContent = confirm;
  $('#prompt-error').textContent = '';

  const codeField = $('#field-code');
  codeField.hidden = !needCode;
  codeField.querySelector('input').required = !!needCode;

  const callsign = $('#in-callsign');
  const code = $('#in-code');
  callsign.value = state.identity.name || '';
  code.value = defaultCode;

  dlg.showModal();
  setTimeout(() => (needCode && !defaultCode ? code : callsign).focus(), 30);

  return new Promise((resolve) => {
    const form = $('#prompt-form');

    const cleanup = () => {
      form.removeEventListener('submit', onSubmit);
      dlg.removeEventListener('close', onClose);
    };

    function onSubmit(e) {
      e.preventDefault();
      const name = callsign.value.trim();
      if (!name) { $('#prompt-error').textContent = 'Pick a callsign so your squad knows who you are.'; return; }
      if (needCode && code.value.trim().length < 4) {
        $('#prompt-error').textContent = 'Squad codes are 5 characters.';
        return;
      }
      cleanup();
      dlg.close();
      resolve({ callsign: name, code: code.value.trim().toUpperCase() });
    }

    function onClose() { cleanup(); resolve(null); }

    form.addEventListener('submit', onSubmit);
    dlg.addEventListener('close', onClose);
  });
}

let toastTimer;
export function toast(message, kind = 'info') {
  const el = $('#toast');
  el.textContent = message;
  el.dataset.kind = kind;
  el.classList.add('up');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('up'), 3800);
}

export function setBusy(on) {
  document.body.classList.toggle('busy', on);
}
