// P05–P07 en canvas: noche y sueño → ritmo de 24 horas → un contorno que gana volumen.
import { TAU, clamp, createStars, lerp, ramp, smooth } from '../apertura/draw';

type RGB = [number, number, number];
const mix = (a: RGB, b: RGB, t: number): RGB => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
const rgb = (c: RGB, alpha = 1) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${alpha})`;

/** Posiciones del recorrido, en pantallas desplazadas. */
export const R = { lockedScreens: 7, unlockedScreens: 8.8, station: 5.6, volumeFrom: 6.3, volumeTo: 7.6 };

// Cielo esquemático por hora (arriba, horizonte).
const SKY: [number, RGB, RGB][] = [
  [0, [7, 11, 20], [16, 22, 40]],
  [5, [10, 14, 30], [40, 36, 66]],
  [6.5, [52, 60, 104], [232, 158, 118]],
  [8.5, [120, 168, 206], [236, 214, 182]],
  [12, [118, 176, 222], [214, 232, 240]],
  [16.5, [110, 160, 206], [232, 214, 182]],
  [18.5, [70, 64, 118], [236, 140, 98]],
  [20, [20, 22, 48], [58, 44, 76]],
  [24, [7, 11, 20], [16, 22, 40]],
];
function sky(hour: number): [RGB, RGB] {
  const h = ((hour % 24) + 24) % 24;
  let i = 0;
  while (i < SKY.length - 2 && SKY[i + 1][0] <= h) i++;
  const [h0, t0, b0] = SKY[i], [h1, t1, b1] = SKY[i + 1];
  const t = smooth(clamp((h - h0) / (h1 - h0)));
  return [mix(t0, t1, t), mix(b0, b1, t)];
}
/** 1 = noche plena, 0 = pleno día. */
export function darkness(hour: number) {
  const h = ((hour % 24) + 24) % 24;
  return h < 5 || h > 20.5 ? 1 : h < 7.5 ? 1 - smooth(ramp(h, 5, 7.5)) : h > 18 ? smooth(ramp(h, 18, 20.5)) : 0;
}

/** Hora que sigue al scroll mientras el visitante no mueve el control. */
export function autoHour(s: number) {
  if (s < 2.3) return 1;
  if (s < 3.4) return lerp(1, 7.5, smooth(ramp(s, 2.3, 3.4)));
  if (s < 4.9) return lerp(7.5, 20, ramp(s, 3.4, 4.9));
  return lerp(20, 23, smooth(ramp(s, 4.9, 5.6)));
}

export type Scene = {
  s: number; now: number; width: number; height: number; reduce: boolean;
  hour: number; stars: ReturnType<typeof createStars>; earth: HTMLImageElement | null;
};

export function sleeperLayout(W: number, H: number) {
  const L = Math.min(W * (W < 600 ? .9 : .78), 600), cx = W / 2 + (W < 600 ? W * .04 : 0), base = H * .7;
  return {
    L, cx, base,
    head: { x: cx - L * .36, y: base - L * .105 },
    memoria: { x: cx - L * .3, y: base - L * .34 },
    aprendizaje: { x: cx - L * .44, y: base - L * .2 },
    cuerpo: { x: cx + L * .12, y: base - L * .2 },
  };
}

export function dialLayout(W: number, H: number) {
  return { x: W / 2, y: H * .5, r: Math.min(W, H) * .22 };
}

function drawSleeper(g: CanvasRenderingContext2D, W: number, H: number, alpha: number, breath: number) {
  const { L, cx, base, head } = sleeperLayout(W, H);
  const r = L * .075;
  g.save();
  g.globalAlpha = alpha;
  // Colchón y almohada.
  g.fillStyle = '#16203a';
  g.beginPath(); g.roundRect(cx - L * .52, base - 4, L * 1.08, 14, 7); g.fill();
  g.fillStyle = '#243150';
  g.beginPath(); g.ellipse(head.x - r * .3, base - r * .55, r * 1.9, r * .62, -.05, 0, TAU); g.fill();
  // Cuerpo bajo la manta; la respiración levanta suavemente el torso.
  const lift = 1 + breath * .02;
  g.fillStyle = '#1b2640';
  g.beginPath();
  g.moveTo(head.x + r * .5, base);
  g.bezierCurveTo(head.x + r * .6, base - L * .14 * lift, cx - L * .16, base - L * .19 * lift, cx - L * .02, base - L * .15 * lift);
  g.bezierCurveTo(cx + L * .08, base - L * .12, cx + L * .14, base - L * .2, cx + L * .26, base - L * .17);
  g.bezierCurveTo(cx + L * .4, base - L * .13, cx + L * .48, base - L * .1, cx + L * .52, base - L * .06);
  g.quadraticCurveTo(cx + L * .56, base - L * .02, cx + L * .54, base);
  g.closePath(); g.fill();
  g.strokeStyle = 'rgba(255,196,140,.35)'; g.lineWidth = 1.5; g.stroke();
  // Cabeza.
  g.beginPath(); g.arc(head.x, head.y, r, 0, TAU); g.fillStyle = '#1b2640'; g.fill(); g.stroke();
  g.restore();
}

function drawWaves(g: CanvasRenderingContext2D, W: number, H: number, alpha: number, t: number) {
  const { L, head } = sleeperLayout(W, H);
  g.save();
  for (let k = 0; k < 3; k++) {
    g.strokeStyle = `rgba(255,214,170,${alpha * (.28 - k * .07)})`;
    g.lineWidth = 1.2;
    g.beginPath();
    for (let i = 0; i <= 60; i++) {
      const x = head.x - L * .12 + i / 60 * L * .34;
      const y = head.y - L * (.2 + k * .06) + Math.sin(i / 60 * TAU * 1.5 + t * .6 + k) * L * .012 * (1 - Math.abs(i / 30 - 1));
      if (i) g.lineTo(x, y); else g.moveTo(x, y);
    }
    g.stroke();
  }
  g.restore();
}

function drawDial(g: CanvasRenderingContext2D, W: number, H: number, hour: number, ring: number, marks: number) {
  const { x, y, r } = dialLayout(W, H);
  const at = (h: number, radius: number) => {
    const a = h / 24 * TAU;
    return { x: x - Math.sin(a) * radius, y: y + Math.cos(a) * radius };
  };
  g.save();
  if (marks > 0) {
    // Anillo de dos tramos (06–18 luz, 18–06 oscuridad) como esquema; no son horas de luz reales.
    const ink = darkness(hour) > .5 ? '255,244,230' : '29,36,48';
    const band = (from: number, to: number, color: string) => {
      g.strokeStyle = color; g.lineWidth = 10; g.lineCap = 'round';
      g.beginPath();
      for (let h = from; h <= to + .001; h += .25) { const p = at(h, r + 12); if (h === from) g.moveTo(p.x, p.y); else g.lineTo(p.x, p.y); }
      g.stroke();
    };
    band(6.2, 17.8, `rgba(236,170,90,${.75 * marks})`);
    band(18.2, 29.8, `rgba(70,80,150,${.75 * marks})`);
    g.lineCap = 'butt';
    g.strokeStyle = `rgba(${ink},${.55 * marks})`; g.lineWidth = 1;
    for (let h = 0; h < 24; h++) {
      const a = at(h, r), b = at(h, r - (h % 6 ? 6 : 12));
      g.beginPath(); g.moveTo(a.x, a.y); g.lineTo(b.x, b.y); g.stroke();
    }
    g.fillStyle = `rgba(${ink},${.85 * marks})`;
    g.font = "12px 'Avenir Next', 'Segoe UI', sans-serif"; g.textAlign = 'center'; g.textBaseline = 'middle';
    for (const h of [0, 6, 12, 18]) { const p = at(h, r - 26); g.fillText(`${String(h).padStart(2, '0')}:00`, p.x, p.y); }
    // Sol o luna sobre el anillo.
    const m = at(hour, r + 12);
    const night = darkness(hour);
    g.globalAlpha = marks;
    if (night < .5) {
      g.fillStyle = '#ffcf7a'; g.strokeStyle = '#fff8'; g.lineWidth = 2; g.beginPath(); g.arc(m.x, m.y, 12, 0, TAU); g.fill(); g.stroke();
    } else {
      g.fillStyle = '#f3ead9'; g.beginPath(); g.arc(m.x, m.y, 10, 0, TAU); g.fill();
      const [top] = sky(hour);
      g.fillStyle = rgb(top); g.beginPath(); g.arc(m.x + 5, m.y - 3, 9, 0, TAU); g.fill();
    }
    g.globalAlpha = 1;
  }
  if (ring > 0) {
    g.strokeStyle = 'rgba(255,214,170,.85)'; g.lineWidth = 1.5;
    g.beginPath(); g.arc(x, y, r, Math.PI / 2, Math.PI / 2 + TAU * ring); g.stroke();
  }
  g.restore();
}

function drawGlobe(g: CanvasRenderingContext2D, W: number, H: number, volume: number, earth: HTMLImageElement | null) {
  const d = dialLayout(W, H);
  const r = lerp(d.r, H * .3, smooth(volume));
  const { x, y } = d;
  g.save();
  g.beginPath(); g.arc(x, y, r, 0, TAU); g.clip();
  g.globalAlpha = volume;
  if (earth && earth.complete && earth.naturalWidth) {
    // Américas centradas; la sombra y el oscurecimiento del limbo dan volumen.
    const w = earth.naturalWidth, h = earth.naturalHeight;
    g.drawImage(earth, w * .12, h * .16, w * .32, h * .64, x - r * 1.1, y - r, r * 2.2, r * 2);
  } else {
    g.fillStyle = '#34607a'; g.fillRect(x - r, y - r, r * 2, r * 2);
  }
  const limb = g.createRadialGradient(x - r * .35, y - r * .25, r * .2, x, y, r);
  limb.addColorStop(0, 'rgba(0,0,0,0)'); limb.addColorStop(.75, 'rgba(0,4,12,.25)'); limb.addColorStop(1, 'rgba(0,4,12,.8)');
  g.fillStyle = limb; g.fillRect(x - r, y - r, r * 2, r * 2);
  const shade = g.createLinearGradient(x - r, y, x + r, y);
  shade.addColorStop(0, 'rgba(3,6,14,0)'); shade.addColorStop(.52, 'rgba(3,6,14,.1)'); shade.addColorStop(.72, 'rgba(3,6,14,.85)'); shade.addColorStop(1, 'rgba(3,6,14,.97)');
  g.fillStyle = shade; g.fillRect(x - r, y - r, r * 2, r * 2);
  g.restore();
  g.save();
  g.strokeStyle = `rgba(110,170,255,${.35 * volume})`; g.lineWidth = 2;
  g.beginPath(); g.arc(x, y, r, Math.PI * .55, Math.PI * 1.45); g.stroke();
  g.strokeStyle = `rgba(255,214,170,${.85 * (1 - volume)})`; g.lineWidth = 1.5;
  g.beginPath(); g.arc(x, y, r, 0, TAU); g.stroke();
  g.restore();
}

export function drawRhythms(g: CanvasRenderingContext2D, f: Scene) {
  const { s, now, width: W, height: H, reduce, hour, stars, earth } = f;
  const toNight = smooth(ramp(s, 5, 5.6));
  const [top0, bottom0] = sky(hour);
  const [topN, bottomN] = sky(1);
  const space: RGB = [5, 8, 15];
  const toSpace = smooth(ramp(s, R.volumeFrom, R.volumeTo));
  const top = mix(mix(top0, topN, toNight), space, toSpace), bottom = mix(mix(bottom0, bottomN, toNight), space, toSpace);
  const grd = g.createLinearGradient(0, 0, 0, H);
  grd.addColorStop(0, rgb(top)); grd.addColorStop(1, rgb(bottom));
  g.fillStyle = grd; g.fillRect(0, 0, W, H);

  const dark = lerp(darkness(hour), 1, toNight);
  if (dark > 0) for (const st of stars) {
    const tw = reduce ? 1 : .75 + .25 * Math.sin(now * .001 * st.d + st.ph);
    g.fillStyle = `rgba(255,244,225,${dark * .8 * tw * st.d})`;
    g.beginPath(); g.arc(st.x * W, st.y * H, st.s, 0, TAU); g.fill();
  }

  // Horizonte suave: continuidad entre noche, día y la pregunta.
  const hill = 1 - toSpace;
  if (hill > 0) {
    g.fillStyle = rgb(mix(mix([30, 38, 62], [70, 92, 88], 1 - dark), space, toSpace), hill);
    g.beginPath(); g.moveTo(0, H);
    g.lineTo(0, H * .86); g.quadraticCurveTo(W * .3, H * .8, W * .55, H * .85); g.quadraticCurveTo(W * .8, H * .9, W, H * .83);
    g.lineTo(W, H); g.closePath(); g.fill();
  }

  const sleeper = ramp(s, .15, .6) * (1 - ramp(s, 2.2, 2.6));
  const t = reduce ? 0 : now / 1000;
  if (sleeper > 0) {
    drawWaves(g, W, H, sleeper, t);
    drawSleeper(g, W, H, sleeper, reduce ? 0 : Math.sin(t * TAU / 4.8));
  }

  const ring = smooth(ramp(s, 2.5, 3.2));
  const marks = smooth(ramp(s, 3, 3.4)) * (1 - smooth(ramp(s, 4.9, 5.4)));
  const volume = ramp(s, R.volumeFrom, R.volumeTo);
  if (volume > 0) drawGlobe(g, W, H, volume, earth);
  else drawDial(g, W, H, hour, ring, marks);
}
