// Texturas del libro, generadas por código: papel, tela de la portada, guardas y canto de las hojas.

export function seeded(seed: number) {
  return () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
}

function canvas(w: number, h: number) {
  const c = document.createElement('canvas');
  c.width = Math.max(1, Math.round(w)); c.height = Math.max(1, Math.round(h));
  return c;
}

let grain: HTMLCanvasElement | null = null;
/** Grano de papel: motas y fibras cortas, en mosaico. */
function grainTile() {
  if (grain) return grain;
  const c = canvas(256, 256), g = c.getContext('2d')!, r = seeded(9);
  const img = g.createImageData(256, 256);
  for (let i = 0; i < 256 * 256; i++) {
    const v = r();
    img.data[i * 4] = 110; img.data[i * 4 + 1] = 90; img.data[i * 4 + 2] = 60;
    img.data[i * 4 + 3] = v < .55 ? 0 : (v - .55) * 36;
  }
  g.putImageData(img, 0, 0);
  g.strokeStyle = 'rgba(120,95,60,.07)'; g.lineWidth = .6;
  for (let i = 0; i < 70; i++) {
    const x = r() * 256, y = r() * 256, a = r() * Math.PI * 2, l = 4 + r() * 10;
    g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + Math.cos(a) * l / 2 + r() * 3, y + Math.sin(a) * l / 2 + r() * 3, x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke();
  }
  grain = c;
  return c;
}

export type Side = 'left' | 'right' | 'single';

/** Hoja de papel crema con grano, bordes y sombra del lomo según el lado. */
export function paperCanvas(w: number, h: number, scale: number, side: Side, back = false) {
  const c = canvas(w * scale, h * scale), g = c.getContext('2d')!;
  g.scale(scale, scale);
  g.fillStyle = back ? '#f3ecdc' : '#f8f2e4'; g.fillRect(0, 0, w, h);
  const pattern = g.createPattern(grainTile(), 'repeat')!;
  pattern.setTransform(new DOMMatrix().scale(.5));
  g.fillStyle = pattern; g.globalAlpha = .9; g.fillRect(0, 0, w, h); g.globalAlpha = 1;
  const vignette = g.createRadialGradient(w / 2, h / 2, Math.min(w, h) * .3, w / 2, h / 2, Math.max(w, h) * .75);
  vignette.addColorStop(0, 'rgba(120,90,50,0)'); vignette.addColorStop(1, 'rgba(120,90,50,.08)');
  g.fillStyle = vignette; g.fillRect(0, 0, w, h);
  // Sombra del lomo: la hoja se curva hacia la costura.
  if (side !== 'single') {
    const atSpine = side === 'right' ? 0 : w;
    const gutter = g.createLinearGradient(atSpine, 0, atSpine + (side === 'right' ? 46 : -46), 0);
    gutter.addColorStop(0, 'rgba(70,50,25,.24)'); gutter.addColorStop(.25, 'rgba(70,50,25,.09)'); gutter.addColorStop(1, 'rgba(70,50,25,0)');
    g.fillStyle = gutter; g.fillRect(0, 0, w, h);
  }
  g.strokeStyle = 'rgba(120,95,60,.18)'; g.lineWidth = 1; g.strokeRect(.5, .5, w - 1, h - 1);
  return c;
}

function foil(g: CanvasRenderingContext2D, x0: number, x1: number) {
  const gold = g.createLinearGradient(x0, 0, x1, 0);
  gold.addColorStop(0, '#9c7432'); gold.addColorStop(.35, '#f1d28b'); gold.addColorStop(.55, '#c89b4c'); gold.addColorStop(.8, '#f5dc9c'); gold.addColorStop(1, '#a57b36');
  return gold;
}

