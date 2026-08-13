# DOOMSDAY PROTOCOL

A Stark HUD mission manifest for the 38 Marvel films and series worth watching
before **Avengers: Doomsday** (18 Dec 2026).

Works solo out of the box — progress lives in `localStorage`, no account, no
network. Form a **squad** and everyone's progress lands on one shared board with
a leaderboard, per-entry "who's seen it" chips, and a live sync.

---

## Quick start

```bash
npm install
cp .env.example .env      # then edit MONGODB_URI (see below)
npm run dev               # http://localhost:5173
```

Solo mode works immediately with no database. You only need Mongo for squads.

| Script | Does |
| --- | --- |
| `npm run dev` | Dev server with hot reload, and `/api/*` mounted locally |
| `npm run build` | Production build into `dist/` |
| `npm run preview` | Serve the built `dist/` (no API — use `dev` for that) |

---

## Database

Squad mode needs MongoDB. **Vercel's serverless functions run in the cloud and
cannot reach a database on your PC**, so production requires a hosted cluster.

The simplest setup is to use one **MongoDB Atlas** free cluster for both local
dev and production:

1. Create a free **M0** cluster at [mongodb.com/atlas](https://www.mongodb.com/atlas).
2. **Database Access** → add a user with a password.
3. **Network Access** → add `0.0.0.0/0`. Vercel's functions do not have fixed
   outbound IPs, so an allowlist of specific addresses will not work.
4. **Connect → Drivers** → copy the `mongodb+srv://…` string into `.env`.

```ini
MONGODB_URI=mongodb+srv://user:password@cluster.xxxxx.mongodb.net/?retryWrites=true&w=majority
MONGODB_DB=doomsday
```

Two indexes are created automatically on first connect: a unique index on
`code`, and a TTL index that expires rooms 180 days after creation.

---

## Deploy to Vercel

1. Push to GitHub (see below).
2. [vercel.com/new](https://vercel.com/new) → import the repo. The Vite preset
   is detected automatically.
3. **Settings → Environment Variables** → add `MONGODB_URI` and `MONGODB_DB`
   for Production, Preview, and Development.
4. Deploy. Share the URL — friends open it and join with a squad code.

> Environment variables are only read at function start. After adding or
> changing them, redeploy.

---

## How it works

```
doomsday-protocol/
├── api/                 Vercel serverless functions (Node)
│   ├── _db.js           Cached Mongo client, input sanitizers, limits
│   ├── room.js          GET  ?code=  fetch a room  ·  POST  create one
│   ├── join.js          POST join a squad, or update your callsign
│   └── watch.js         POST log/clear one entry ('*' clears all)
├── src/
│   ├── data.js          The manifest — tiers, entries, runtimes, intel notes
│   ├── state.js         Store: solo/squad mode, progress maths, persistence
│   ├── net.js           fetch wrapper over /api
│   ├── ui.js            Rendering: rows, rail, squad panel, dialog, toasts
│   ├── hud.js           Ambient canvas, boot sequence, countdown, ring ticks
│   ├── main.js          Wiring and the sync loop
│   └── style.css        The whole HUD
├── index.html
└── vite.config.js       Build config + a dev shim that serves api/ locally
```

**Solo → squad.** Solo progress is a `Set` in `localStorage`. Forming or joining
a squad uploads that set as your starting point, so nothing is lost. Leaving a
squad keeps your log.

**Identity** is a `crypto.randomUUID()` stored in `localStorage`, so the same
browser resumes as the same member. Different browser or device = different
agent; rejoin with the same code and pick your callsign again.

**Sync** is a 6-second poll while the tab is visible. Rooms carry a version
counter (`v`) so an unchanged room causes no re-render. Toggles apply
optimistically and roll back if the request fails; the status chip in the top
bar shows `SQUAD LINKED`, `SYNCING`, or `OFFLINE — LOCAL ONLY`.

**Writes** use `$addToSet` / `$pull` on the matched member, so two people
toggling at once cannot clobber each other.

**Limits** (in `api/_db.js`): 12 members per squad, 200 logged entries per
member, 18-character callsigns. Squad codes use a 5-character alphabet with no
`O`/`0` or `I`/`1`, because people read them aloud.

---

## Editing the manifest

Everything derives from the `MANIFEST` array in [`src/data.js`](src/data.js).
Add an entry and the counts, runtimes, filters and progress ring all update:

```js
{ t: 'crit', n: 'Avengers: Doomsday', y: 2026, f: 'FILM', min: 150,
  i: 'The reason for all of this.' },
```

| Field | Meaning |
| --- | --- |
| `t` | Tier id — `crit`, `rec`, `lore`, `mutant` |
| `n` | Title (with `y`, forms the sync key — changing it resets that entry) |
| `y` | Year |
| `f` | Format badge — `FILM`, `SERIES`, `SPECIAL` |
| `min` | Approximate total runtime in minutes (whole seasons for series) |
| `i` | One-line intel note |

Tiers themselves are the `TIERS` array in the same file. Runtimes are estimates,
used for the "runtime left" and "per day, to make it" readouts.

---

## Notes

- Single-theme by design — it is an instrument readout, so it commits to the
  dark HUD in any host theme.
- `prefers-reduced-motion` is respected: the boot sequence is skipped, the
  ambient field renders one static frame, and transitions are disabled.
- Rows are real `<button>`s with `aria-pressed`, so the board is keyboard
  navigable.
- Squad rooms are unlisted but not secret — anyone with the code can join and
  edit. That is the intended trade-off for zero-friction sharing; do not treat a
  code as a credential.
