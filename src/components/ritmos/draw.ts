// P05–P07 en canvas: la persona se aleja → cama y sueño → ritmo de 24 horas → contorno → Tierra.
import { NIGHT_SKY, TAU, clamp, drawBubbleStar, drawBust, lerp, nightBust, ramp, smooth, type Bubble, type createStars } from '../apertura/draw';
import type { Circle } from '../descanso/handoff';

type RGB = [number, number, number];
const mix = (a: RGB, b: RGB, t: number): RGB => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
const rgb = (c: RGB, alpha = 1) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${alpha})`;
const SERIF = "Georgia, 'Iowan Old Style', serif";
const SANS = "'Avenir Next', 'Segoe UI', system-ui, sans-serif";

/** Posiciones del recorrido, en pantallas desplazadas. */
export const R = {
  walkOut: [.1, 1] as const, bedIn: [.9, 1.7] as const, bedOut: [3.3, 3.7] as const,
  dayFrom: 3.7, dayTo: 6.5,                 // el control de la hora recorre 00:00 → 24:00 en este tramo
  station: 6.9, lockedScreens: 8.3,
  volume: [7.5, 8.7] as const, unlockedScreens: 10.8,
};

/** Hora ligada al scroll, en ambos sentidos. */
export const hourAt = (s: number) => 24 * ramp(s, R.dayFrom, R.dayTo);
export const scrollAt = (hour: number) => R.dayFrom + clamp(hour / 24) * (R.dayTo - R.dayFrom);

// Cielo por hora: [arriba, horizonte]. Las 00:00 coinciden con la noche de la apertura.
const SKY: [number, RGB, RGB][] = [
  [0, NIGHT_SKY[0], NIGHT_SKY[1]],
  [4.8, [8, 12, 28], [34, 32, 58]],
  [6, [40, 50, 96], [226, 140, 104]],
  [7.5, [96, 142, 196], [246, 204, 160]],
  [10, [98, 160, 216], [206, 228, 238]],
  [15, [92, 150, 208], [214, 230, 236]],
  [17.5, [88, 118, 176], [248, 196, 142]],
  [18.7, [56, 52, 104], [232, 120, 90]],
  [20, [16, 18, 42], [46, 36, 66]],
  [24, NIGHT_SKY[0], NIGHT_SKY[1]],
];
function sky(hour: number): [RGB, RGB] {
  const h = clamp(hour / 24) * 24;
  let i = 0;
  while (i < SKY.length - 2 && SKY[i + 1][0] <= h) i++;
  const [h0, t0, b0] = SKY[i], [h1, t1, b1] = SKY[i + 1];
  const t = smooth(clamp((h - h0) / (h1 - h0)));
  return [mix(t0, t1, t), mix(b0, b1, t)];
}
/** 1 = noche plena, 0 = pleno día. */
export function darkness(hour: number) {
  const h = clamp(hour / 24) * 24;
  return h < 5 || h > 20.5 ? 1 : h < 7.5 ? 1 - smooth(ramp(h, 5, 7.5)) : h > 18 ? smooth(ramp(h, 18, 20.5)) : 0;
}
const twilight = (hour: number, center: number) => Math.max(0, 1 - Math.abs(hour - center) / 1.4);

export function band(hour: number): [string, string] {
  const h = clamp(hour / 24) * 24;
  if (h >= 5 && h < 8) return ['Amanecer', 'La luz de la mañana es una de las señales que ayudan a sincronizar tu reloj interno.'];
  if (h >= 8 && h < 17) return ['Día', 'Con la luz del día, el organismo tiende a mantenerse más alerta.'];
  if (h >= 17 && h < 20.5) return ['Atardecer', 'Al disminuir la luz, el cuerpo empieza a prepararse para el descanso.'];
  return ['Noche', 'En la oscuridad, el organismo favorece el sueño.'];
}
export const clock = (hour: number) => {
  const minutes = Math.round(clamp(hour / 24) * 24 * 60) % (24 * 60);
  return `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
};

