import './style.css';
import { TARGET_DATE, MANIFEST, keyOf } from './data.js';
import {
  state, loadLocal, saveSolo, saveIdentity, myWatched, me,
  adoptRoom, goSolo, onChange, forgetRoom,
} from './state.js';
import { fetchRoom, createRoom, joinRoom, setWatch } from './net.js';
import { startField, runBoot, startClock, drawTicks } from './hud.js';
import { mountManifest, mountFilters, paint, askAgent, toast, setBusy } from './ui.js';

const $ = (sel) => document.querySelector(sel);
const POLL_MS = 6000;

/* ============================================================
   TOGGLING AN ENTRY
   ============================================================ */

async function onToggle(key) {
  const on = !myWatched().has(key);

  if (state.mode === 'solo') {
    if (on) state.solo.add(key); else state.solo.delete(key);
    saveSolo();
    paint();
    return;
  }

  const mine = me();
  if (!mine) return;

  // Optimistic: flip locally, reconcile with whatever the server returns.
  const before = [...mine.watched];
  mine.watched = on ? [...before, key] : before.filter((k) => k !== key);
  paint();

  try {
    adoptRoom(await setWatch(state.room.code, state.identity.id, key, on));
    state.status = 'idle';
    paint();
  } catch (err) {
    mine.watched = before;
    state.status = 'offline';
    paint();
    toast(err.message, 'error');
  }
}

/* ============================================================
   SQUAD FLOWS
   ============================================================ */

async function formSquad() {
  const answer = await askAgent({
    title: 'Form a squad',
    hint: 'You get a 5-character code. Anyone with it joins your board — your current progress carries over.',
    confirm: 'Create squad',
  });
  if (!answer) return;

  state.identity.name = answer.callsign;
  saveIdentity();
  setBusy(true);
  try {
    const room = await createRoom(state.identity.id, answer.callsign, [...state.solo]);
    adoptRoom(room);
    writeRoomToUrl(room.code);
    toast(`Squad ${room.code} is live. Share the link.`, 'good');
  } catch (err) {
    toast(err.message, 'error');
  } finally {
    setBusy(false);
  }
}

async function joinSquad(prefill = '') {
  const answer = await askAgent({
    title: 'Join a squad',
    hint: 'Enter the code a friend sent you. Your existing progress comes with you.',
    confirm: 'Join squad',
    needCode: true,
    defaultCode: prefill,
  });
  if (!answer) return;

  state.identity.name = answer.callsign;
  saveIdentity();
  setBusy(true);
  try {
    const room = await joinRoom(answer.code, state.identity.id, answer.callsign, [...state.solo]);
    adoptRoom(room);
    writeRoomToUrl(room.code);
    toast(`Linked to squad ${room.code}.`, 'good');
  } catch (err) {
    toast(err.message, 'error');
  } finally {
    setBusy(false);
  }
}

/** Silent rejoin on load for a squad we were already part of. */
async function resumeSquad(code) {
  state.status = 'syncing';
  paint();
  try {
    const room = await fetchRoom(code);
    if (room.members.some((m) => m.id === state.identity.id)) {
      adoptRoom(room);
      state.status = 'idle';
    } else {
      forgetRoom(); // removed from the squad, or a stale code
      state.status = 'idle';
    }
  } catch {
    state.status = 'offline';
  }
  paint();
}

function leaveSquad() {
  const code = state.room?.code;
  goSolo();
  history.replaceState(null, '', location.pathname);
  paint();
  toast(`Left squad ${code}. Back to solo — your log is intact.`);
}

function writeRoomToUrl(code) {
  history.replaceState(null, '', `${location.pathname}?room=${code}`);
}

async function copyInvite() {
  const link = `${location.origin}${location.pathname}?room=${state.room.code}`;
  try {
    await navigator.clipboard.writeText(link);
    toast('Invite link copied.', 'good');
  } catch {
    // Clipboard is blocked on insecure origins — show it so they can copy manually.
    toast(link);
  }
}

async function purgeLog() {
  const count = myWatched().size;
  if (!count) { toast('Nothing logged yet.'); return; }
  if (!confirm(`Clear all ${count} logged entries? This cannot be undone.`)) return;

  if (state.mode === 'solo') {
    state.solo.clear();
    saveSolo();
    paint();
    toast('Log purged.');
    return;
  }

  setBusy(true);
  try {
    adoptRoom(await setWatch(state.room.code, state.identity.id, '*', false));
    toast('Log purged.');
  } catch (err) {
    toast(err.message, 'error');
  } finally {
    setBusy(false);
    paint();
  }
}

/* ============================================================
   SYNC LOOP
   ============================================================ */

async function sync() {
  if (state.mode !== 'squad' || document.hidden || !state.room) return;
  try {
    const room = await fetchRoom(state.room.code);
    if (room.v !== state.room.v) adoptRoom(room);
    if (state.status === 'offline') { state.status = 'idle'; paint(); }
  } catch {
    if (state.status !== 'offline') { state.status = 'offline'; paint(); }
  }
}

/* ============================================================
   BOOT
   ============================================================ */

async function boot() {
  const storedCode = loadLocal();

  mountManifest($('#manifest'), onToggle);
  mountFilters($('#filters'), (id) => { state.filter = id; paint(); });
  drawTicks($('#ticks'));
  startField($('#field'));
  startClock(TARGET_DATE, {
    d: $('#c-d'), h: $('#c-h'), m: $('#c-m'), s: $('#c-s'),
  });

  $('#btn-form').addEventListener('click', formSquad);
  $('#btn-join').addEventListener('click', () => joinSquad());
  $('#btn-copy').addEventListener('click', copyInvite);
  $('#btn-leave').addEventListener('click', leaveSquad);
  $('#purge').addEventListener('click', purgeLog);
  $('#prompt-cancel').addEventListener('click', () => $('#prompt').close());

  onChange(paint);
  paint();
  runBoot($('#boot'));

  const urlCode = new URLSearchParams(location.search).get('room');
  if (urlCode) {
    await joinSquad(urlCode.toUpperCase().replace(/[^A-Z0-9]/g, ''));
  } else if (storedCode) {
    await resumeSquad(storedCode);
  }

  setInterval(sync, POLL_MS);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) sync(); });
}

boot();

// Handy in the console: DOOMSDAY.MANIFEST, DOOMSDAY.state
globalThis.DOOMSDAY = { MANIFEST, keyOf, state };
