'use client';

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useSound } from '../descanso/sound';
import { PASSAGES, SOURCES, type SourceKey } from '../cierre/content';
import { drawArt, type ArtKind } from './art';
import { clampCorner, computeTurn, tracePath, type V } from './curl';
import { coverCanvas, edgeCanvas, endpaperCanvas, paperCanvas, type Side } from './paper';
import { rasterizeText } from './raster';
import './book.css';

// Libro del tema en canvas 2D con proyección 3D propia (sin Three.js).
// La tapa gira sobre su bisagra; las hojas se pasan arrastrando la esquina. Quieta, cada página es
// HTML real (seleccionable y accesible); mientras gira, su texto se pinta en el canvas.

const PW = 420, PH = 600, BOARD = 8;
// `ghost-N`: reverso de la página N en móvil, con su tinta tenue y en espejo, como papel a contraluz.
type Surface = number | 'endpaper' | 'back' | `ghost-${number}` | null;
type Layout = { w: number; h: number; k: number; spread: boolean; spine: number; top: number; W: number; H: number; dpr: number };
type TurnState = {
  pages: { l0: Surface; r0: Surface; r1: Surface; l1: Surface };
  C: V; P: V; atC: number; atC2: number;
  drag: { offset: V; moved: boolean; lastX: number; lastT: number; vx: number; sounded: boolean } | null;
  anim: { t0: number; dur: number; from: V; to: V; lift: number } | null;
};

const PAGES: { id: string; art?: ArtKind }[] = [
  { id: 'titulo', art: 'moon' }, { id: 'indice' }, { id: 'resumen' }, { id: 'descubriste', art: 'cards' },
  { id: 'pasajes1', art: 'branch' }, { id: 'pasajes2' }, { id: 'fuentes1', art: 'globe' }, { id: 'fuentes2' },
  { id: 'reflexion', art: 'cup' }, { id: 'notas' }, { id: 'colofon', art: 'sunrise' },
];
const INDEX: [string, number][] = [['Resumen', 2], ['Lo que descubriste', 3], ['Pasajes bíblicos', 4], ['Fuentes', 6], ['Para reflexionar', 8], ['Tus notas', 9]];