function seeded(seed: number) { return () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }; }
const r0 = seeded(21);
const ridgeFar = Array.from({ length: 5 }, () => ({ f: 1 + r0() * 5, p: r0() * TAU, a: .3 + r0() * .7 }));
const ridgeMid = Array.from({ length: 4 }, () => ({ f: .7 + r0() * 3, p: r0() * TAU, a: .3 + r0() * .7 }));
const trees = Array.from({ length: 11 }, () => ({ x: r0(), h: .6 + r0() * .6, round: r0() < .35 }));
const clouds = Array.from({ length: 6 }, () => ({ x: r0(), y: .08 + r0() * .26, w: .12 + r0() * .16, puffs: Array.from({ length: 5 }, () => [r0() - .5, r0() * .5, .35 + r0() * .4]) }));
const ridge = (waves: typeof ridgeFar, x: number) => waves.reduce((sum, w) => sum + Math.sin(x * w.f * TAU + w.p) * w.a, 0) / waves.length;

// ---------- Capas del paisaje ----------

function drawSky(g: CanvasRenderingContext2D, W: number, H: number, hour: number, toSpace: number) {
  const [top, horizon] = sky(hour);
  const space: RGB = [5, 8, 15];
  const t = mix(top, space, toSpace), b = mix(horizon, space, toSpace);
  const grd = g.createLinearGradient(0, 0, 0, H);
  grd.addColorStop(0, rgb(t)); grd.addColorStop(.62, rgb(mix(t, b, .7))); grd.addColorStop(1, rgb(b));
  g.fillStyle = grd; g.fillRect(0, 0, W, H);
  // Resplandor del amanecer (este, izquierda) y del atardecer (oeste, derecha).
  for (const [center, x] of [[6.3, W * .18], [18.6, W * .82]] as const) {
    const k = twilight(clamp(hour / 24) * 24, center) * (1 - toSpace);
    if (k <= 0) continue;
    const glow = g.createRadialGradient(x, H * .78, 0, x, H * .78, Math.max(W, H) * .6);
    glow.addColorStop(0, `rgba(255,170,110,${.45 * k})`); glow.addColorStop(.4, `rgba(255,140,110,${.15 * k})`); glow.addColorStop(1, 'rgba(255,140,110,0)');
    g.fillStyle = glow; g.fillRect(0, 0, W, H);
  }
}

function drawClouds(g: CanvasRenderingContext2D, W: number, H: number, hour: number, alpha: number) {
  if (alpha <= 0) return;
  const dark = darkness(hour), warm = Math.max(twilight(hour, 6.3), twilight(hour, 18.6));
  const color = mix(mix([255, 255, 255], [255, 196, 170], warm), [60, 66, 96], dark);
  for (const c of clouds) {
    const cx = ((c.x + hour * .012) % 1.3 - .15) * W, cy = c.y * H, w = c.w * W;
    for (const [dx, dy, size] of c.puffs) {
      const x = cx + dx * w, y = cy - dy * w * .3, r = size * w * .5;
      const grd = g.createRadialGradient(x, y, 0, x, y, r);
      grd.addColorStop(0, rgb(color, (.34 - dark * .2) * alpha)); grd.addColorStop(1, rgb(color, 0));
      g.fillStyle = grd; g.fillRect(x - r, y - r, r * 2, r * 2);
    }
  }
}

