/** Ambient canvas field and the boot sequence — pure decoration, no state. */

const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * Canvas can't read CSS custom properties, so the active palette is mirrored
 * here as bare "r,g,b" channels. Re-read on every theme change.
 */
let palette = { hud: '255,179,55', ion: '95,211,243', mote: '255,196,110' };

/**
 * What drifts up through the field, per palette. The context arrives already
 * translated to the mote and rotated, with fill and stroke both set to the
 * palette's mote colour — a drifter only describes its shape around 0,0.
 *
 * `m.r` runs about 0.4 to 1.2, so shapes scale off it to keep the same size
 * spread the original embers had.
 */
const DRIFTERS = {
  /* Stark: embers off the reactor. */
  stark: (x, m) => {
    x.beginPath();
    x.arc(0, 0, m.r, 0, Math.PI * 2);
    x.fill();
  },

  /* Spider-Man: torn web fragments — spokes plus two catch threads. */
  spider: (x, m) => {
    const s = 3 + m.r * 4;
    const spokes = 5;
    x.beginPath();
    for (let i = 0; i < spokes; i++) {
      const a = (i / spokes) * Math.PI * 2;
      x.moveTo(0, 0);
      x.lineTo(Math.cos(a) * s, Math.sin(a) * s);
    }
    for (const ring of [0.45, 0.85]) {
      for (let i = 0; i < spokes; i++) {
        const a1 = (i / spokes) * Math.PI * 2;
        const a2 = ((i + 1) / spokes) * Math.PI * 2;
        x.moveTo(Math.cos(a1) * s * ring, Math.sin(a1) * s * ring);
        x.lineTo(Math.cos(a2) * s * ring, Math.sin(a2) * s * ring);
      }
    }
    x.stroke();
  },

  /* Thor: forked lightning. */
  thor: (x, m) => {
    const s = 3 + m.r * 5;
    x.beginPath();
    x.moveTo(0, -s);
    x.lineTo(-s * 0.38, -s * 0.1);
    x.lineTo(s * 0.12, 0);
    x.lineTo(-s * 0.22, s);
    x.stroke();
  },

  /* Guardians: Groot saplings. */
  guardians: (x, m) => {
    const s = 3 + m.r * 4;
    x.beginPath();
    x.moveTo(0, s); x.lineTo(0, -s * 0.25);
    x.moveTo(0, s * 0.3); x.lineTo(-s * 0.62, -s * 0.3);
    x.moveTo(0, -s * 0.05); x.lineTo(s * 0.62, -s * 0.68);
    x.stroke();
    x.beginPath();
    x.arc(0, -s * 0.5, s * 0.22, 0, Math.PI * 2);
    x.fill();
  },

  /* Captain America: shields, seen edge-on as concentric rings. */
  cap: (x, m) => {
    const s = 2.5 + m.r * 3.5;
    x.beginPath(); x.arc(0, 0, s, 0, Math.PI * 2); x.stroke();
    x.beginPath(); x.arc(0, 0, s * 0.55, 0, Math.PI * 2); x.stroke();
    x.beginPath(); x.arc(0, 0, s * 0.18, 0, Math.PI * 2); x.fill();
  },

  /* Doctor Strange: sling-ring sparks. */
  strange: (x, m) => {
    const s = 3 + m.r * 4;
    x.beginPath();
    x.arc(0, 0, s * 0.6, 0, Math.PI * 2);
    x.stroke();
    x.beginPath();
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      x.moveTo(Math.cos(a) * s * 0.78, Math.sin(a) * s * 0.78);
      x.lineTo(Math.cos(a) * s, Math.sin(a) * s);
    }
    x.stroke();
  },

  /* Black Panther: the nested triangle of Wakandan design. */
  panther: (x, m) => {
    const s = 3 + m.r * 4;
    const tri = (r) => {
      x.beginPath();
      for (let i = 0; i < 3; i++) {
        const a = (i / 3) * Math.PI * 2 - Math.PI / 2;
        const px = Math.cos(a) * r;
        const py = Math.sin(a) * r;
        if (i === 0) x.moveTo(px, py); else x.lineTo(px, py);
      }
      x.closePath();
      x.stroke();
    };
    tri(s);
    tri(s * 0.45);
  },
};

let drifter = DRIFTERS.stark;

export function syncPalette() {
  const cs = getComputedStyle(document.documentElement);
  const pick = (name, current) => cs.getPropertyValue(name).trim() || current;
  palette = {
    hud: pick('--hud-rgb', palette.hud),
    ion: pick('--ion-rgb', palette.ion),
    mote: pick('--mote-rgb', palette.mote),
  };
  drifter = DRIFTERS[document.documentElement.dataset.theme] || DRIFTERS.stark;
}

