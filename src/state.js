import { MANIFEST, keyOf, SQUAD_COLORS } from './data.js';

const K = {
  log: 'doomsday/log/v1',
  identity: 'doomsday/identity/v1',
  room: 'doomsday/room/v1',
};

/**
 * One store for both modes.
 *
 * Solo mode is the default and works with no network at all — progress lives in
 * localStorage. Squad mode mirrors the same progress into a shared room, and
 * localStorage keeps acting as the offline fallback if the API is unreachable.
 */
export const state = {
  mode: 'solo',
  identity: null,
  room: null,
  solo: new Set(),
  filter: 'all',
  status: 'idle', // idle | syncing | offline
  notice: null,
};

/* ---------------- persistence ---------------- */

const read = (k, fallback) => {
  try {
    const raw = localStorage.getItem(k);
    return raw === null ? fallback : JSON.parse(raw);
  } catch {
    return fallback;
  }
};

const write = (k, v) => {
  try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* private mode */ }
};

export function loadLocal() {
  const stored = read(K.identity, null);
  state.identity = stored?.id
    ? stored
    : { id: crypto.randomUUID(), name: '' };
  write(K.identity, state.identity);

  const log = read(K.log, null);
  if (Array.isArray(log)) {
    state.solo = new Set(log);
  } else {
    // First run after coming out of the cinema.
    state.solo = new Set(['Spider-Man: Brand New Day|2026']);
    saveSolo();
  }

  return read(K.room, null); // last squad code, if any
}

export const saveSolo = () => write(K.log, [...state.solo]);
export const saveIdentity = () => write(K.identity, state.identity);
export const rememberRoom = (code) => write(K.room, code);
export const forgetRoom = () => { try { localStorage.removeItem(K.room); } catch { /* noop */ } };

/* ---------------- derived reads ---------------- */

export const me = () =>
  state.room?.members?.find((m) => m.id === state.identity.id) || null;

/** The authoritative set of what *I* have logged, whichever mode is active. */
export function myWatched() {
  if (state.mode === 'squad') {
    const mine = me();
    if (mine) return new Set(mine.watched);
  }
  return state.solo;
}

export const isWatched = (key) => myWatched().has(key);

/** Everyone in the squad who has logged this entry, in join order. */
export function watchersOf(key) {
  if (state.mode !== 'squad' || !state.room) return [];
  return state.room.members.filter((m) => m.watched.includes(key));
}

export const colorFor = (memberId) => {
  const i = state.room?.members?.findIndex((m) => m.id === memberId) ?? -1;
  return SQUAD_COLORS[(i < 0 ? 0 : i) % SQUAD_COLORS.length];
};

export const initialsOf = (name) =>
  String(name || '?').trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join('').toUpperCase();

/** Members sorted by progress — doubles as the leaderboard. */
export function standings() {
  if (!state.room) return [];
  return [...state.room.members]
    .map((m) => ({ ...m, count: m.watched.length, color: colorFor(m.id) }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}

/* ---------------- progress maths ---------------- */

export function progress() {
  const watched = myWatched();
  const done = MANIFEST.filter((m) => watched.has(keyOf(m)));
  const crit = MANIFEST.filter((m) => m.t === 'crit');
  const minutesLeft = MANIFEST
    .filter((m) => !watched.has(keyOf(m)))
    .reduce((sum, m) => sum + m.min, 0);

  return {
    done: done.length,
    total: MANIFEST.length,
    pct: Math.round((done.length / MANIFEST.length) * 100),
    crit: crit.filter((m) => watched.has(keyOf(m))).length,
    critTotal: crit.length,
    minutesLeft,
  };
}

export function daysToTarget(target) {
  return Math.max(1, Math.ceil((target - new Date()) / 86_400_000));
}

/* ---------------- change notification ---------------- */

const listeners = new Set();
export const onChange = (fn) => { listeners.add(fn); return () => listeners.delete(fn); };
export const emit = () => listeners.forEach((fn) => fn());

/** Apply a room payload from the server and mirror it into local storage. */
export function adoptRoom(room) {
  state.room = room;
  state.mode = 'squad';
  const mine = me();
  if (mine) {
    state.solo = new Set(mine.watched); // keep the offline copy warm
    saveSolo();
  }
  rememberRoom(room.code);
  emit();
}

export function goSolo() {
  state.mode = 'solo';
  state.room = null;
  forgetRoom();
  emit();
}