function drawLand(g: CanvasRenderingContext2D, W: number, H: number, hour: number, rise: number, reduce: boolean, now: number) {
  if (rise <= 0) return;
  const [, horizon] = sky(hour);
  const light = 1 - darkness(hour);
  const shift = (1 - rise) * H * .4;
  const layer = (base: number, amp: number, waves: typeof ridgeFar, color: RGB, depth: number) => {
    const y0 = H * base + shift * depth;
    g.fillStyle = rgb(color);
    g.beginPath(); g.moveTo(0, H);
    for (let i = 0; i <= 80; i++) { const x = i / 80; g.lineTo(x * W, y0 - ridge(waves, x) * H * amp); }
    g.lineTo(W, H); g.closePath(); g.fill();
  };
  // Perspectiva atmosférica: lo lejano se funde con el horizonte.
  layer(.7, .05, ridgeFar, mix(mix([28, 32, 56], [120, 146, 170], light), horizon, .45), .6);
  const mist = g.createLinearGradient(0, H * .64 + shift * .7, 0, H * .82 + shift * .7);
  mist.addColorStop(0, rgb(horizon, 0)); mist.addColorStop(.5, rgb(horizon, .35 * rise)); mist.addColorStop(1, rgb(horizon, 0));
  g.fillStyle = mist; g.fillRect(0, H * .6 + shift * .7, W, H * .25);
  layer(.79, .03, ridgeMid, mix(mix([18, 22, 40], [76, 104, 96], light), horizon, .18), .8);

  // Primer plano con árboles y una casa: de noche, sus ventanas se encienden.
  const nearY = H * .87 + shift;
  g.fillStyle = rgb(mix([10, 13, 24], [40, 62, 54], light));
  g.beginPath(); g.moveTo(0, H); g.lineTo(0, nearY + H * .02);
  g.bezierCurveTo(W * .3, nearY - H * .03, W * .6, nearY + H * .03, W, nearY - H * .01);
  g.lineTo(W, H); g.closePath(); g.fill();
  const groundAt = (x: number) => nearY + H * .02 * (1 - x) - H * .03 * Math.sin(x * Math.PI);
  const unit = Math.min(W, H) * .05;
  for (const t of trees) {
    if (Math.abs(t.x - .78) < .06) continue;
    const x = t.x * W, y = groundAt(t.x) + 2, h = unit * 1.6 * t.h;
    g.beginPath();
    if (t.round) { g.ellipse(x, y - h * .7, h * .38, h * .5, 0, 0, TAU); g.rect(x - 1.5, y - h * .3, 3, h * .3); }
    else { for (let k = 0; k < 3; k++) { const ty = y - h * (.25 + k * .28); g.moveTo(x, ty - h * .42); g.lineTo(x - h * (.3 - k * .06), ty); g.lineTo(x + h * (.3 - k * .06), ty); } g.rect(x - 1.5, y - h * .25, 3, h * .25); }
    g.fill();
  }
  const hx = W * .78, hy = groundAt(.78) + 2, hw = unit * 1.9, hh = unit * 1.2;
  g.beginPath(); g.rect(hx - hw / 2, hy - hh, hw, hh); g.moveTo(hx - hw * .62, hy - hh); g.lineTo(hx, hy - hh - unit * .9); g.lineTo(hx + hw * .62, hy - hh); g.fill();
  const lamp = smooth(ramp(darkness(hour), .25, .8));
  const flicker = reduce ? 1 : .94 + .06 * Math.sin(now * .003);
  g.fillStyle = `rgba(255,196,120,${(.12 + .85 * lamp) * flicker})`;
  g.fillRect(hx - hw * .28, hy - hh * .62, hw * .2, hh * .3);
  g.fillRect(hx + hw * .08, hy - hh * .62, hw * .2, hh * .3);
  if (lamp > 0) {
    const glow = g.createRadialGradient(hx, hy - hh * .5, 0, hx, hy - hh * .5, unit * 3);
    glow.addColorStop(0, `rgba(255,190,110,${.25 * lamp})`); glow.addColorStop(1, 'rgba(255,190,110,0)');
    g.fillStyle = glow; g.fillRect(hx - unit * 3, hy - hh * .5 - unit * 3, unit * 6, unit * 6);
  }
}

// ---------- P05 · la cama ----------

