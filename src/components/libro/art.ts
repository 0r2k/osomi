// Ilustraciones en acuarela generadas por código. Cada una se pinta sola la primera vez que se abre
// su página: las manchas florecen desde el centro y la tinta avanza a lo largo de su trazo.
import { seeded } from './paper';

export type ArtKind = 'moon' | 'cards' | 'branch' | 'globe' | 'cup' | 'sunrise';
type Box = { x: number; y: number; w: number; h: number };
type RGB = [number, number, number];
const TAU = Math.PI * 2;
const clamp = (v: number) => Math.max(0, Math.min(1, v));
const phase = (p: number, a: number, b: number) => clamp((p - a) / (b - a));

/** Mancha de acuarela: capas translúcidas desplazadas, borde más oscuro y granulado. */
function wash(g: CanvasRenderingContext2D, shape: (g: CanvasRenderingContext2D) => void, color: RGB, r: () => number, bloom: number, center: { x: number; y: number }, reach: number, strength = 1) {
  // Consumir siempre la misma secuencia aleatoria: las demás manchas no tiemblan entre fotogramas.
  const jitter = Array.from({ length: 18 }, () => (r() - .5) * 3.2);
  const specks = Array.from({ length: 180 }, () => r() - .5);
  if (bloom <= 0) return;
  g.save();
  g.beginPath(); g.arc(center.x, center.y, reach * (.15 + .85 * bloom), 0, TAU); g.clip();
  const [cr, cg, cb] = color;
  for (let i = 0; i < 9; i++) {
    g.save();
    g.translate(jitter[i * 2], jitter[i * 2 + 1]);
    shape(g);
    g.fillStyle = `rgba(${cr},${cg},${cb},${.085 * strength})`; g.fill();
    g.restore();
  }
  shape(g);
  g.strokeStyle = `rgba(${cr * .7 | 0},${cg * .7 | 0},${cb * .7 | 0},${.28 * strength})`; g.lineWidth = 1.1; g.stroke();
  g.clip();
  // Pigmento irregular: zonas más cargadas y otras lavadas, como el agua al secarse.
  for (let i = 0; i < 6; i++) {
    const bx = center.x + specks[100 + i * 2] * reach, by = center.y + specks[101 + i * 2] * reach, br = reach * (.18 + Math.abs(specks[120 + i]) * .5);
    const blot = g.createRadialGradient(bx, by, 0, bx, by, br);
    const dark = i % 2 === 0;
    blot.addColorStop(0, dark ? `rgba(${cr * .75 | 0},${cg * .75 | 0},${cb * .75 | 0},${.16 * strength})` : 'rgba(255,250,238,.22)');
    blot.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = blot; g.fillRect(bx - br, by - br, br * 2, br * 2);
  }
  for (let i = 0; i < 90; i++) {
    g.fillStyle = `rgba(${cr * .6 | 0},${cg * .6 | 0},${cb * .6 | 0},${.12 * strength})`;
    g.fillRect(center.x + specks[i * 2] * reach * 2, center.y + specks[i * 2 + 1] * reach * 2, 1, 1);
  }
  g.restore();
}

/** Trazo de tinta con leve temblor, dibujado hasta la fracción `progress` de su largo. */
function ink(g: CanvasRenderingContext2D, pts: [number, number][], progress: number, width = 1.3, color = 'rgba(60,48,34,.85)') {
  if (progress <= 0 || pts.length < 2) return;
  let total = 0;
  const seg = pts.slice(1).map((p, i) => { const l = Math.hypot(p[0] - pts[i][0], p[1] - pts[i][1]); total += l; return l; });
  let left = total * progress;
  g.save(); g.strokeStyle = color; g.lineWidth = width; g.lineCap = 'round'; g.lineJoin = 'round';
  g.beginPath(); g.moveTo(pts[0][0], pts[0][1]);
  for (let i = 0; i < seg.length && left > 0; i++) {
    const t = Math.min(1, left / seg[i]);
    g.lineTo(pts[i][0] + (pts[i + 1][0] - pts[i][0]) * t, pts[i][1] + (pts[i + 1][1] - pts[i][1]) * t);
    left -= seg[i];
  }
  g.stroke(); g.restore();
}

const arc = (cx: number, cy: number, rx: number, ry: number, a0: number, a1: number, n = 40): [number, number][] =>
  Array.from({ length: n + 1 }, (_, i) => { const a = a0 + (a1 - a0) * i / n; return [cx + Math.cos(a) * rx, cy + Math.sin(a) * ry]; });

