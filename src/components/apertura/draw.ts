// Dibujo en canvas de la apertura. Funciones puras: reciben el estado narrativo y pintan.

export type Category = 'trabajo' | 'telefono' | 'responsabilidades' | 'preocupaciones';

export type Bubble = {
  title: string; sub: string; urgent: boolean; category: Category;
  appear: number; release: number;
  ang: number; rad: number; tilt: number; wob: number;
  sx: number; sy: number; w: number; highlight: number;
};

export const TAU = Math.PI * 2;
export const clamp = (v: number, a = 0, b = 1) => Math.max(a, Math.min(b, v));
export const ramp = (p: number, a: number, b: number) => clamp((p - a) / (b - a));
export const smooth = (t: number) => t * t * (3 - 2 * t);
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
type RGB = [number, number, number];
const mix = (a: RGB, b: RGB, t: number): RGB => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
const rgb = (c: RGB, alpha = 1) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${alpha})`;

function random(seed: number) {
  return () => {
    seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

const demands: [string, string, boolean, Category][] = [
  ['Reunión', '9:00 · sala 2', false, 'trabajo'],
  ['Mensajes', '14 sin leer', false, 'telefono'],
  ['Pagar la luz', 'vence hoy', true, 'responsabilidades'],
  ['¿Recoges a mamá?', 'a las 18:30', false, 'responsabilidades'],
  ['Informe', 'lo necesito para ayer', true, 'trabajo'],
  ['Grupo del colegio', '37 mensajes', false, 'telefono'],
  ['¿Alcanzará?', 'faltan 12 días para cobrar', true, 'preocupaciones'],
  ['Correo', 'Re: Re: Urgente', true, 'trabajo'],
  ['Turno extra', '¿puedes el sábado?', false, 'trabajo'],
  ['Análisis', 'resultados el lunes', false, 'preocupaciones'],
  ['Supermercado', 'falta leche', false, 'responsabilidades'],
  ['Jefe', '¿tienes un minuto?', true, 'trabajo'],
  ['Alquiler', 'día 1', true, 'preocupaciones'],
  ['Llamada perdida', '(3)', false, 'telefono'],
  ['Tarea de Sofía', 'maqueta para mañana', false, 'responsabilidades'],
  ['¿Y si no me da tiempo?', '', false, 'preocupaciones'],
  ['Recordatorio', 'ya son las 23:40', true, 'telefono'],
];

/** Posiciones del recorrido, en pantallas desplazadas (1 = alto del viewport). */
export const T = {
  lockedScreens: 5.4, unlockedScreens: 10,
  appearFrom: .8, appearSpan: 2.3,
  station: 3.4, releaseFrom: 4.6, releaseStep: .07, releaseSpan: .45,
};

export function createBubbles(): Bubble[] {
  const r = random(7);
  return demands.map(([title, sub, urgent, category], i) => ({
    title, sub, urgent, category,
    appear: T.appearFrom + i * (T.appearSpan / demands.length),
    release: T.releaseFrom + i * T.releaseStep,
    ang: i * 2.39996 + r() * .4, rad: .55 + r() * .45, tilt: (r() - .5) * .14, wob: r() * TAU,
    sx: .08 + r() * .84, sy: .05 + r() * .38, w: 0, highlight: 0,
  }));
}

export function createStars(count: number) {
  const r = random(11);
  return Array.from({ length: count }, () => ({ x: r(), y: r() * .8, s: .3 + r() * 1.3, ph: r() * TAU, d: .3 + r() * .7 }));
}

const SANS = "'Avenir Next', 'Segoe UI', system-ui, sans-serif";
export function measureBubbles(g: CanvasRenderingContext2D, bubbles: Bubble[]) {
  for (const b of bubbles) {
    g.font = `600 13px ${SANS}`; const a = g.measureText(b.title).width;
    g.font = `12px ${SANS}`; const c = g.measureText(b.sub).width;
    b.w = Math.max(a, c) + 50;
  }
}

export type Frame = {
  s: number; now: number; width: number; height: number; reduce: boolean; chosen: boolean;
};

const DAY: RGB = [243, 233, 220], TENSE: RGB = [205, 207, 212], NIGHT: RGB = [7, 11, 20];

export function narrative(s: number) {
  return {
    walk: ramp(s, .15, 3.2),
    stress: smooth(ramp(s, .7, 3.1)) * (1 - smooth(ramp(s, 4.6, 5.8))),
    night: smooth(ramp(s, 4.8, 6.2)),
    calm: smooth(ramp(s, 5.4, 6.6)),
  };
}

function bodyPath(g: CanvasRenderingContext2D, sh: number) {
  g.beginPath();
  g.moveTo(-sh * 1.15, 4);
  g.bezierCurveTo(-sh * 1.1, -sh * .5, -sh * .75, -sh * .7, -sh * .27, -sh * .77);
  g.quadraticCurveTo(-sh * .17, -sh * .82, -sh * .15, -sh * .98);
  g.lineTo(sh * .15, -sh * .98);
  g.quadraticCurveTo(sh * .17, -sh * .82, sh * .27, -sh * .77);
  g.bezierCurveTo(sh * .75, -sh * .7, sh * 1.1, -sh * .5, sh * 1.15, 4);
  g.closePath();
}

function drawCard(g: CanvasRenderingContext2D, b: Bubble, x: number, y: number, alpha: number, scale: number, rot: number) {
  const w = b.w, h = b.sub ? 46 : 36;
  g.save();
  g.translate(x, y); g.rotate(rot); g.scale(scale, scale); g.globalAlpha = alpha;
  g.shadowColor = 'rgba(20,25,35,.18)'; g.shadowBlur = 18; g.shadowOffsetY = 6;
  g.fillStyle = 'rgba(255,255,255,.94)';
  g.beginPath(); g.roundRect(-w / 2, -h / 2, w, h, 14); g.fill();
  g.shadowColor = 'transparent';
  if (b.highlight > .01) {
    g.strokeStyle = `rgba(200,116,58,${b.highlight})`; g.lineWidth = 2;
    g.beginPath(); g.roundRect(-w / 2 - 3, -h / 2 - 3, w + 6, h + 6, 16); g.stroke();
  }
  g.fillStyle = b.urgent ? '#c9503a' : '#3f7a8c';
  g.beginPath(); g.arc(-w / 2 + 19, 0, 5, 0, TAU); g.fill();
  g.fillStyle = '#1d2430'; g.font = `600 13px ${SANS}`;
  g.fillText(b.title, -w / 2 + 33, b.sub ? -2 : 5);
  if (b.sub) { g.fillStyle = 'rgba(29,36,48,.62)'; g.font = `12px ${SANS}`; g.fillText(b.sub, -w / 2 + 33, 14); }
  g.restore();
}

export type Events = { fired: number[]; released: number[] };

export function drawOpening(g: CanvasRenderingContext2D, f: Frame, prevS: number, bubbles: Bubble[], stars: ReturnType<typeof createStars>): Events {
  const { s, now, width: W, height: H, reduce, chosen } = f;
  const { walk, stress, night } = narrative(s);
  const events: Events = { fired: [], released: [] };

  const base = mix(mix(DAY, TENSE, stress), NIGHT, night);
  const sky = g.createLinearGradient(0, 0, 0, H);
  sky.addColorStop(0, rgb(mix(base, [2, 4, 10], night * .6)));
  sky.addColorStop(1, rgb(mix(base, [240, 205, 170], (1 - night) * .25 + night * .06)));
  g.fillStyle = sky; g.fillRect(0, 0, W, H);

  if (night > 0) {
    for (const st of stars) {
      const tw = reduce ? 1 : .75 + .25 * Math.sin(now * .001 * st.d + st.ph);
      g.fillStyle = `rgba(255,244,225,${night * .8 * tw * st.d})`;
      g.beginPath(); g.arc(st.x * W, st.y * H, st.s, 0, TAU); g.fill();
    }
  }

  // Plano medio frontal: acercamiento y balanceo como curva repetible del scroll.
  const zoom = lerp(1, 1.3, smooth(walk)) * lerp(1, .62, night);
  const sh = Math.min(W * .27, 200) * zoom;
  const moving = reduce ? 0 : walk * (1 - night);
  const step = s * 9;
  const sway = Math.sin(step) * 7 * moving;
  const bob = Math.abs(Math.sin(step)) * 6 * moving;
  const roll = Math.sin(step + .6) * .025 * moving;
  const baseY = H + sh * .12 + bob + night * sh * .35;
  const head = { x: W / 2 + sway, y: baseY - sh * 1.3 };

  const cx = W / 2, cy = H * .5, rx = Math.min(W * .4, 470), ry = Math.min(H * .25, 240);
  const place = (b: Bubble) => {
    const jit = reduce ? 0 : Math.sin(s * 18 + b.wob) * 5 * stress;
    const half = b.w / 2 + 8;
    return {
      x: clamp(cx + Math.cos(b.ang) * rx * b.rad + jit, half, Math.max(half, W - half)),
      y: cy + Math.sin(b.ang) * ry * b.rad - jit * .6,
    };
  };

  // Hilos de tensión entre cada demanda y la persona.
  for (const b of bubbles) {
    const a = smooth(ramp(s, b.appear, b.appear + .15)), k = smooth(ramp(s, b.release, b.release + T.releaseSpan));
    if (a <= 0 || k >= 1) continue;
    const { x, y } = place(b);
    g.strokeStyle = `rgba(40,45,60,${(.16 * stress + .25 * b.highlight) * a * (1 - k)})`; g.lineWidth = 1;
    g.beginPath(); g.moveTo(head.x, head.y); g.quadraticCurveTo((head.x + x) / 2, y + 40, x, y); g.stroke();
  }

  // Figura.
  const color = rgb(mix([42, 49, 64], [16, 24, 40], night));
  g.save();
  g.translate(W / 2 + sway, baseY); g.rotate(roll * .4);
  g.fillStyle = color; bodyPath(g, sh); g.fill();
  if (night > 0) { g.strokeStyle = `rgba(255,196,140,${.45 * night})`; g.lineWidth = 1.5; g.stroke(); }
  g.translate(0, -sh * 1.3); g.rotate(roll);
  g.beginPath(); g.ellipse(0, 0, sh * .29, sh * .37, 0, 0, TAU); g.fill();
  if (night > 0) g.stroke();
  g.restore();

  // Demandas → se dejan en pausa → estrellas.
  bubbles.forEach((b, i) => {
    const a = smooth(ramp(s, b.appear, b.appear + .15));
    const k = smooth(ramp(s, b.release, b.release + T.releaseSpan));
    if (prevS < b.appear && s >= b.appear) events.fired.push(i);
    const done = b.release + T.releaseSpan * .4;
    if (prevS < done && s >= done) events.released.push(i);
    if (a <= 0) return;
    const { x: x0, y: y0 } = place(b);
    const tx = b.sx * W, ty = b.sy * H;
    if (k < 1) {
      const pop = a < 1 ? 1 + Math.sin(a * Math.PI) * .12 : 1;
      const dim = chosen ? lerp(.5, 1, b.highlight) : 1;
      const x = lerp(x0, tx, k), y = lerp(y0, ty, k * k);
      drawCard(g, b, x, y, a * (1 - k) * dim, (.82 + .18 * a) * pop * (1 + b.highlight * .06) * (1 - k * .85), b.tilt * (1 + stress * 2) * (1 - k));
      if (k > 0) { g.fillStyle = `rgba(255,220,170,${k})`; g.beginPath(); g.arc(x, y, 1 + 2 * k, 0, TAU); g.fill(); }
    } else {
      const tw = reduce ? 1 : .8 + .2 * Math.sin(now * .0015 + b.wob);
      const r = 14 + b.highlight * 6;
      const glow = g.createRadialGradient(tx, ty, 0, tx, ty, r);
      glow.addColorStop(0, `rgba(255,225,180,${(.55 + .3 * b.highlight) * tw})`);
      glow.addColorStop(1, 'rgba(255,225,180,0)');
      g.fillStyle = glow; g.beginPath(); g.arc(tx, ty, r, 0, TAU); g.fill();
      g.fillStyle = `rgba(255,240,215,${tw})`; g.beginPath(); g.arc(tx, ty, 2.2, 0, TAU); g.fill();
    }
  });

  return events;
}