export const bedOffset = (W: number, s: number) => (1 - smooth(ramp(s, ...R.bedIn))) * W * .75;

const SLEEPER_RATIO = 831 / 1893;

export function bedLayout(W: number, H: number, offsetX = 0) {
  const L = Math.min(W * (W < 600 ? .98 : .7), 640, H * 1.25), h = L * SLEEPER_RATIO;
  const cx = W / 2 + offsetX, base = H * (W < 600 ? .72 : .78);
  const box = { x: cx - L / 2, y: base - h, w: L, h };
  const at = (u: number, v: number) => ({ x: box.x + u * L, y: box.y + v * h });
  return {
    L, cx, base, box, head: at(.26, .4),
    // En pantallas estrechas los puntos se separan para no tapar la cara.
    memoria: W < 600 ? at(.4, -.14) : at(.34, .02),
    aprendizaje: W < 600 ? at(.07, .02) : at(.2, .5),
    cuerpo: W < 600 ? at(.66, .28) : at(.6, .46),
  };
}

// La ilustración con un tinte de luz de luna, aplicado solo sobre sus píxeles.
let tinted: { src: HTMLImageElement; canvas: HTMLCanvasElement } | null = null;
function moonlit(img: HTMLImageElement) {
  if (tinted?.src === img) return tinted.canvas;
  const c = document.createElement('canvas');
  c.width = img.naturalWidth; c.height = img.naturalHeight;
  const g = c.getContext('2d')!;
  g.drawImage(img, 0, 0);
  g.globalCompositeOperation = 'source-atop';
  g.fillStyle = 'rgba(28,36,86,.3)'; g.fillRect(0, 0, c.width, c.height);
  const rim = g.createLinearGradient(c.width, 0, 0, c.height);
  rim.addColorStop(0, 'rgba(200,215,255,.12)'); rim.addColorStop(1, 'rgba(200,215,255,0)');
  g.fillStyle = rim; g.fillRect(0, 0, c.width, c.height);
  tinted = { src: img, canvas: c };
  return c;
}

function drawBed(g: CanvasRenderingContext2D, W: number, H: number, offsetX: number, alpha: number, breath: number, t: number, reduce: boolean, img: HTMLImageElement | null) {
  if (alpha <= 0) return;
  const { L, cx, base, box, head } = bedLayout(W, H, offsetX);
  g.save();
  g.globalAlpha = alpha;
  // Luz de luna sobre el suelo, bajo la cama.
  const floor = g.createRadialGradient(cx, base, 0, cx, base, L * .7);
  floor.addColorStop(0, 'rgba(150,170,230,.2)'); floor.addColorStop(1, 'rgba(150,170,230,0)');
  g.fillStyle = floor; g.beginPath(); g.ellipse(cx, base - L * .01, L * .72, L * .09, 0, 0, TAU); g.fill();
  if (img && img.complete && img.naturalWidth) {
    // Respiración muy suave: la ilustración se eleva apenas desde el suelo.
    const lift = 1 + breath * .005;
    g.drawImage(moonlit(img), box.x, base - box.h * lift, box.w, box.h * lift);
  }
  // Ondas conceptuales sobre la cabeza (no son datos medidos).
  const u = L / 100;
  for (let k = 0; k < 3; k++) {
    g.strokeStyle = `rgba(255,214,170,${.32 - k * .08})`; g.lineWidth = 1.2;
    g.beginPath();
    for (let i = 0; i <= 60; i++) {
      const x = head.x - 6 * u + i / 60 * 26 * u;
      const y = box.y - (2 + k * 4) * u + Math.sin(i / 60 * TAU * 1.5 + (reduce ? 0 : t * .6) + k) * 1.1 * u * (1 - Math.abs(i / 30 - 1));
      if (i) g.lineTo(x, y); else g.moveTo(x, y);
    }
    g.stroke();
  }
  g.restore();
}

// ---------- P06 · reloj de 24 horas ----------

