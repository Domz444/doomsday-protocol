/** Ambient canvas field and the boot sequence — pure decoration, no state. */

const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

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
    }));
  }

  size();
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
      x.strokeStyle = `rgba(255,179,55,${0.13 - i * 0.03})`;
      x.lineWidth = 1;
      x.stroke();
    }
    x.setLineDash([]);

    x.strokeStyle = 'rgba(95,211,243,0.07)';
    x.lineWidth = 1;
    x.beginPath();
    x.moveTo(cx - base, cy); x.lineTo(cx + base, cy);
    x.moveTo(cx, cy - base); x.lineTo(cx, cy + base);
    x.stroke();

    for (const m of motes) {
      if (!still) {
        m.y -= m.s;
        if (m.y < -4) m.y = h + 4;
      }
      x.beginPath();
      x.arc(m.x, m.y, m.r, 0, Math.PI * 2);
      x.fillStyle = `rgba(255,196,110,${m.o})`;
      x.fill();
    }

    if (!still) requestAnimationFrame(frame);
  }

  if (still) frame(0); else requestAnimationFrame(frame);
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
