import { MongoClient } from 'mongodb';

/**
 * Serverless functions get frozen and thawed between invocations, so a new
 * connection per request would exhaust the pool fast. Stash the client on the
 * module scope (which survives warm starts) and reuse it.
 */
let clientPromise;
let indexesReady = false;

export function getRooms() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI is not set');

  if (!clientPromise) {
    clientPromise = new MongoClient(uri, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 8000,
    }).connect();
  }

  return clientPromise.then(async (client) => {
    const rooms = client.db(process.env.MONGODB_DB || 'doomsday').collection('rooms');
    if (!indexesReady) {
      indexesReady = true;
      await Promise.all([
        rooms.createIndex({ code: 1 }, { unique: true }),
        // Rooms self-destruct after 180 days of existence. Keeps the free tier tidy.
        rooms.createIndex({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 180 }),
      ]).catch(() => { indexesReady = false; });
    }
    return rooms;
  });
}

/* ---------- limits: this is a public endpoint, so nothing is unbounded ---------- */
export const LIMITS = {
  members: 12,
  watchedPerMember: 200,
  nameLength: 18,
  keyLength: 120,
};

/** Unambiguous alphabet — no O/0 or I/1, because these get read aloud. */
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export function makeCode(len = 5) {
  const bytes = new Uint8Array(len);
  globalThis.crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]).join('');
}

export const cleanName = (v) =>
  String(v ?? '').replace(/\s+/g, ' ').trim().slice(0, LIMITS.nameLength) || 'AGENT';

export const cleanCode = (v) =>
  String(v ?? '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8);

export const cleanId = (v) =>
  String(v ?? '').replace(/[^a-z0-9-]/gi, '').slice(0, 40);

export const cleanKey = (v) => {
  const s = String(v ?? '').trim();
  return s.length && s.length <= LIMITS.keyLength ? s : null;
};

/** Strip Mongo internals before anything goes over the wire. */
export const publicRoom = (room) =>
  room && {
    code: room.code,
    v: room.v || 0,
    createdAt: room.createdAt,
    members: (room.members || []).map((m) => ({
      id: m.id,
      name: m.name,
      watched: m.watched || [],
    })),
  };

export function methodGuard(req, res, allowed) {
  if (allowed.includes(req.method)) return false;
  res.status(405).json({ error: `Use ${allowed.join(' or ')}` });
  return true;
}