export function dialLayout(W: number, H: number) {
  return { x: W / 2, y: H * .43, r: Math.min(W * .34, H * .21, 200) };
}

function drawDial(g: CanvasRenderingContext2D, W: number, H: number, hour: number, sweep: number, marks: number, contour: number) {
  const { x, y, r } = dialLayout(W, H);
  const angle = (h: number) => h / 24 * TAU + Math.PI / 2;       // 00:00 abajo, 12:00 arriba
  const at = (h: number, radius: number) => ({ x: x + Math.cos(angle(h)) * radius, y: y + Math.sin(angle(h)) * radius });
  const dark = darkness(hour);
  const ink = dark > .5 ? '255,244,230' : '26,32,46';
  g.save();
  if (marks > 0) {
    // Esfera de cristal con sombra suave.
    g.save();
    g.shadowColor = 'rgba(0,0,0,.28)'; g.shadowBlur = 50; g.shadowOffsetY = 18;
    const glass = g.createRadialGradient(x - r * .3, y - r * .4, r * .1, x, y, r * 1.05);
    glass.addColorStop(0, `rgba(255,255,255,${(.3 - dark * .22) * marks})`); glass.addColorStop(1, `rgba(255,255,255,${(.08 - dark * .05) * marks})`);
    g.fillStyle = glass; g.beginPath(); g.arc(x, y, r + 16, 0, TAU); g.fill();
    g.restore();
    g.strokeStyle = `rgba(255,255,255,${.35 * marks})`; g.lineWidth = 1;
    g.beginPath(); g.arc(x, y, r + 16, Math.PI * 1.05, Math.PI * 1.7); g.stroke();
  }
  // Arco de luz: noche índigo → amanecer → día → atardecer → noche. Esquema, no horas de luz reales.
  if (sweep > 0) {
    const conic = g.createConicGradient(Math.PI / 2, x, y);
    const stops: [number, string][] = [[0, '#2c3170'], [4.8, '#353a86'], [6, '#e0835a'], [7.2, '#f3bf6a'], [12, '#fde7a8'], [16.8, '#f3bf6a'], [18.2, '#e0835a'], [19.6, '#3d3a8a'], [24, '#2c3170']];
    stops.forEach(([h, c]) => conic.addColorStop(h / 24, c));
    g.strokeStyle = conic; g.globalAlpha = Math.max(marks, contour > 0 ? 0 : sweep); g.lineWidth = 8; g.lineCap = 'round';
    g.beginPath(); g.arc(x, y, r, Math.PI / 2, Math.PI / 2 + TAU * sweep * .999); g.stroke();
    g.globalAlpha = 1; g.lineCap = 'butt';
  }
  if (marks > 0) {
    for (let h = 0; h < 24; h++) {
      const major = h % 6 === 0;
      const a = at(h, r - 12), b = at(h, r - (major ? 24 : 17));
      g.strokeStyle = `rgba(${ink},${(major ? .8 : .4) * marks})`; g.lineWidth = major ? 1.6 : 1;
      g.beginPath(); g.moveTo(a.x, a.y); g.lineTo(b.x, b.y); g.stroke();
    }
    g.fillStyle = `rgba(${ink},${.75 * marks})`; g.font = `13px ${SERIF}`; g.textAlign = 'center'; g.textBaseline = 'middle';
    for (const h of [0, 6, 12, 18]) { const p = at(h, r - 38); g.fillText(String(h).padStart(2, '0'), p.x, p.y); }
    // Manecilla.
    const tip = at(hour, r - 14);
    g.strokeStyle = `rgba(${ink},${.7 * marks})`; g.lineWidth = 2; g.lineCap = 'round';
    g.beginPath(); g.moveTo(x, y); g.lineTo(tip.x, tip.y); g.stroke(); g.lineCap = 'butt';
    g.fillStyle = `rgba(${ink},${marks})`; g.beginPath(); g.arc(x, y, 3.5, 0, TAU); g.fill();
    // Hora y franja en el centro.
    g.fillStyle = `rgba(${ink},${.95 * marks})`; g.font = `${Math.round(r * .2)}px ${SERIF}`;
    g.fillText(clock(hour), x, y + r * .3);
    g.font = `600 10px ${SANS}`; g.fillStyle = `rgba(${ink},${.65 * marks})`;
    g.fillText(band(hour)[0].toUpperCase().split('').join(' '), x, y + r * .47);
    // Sol o luna sobre el arco.
    const m = at(hour, r);
    const sunny = dark < .5;
    const halo = g.createRadialGradient(m.x, m.y, 0, m.x, m.y, 34);
    halo.addColorStop(0, sunny ? `rgba(255,214,130,${.7 * marks})` : `rgba(210,220,255,${.45 * marks})`); halo.addColorStop(1, 'rgba(255,220,150,0)');
    g.fillStyle = halo; g.beginPath(); g.arc(m.x, m.y, 34, 0, TAU); g.fill();
    g.globalAlpha = marks;
    if (sunny) {
      const disc = g.createRadialGradient(m.x - 3, m.y - 3, 1, m.x, m.y, 12);
      disc.addColorStop(0, '#fff5d6'); disc.addColorStop(1, '#f6b84e');
      g.fillStyle = disc; g.beginPath(); g.arc(m.x, m.y, 12, 0, TAU); g.fill();
    } else {
      g.fillStyle = '#eef0ff';
      g.beginPath(); g.arc(m.x, m.y, 11, 0, TAU); g.arc(m.x + 6, m.y - 4, 10, 0, TAU, true); g.fill('evenodd');
    }
    g.globalAlpha = 1;
  }
  if (contour > 0) {
    g.strokeStyle = `rgba(255,214,170,${.85 * contour})`; g.lineWidth = 1.5;
    g.beginPath(); g.arc(x, y, r, 0, TAU); g.stroke();
  }
  g.restore();
}