/** Tapa de tela azul noche con título en oro, las siete fichas y el nombre Osomi. */
export function coverCanvas(w: number, h: number, scale: number) {
  const c = canvas(w * scale, h * scale), g = c.getContext('2d')!, r = seeded(4);
  g.scale(scale, scale);
  const base = g.createLinearGradient(0, 0, w, h);
  base.addColorStop(0, '#26335a'); base.addColorStop(1, '#161f3b');
  g.fillStyle = base; g.fillRect(0, 0, w, h);
  // Trama de la tela.
  g.globalAlpha = .06;
  for (let y = 0; y < h; y += 2) { g.fillStyle = y % 4 ? '#000' : '#fff'; g.fillRect(0, y, w, 1); }
  for (let x = 0; x < w; x += 2) { g.fillStyle = x % 4 ? '#000' : '#fff'; g.fillRect(x, 0, 1, h); }
  g.globalAlpha = 1;
  for (let i = 0; i < 900; i++) { g.fillStyle = `rgba(255,255,255,${r() * .05})`; g.fillRect(r() * w, r() * h, 1, 1); }
  // Bisagra junto al lomo.
  const hinge = g.createLinearGradient(0, 0, 26, 0);
  hinge.addColorStop(0, 'rgba(0,0,0,.45)'); hinge.addColorStop(.6, 'rgba(0,0,0,.1)'); hinge.addColorStop(.62, 'rgba(255,255,255,.08)'); hinge.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = hinge; g.fillRect(0, 0, 26, h);
  // Marco en bajorrelieve.
  const m = 26;
  g.strokeStyle = 'rgba(0,0,0,.35)'; g.lineWidth = 1.2; g.strokeRect(m + 14, m, w - 2 * m - 14, h - 2 * m);
  g.strokeStyle = 'rgba(240,210,140,.35)'; g.strokeRect(m + 15, m + 1, w - 2 * m - 14, h - 2 * m);
  // Título en oro.
  g.textAlign = 'center'; g.textBaseline = 'alphabetic';
  const cx = w / 2 + 7;
  g.fillStyle = foil(g, cx - 150, cx + 150);
  g.shadowColor = 'rgba(0,0,0,.45)'; g.shadowOffsetY = 1; g.shadowBlur = 1;
  g.font = `400 ${Math.round(w * .085)}px Georgia, serif`;
  g.fillText('¿Por qué necesito', cx, h * .33);
  g.fillText('descansar?', cx, h * .33 + w * .105);
  g.font = `600 ${Math.round(w * .026)}px 'Avenir Next', 'Segoe UI', sans-serif`;
  g.letterSpacing = '4px';
  g.fillText('CUADERNO DE LECTURA', cx, h * .49);
  // Siete fichas: seis en contorno, la séptima llena.
  const y = h * .64, gap = w * .075;
  for (let i = 0; i < 7; i++) {
    const x = cx + (i - 3) * gap;
    g.beginPath(); g.roundRect(x - 9, y - 12, 18, 24, 3);
    if (i === 6) { g.fillStyle = foil(g, x - 10, x + 10); g.fill(); }
    else { g.strokeStyle = 'rgba(240,210,140,.8)'; g.lineWidth = 1.3; g.stroke(); }
  }
  g.fillStyle = foil(g, cx - 60, cx + 60);
  g.font = `600 ${Math.round(w * .03)}px 'Avenir Next', 'Segoe UI', sans-serif`;
  g.letterSpacing = '8px';
  g.fillText('OSOMI', cx, h * .87);
  g.letterSpacing = '0px'; g.shadowColor = 'transparent';
  return c;
}

/** Guardas: papel azul noche con pequeñas estrellas doradas. */
export function endpaperCanvas(w: number, h: number, scale: number, side: Side = 'left') {
  const c = canvas(w * scale, h * scale), g = c.getContext('2d')!, r = seeded(12);
  g.scale(scale, scale);
  g.fillStyle = '#1c2544'; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 180; i++) {
    const x = r() * w, y = r() * h, s = .6 + r() * 1.4;
    g.fillStyle = `rgba(241,210,139,${.25 + r() * .5})`;
    g.beginPath(); g.arc(x, y, s, 0, Math.PI * 2); g.fill();
  }
  for (let i = 0; i < 14; i++) {
    const x = 30 + r() * (w - 60), y = 30 + r() * (h - 60);
    g.strokeStyle = 'rgba(241,210,139,.35)'; g.lineWidth = 1;
    g.beginPath(); g.moveTo(x - 5, y); g.lineTo(x + 5, y); g.moveTo(x, y - 5); g.lineTo(x, y + 5); g.stroke();
  }
  const atSpine = side === 'left' ? w : 0;
  const gutter = g.createLinearGradient(atSpine, 0, atSpine + (side === 'left' ? -40 : 40), 0);
  gutter.addColorStop(0, 'rgba(0,0,0,.4)'); gutter.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = gutter; g.fillRect(0, 0, w, h);
  return c;
}

/** Canto del bloque de hojas visto de lado. */
export function edgeCanvas(w: number, h: number) {
  const c = canvas(w, h), g = c.getContext('2d')!;
  g.fillStyle = '#efe6d2'; g.fillRect(0, 0, w, h);
  for (let x = 0; x < w; x += 2) { g.fillStyle = `rgba(150,120,80,${x % 4 ? .12 : .22})`; g.fillRect(x, 0, 1, h); }
  return c;
}
