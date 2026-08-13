import {
  getRooms, makeCode, cleanName, cleanCode, cleanId, cleanKey,
  publicRoom, methodGuard, LIMITS,
} from './_db.js';

/**
 * GET  /api/room?code=K7F2A  → current room state (used by the sync poll)
 * POST /api/room             → create a room, seeding it with the creator's
 *                              existing solo progress
 */
export default async function handler(req, res) {
  if (methodGuard(req, res, ['GET', 'POST'])) return;

  // Validate before touching the database, so bad input reports as 400 even
  // when the database happens to be unreachable.
  const isGet = req.method === 'GET';
  const code = isGet ? cleanCode(req.query?.code) : null;
  const { memberId, callsign, watched } = isGet ? {} : (req.body || {});
  const id = isGet ? null : cleanId(memberId);

  if (isGet && !code) return res.status(400).json({ error: 'Missing room code' });
  if (!isGet && !id) return res.status(400).json({ error: 'Missing member id' });

  try {
    const rooms = await getRooms();

    if (isGet) {
      const room = await rooms.findOne({ code });
      if (!room) return res.status(404).json({ error: 'No squad found with that code' });
      return res.status(200).json({ room: publicRoom(room) });
    }

    /* ---------- create ---------- */
    const seed = Array.isArray(watched)
      ? [...new Set(watched.map(cleanKey).filter(Boolean))].slice(0, LIMITS.watchedPerMember)
      : [];

    const member = {
      id,
      name: cleanName(callsign),
      joinedAt: new Date(),
      watched: seed,
    };

    // Codes are short, so a collision is unlikely but not impossible.
    for (let attempt = 0; attempt < 6; attempt++) {
      const doc = {
        code: makeCode(),
        v: 1,
        createdAt: new Date(),
        members: [member],
      };
      try {
        await rooms.insertOne(doc);
        return res.status(201).json({ room: publicRoom(doc) });
      } catch (err) {
        if (err?.code !== 11000) throw err; // 11000 = duplicate key, retry
      }
    }
    return res.status(503).json({ error: 'Could not allocate a code. Try again.' });
  } catch (err) {
    return res.status(500).json({ error: describe(err) });
  }
}

export function describe(err) {
  const msg = String(err?.message || err);
  if (msg.includes('MONGODB_URI')) return 'Database is not configured (MONGODB_URI missing).';
  if (/ECONNREFUSED|ServerSelection|ETIMEDOUT/i.test(msg)) return 'Cannot reach the database.';
  return 'Something went wrong on the server.';
}