// ---------- P07 → P08 · el contorno gana volumen ----------

function drawGlobe(g: CanvasRenderingContext2D, W: number, H: number, volume: number, earth: HTMLImageElement | null, target: Circle | null, handover: number) {
  const d = dialLayout(W, H);
  const end = target ?? { x: W / 2, y: H * .55, r: H * .28 };
  const t = smooth(volume);
  const x = lerp(d.x, end.x, t), y = lerp(d.y, end.y, t), r = lerp(d.r, end.r, t);
  if (handover >= 1) return;
  g.save();
  g.globalAlpha = 1 - handover;
  g.beginPath(); g.arc(x, y, r, 0, TAU); g.clip();
  g.globalAlpha = volume * (1 - handover);
  if (earth && earth.complete && earth.naturalWidth) {
    // Américas, como las mostrará la Tierra 3D; el desplazamiento de la textura sugiere el giro.
    const w = earth.naturalWidth, h = earth.naturalHeight;
    const spin = (1 - t) * .09;
    g.drawImage(earth, w * (.125 + spin), h * .085, w * .306, h * .667, x - r, y - r, r * 2, r * 2);
  } else {
    g.fillStyle = '#34607a'; g.fillRect(x - r, y - r, r * 2, r * 2);
  }
  const limb = g.createRadialGradient(x - r * .35, y - r * .25, r * .2, x, y, r);
  limb.addColorStop(0, 'rgba(0,0,0,0)'); limb.addColorStop(.75, 'rgba(0,4,12,.22)'); limb.addColorStop(1, 'rgba(0,4,12,.8)');
  g.fillStyle = limb; g.fillRect(x - r, y - r, r * 2, r * 2);
  const shade = g.createLinearGradient(x - r, y, x + r, y);
  shade.addColorStop(0, 'rgba(3,6,14,0)'); shade.addColorStop(.5, 'rgba(3,6,14,.08)'); shade.addColorStop(.7, 'rgba(3,6,14,.82)'); shade.addColorStop(1, 'rgba(3,6,14,.97)');
  g.fillStyle = shade; g.fillRect(x - r, y - r, r * 2, r * 2);
  g.restore();
  g.save();
  g.globalAlpha = 1 - handover;
  g.strokeStyle = `rgba(110,170,255,${.35 * volume})`; g.lineWidth = 2;
  g.beginPath(); g.arc(x, y, r, Math.PI * .55, Math.PI * 1.45); g.stroke();
  g.strokeStyle = `rgba(255,214,170,${.85 * (1 - volume)})`; g.lineWidth = 1.5;
  g.beginPath(); g.arc(x, y, r, 0, TAU); g.stroke();
  g.restore();
}