export function startField(canvas) {
  const x = canvas.getContext('2d');
  const still = reduced();
  let w = 0, h = 0, motes = [];

  function size() {
    const dpr = Math.min(devicePixelRatio || 1, 2);
    w = innerWidth;
    h = innerHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    x.setTransform(dpr, 0, 0, dpr, 0, 0);

    // Deterministic scatter — no Math.random, so resizes don't reshuffle.
    motes = Array.from({ length: Math.min(70, Math.round(w / 22)) }, (_, i) => ({
      x: (i * 97.3) % w,
      y: (i * 61.7) % h,
      r: 0.4 + ((i * 13) % 10) / 12,
      s: 0.06 + ((i * 7) % 10) / 90,
      o: 0.1 + ((i * 3) % 10) / 32,
      a: (((i * 47) % 360) * Math.PI) / 180, // resting angle
      w: (((i % 5) - 2) * 0.000018),         // slow spin, both directions
    }));
  }

  size();
  syncPalette();
  addEventListener('resize', size);

  function frame(t) {
    x.clearRect(0, 0, w, h);
    const cx = w * 0.22;
    const cy = h * 0.52;
    const base = Math.min(w, h) * 0.42;

    // Counter-rotating reticle rings.
    for (let i = 0; i < 3; i++) {
      const r = base * (0.55 + i * 0.28);
      const dir = i % 2 ? -1 : 1;
      const a = t * 0.00007 * dir * (1 + i * 0.4);
      x.setLineDash([2, 15 + i * 6]);
      x.beginPath();
      x.arc(cx, cy, r, a, a + Math.PI * 1.75);
      x.strokeStyle = `rgba(${palette.hud},${0.13 - i * 0.03})`;
      x.lineWidth = 1;
      x.stroke();
    }
    x.setLineDash([]);

    x.strokeStyle = `rgba(${palette.ion},0.07)`;
    x.lineWidth = 1;
    x.beginPath();
    x.moveTo(cx - base, cy); x.lineTo(cx + base, cy);
    x.moveTo(cx, cy - base); x.lineTo(cx, cy + base);
    x.stroke();

    x.lineWidth = 1;
    for (const m of motes) {
      if (!still) {
        m.y -= m.s;
        if (m.y < -4) m.y = h + 4;
      }
      const ink = `rgba(${palette.mote},${m.o})`;
      x.fillStyle = ink;
      x.strokeStyle = ink;

      x.save();
      x.translate(m.x, m.y);
      x.rotate(m.a + (still ? 0 : t * m.w));
      drifter(x, m);
      x.restore();
    }

    if (!still) requestAnimationFrame(frame);
  }

  if (still) frame(0); else requestAnimationFrame(frame);

  // Returned so a palette change can repaint at once — in reduced-motion mode
  // there is no next frame to pick the new colours up.
  return () => frame(performance.now());
}

/** Tick marks around the reactor ring — every 5th one runs longer. */
export function drawTicks(group) {
  const NS = 'http://www.w3.org/2000/svg';
  for (let i = 0; i < 60; i++) {
    const a = (i / 60) * Math.PI * 2 - Math.PI / 2;
    const inner = i % 5 === 0 ? 90 : 93;
    const line = document.createElementNS(NS, 'line');
    line.setAttribute('x1', 100 + Math.cos(a) * inner);
    line.setAttribute('y1', 100 + Math.sin(a) * inner);
    line.setAttribute('x2', 100 + Math.cos(a) * 96);
    line.setAttribute('y2', 100 + Math.sin(a) * 96);
    group.appendChild(line);
  }
}

export function runBoot(el) {
  if (!el) return;
  if (reduced()) { el.remove(); return; }

  const lines = [...el.querySelectorAll('li')];
  lines.forEach((li, i) => setTimeout(() => li.classList.add('up'), 260 + i * 190));

  const done = () => {
    el.classList.add('done');
    setTimeout(() => el.remove(), 800);
  };

  setTimeout(done, 260 + lines.length * 190 + 480);
  el.addEventListener('click', () => el.remove());
}

/** Live countdown. Returns a stop function. */
export function startClock(target, nodes) {
  const tick = () => {
    const delta = Math.abs(target - new Date());
    const past = target - new Date() < 0;
    nodes.d.textContent = past ? '00' : Math.floor(delta / 86_400_000);
    nodes.h.textContent = String(Math.floor(delta / 3_600_000) % 24).padStart(2, '0');
    nodes.m.textContent = String(Math.floor(delta / 60_000) % 60).padStart(2, '0');
    nodes.s.textContent = String(Math.floor(delta / 1000) % 60).padStart(2, '0');
  };
  tick();
  const id = setInterval(tick, 1000);
  return () => clearInterval(id);
}
