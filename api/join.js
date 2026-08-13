import {
  getRooms, cleanName, cleanCode, cleanId, cleanKey,
  publicRoom, methodGuard, LIMITS,
} from './_db.js';
import { describe } from './room.js';

/**
 * POST /api/join { code, memberId, callsign, watched? }
 *
 * Joins a squad, or updates your callsign if you are already in it. Returning
 * members keep their logged entries; first-timers seed theirs from solo mode.
 */
export default async function handler(req, res) {
  if (methodGuard(req, res, ['POST'])) return;

  try {
    const { code: rawCode, memberId, callsign, watched } = req.body || {};
    const code = cleanCode(rawCode);
    const id = cleanId(memberId);
    const name = cleanName(callsign);

    if (!code) return res.status(400).json({ error: 'Missing room code' });
    if (!id) return res.status(400).json({ error: 'Missing member id' });

    const rooms = await getRooms();
    const room = await rooms.findOne({ code });
    if (!room) return res.status(404).json({ error: 'No squad found with that code' });

    const existing = (room.members || []).find((m) => m.id === id);

    if (existing) {
      await rooms.updateOne(
        { code, 'members.id': id },
        { $set: { 'members.$.name': name }, $inc: { v: 1 } },
      );
    } else {
      if ((room.members || []).length >= LIMITS.members) {
        return res.status(409).json({ error: `Squad is full (${LIMITS.members} max)` });
      }
      const seed = Array.isArray(watched)
        ? [...new Set(watched.map(cleanKey).filter(Boolean))].slice(0, LIMITS.watchedPerMember)
        : [];

      // The filter re-checks the size so two simultaneous joins cannot overflow.
      const result = await rooms.updateOne(
        { code, [`members.${LIMITS.members - 1}`]: { $exists: false } },
        {
          $push: { members: { id, name, joinedAt: new Date(), watched: seed } },
          $inc: { v: 1 },
        },
      );
      if (!result.modifiedCount) {
        return res.status(409).json({ error: `Squad is full (${LIMITS.members} max)` });
      }
    }

    const updated = await rooms.findOne({ code });
    return res.status(200).json({ room: publicRoom(updated) });
  } catch (err) {
    return res.status(500).json({ error: describe(err) });
  }
}