export type Scene = {
  s: number; now: number; width: number; height: number; reduce: boolean;
  stars: ReturnType<typeof createStars>; bubbles: Bubble[]; earth: HTMLImageElement | null; sleeper: HTMLImageElement | null; target: Circle | null;
};

export function drawRhythms(g: CanvasRenderingContext2D, f: Scene) {
  const { s, now, width: W, height: H, reduce, stars, bubbles, earth, sleeper, target } = f;
  const hour = hourAt(s);
  const toSpace = smooth(ramp(s, R.volume[0], R.volume[1] - .3));
  drawSky(g, W, H, hour, toSpace);

  const dark = darkness(hour);
  if (dark > 0) for (const st of stars) {
    const tw = reduce ? 1 : .75 + .25 * Math.sin(now * .001 * st.d + st.ph);
    g.fillStyle = `rgba(255,244,225,${dark * .8 * tw * st.d})`;
    g.beginPath(); g.arc(st.x * W, st.y * H, st.s, 0, TAU); g.fill();
  }
  const demandStars = dark * (1 - smooth(ramp(s, R.volume[0], R.volume[1])));
  if (demandStars > 0) for (const b of bubbles) drawBubbleStar(g, b, W, H, now, reduce, demandStars);

  const land = smooth(ramp(s, 3.3, 4.2)) * (1 - smooth(ramp(s, 7.3, 8.2)));
  drawClouds(g, W, H, hour, land);
  drawLand(g, W, H, hour, land, reduce, now);

  // La persona de la apertura se aleja caminando hacia la izquierda.
  const out = smooth(ramp(s, ...R.walkOut));
  if (out < 1) {
    const { sh, baseY } = nightBust(W, H);
    const walking = reduce ? 0 : Math.min(1, out * 6) * (1 - out);
    const step = s * 14;
    drawBust(g, W / 2 - out * (W / 2 + sh * 1.6), baseY + Math.abs(Math.sin(step)) * 7 * walking, sh, Math.sin(step + .6) * .03 * walking, 1);
  }

  // Luego entra la cama desde la derecha.
  const bedAlpha = ramp(s, R.bedIn[0], R.bedIn[0] + .4) * (1 - ramp(s, ...R.bedOut));
  const t = now / 1000;
  drawBed(g, W, H, bedOffset(W, s), bedAlpha, reduce ? 0 : Math.sin(t * TAU / 4.8), t, reduce, sleeper);

  const sweep = smooth(ramp(s, 3.6, 4.2));
  const marks = smooth(ramp(s, 3.9, 4.3)) * (1 - smooth(ramp(s, 6.5, 6.9)));
  const contour = smooth(ramp(s, 6.4, 6.9));
  const volume = ramp(s, ...R.volume);
  // P08 se funde encima entre s = 8.8 y 9.8; el globo plano cede en la segunda mitad.
  if (volume > 0) drawGlobe(g, W, H, volume, earth, target, smooth(ramp(s, R.unlockedScreens - 1.5, R.unlockedScreens - 1)));
  else drawDial(g, W, H, hour, sweep, marks, contour);
}
