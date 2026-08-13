/** Thin wrapper over the /api routes. Every call resolves to a room object. */

async function call(path, { method = 'GET', body } = {}) {
  let res;
  try {
    res = await fetch(path, {
      method,
      headers: body ? { 'content-type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new Error('Cannot reach the server. Check your connection.');
  }

  let payload = null;
  try { payload = await res.json(); } catch { /* empty or non-JSON body */ }

  if (!res.ok) throw new Error(payload?.error || `Request failed (${res.status})`);
  return payload;
}

export const fetchRoom = (code) =>
  call(`/api/room?code=${encodeURIComponent(code)}`).then((r) => r.room);

export const createRoom = (memberId, callsign, watched) =>
  call('/api/room', { method: 'POST', body: { memberId, callsign, watched } }).then((r) => r.room);

export const joinRoom = (code, memberId, callsign, watched) =>
  call('/api/join', { method: 'POST', body: { code, memberId, callsign, watched } }).then((r) => r.room);

export const setWatch = (code, memberId, key, on) =>
  call('/api/watch', { method: 'POST', body: { code, memberId, key, on } }).then((r) => r.room);
