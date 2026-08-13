/**
 * Alternate HUD palettes, reachable from the sigil rail on the right edge.
 *
 * The colours themselves live in style.css as `:root[data-theme="…"]` blocks,
 * so this file only carries identity: the glyph drawn on the rail, and the
 * in-world chrome each palette rewrites. Stark is the default and maps to the
 * bare `:root` palette, so selecting it clears the attribute entirely.
 *
 * Adding one: append here, add a matching `:root[data-theme="<id>"]` block in
 * style.css. Nothing else needs touching.
 */

const K_THEME = 'doomsday/theme/v1';

/* Glyphs are 24x24, stroked with currentColor. Anything meant to be solid
   carries class="fill" — see the .sigil-btn rules in style.css. */
const GLYPHS = {
  reactor: `
    <circle cx="12" cy="12" r="8.6"/>
    <circle cx="12" cy="12" r="4"/>
    <path d="M12 3.4v3.6M12 17v3.6M3.4 12h3.6M17 12h3.6"/>`,

  spider: `
    <ellipse class="fill" cx="12" cy="12.6" rx="2.1" ry="3"/>
    <circle class="fill" cx="12" cy="8.7" r="1.4"/>
    <path d="M9.9 10.6 6.4 8.2 4.2 9.4M9.7 12.3 5.8 11.7 3.9 13.3
             M9.9 13.9 6.3 14.9 4.6 16.9M10.4 15.2 8.2 17.2 7.4 19.6"/>
    <path d="M14.1 10.6 17.6 8.2 19.8 9.4M14.3 12.3 18.2 11.7 20.1 13.3
             M14.1 13.9 17.7 14.9 19.4 16.9M13.6 15.2 15.8 17.2 16.6 19.6"/>`,

  mjolnir: `
    <rect x="4.6" y="4.4" width="14.8" height="7.2" rx="1.2"/>
    <path d="M8.4 4.4v7.2M15.6 4.4v7.2"/>
    <path d="M12 11.6v7.4M9.8 19h4.4"/>`,

  star: `
    <path class="fill" d="M12 3 14.2 8.9 20.6 9.2 15.6 13.2 17.3 19.3
                          12 15.8 6.7 19.3 8.4 13.2 3.4 9.2 9.8 8.9Z"/>`,

  shield: `
    <circle cx="12" cy="12" r="8.8"/>
    <circle cx="12" cy="12" r="5.9"/>
    <path class="fill" d="M12 8.8 12.8 11 15 11 13.2 12.4 13.9 14.6
                          12 13.3 10.1 14.6 10.8 12.4 9 11 11.2 11Z"/>`,

  eye: `
    <path d="M2.8 12s3.6-5.4 9.2-5.4S21.2 12 21.2 12s-3.6 5.4-9.2 5.4S2.8 12 2.8 12Z"/>
    <circle cx="12" cy="12" r="2.6"/>`,

  claws: `
    <path d="M7.2 3.8c1.9 4.1 2.7 8.7 2.3 13.4M12 3c1.7 4.5 2.3 9.3 1.7 14.2
             M16.8 4.4c1.2 4.3 1.4 8.7.6 13"/>`,
};

export const THEMES = [
  {
    id: 'stark',
    name: 'Stark',
    glyph: GLYPHS.reactor,
    org: 'Stark Industries',
    clearance: 'STARK-01',
    sector: 'EARTH-616',
    line: 'Arc reactor nominal. Welcome back, sir.',
  },
  {
    id: 'spider',
    name: 'Spider-Man',
    glyph: GLYPHS.spider,
    org: 'Parker Industries',
    clearance: 'PARKER-616',
    sector: 'QUEENS, NY',
    line: 'Friendly neighbourhood protocol engaged.',
  },
  {
    id: 'thor',
    name: 'Thor',
    glyph: GLYPHS.mjolnir,
    org: 'Asgardian Archive',
    clearance: 'ODINSON-09',
    sector: 'NEW ASGARD',
    line: 'The Bifrost is open. Mind the landing.',
  },
  {
    id: 'guardians',
    name: 'Guardians of the Galaxy',
    glyph: GLYPHS.star,
    org: 'Ravager Salvage',
    clearance: 'STAR-LORD',
    sector: 'KNOWHERE',
    line: 'We are Groot. Manifest re-tuned.',
  },
  {
    id: 'cap',
    name: 'Captain America',
    glyph: GLYPHS.shield,
    org: 'S.H.I.E.L.D. Archive',
    clearance: 'ROGERS-01',
    sector: 'BROOKLYN',
    line: 'I can do this all day.',
  },
  {
    id: 'strange',
    name: 'Doctor Strange',
    glyph: GLYPHS.eye,
    org: 'Kamar-Taj Records',
    clearance: 'SORCERER-SUPREME',
    sector: 'SANCTUM SANCTORUM',
    line: 'One timeline re-read. This is the one where you finish the list.',
  },
  {
    id: 'panther',
    name: 'Black Panther',
    glyph: GLYPHS.claws,
    org: 'Wakandan Design Group',
    clearance: "T'CHALLA",
    sector: 'WAKANDA',
    line: 'Vibranium interface online. Wakanda forever.',
  },
];

export const themeById = (id) => THEMES.find((t) => t.id === id) || THEMES[0];

export function loadTheme() {
  try {
    return themeById(localStorage.getItem(K_THEME));
  } catch {
    return THEMES[0]; // private mode
  }
}

/**
 * Paint a theme. Only touches the root attribute and a few chrome strings —
 * every colour in the console already derives from the CSS tokens.
 */
export function applyTheme(id, { save = true } = {}) {
  const theme = themeById(id);
  const root = document.documentElement;

  if (theme.id === 'stark') delete root.dataset.theme;
  else root.dataset.theme = theme.id;

  const set = (sel, text) => {
    const el = document.querySelector(sel);
    if (el) el.textContent = text;
  };
  set('#chrome-clearance', `CLEARANCE: ${theme.clearance}`);
  set('#chrome-sector', `SECTOR: ${theme.sector}`);
  set('#chrome-org', `${theme.org} // Doomsday Protocol v1.0`);
  set('#boot-sigil', theme.org);

  for (const btn of document.querySelectorAll('.sigil-btn')) {
    btn.setAttribute('aria-pressed', String(btn.dataset.themeId === theme.id));
  }

  if (save) {
    try { localStorage.setItem(K_THEME, theme.id); } catch { /* private mode */ }
  }
  return theme;
}

/** Build the rail. Delegated click, so the buttons stay disposable. */
export function mountSigils(el, onPick) {
  if (!el) return;

  el.innerHTML = THEMES.map((t) => `
    <button type="button" class="sigil-btn" data-theme-id="${t.id}"
            aria-pressed="false" title="${t.name}" aria-label="${t.name} palette">
      <svg viewBox="0 0 24 24" aria-hidden="true">${t.glyph}</svg>
    </button>`).join('');

  el.addEventListener('click', (e) => {
    const btn = e.target.closest('.sigil-btn');
    if (btn) onPick(btn.dataset.themeId);
  });
}