const ease = (t: number) => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
const clamp = (v: number, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export function Book3D({ open, onClose, onFlat, biblical, takeaways, note, setNote }: {
  open: boolean; onClose: () => void; onFlat: () => void; biblical: boolean;
  takeaways: { text: string; source: SourceKey | null }[]; note: string; setNote: (value: string) => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const pageEls = useRef<(HTMLElement | null)[]>([]);
  const sound = useSound();
  const [mode, setMode] = useState<'closed' | 'opening' | 'open'>('closed');
  const [spread, setSpread] = useState(0);
  const [turning, setTurning] = useState(false);
  const [single, setSingle] = useState(false);
  const S = useRef({
    mode: 'closed' as 'closed' | 'opening' | 'open', openT: 0, openStart: 0, k: 0,
    turn: null as TurnState | null, layout: null as Layout | null, reduce: false,
    art: new Map<number, number>(), artBoxes: new Map<number, { x: number; y: number; w: number; h: number }>(),
    cache: new Map<string, HTMLCanvasElement>(), raf: 0, hinted: false,
  });

  const count = () => S.current.layout?.spread ? 6 : PAGES.length;
  const leftOf = (k: number): Surface => S.current.layout?.spread ? (k === 0 ? 'endpaper' : 2 * k - 1) : null;
  const rightOf = (k: number): Surface => S.current.layout?.spread ? 2 * k : k;
  const spreadOfPage = (i: number) => S.current.layout?.spread ? Math.floor((i + 1) / 2) : i;

  // ---------- Texturas en caché ----------
  const texture = useCallback((key: string, make: () => HTMLCanvasElement) => {
    const cache = S.current.cache;
    if (!cache.has(key)) cache.set(key, make());
    return cache.get(key)!;
  }, []);
  const sideOf = (i: number): Side => !S.current.layout?.spread ? 'single' : i % 2 ? 'left' : 'right';
  const base = useCallback((s: Surface) => {
    const L = S.current.layout!, sc = L.k * L.dpr;
    if (s === 'endpaper') return texture(`end:${sc}`, () => endpaperCanvas(PW, PH, sc, 'left'));
    if (s === 'back') return texture(`back:${sc}`, () => paperCanvas(PW, PH, sc, 'single', true));
    return texture(`paper:${sideOf(s as number)}:${sc}`, () => paperCanvas(PW, PH, sc, sideOf(s as number)));
  }, [texture]);
  const measureArt = useCallback((i: number) => {
    const el = pageEls.current[i], L = S.current.layout!;
    const holder = el?.querySelector<HTMLElement>('[data-art]');
    if (!el || !holder) return;
    const a = el.getBoundingClientRect(), b = holder.getBoundingClientRect();
    S.current.artBoxes.set(i, { x: (b.left - a.left) / L.k, y: (b.top - a.top) / L.k, w: b.width / L.k, h: b.height / L.k });
  }, []);
  /** Hoja completa (papel + ilustración + texto) para cuando gira. */
  const sheet = useCallback((i: number) => {
    const L = S.current.layout!;
    const c = document.createElement('canvas');
    c.width = Math.round(PW * L.k * L.dpr); c.height = Math.round(PH * L.k * L.dpr);
    const g = c.getContext('2d')!;
    g.drawImage(base(i), 0, 0);
    g.scale(L.k * L.dpr, L.k * L.dpr);
    const art = PAGES[i].art, box = S.current.artBoxes.get(i);
    if (art && box) drawArt(g, art, box, S.current.art.get(i) ?? 0);
    const el = pageEls.current[i];
    if (el) rasterizeText(el, g, L.k);
    return c;
  }, [base]);
  const full = useCallback((s: Surface) => {
    if (s === null) return null;
    if (typeof s === 'number') return sheet(s);
    if (s.startsWith('ghost-')) {
      const front = sheet(Number(s.slice(6)));
      const back = base('back'), c = document.createElement('canvas');
      c.width = back.width; c.height = back.height;
      const g = c.getContext('2d')!;
      g.drawImage(back, 0, 0);
      g.globalAlpha = .12; g.translate(c.width, 0); g.scale(-1, 1); g.drawImage(front, 0, 0);
      return c;
    }
    return base(s);
  }, [base, sheet]);

  // Hojas completas: se generan al empezar cada giro (el texto de las notas puede cambiar).
  const fullCache = useRef(new Map<Surface, HTMLCanvasElement | null>());
  const cachedFull = useCallback((s: Surface) => {
    if (!fullCache.current.has(s)) fullCache.current.set(s, full(s));
    return fullCache.current.get(s) ?? null;
  }, [full]);

  // ---------- Dibujo ----------
  const render = useCallback((now: number) => {
    const st = S.current, L = st.layout, cv = canvas.current;
    if (!L || !cv) return false;
    const g = cv.getContext('2d')!;
    const { W, H, top, dpr } = L, B = BOARD * L.k;
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.clearRect(0, 0, cv.width, cv.height);
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    let animating = false;

    if (st.mode !== 'open') {
      // ---- Portada en 3D: la tapa gira sobre la bisagra y el libro se endereza.
      if (st.mode === 'opening') {
        st.openT = st.reduce ? 1 : clamp((now - st.openStart) / 1500);
        animating = st.openT < 1;
      }
      const t = st.openT, e = ease(t), theta = Math.PI * ease(clamp((t - .12) / .88));
      const closedSpine = L.spread ? L.w / 2 - W / 2 : L.spine;
      const spine = lerp(closedSpine, L.spine, e);
      const yaw = lerp(.36, 0, e), pitch = lerp(.1, 0, e), shrink = lerp(.86, 1, e), focal = Math.max(W, H) * 2.4, T = 14 * L.k;
      const px = spine + W / 2, py = top + H / 2;
      const project = (x: number, y: number, z: number): V => {
        const X = x - W / 2, Y = y - H / 2;
        const x1 = X * Math.cos(yaw) + z * Math.sin(yaw), z1 = -X * Math.sin(yaw) + z * Math.cos(yaw);
        const y2 = Y * Math.cos(pitch) - z1 * Math.sin(pitch), z2 = Y * Math.sin(pitch) + z1 * Math.cos(pitch);
        const s = focal / (focal + z2) * shrink;
        return { x: px + x1 * s, y: py + y2 * s };
      };
      type P3 = [number, number, number];
      const add = (a: P3, b: P3, s: number): P3 => [a[0] + b[0] * s, a[1] + b[1] * s, a[2] + b[2] * s];
      const facing = (O: P3, U: P3, Vv: P3) => {
        const o = project(...O), u = project(...add(O, U, 1)), v = project(...add(O, Vv, 1));
        return (u.x - o.x) * (v.y - o.y) - (u.y - o.y) * (v.x - o.x) > 0;
      };
      const quad = (O: P3, U: P3, Vv: P3, fill: string) => {
        const pts = [O, add(O, U, 1), add(add(O, U, 1), Vv, 1), add(O, Vv, 1)].map(p => project(...p));
        tracePath(g, pts); g.fillStyle = fill; g.fill();
      };
      const plane = (img: HTMLCanvasElement, O: P3, U: P3, Vv: P3, flip = false, strips = 36) => {
        const iw = img.width, ih = img.height;
        for (let i = 0; i < strips; i++) {
          const s0 = i / strips * iw, s1 = (i + 1) / strips * iw;
          const u0 = flip ? 1 - s0 / iw : s0 / iw, u1 = flip ? 1 - s1 / iw : s1 / iw;
          const A = project(...add(O, U, u0)), Bp = project(...add(O, U, u1)), Cp = project(...add(add(O, U, u0), Vv, 1));
          const sw = s1 - s0;
          const a = (Bp.x - A.x) / sw, b = (Bp.y - A.y) / sw, c = (Cp.x - A.x) / ih, d = (Cp.y - A.y) / ih;
          g.setTransform(dpr * a, dpr * b, dpr * c, dpr * d, dpr * (A.x - a * s0), dpr * (A.y - b * s0));
          g.drawImage(img, s0, 0, Math.min(iw - s0, sw + 1.5), ih, s0, 0, Math.min(iw - s0, sw + 1.5), ih);
        }
        g.setTransform(dpr, 0, 0, dpr, 0, 0);
      };
      // Sombra sobre la mesa.
      g.save();
      g.shadowColor = 'rgba(60,40,20,.35)'; g.shadowBlur = 50 * L.k; g.shadowOffsetY = 22 * L.k;
      quad([0, -B, T], [W + B, 0, 0], [0, H + 2 * B, 0], '#1b2440');
      g.restore();
      // Canto de las hojas (visible con el libro inclinado).
      const edge = texture('edge', () => edgeCanvas(64, 256));
      if (facing([W, 0, 0], [0, 0, T], [0, H, 0])) plane(edge, [W, 0, 0], [0, 0, T], [0, H, 0]);
      if (facing([0, 0, 0], [W, 0, 0], [0, 0, T])) quad([0, 0, 0], [W, 0, 0], [0, 0, T], '#ece2cc');
      // Primera página bajo la tapa.
      const first = texture(`first:${L.k}:${L.dpr}`, () => full(rightOf(0))!);
      plane(first, [0, 0, 0], [W, 0, 0], [0, H, 0]);
      if (theta < Math.PI / 2) {
        const pts = ([[0, 0, 0], [W, 0, 0], [W, H, 0], [0, H, 0]] as P3[]).map(p => project(...p));
        tracePath(g, pts); g.fillStyle = `rgba(20,14,6,${.35 * Math.cos(theta)})`; g.fill();
      }
      // La tapa.
      const O: P3 = [0, -B, -1.5 * (1 - e)], U: P3 = [(W + B) * Math.cos(theta), 0, -(W + B) * Math.sin(theta)], Vv: P3 = [0, H + 2 * B, 0];
      if (facing(O, U, Vv)) plane(texture(`cover:${L.k}:${L.dpr}`, () => coverCanvas(PW + BOARD, PH + 2 * BOARD, L.k * L.dpr)), O, U, Vv);
      else plane(texture(`inside:${L.k}:${L.dpr}`, () => endpaperCanvas(PW + BOARD, PH + 2 * BOARD, L.k * L.dpr, 'left')), O, U, Vv, true);
      if (st.mode === 'opening' && st.openT >= 1) {
        st.mode = 'open'; setMode('open');
      }
      return animating;
    }

    // ---- Libro abierto.
    const spine = L.spine, turn = st.turn;
    const k = st.k;
    const l0 = turn ? turn.pages.l0 : leftOf(k), r0 = turn ? turn.pages.r0 : rightOf(k);
    // Tapas (cartón forrado) y sombra.
    g.save();
    g.shadowColor = 'rgba(60,40,20,.32)'; g.shadowBlur = 44 * L.k; g.shadowOffsetY = 20 * L.k;
    g.fillStyle = '#1b2440';
    g.beginPath(); g.roundRect(L.spread ? spine - W - B : spine, top - B, L.spread ? 2 * (W + B) : W + B, H + 2 * B, 4 * L.k); g.fill();
    g.restore();
    // Bloques de hojas a cada lado: más grueso donde quedan más páginas.
    const total = count(), leftStack = L.spread ? Math.min(5, k) : 0, rightStack = Math.min(5, Math.max(1, total - 1 - k));
    for (let i = rightStack; i > 0; i--) { g.fillStyle = i % 2 ? '#e7ddc6' : '#f3ebd9'; g.fillRect(spine + i * .9, top + i * .7, W, H); }
    for (let i = leftStack; i > 0; i--) { g.fillStyle = i % 2 ? '#e7ddc6' : '#f3ebd9'; g.fillRect(spine - W - i * .9, top + i * .7, W, H); }

    g.save(); g.translate(spine, top);
    const img = (s: Surface, kind: 'base' | 'full') => s === null ? null : kind === 'base' ? base(s) : cachedFull(s);
    if (!turn) {
      // Quietas: papel + acuarelas en el canvas; el texto es HTML encima.
      const drawPage = (s: Surface, x: number) => {
        const im = img(s, 'base');
        if (!im) return;
        g.drawImage(im, x, 0, W, H);
        if (typeof s === 'number' && PAGES[s].art) {
          const box = st.artBoxes.get(s);
          let p = st.art.get(s) ?? 0;
          if (p < 1) { p = st.reduce ? 1 : Math.min(1, p + 1 / 100); st.art.set(s, p); animating = true; }
          if (box) { g.save(); g.translate(x, 0); g.scale(L.k, L.k); drawArt(g, PAGES[s].art!, box, ease(p)); g.restore(); }
        }
      };
      if (L.spread) drawPage(l0, -W);
      drawPage(r0, 0);
      // Invitación a arrastrar: una esquina levemente levantada hasta el primer giro.
      if (!st.hinted && k < total - 1) {
        g.save();
        g.beginPath(); g.moveTo(W, H - 26 * L.k); g.lineTo(W - 26 * L.k, H); g.lineTo(W, H); g.closePath();
        g.fillStyle = '#d7ccb5'; g.fill();
        g.beginPath(); g.moveTo(W, H - 26 * L.k); g.lineTo(W - 26 * L.k, H); g.lineTo(W - 22 * L.k, H - 22 * L.k); g.closePath();
        const dog = g.createLinearGradient(W - 26 * L.k, H - 26 * L.k, W - 13 * L.k, H - 13 * L.k);
        dog.addColorStop(0, '#fbf6ea'); dog.addColorStop(1, '#e2d7c0');
        g.fillStyle = dog; g.shadowColor = 'rgba(0,0,0,.2)'; g.shadowBlur = 6; g.fill();
        g.restore();
      }
    } else {
      // Animación de la esquina.
      if (turn.anim) {
        const a = turn.anim, t = st.reduce ? 1 : clamp((now - a.t0) / a.dur), e = ease(t);
        const lift = Math.sin(Math.PI * t) * a.lift * (turn.C.y > 0 ? -1 : 1);
        turn.P = clampCorner({ x: lerp(a.from.x, a.to.x, e), y: lerp(a.from.y, a.to.y, e) + lift }, turn.C, W, H);
        if (t >= 1) {
          turn.P = a.to;
          const endK = Math.abs(a.to.x - turn.C.x) < 1 ? turn.atC : turn.atC2;
          st.turn = null; st.k = endK; st.hinted = true;
          setSpread(endK); setTurning(false);
          g.restore();
          return true;   // el siguiente fotograma dibuja la doble página quieta
        }
        animating = true;
      }
      const geo = computeTurn(W, H, turn.C, turn.P);
      const L0 = img(turn.pages.l0, 'full'), R0 = img(turn.pages.r0, 'full'), R1 = img(turn.pages.r1, 'full'), L1 = img(turn.pages.l1, 'full');
      if (L0 && L.spread) g.drawImage(L0, -W, 0, W, H);
      if (!geo) { if (R0) g.drawImage(R0, 0, 0, W, H); }
      else {
        if (R1) g.drawImage(R1, 0, 0, W, H);
        const { M, n } = geo, reach = 70 * L.k;
        // Sombra que la hoja levantada proyecta sobre la página siguiente.
        g.save(); tracePath(g, geo.fold); g.clip();
        const cast = g.createLinearGradient(M.x, M.y, M.x - n.x * reach, M.y - n.y * reach);
        cast.addColorStop(0, 'rgba(40,28,12,.32)'); cast.addColorStop(1, 'rgba(40,28,12,0)');
        g.fillStyle = cast; g.fillRect(-W, -H, 3 * W, 3 * H); g.restore();
        // Lo que queda de la página actual, con su curvatura junto al pliegue.
        if (geo.keep.length > 2 && R0) {
          g.save(); tracePath(g, geo.keep); g.clip(); g.drawImage(R0, 0, 0, W, H);
          const curve = g.createLinearGradient(M.x, M.y, M.x + n.x * reach * .6, M.y + n.y * reach * .6);
          curve.addColorStop(0, 'rgba(40,28,12,.18)'); curve.addColorStop(1, 'rgba(40,28,12,0)');
          g.fillStyle = curve; g.fillRect(-W, -H, 3 * W, 3 * H); g.restore();
        }
        // Reverso de la hoja: sombra suave y luego su contenido reflejado.
        if (geo.flap.length > 2) {
          g.save(); tracePath(g, geo.flap);
          g.shadowColor = 'rgba(40,28,12,.35)'; g.shadowBlur = 22 * L.k; g.fillStyle = '#f3ecdc'; g.fill(); g.restore();
          g.save(); tracePath(g, geo.flap); g.clip();
          if (L1) { g.save(); g.transform(...geo.matrix); g.drawImage(L1, -W, 0, W, H); g.restore(); }
          const shine = g.createLinearGradient(M.x, M.y, M.x + n.x * reach * 1.6, M.y + n.y * reach * 1.6);
          shine.addColorStop(0, 'rgba(255,255,255,.35)'); shine.addColorStop(.2, 'rgba(255,255,255,.08)'); shine.addColorStop(1, 'rgba(40,28,12,.12)');
          g.fillStyle = shine; g.fillRect(-W, -H, 3 * W, 3 * H); g.restore();
        }
      }
    }
    // Cinta marcapáginas dorada, del color de la ficha 7.
    if (L.spread) {
      const rx = 5 * L.k, ry0 = -B - 2, ry1 = H + 38 * L.k, rw = 9 * L.k;
      const ribbon = g.createLinearGradient(rx, 0, rx + rw, 0);
      ribbon.addColorStop(0, '#b98534'); ribbon.addColorStop(.5, '#f4c77a'); ribbon.addColorStop(1, '#a8772f');
      g.fillStyle = ribbon;
      g.beginPath(); g.moveTo(rx, ry0);
      g.bezierCurveTo(rx + 4 * L.k, H * .4, rx - 3 * L.k, H * .8, rx + 6 * L.k, ry1);
      g.lineTo(rx + 6 * L.k + rw / 2, ry1 - 6 * L.k); g.lineTo(rx + 6 * L.k + rw, ry1);
      g.bezierCurveTo(rx + rw, H * .8, rx + rw + 5 * L.k, H * .4, rx + rw, ry0);
      g.closePath(); g.shadowColor = 'rgba(0,0,0,.25)'; g.shadowBlur = 4; g.fill();
    }
    g.restore();
    return animating;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [base, cachedFull]);


  const loop = useCallback(() => {
    const st = S.current;
    cancelAnimationFrame(st.raf);
    const frame = (now: number) => { if (render(now)) st.raf = requestAnimationFrame(frame); };
    st.raf = requestAnimationFrame(frame);
  }, [render]);

  // ---------- Disposición ----------
  const relayout = useCallback(() => {
    const el = stage.current, cv = canvas.current, st = S.current;
    if (!el || !cv) return;
    const w = el.clientWidth, h = el.clientHeight, dpr = Math.min(window.devicePixelRatio || 1, 2);
    const spread = w >= 760;
    // Margen vertical para que la hoja, al levantarse, no se corte.
    const k = spread ? Math.min((h - 120) / (PH + 2 * BOARD), (w - 64) / (2 * PW + 2 * BOARD)) : Math.min((h - 90) / (PH + 2 * BOARD), (w - 24) / (PW + BOARD + 6));
    const W = PW * k, H = PH * k;
    const wasSpread = st.layout?.spread;
    st.layout = { w, h, k, spread, W, H, dpr, spine: spread ? w / 2 : (w - W) / 2, top: (h - H) / 2 };
    if (wasSpread !== undefined && wasSpread !== spread) {
      // Mantener la página al cambiar entre doble página y página única.
      const page = wasSpread ? Math.max(0, 2 * st.k - 1) : st.k;
      st.k = spread ? Math.floor((page + 1) / 2) : page;
      setSpread(st.k);
    }
    setSingle(!spread);
    cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr);
    st.cache.clear(); fullCache.current.clear();
    pageEls.current.forEach(p => { if (p) p.style.transform = `translate(-100000px,0) scale(${k})`; });
    PAGES.forEach((_, i) => measureArt(i));
    loop();
  }, [loop, measureArt]);

  useEffect(() => {
    const el = stage.current;
    if (!el) return;
    const ro = new ResizeObserver(relayout);
    ro.observe(el);
    const st = S.current;
    return () => { ro.disconnect(); cancelAnimationFrame(st.raf); };
  }, [relayout]);

  // Páginas HTML: visibles solo si están quietas en la doble página actual.
  useLayoutEffect(() => {
    const L = S.current.layout;
    if (!L) return;
    const visible = new Map<number, number>();
    if (mode === 'open' && !turning) {
      const l = leftOf(spread), r = rightOf(spread);
      if (typeof l === 'number') visible.set(l, L.spine - L.W);
      if (typeof r === 'number') visible.set(r, L.spine);
    }
    pageEls.current.forEach((el, i) => {
      if (!el) return;
      const x = visible.get(i);
      el.style.transform = x === undefined ? `translate(-100000px,0) scale(${L.k})` : `translate(${x}px,${L.top}px) scale(${L.k})`;
      el.style.visibility = x === undefined ? 'hidden' : 'visible';
      el.inert = x === undefined;
      el.setAttribute('aria-hidden', String(x === undefined));
    });
    loop();
  }, [spread, mode, turning, single, loop]);

  useEffect(() => {
    const d = dialog.current;
    if (!d) return;
    S.current.reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (open && !d.open) { d.showModal(); requestAnimationFrame(relayout); }
    if (!open && d.open) d.close();
  }, [open, relayout]);

  // ---------- Acciones ----------
  const openBook = () => {
    const st = S.current;
    if (st.mode !== 'closed') return;
    st.mode = 'opening'; st.openStart = performance.now(); setMode('opening');
    sound.get()?.bookOpen();
    loop();
  };

  const startTurn = (pages: TurnState['pages'], atC: number, atC2: number, from: 'C' | 'C2', cornerY: number): TurnState => {
    const L = S.current.layout!;
    fullCache.current.clear();
    const C = { x: L.W, y: cornerY }, C2 = { x: -L.W, y: cornerY };
    if (!L.spread && typeof pages.r0 === 'number') pages = { ...pages, l1: `ghost-${pages.r0}` };
    const turn: TurnState = { pages, C, P: from === 'C' ? C : C2, atC, atC2, drag: null, anim: null };
    S.current.turn = turn; setTurning(true);
    return turn;
  };
  const animateTo = (turn: TurnState, target: 'C' | 'C2') => {
    const L = S.current.layout!;
    const to = target === 'C' ? turn.C : { x: -L.W, y: turn.C.y };
    const span = Math.abs(to.x - turn.P.x) / (2 * L.W);
    turn.anim = { t0: performance.now(), dur: 380 + 620 * span, from: { ...turn.P }, to, lift: L.H * .1 * span };
    sound.get()?.pageTurn(0, .5 + span * .5);
    loop();
  };
  const go = (target: number) => {
    const st = S.current;
    if (st.mode !== 'open' || st.turn || target === st.k || target < 0 || target >= count()) return;
    const L = st.layout!;
    if (st.reduce) { st.k = target; setSpread(target); sound.get()?.pageTurn(0, .5); return; }
    if (target > st.k) {
      const turn = startTurn({ l0: leftOf(st.k), r0: rightOf(st.k), r1: rightOf(target), l1: L.spread ? leftOf(target) : 'back' }, st.k, target, 'C', L.H);
      animateTo(turn, 'C2');
    } else {
      const turn = startTurn({ l0: leftOf(target), r0: rightOf(target), r1: rightOf(st.k), l1: L.spread ? leftOf(st.k) : 'back' }, target, st.k, 'C2', L.H);
      animateTo(turn, 'C');
    }
  };

  const local = (e: React.PointerEvent) => {
    const r = stage.current!.getBoundingClientRect(), L = S.current.layout!;
    return { x: e.clientX - r.left - L.spine, y: e.clientY - r.top - L.top };
  };
  const onPointerDown = (e: React.PointerEvent) => {
    const st = S.current, L = st.layout;
    if (!L) return;
    if (st.mode === 'closed') { openBook(); return; }
    if (st.mode !== 'open' || st.turn || (e.target as HTMLElement).closest('a, button, textarea, input')) return;
    const p = local(e), W = L.W, H = L.H;
    if (p.y < -20 || p.y > H + 20) return;
    const cornerY = p.y < H / 2 ? 0 : H;
    let turn: TurnState | null = null, start: V;
    const forward = L.spread ? p.x > W * .78 && p.x < W + 30 : p.x > W * .78;
    const backward = L.spread ? p.x < -W * .78 && p.x > -W - 30 : p.x < W * .22;
    if (forward && st.k < count() - 1) {
      turn = startTurn({ l0: leftOf(st.k), r0: rightOf(st.k), r1: rightOf(st.k + 1), l1: L.spread ? leftOf(st.k + 1) : 'back' }, st.k, st.k + 1, 'C', cornerY);
      start = turn.C;
    } else if (backward && st.k > 0) {
      turn = startTurn({ l0: leftOf(st.k - 1), r0: rightOf(st.k - 1), r1: rightOf(st.k), l1: L.spread ? leftOf(st.k) : 'back' }, st.k - 1, st.k, 'C2', cornerY);
      start = { x: -W, y: cornerY };
    } else return;
    // La esquina sigue al puntero desde donde se tomó (en móvil, la hoja anterior entra desde la izquierda).
    turn.drag = { offset: { x: p.x - start.x, y: p.y - start.y }, moved: false, lastX: e.clientX, lastT: performance.now(), vx: 0, sounded: false };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    e.preventDefault();
    loop();
  };
  const onPointerMove = (e: React.PointerEvent) => {
    const st = S.current, turn = st.turn, L = st.layout;
    if (!turn?.drag || !L) return;
    const p = local(e);
    const d = turn.drag, now = performance.now();
    const next = clampCorner({ x: p.x - d.offset.x, y: p.y - d.offset.y }, turn.C, L.W, L.H);
    if (Math.hypot(next.x - turn.P.x, next.y - turn.P.y) > 1) d.moved = true;
    if (d.moved && !d.sounded) { d.sounded = true; sound.get()?.pageTurn(0, .7); }
    d.vx = (e.clientX - d.lastX) / Math.max(1, now - d.lastT); d.lastX = e.clientX; d.lastT = now;
    turn.P = next;
    loop();
  };
  const onPointerUp = () => {
    const st = S.current, turn = st.turn, L = st.layout;
    if (!turn?.drag || !L) return;
    const d = turn.drag;
    turn.drag = null;
    const startedAtC = turn.atC === st.k;
    let target: 'C' | 'C2';
    if (!d.moved) target = startedAtC ? 'C2' : 'C';
    else if (d.vx < -.45) target = 'C2';
    else if (d.vx > .45) target = 'C';
    else target = turn.P.x < 0 ? 'C2' : 'C';
    animateTo(turn, target);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!open || (e.target as HTMLElement).closest('textarea')) return;
      if (e.key === 'ArrowRight') { e.preventDefault(); if (S.current.mode === 'closed') openBook(); else go(S.current.k + 1); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); go(S.current.k - 1); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const total = single ? PAGES.length : 6;
  const shown = single ? [spread] : [2 * spread - 1, 2 * spread].filter(i => i >= 0);
  const label = shown.length === 2 ? `Páginas ${shown[0] + 1} y ${shown[1] + 1} de ${PAGES.length}` : `Página ${shown[0] + 1} de ${PAGES.length}`;
  const setPage = (el: HTMLElement | null, i: number) => { pageEls.current[i] = el; };
  const folio = (i: number) => <p className="bk-folio">{i + 1}</p>;
  const sourceItem = (key: SourceKey) => <div className="bk-source" key={key}><a href={SOURCES[key].href} target="_blank" rel="noreferrer">{SOURCES[key].label}</a><p>{SOURCES[key].scope}</p></div>;

  return <dialog ref={dialog} className="book3d" aria-labelledby="book3d-title" onClose={onClose}>
    <header className="book3d-head">
      <h2 id="book3d-title">El libro del tema</h2>
      <button onClick={onFlat}>Vista plana</button>
      <button onClick={() => dialog.current?.close()}>Cerrar ×</button>
    </header>

    <div ref={stage} className="book3d-stage" onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerCancel={onPointerUp}>
      <canvas ref={canvas} aria-hidden="true" />
      <div className="book3d-pages">
        <section ref={el => setPage(el, 0)} className="bk-page bk-title-page">
          <p className="bk-eyebrow">Osomi · Mira más de cerca</p>
          <h3 className="bk-title">¿Por qué necesito descansar?</h3>
          <p className="bk-sub">Cuaderno de lectura</p>
          <div className="bk-art" data-art style={{ height: 230 }} />
          <p className="bk-small">Este cuaderno acompaña la experiencia. Léelo a tu ritmo; al final puedes tomar notas.</p>
          {folio(0)}
        </section>
        <section ref={el => setPage(el, 1)} className="bk-page">
          <p className="bk-eyebrow">Contenido</p>
          <h3>Índice</h3>
          <div className="bk-index">{INDEX.map(([title, page]) => <button key={title} onClick={() => go(spreadOfPage(page))}><span>{title}</span><span>{page + 1}</span></button>)}</div>
          <p className="bk-small">Toca un título para ir a esa página. También puedes arrastrar la esquina de la hoja o usar las flechas del teclado.</p>
          {folio(1)}
        </section>
        <section ref={el => setPage(el, 2)} className="bk-page">
          <p className="bk-eyebrow">El recorrido</p>
          <h3>Resumen</h3>
          <p>Empezaste con una pregunta cotidiana: <em>¿por qué necesito descansar?</em> Observaste cómo se acumulan las demandas y probaste una tarea con y sin interrupciones.</p>
          <p>Viste que dormir participa en procesos que sostienen la salud, el aprendizaje y la memoria, y que el cuerpo sigue ritmos cercanos a 24 horas.</p>
          <p>Luego miraste cómo medimos el tiempo: el día y el año se relacionan con movimientos de la Tierra; la semana es un ritmo de calendario con historia.</p>
          <p>{biblical ? 'También exploraste la perspectiva bíblica: un séptimo día apartado para el descanso, la adoración y el servicio.' : 'La perspectiva bíblica sigue disponible cuando quieras explorarla.'}</p>
          {folio(2)}
        </section>
        <section ref={el => setPage(el, 3)} className="bk-page">
          <p className="bk-eyebrow">Para llevar contigo</p>
          <h3>Lo que descubriste</h3>
          {takeaways.map(t => <p className="bk-item" key={t.text}><span className="bk-dash">—</span> {t.text}</p>)}
          <div className="bk-art" data-art style={{ height: 110 }} />
          {folio(3)}
        </section>
        <section ref={el => setPage(el, 4)} className="bk-page">
          <p className="bk-eyebrow">Perspectiva bíblica · Interpretación adventista</p>
          <h3>Pasajes</h3>
          {PASSAGES.slice(0, 2).map(([ref, text]) => <div className="bk-passage" key={ref}><p className="bk-ref">{ref}</p><p>{text}</p></div>)}
          <div className="bk-art" data-art style={{ height: 120 }} />
          {folio(4)}
        </section>
        <section ref={el => setPage(el, 5)} className="bk-page">
          <p className="bk-eyebrow">Perspectiva bíblica · Interpretación adventista</p>
          <h3>Pasajes</h3>
          {PASSAGES.slice(2).map(([ref, text]) => <div className="bk-passage" key={ref}><p className="bk-ref">{ref}</p><p>{text}</p></div>)}
          <p className="bk-small">Resúmenes editoriales, no citas literales. La traducción bíblica de referencia está pendiente de revisión.</p>
          {folio(5)}
        </section>
        <section ref={el => setPage(el, 6)} className="bk-page">
          <p className="bk-eyebrow">Fuentes · Ciencia</p>
          <h3>Fuentes</h3>
          {(['S1', 'S2', 'A1', 'A2'] as SourceKey[]).map(sourceItem)}
          <div className="bk-art" data-art style={{ height: 90 }} />
          {folio(6)}
        </section>
        <section ref={el => setPage(el, 7)} className="bk-page">
          <p className="bk-eyebrow">Fuentes · Historia y creencia</p>
          <h3>Fuentes</h3>
          {(['H1', 'B1'] as SourceKey[]).map(sourceItem)}
          <p className="bk-small">Cada fuente respalda solo lo que afirma. Una analogía visual no cuenta como evidencia, y una fuente científica no demuestra una creencia.</p>
          {folio(7)}
        </section>
        <section ref={el => setPage(el, 8)} className="bk-page">
          <p className="bk-eyebrow">Sin respuesta correcta</p>
          <h3>Para reflexionar</h3>
          <p className="bk-item"><span className="bk-dash">—</span> ¿Qué demanda te acompaña incluso cuando el día termina?</p>
          <p className="bk-item"><span className="bk-dash">—</span> ¿En qué momento de tu semana podrías dejar de producir, aunque sea un poco?</p>
          <p className="bk-item"><span className="bk-dash">—</span> ¿Con quién te gustaría compartir un tiempo de descanso?</p>
          {biblical && <p className="bk-item"><span className="bk-dash">—</span> ¿Qué te llama la atención de un descanso que incluye a los demás?</p>}
          <div className="bk-art" data-art style={{ height: 130 }} />
          {folio(8)}
        </section>
        <section ref={el => setPage(el, 9)} className="bk-page">
          <p className="bk-eyebrow">Solo para ti</p>
          <h3>Tus notas</h3>
          <p className="bk-small">Esta nota es temporal: se conserva mientras la pestaña esté abierta y se pierde al cerrarla. Guardarla entre visitas requerirá una cuenta.</p>
          <label className="visually-hidden" htmlFor="book3d-note">Tu nota</label>
          <textarea id="book3d-note" value={note} onChange={e => setNote(e.target.value)} maxLength={2000} placeholder="Escribe lo que quieras recordar…" />
          {folio(9)}
        </section>
        <section ref={el => setPage(el, 10)} className="bk-page bk-colophon">
          <div className="bk-art" data-art style={{ height: 200 }} />
          <h3>Cuando quieras, sigue explorando.</h3>
          <p className="bk-small">Osomi · Mira más de cerca. Primera experiencia: ¿Por qué necesito descansar? Prototipo, septiembre de 2026.</p>
          {folio(10)}
        </section>
      </div>
      {mode === 'closed' && <button className="book3d-open" onClick={openBook} autoFocus>Abrir el libro</button>}
    </div>

    <footer className="book3d-foot">
      <button onClick={() => go(S.current.k - 1)} disabled={mode !== 'open' || spread === 0}>← Anterior</button>
      <button onClick={() => go(spreadOfPage(1))} disabled={mode !== 'open'}>Índice</button>
      <span aria-live="polite">{mode === 'open' ? label : 'Libro cerrado'}</span>
      <button onClick={() => go(spreadOfPage(9))} disabled={mode !== 'open'}>Tus notas</button>
      <button onClick={() => go(S.current.k + 1)} disabled={mode !== 'open' || spread >= total - 1}>Siguiente →</button>
      <p className="book3d-hint">{mode === 'open' ? 'Arrastra la esquina de la hoja, tócala o usa las flechas del teclado.' : 'Toca la portada para abrir.'}</p>
    </footer>
  </dialog>;
}
