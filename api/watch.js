import {
  getRooms, cleanCode, cleanId, cleanKey,
  publicRoom, methodGuard, LIMITS,
} from './_db.js';
import { describe } from './room.js';

/**
 * POST /api/watch { code, memberId, key, on }
 *
 * Logs or clears one entry for one member. Uses $addToSet / $pull so two
 * people toggling at the same moment cannot clobber each other's arrays.
 */
export default async function handler(req, res) {
  if (methodGuard(req, res, ['POST'])) return;

  try {
    const { code: rawCode, memberId, key: rawKey, on } = req.body || {};
    const code = cleanCode(rawCode);
    const id = cleanId(memberId);
    const key = cleanKey(rawKey);

    if (!code) return res.status(400).json({ error: 'Missing room code' });
    if (!id) return res.status(400).json({ error: 'Missing member id' });
    if (!key) return res.status(400).json({ error: 'Invalid entry' });

    const rooms = await getRooms();

    // '*' with on:false is the purge — clears this member's whole log at once.
    if (key === '*') {
      if (on) return res.status(400).json({ error: 'Invalid entry' });
      const result = await rooms.updateOne(
        { code, 'members.id': id },
        { $set: { 'members.$.watched': [] }, $inc: { v: 1 } },
      );
      if (!result.matchedCount) {
        return res.status(404).json({ error: 'No squad found with that code' });
      }
      const cleared = await rooms.findOne({ code });
      return res.status(200).json({ room: publicRoom(cleared) });
    }

    if (on) {
      // Refuse the push if this member is already at the cap.
      const filter = {
        code,
        members: {
          $elemMatch: {
            id,
            [`watched.${LIMITS.watchedPerMember - 1}`]: { $exists: false },
          },
        },
      };
      const result = await rooms.updateOne(filter, {
        $addToSet: { 'members.$.watched': key },
        $inc: { v: 1 },
      });
      if (!result.matchedCount) {
        const room = await rooms.findOne({ code });
        if (!room) return res.status(404).json({ error: 'No squad found with that code' });
        if (!(room.members || []).some((m) => m.id === id)) {
          return res.status(404).json({ error: 'You are not in this squad' });
        }
        return res.status(409).json({ error: 'Log is full' });
      }
    } else {
      const result = await rooms.updateOne(
        { code, 'members.id': id },
        { $pull: { 'members.$.watched': key }, $inc: { v: 1 } },
      );
      if (!result.matchedCount) {
        return res.status(404).json({ error: 'No squad found with that code' });
      }
    }

    const updated = await rooms.findOne({ code });
    return res.status(200).json({ room: publicRoom(updated) });
  } catch (err) {
    return res.status(500).json({ error: describe(err) });
  }
}
