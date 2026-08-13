/**
 * The manifest. `t` maps to a tier id, `min` is an approximate total runtime in
 * minutes (whole seasons for series), `i` is the one-line intel note.
 *
 * Adding an entry: append it to the right tier block. Nothing else to update —
 * counts, runtimes and progress all derive from this array.
 */

export const TARGET_DATE = new Date('2026-12-18T00:00:00');

export const TIERS = [
  {
    id: 'crit', name: 'Critical Path', color: '#ff4d3d', dim: '#7a2018',
    note: 'Skip these and Doomsday will not make sense',
  },
  {
    id: 'rec', name: 'Roster Context', color: '#ffb337', dim: '#6d4d16',
    note: 'Who these people are and why they show up',
  },
  {
    id: 'lore', name: 'Deep Lore', color: '#5fd3f3', dim: '#17495c',
    note: 'Optional, but pays off in single scenes',
  },
  {
    id: 'mutant', name: 'Mutant Archive', color: '#a98bff', dim: '#3d2f66',
    note: 'Fox-era files, now canon-adjacent',
  },
];

export const MANIFEST = [
  /* ---------------- CRITICAL PATH ---------------- */
  { t: 'crit', n: 'Avengers: Infinity War', y: 2018, f: 'FILM', min: 149,
    i: 'The snap. Everything downstream of this is fallout, and Doomsday is the far end of it.' },
  { t: 'crit', n: 'Avengers: Endgame', y: 2019, f: 'FILM', min: 181,
    i: 'Time heist breaks causality wide open. The multiverse problem starts here, not in Loki.' },
  { t: 'crit', n: 'Loki — Season 1', y: 2021, f: 'SERIES', min: 300,
    i: 'He Who Remains explains the sacred timeline, then dies. The branching begins on screen.' },
  { t: 'crit', n: 'Spider-Man: No Way Home', y: 2021, f: 'FILM', min: 148,
    i: 'First hard proof other universes leak into this one. Also why nobody remembers Peter Parker.' },
  { t: 'crit', n: 'Doctor Strange in the Multiverse of Madness', y: 2022, f: 'FILM', min: 126,
    i: 'Names the mechanic that Doomsday runs on: incursions. Two universes collide, one dies.' },
  { t: 'crit', n: 'Loki — Season 2', y: 2023, f: 'SERIES', min: 290,
    i: 'Loki takes the throne of the timeline itself. The TVA safety net is gone after this.' },
  { t: 'crit', n: 'Deadpool & Wolverine', y: 2024, f: 'FILM', min: 128,
    i: 'Canonizes the Fox universe, introduces anchor beings and the Void. The bridge to the X-Men.' },
  { t: 'crit', n: 'Thunderbolts*', y: 2025, f: 'FILM', min: 126,
    i: 'The team that answers the call in Doomsday gets assembled, and renamed, here.' },
  { t: 'crit', n: 'The Fantastic Four: First Steps', y: 2025, f: 'FILM', min: 115,
    i: 'Earth-828, Franklin Richards, and the arrival that sets the whole endgame in motion.' },
  { t: 'crit', n: 'Spider-Man: Brand New Day', y: 2026, f: 'FILM', min: 125,
    i: 'The last transmission before impact. Peter without a safety net, straight into Doomsday.' },

  /* ---------------- ROSTER CONTEXT ---------------- */
  { t: 'rec', n: 'WandaVision', y: 2021, f: 'SERIES', min: 350,
    i: 'Wanda becomes the Scarlet Witch. Required reading for any chaos-magic beat.' },
  { t: 'rec', n: 'Ms. Marvel', y: 2022, f: 'SERIES', min: 290,
    i: 'Kamala Khan, plus the first quiet hint that a mutant gene exists in this reality.' },
  { t: 'rec', n: 'Black Panther: Wakanda Forever', y: 2022, f: 'FILM', min: 161,
    i: 'New Black Panther, and Namor, a wildcard whenever the world needs defending.' },
  { t: 'rec', n: 'Ant-Man and the Wasp: Quantumania', y: 2023, f: 'FILM', min: 124,
    i: 'The Quantum Realm as a back door between realities. Cassie Lang steps up.' },
  { t: 'rec', n: 'Guardians of the Galaxy Vol. 3', y: 2023, f: 'FILM', min: 150,
    i: 'Closes the cosmic ledger and explains why the current roster looks nothing like it did.' },
  { t: 'rec', n: 'The Marvels', y: 2023, f: 'FILM', min: 105,
    i: 'Carol, Kamala, Monica, and a post-credits tear straight into the X-Men universe.' },
  { t: 'rec', n: 'Agatha All Along', y: 2024, f: 'SERIES', min: 320,
    i: 'The Witches’ Road and Billy Maximoff, who is very much unfinished business.' },
  { t: 'rec', n: 'Captain America: Brave New World', y: 2025, f: 'FILM', min: 118,
    i: 'Sam Wilson holds the shield, and the US government becomes an active hostile.' },
  { t: 'rec', n: 'Daredevil: Born Again', y: 2025, f: 'SERIES', min: 420,
    i: 'Street level under Fisk’s New York. Matt Murdock is on the board again.' },
  { t: 'rec', n: 'Ironheart', y: 2025, f: 'SERIES', min: 250,
    i: 'Riri Williams inherits the Stark problem: tech versus magic, and she picks badly.' },
  { t: 'rec', n: 'Wonder Man', y: 2026, f: 'SERIES', min: 240,
    i: 'Simon Williams, and the most recent read on where the Avengers name even stands.' },

  /* ---------------- DEEP LORE ---------------- */
  { t: 'lore', n: 'What If...? — Season 1', y: 2021, f: 'SERIES', min: 290,
    i: 'The multiverse as an anthology. Establishes the Watcher and Strange Supreme.' },
  { t: 'lore', n: 'Hawkeye', y: 2021, f: 'SERIES', min: 280,
    i: 'Kate Bishop and Yelena Belova collide, and half the Thunderbolts roster starts here.' },
  { t: 'lore', n: 'Moon Knight', y: 2022, f: 'SERIES', min: 290,
    i: 'Egyptian gods operate outside the Avengers entirely. A power set nobody has accounted for.' },
  { t: 'lore', n: 'She-Hulk: Attorney at Law', y: 2022, f: 'SERIES', min: 280,
    i: 'Jen Walters, plus the loosest fourth wall in the canon. Light, and worth it.' },
  { t: 'lore', n: 'Werewolf by Night', y: 2022, f: 'SPECIAL', min: 52,
    i: 'Fifty-two minutes of monster-hunting. Bloodstone lore, and the best-looking thing Marvel made.' },
  { t: 'lore', n: 'Secret Invasion', y: 2023, f: 'SERIES', min: 300,
    i: 'Skrulls have been here the whole time. Relevant every time you doubt someone’s face.' },
  { t: 'lore', n: 'Echo', y: 2024, f: 'SERIES', min: 220,
    i: 'Maya Lopez and ancestral power. Ties Daredevil and Kingpin into the wider board.' },
  { t: 'lore', n: 'X-Men ’97 — Season 1', y: 2024, f: 'SERIES', min: 320,
    i: 'Animated, and the best mutant storytelling in decades. Sets the emotional bar for Doomsday.' },
  { t: 'lore', n: 'Eyes of Wakanda', y: 2025, f: 'SERIES', min: 100,
    i: 'Wakandan history across centuries. Short, gorgeous, deepens every Wakanda scene.' },
  { t: 'lore', n: 'Marvel Zombies', y: 2025, f: 'SERIES', min: 120,
    i: 'A dead branch of the multiverse. Proof of what an unchecked incursion actually costs.' },

  /* ---------------- MUTANT ARCHIVE ---------------- */
  { t: 'mutant', n: 'X-Men', y: 2000, f: 'FILM', min: 104,
    i: 'Where Xavier, Magneto, and the original casting all begin. Doomsday is calling them back.' },
  { t: 'mutant', n: 'X2: X-Men United', y: 2003, f: 'FILM', min: 134,
    i: 'The high point of the early run. Nightcrawler, Stryker, and Jean’s sacrifice.' },
  { t: 'mutant', n: 'X-Men: The Last Stand', y: 2006, f: 'FILM', min: 104,
    i: 'Messy, but it is where the mutant cure and the Phoenix both land.' },
  { t: 'mutant', n: 'X-Men: First Class', y: 2011, f: 'FILM', min: 132,
    i: 'Charles and Erik as friends. The whole tragedy of the franchise in one film.' },
  { t: 'mutant', n: 'X-Men: Days of Future Past', y: 2014, f: 'FILM', min: 132,
    i: 'Two timelines, one team. The template every multiversal crossover has copied since.' },
  { t: 'mutant', n: 'Logan', y: 2017, f: 'FILM', min: 137,
    i: 'The ending that Deadpool & Wolverine deliberately refused to undo. Watch it anyway.' },
  { t: 'mutant', n: 'Fantastic Four', y: 2005, f: 'FILM', min: 106,
    i: 'Optional and rough, but it is the last time a live-action Doom carried a film.' },
];

/** Stable identity for an entry, used as the storage/sync key. */
export const keyOf = (m) => `${m.n}|${m.y}`;

/** Distinguishable on the dark HUD ground, in join order. */
export const SQUAD_COLORS = [
  '#5fd3f3', '#ffb337', '#a98bff', '#6ee7a5',
  '#ff8fa3', '#ff9f4d', '#7aa5ff', '#cbe86b',
  '#f97ee0', '#4fd1c5', '#ffd166', '#9ae6b4',
];
