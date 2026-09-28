// Geometría del pliegue de una página, en coordenadas locales: origen en el lomo (arriba),
// x hacia la derecha (página derecha en [0, W]), y hacia abajo. La esquina C se arrastra hasta P;
// la línea de pliegue es la mediatriz de C–P y la parte doblada se refleja sobre ella.

export type V = { x: number; y: number };

const dist = (a: V, b: V) => Math.hypot(a.x - b.x, a.y - b.y);

/** La hoja está unida al lomo: la esquina no puede alejarse más que el ancho o la diagonal. */
export function clampCorner(P: V, C: V, W: number, H: number): V {
  let p = { ...P };
  const near = { x: 0, y: C.y }, far = { x: 0, y: H - C.y };
  const d1 = dist(p, near);
  if (d1 > W) p = { x: near.x + (p.x - near.x) * W / d1, y: near.y + (p.y - near.y) * W / d1 };
  const D = Math.hypot(W, H), d2 = dist(p, far);
  if (d2 > D) p = { x: far.x + (p.x - far.x) * D / d2, y: far.y + (p.y - far.y) * D / d2 };
  return p;
}

/** Sutherland–Hodgman contra un semiplano: conserva los puntos con (X − M)·n > 0 (o < 0). */
function clipHalf(poly: V[], M: V, n: V, positive: boolean): V[] {
  const f = (p: V) => ((p.x - M.x) * n.x + (p.y - M.y) * n.y) * (positive ? 1 : -1);
  const out: V[] = [];
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i], b = poly[(i + 1) % poly.length];
    const fa = f(a), fb = f(b);
    if (fa >= 0) out.push(a);
    if ((fa >= 0) !== (fb >= 0)) {
      const t = fa / (fa - fb);
      out.push({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });
    }
  }
  return out;
}

export type Turn = {
  /** Parte de la página actual que sigue en su sitio. */
  keep: V[];
  /** Zona que deja ver la página siguiente. */
  fold: V[];
  /** La solapa doblada (reverso de la hoja), ya reflejada. */
  flap: V[];
  /** Transformación afín que lleva la página izquierda siguiente (x ∈ [−W, 0]) al reverso de la solapa. */
  matrix: [number, number, number, number, number, number];
  M: V; n: V;
};

export function computeTurn(W: number, H: number, C: V, P: V): Turn | null {
  const dx = P.x - C.x, dy = P.y - C.y, len = Math.hypot(dx, dy);
  if (len < .5) return null;
  const n = { x: dx / len, y: dy / len };
  const M = { x: (C.x + P.x) / 2, y: (C.y + P.y) / 2 };
  const rect: V[] = [{ x: 0, y: 0 }, { x: W, y: 0 }, { x: W, y: H }, { x: 0, y: H }];
  const keep = clipHalf(rect, M, n, true);
  const fold = clipHalf(rect, M, n, false);
  const k = 2 * (M.x * n.x + M.y * n.y);
  const reflect = (p: V): V => { const d = (p.x - M.x) * n.x + (p.y - M.y) * n.y; return { x: p.x - 2 * d * n.x, y: p.y - 2 * d * n.y }; };
  const flap = fold.map(reflect);
  // Reflexión sobre el pliegue ∘ espejo en el lomo (x → −x): el reverso queda bien orientado.
  const a = -(1 - 2 * n.x * n.x), b = 2 * n.x * n.y, c = -2 * n.x * n.y, d = 1 - 2 * n.y * n.y;
  return { keep, fold, flap, matrix: [a, b, c, d, k * n.x, k * n.y], M, n };
}

export function tracePath(g: CanvasRenderingContext2D, poly: V[]) {
  g.beginPath();
  poly.forEach((p, i) => (i ? g.lineTo(p.x, p.y) : g.moveTo(p.x, p.y)));
  g.closePath();
}