export function drawArt(g: CanvasRenderingContext2D, kind: ArtKind, box: Box, p: number) {
  const r = seeded(kind.length * 97 + 13);
  const { x, y, w, h } = box, cx = x + w / 2, cy = y + h / 2;
  const reach = Math.max(w, h) * .7;
  g.save();
  if (kind === 'moon') {
    const s = Math.min(w, h) * .86, sx = cx - s / 2, sy = cy - s / 2;
    wash(g, gg => { gg.beginPath(); gg.roundRect(sx, sy, s, s, 14); }, [44, 56, 118], r, phase(p, 0, .5), { x: cx, y: cy }, reach, 1.4);
    const wx = cx - s * .16, wy = cy - s * .05, ww = s * .34, wh = s * .38;
    wash(g, gg => { gg.beginPath(); gg.rect(wx, wy, ww, wh); }, [246, 196, 110], r, phase(p, .35, .7), { x: wx + ww / 2, y: wy + wh / 2 }, s * .4, 1.8);
    wash(g, gg => { gg.beginPath(); gg.arc(cx + s * .28, cy - s * .28, s * .09, 0, TAU); gg.arc(cx + s * .32, cy - s * .31, s * .08, 0, TAU, true); }, [246, 238, 214], r, phase(p, .45, .75), { x: cx + s * .28, y: cy - s * .28 }, s * .2, 2.4);
    const lp = phase(p, .6, 1);
    ink(g, [[wx, wy], [wx + ww, wy], [wx + ww, wy + wh], [wx, wy + wh], [wx, wy]], lp);
    ink(g, [[wx + ww / 2, wy], [wx + ww / 2, wy + wh]], lp); ink(g, [[wx, wy + wh / 2], [wx + ww, wy + wh / 2]], lp);
    ink(g, [[wx - 6, wy + wh + 4], [wx + ww + 6, wy + wh + 4]], lp, 2);
    for (let i = 0; i < 7; i++) {
      const tx = sx + 14 + r() * (s - 28), ty = sy + 12 + r() * s * .35;
      g.fillStyle = `rgba(250,240,210,${.8 * phase(p, .7 + i * .03, .85 + i * .03)})`;
      g.beginPath(); g.arc(tx, ty, 1.4, 0, TAU); g.fill();
    }
  }
  if (kind === 'cards') {
    const cw = Math.min(w / 8.4, 40), ch = cw * 1.3, gap = cw * .2, total = 7 * cw + 6 * gap, x0 = cx - total / 2, y0 = cy - ch / 2;
    for (let i = 0; i < 7; i++) {
      const bx = x0 + i * (cw + gap), bp = phase(p, i * .08, .35 + i * .08);
      const gold = i === 6;
      wash(g, gg => { gg.beginPath(); gg.roundRect(bx, y0, cw, ch, 3); }, gold ? [240, 180, 90] : [206, 196, 176], r, bp, { x: bx + cw / 2, y: y0 + ch / 2 }, ch, gold ? 1.6 : 1.1);
      ink(g, [[bx, y0 + 3], [bx + cw, y0 + 3]], phase(p, .3 + i * .08, .5 + i * .08), 2.2, gold ? 'rgba(150,100,40,.9)' : 'rgba(150,130,90,.8)');
      g.fillStyle = `rgba(60,48,34,${.8 * phase(p, .5 + i * .06, .7 + i * .06)})`;
      g.font = `${Math.round(cw * .5)}px Georgia, serif`; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillText(String(i + 1), bx + cw / 2, y0 + ch * .58);
    }
  }
  if (kind === 'branch') {
    const stem: [number, number][] = Array.from({ length: 30 }, (_, i) => { const t = i / 29; return [x + w * (.1 + .8 * t), cy + Math.sin(t * 2.6) * h * .18 - t * h * .1]; });
    ink(g, stem, phase(p, 0, .5), 1.6);
    for (let i = 0; i < 9; i++) {
      const t = .12 + i * .09, idx = Math.round(t * 29), [lx, ly] = stem[idx], up = i % 2 ? 1 : -1, ang = -.5 * up + (r() - .5) * .3;
      const lp = phase(p, .15 + i * .07, .45 + i * .07);
      wash(g, gg => { gg.beginPath(); gg.ellipse(lx + Math.cos(ang - Math.PI / 2 * up) * 14, ly + Math.sin(ang - Math.PI / 2 * up) * 14 * up, 16, 6, ang, 0, TAU); }, [118, 146, 96], r, lp, { x: lx, y: ly }, 30, 1.5);
    }
    for (let i = 0; i < 3; i++) {
      const [ox, oy] = stem[8 + i * 7];
      wash(g, gg => { gg.beginPath(); gg.ellipse(ox + 4, oy + 12, 6, 8, .3, 0, TAU); }, [70, 70, 90], r, phase(p, .6 + i * .1, .85 + i * .05), { x: ox, y: oy + 12 }, 14, 1.6);
    }
  }
  if (kind === 'globe') {
    const rad = Math.min(w, h) * .36;
    wash(g, gg => { gg.beginPath(); gg.arc(cx, cy, rad, 0, TAU); }, [70, 124, 176], r, phase(p, 0, .5), { x: cx, y: cy }, rad * 1.4, 1.5);
    for (let i = 0; i < 4; i++) {
      const lx = cx + (r() - .5) * rad * 1.1, ly = cy + (r() - .5) * rad * 1.1;
      wash(g, gg => { gg.beginPath(); gg.ellipse(lx, ly, rad * (.2 + r() * .15), rad * (.12 + r() * .12), r() * 3, 0, TAU); }, [120, 150, 96], r, phase(p, .3 + i * .08, .6 + i * .08), { x: lx, y: ly }, rad * .5, 1.4);
    }
    ink(g, arc(cx, cy, rad * 1.55, rad * .42, Math.PI * .95, Math.PI * 2.05, 60), phase(p, .55, 1), 1.1, 'rgba(120,96,60,.7)');
    wash(g, gg => { gg.beginPath(); gg.arc(cx + rad * 1.5, cy + rad * .1, 6, 0, TAU); }, [240, 186, 96], r, phase(p, .8, 1), { x: cx + rad * 1.5, y: cy }, 14, 2.2);
  }
  if (kind === 'cup') {
    const cw = Math.min(w * .42, 120), top = cy - cw * .1;
    wash(g, gg => { gg.beginPath(); gg.ellipse(cx, top + cw * .78, cw * .85, cw * .16, 0, 0, TAU); }, [200, 190, 170], r, phase(p, 0, .4), { x: cx, y: top + cw * .78 }, cw, 1.2);
    wash(g, gg => { gg.beginPath(); gg.moveTo(cx - cw / 2, top); gg.quadraticCurveTo(cx - cw * .46, top + cw * .75, cx, top + cw * .72); gg.quadraticCurveTo(cx + cw * .46, top + cw * .75, cx + cw / 2, top); gg.closePath(); }, [96, 132, 170], r, phase(p, .1, .5), { x: cx, y: top + cw * .35 }, cw, 1.5);
    wash(g, gg => { gg.beginPath(); gg.ellipse(cx, top, cw / 2, cw * .1, 0, 0, TAU); }, [150, 100, 60], r, phase(p, .3, .6), { x: cx, y: top }, cw * .6, 1.4);
    ink(g, arc(cx + cw * .56, top + cw * .28, cw * .14, cw * .16, -Math.PI / 2, Math.PI / 2), phase(p, .4, .7), 1.5);
    for (let i = 0; i < 3; i++) {
      const sx = cx - cw * .18 + i * cw * .18;
      ink(g, Array.from({ length: 20 }, (_, j) => [sx + Math.sin(j / 3 + i) * 5, top - 8 - j * 3.2] as [number, number]), phase(p, .55 + i * .1, .9 + i * .03), 1.1, 'rgba(120,110,100,.6)');
    }
  }
  if (kind === 'sunrise') {
    // Cielo en una mancha ovalada (sin bordes rectos); el sol entero queda detrás de colinas opacas.
    const sky = { x: cx, y: y + h * .52, rx: w * .46, ry: h * .5 };
    const horizon = y + h * .64, sunR = h * .2;
    wash(g, gg => { gg.beginPath(); gg.ellipse(sky.x, sky.y, sky.rx, sky.ry, 0, 0, TAU); }, [246, 206, 170], r, phase(p, 0, .4), { x: cx, y: horizon }, reach, 1.2);
    wash(g, gg => { gg.beginPath(); gg.arc(cx, horizon + sunR * .15, sunR, 0, TAU); }, [244, 160, 86], r, phase(p, .2, .55), { x: cx, y: horizon }, sunR * 2, 1.9);
    for (let i = 0; i < 5; i++) {
      const a = Math.PI * (1.1 + i * .2);
      ink(g, [[cx + Math.cos(a) * sunR * 1.3, horizon + Math.sin(a) * sunR * 1.3], [cx + Math.cos(a) * sunR * 1.75, horizon + Math.sin(a) * sunR * 1.75]], phase(p, .7 + i * .05, .85 + i * .03), 1.3, 'rgba(180,110,50,.7)');
    }
    const hills = phase(p, .4, .75);
    if (hills > 0) {
      g.save();
      g.beginPath(); g.ellipse(sky.x, sky.y, sky.rx, sky.ry, 0, 0, TAU); g.clip();
      g.globalAlpha = Math.min(1, hills * 1.6);
      const far = (gg: CanvasRenderingContext2D) => { gg.beginPath(); gg.moveTo(x, horizon + h * .06); gg.bezierCurveTo(x + w * .25, horizon - h * .1, x + w * .45, horizon + h * .02, x + w * .62, horizon - h * .02); gg.bezierCurveTo(x + w * .8, horizon - h * .06, x + w * .9, horizon + h * .01, x + w, horizon); gg.lineTo(x + w, y + h); gg.lineTo(x, y + h); gg.closePath(); };
      const near = (gg: CanvasRenderingContext2D) => { gg.beginPath(); gg.moveTo(x, horizon + h * .14); gg.bezierCurveTo(x + w * .3, horizon + h * .04, x + w * .6, horizon + h * .2, x + w, horizon + h * .1); gg.lineTo(x + w, y + h); gg.lineTo(x, y + h); gg.closePath(); };
      far(g); g.fillStyle = '#c4c9b3'; g.fill();
      near(g); g.fillStyle = '#a8b6a0'; g.fill();
      g.globalAlpha = 1;
      wash(g, far, [150, 166, 136], r, hills, { x: cx, y: horizon }, reach, 1.2);
      wash(g, near, [112, 136, 116], r, phase(p, .5, .85), { x: cx, y: horizon + h * .15 }, reach, 1.5);
      g.restore();
    }
  }
  g.restore();
}
