'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useSound } from '../descanso/sound';
import { T, createBubbles, createStars, drawOpening, measureBubbles, narrative, ramp, type Category } from './draw';
import { Lab } from './lab';

gsap.registerPlugin(useGSAP, ScrollTrigger);

export type Pausa = Category | 'ninguna';
const choices: [Pausa, string][] = [
  ['trabajo', 'El trabajo'], ['telefono', 'El teléfono'], ['responsabilidades', 'Mis responsabilidades'],
  ['preocupaciones', 'Mis preocupaciones'], ['ninguna', 'Prefiero no responder'],
];
const phrases: Record<Pausa, [string, string]> = {
  trabajo: ['El trabajo seguirá ahí mañana.', 'Tú también necesitas un tiempo que no se mida en tareas.'],
  telefono: ['Los mensajes pueden esperar.', 'Tú también necesitas un tiempo sin notificaciones.'],
  responsabilidades: ['Cuidar de otros es valioso.', 'Tú también necesitas un tiempo para que te cuiden.'],
  preocupaciones: ['Algunas preocupaciones no se resuelven esta noche.', 'Tú también necesitas un tiempo para soltar.'],
  ninguna: ['Hay cosas que no se resuelven en un día.', 'Tú también necesitas un tiempo para detenerte.'],
};

// [inicio, fin] de cada texto, en pantallas desplazadas.
// El último fotograma (s = 7.6) queda limpio: es idéntico al primero de P05.
const copyRanges: [number, number][] = [[-1, .55], [.8, 1.9], [2, 3.2], [4.9, 6.1], [6.2, 7.3]];
const fade = (s: number, a: number, b: number, f = .3) => ramp(s, a, a + f) * (1 - ramp(s, b - f, b));

export function Opening({ pausa, onPausa, onUnlock }: { pausa: Pausa | null; onPausa: (value: Pausa | null) => void; onUnlock?: () => void }) {
  const section = useRef<HTMLElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const station = useRef<HTMLDivElement>(null);
  const sound = useSound();
  const control = useRef({ choice: null as Pausa | null, unlocked: false, dirty: true, hush: 0, hushTarget: 0, pulse: null as { index: number; at: number } | null });
  const [step, setStep] = useState<'choose' | 'lab'>('choose');
  const [unlocked, setUnlocked] = useState(false);
  const [stationVisible, setStationVisible] = useState(false);
  const [toasts, setToasts] = useState<{ title: string; sub: string; key: number; slot: number }[]>([]);
  const bubbles = useRef(createBubbles());

  useGSAP(() => {
    const g = canvas.current!.getContext('2d');
    if (!g) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const stars = createStars(260);
    const state = control.current;
    const copies = Array.from(stage.current!.querySelectorAll<HTMLElement>('.opening-copy'));
    let width = 1, height = 1, target = 0, s = 0, prev = 0, visible = true, shown = false;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = stage.current!.clientWidth; height = stage.current!.clientHeight;
      canvas.current!.width = width * dpr; canvas.current!.height = height * dpr;
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      measureBubbles(g, bubbles.current);
      state.dirty = true;
    };
    const observer = new ResizeObserver(resize);
    observer.observe(stage.current!);
    resize();

    const trigger = ScrollTrigger.create({
      trigger: section.current, start: 'top top', end: 'bottom bottom',
      onUpdate: self => { target = (self.scroll() - self.start) / Math.max(height, 1); },
      onRefresh: self => { target = Math.max(0, self.scroll() - self.start) / Math.max(height, 1); state.dirty = true; },
    });
    s = prev = target;

    const io = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; state.dirty = true; });
    io.observe(stage.current!);

    const tick = (now: number, delta: number) => {
      if (document.hidden || !visible) return;
      const follow = reduce ? 1 : 1 - Math.pow(.88, Math.min(delta, 60) / 16.7);
      s += (target - s) * follow;
      if (Math.abs(target - s) < 1e-4) s = target;

      const chosenCategory = state.choice && state.choice !== 'ninguna' ? state.choice : null;
      let settling = false;
      for (const b of bubbles.current) {
        const goal = b.category === chosenCategory ? 1 : 0;
        const next = b.highlight + (goal - b.highlight) * (reduce ? 1 : .12);
        b.highlight = Math.abs(goal - next) < .005 ? goal : next;
        if (b.highlight !== goal) settling = true;
      }
      const hushNext = state.hush + (state.hushTarget - state.hush) * (reduce ? 1 : .08);
      state.hush = Math.abs(state.hushTarget - hushNext) < .005 ? state.hushTarget : hushNext;
      if (state.hush !== state.hushTarget) settling = true;
      const pulsing = !!state.pulse && now - state.pulse.at < 800;

      const { stress, night, calm } = narrative(s);
      const twinkling = night > 0 && !reduce;
      if (s === prev && !state.dirty && !settling && !twinkling && !pulsing) return;
      state.dirty = false;

      const events = drawOpening(g, { s, now, width, height, reduce, chosen: !!chosenCategory, hush: state.hush, pulse: state.pulse }, prev, bubbles.current, stars);
      const a = sound.get();
      if (a) {
        events.fired.slice(0, 5).forEach((i, n) => a.ping((bubbles.current[i].sx - .5) * 1.6, i, stress, n * .04));
        events.released.slice(0, 5).forEach((i, n) => a.chime((bubbles.current[i].sx - .5) * 1.6, i, n * .12));
        a.update(stress * (1 - .8 * state.hush), night, calm);
      }

      copies.forEach((el, i) => { el.style.opacity = fade(s, ...copyRanges[i]).toFixed(3); });
      const st = station.current!;
      const stationOpacity = fade(s, T.station, state.unlocked ? T.releaseFrom + .2 : 99);
      st.style.opacity = stationOpacity.toFixed(3);
      st.inert = stationOpacity < .4;
      if (shown !== stationOpacity >= .4) { shown = stationOpacity >= .4; setStationVisible(shown); }
      stage.current!.dataset.night = night > .5 ? 'true' : 'false';
      prev = s;
    };
    gsap.ticker.add(tick);

    return () => { gsap.ticker.remove(tick); trigger.kill(); observer.disconnect(); io.disconnect(); };
  }, { scope: section });

  useEffect(() => {
    control.current.unlocked = unlocked;
    control.current.dirty = true;
    if (!unlocked) return;
    onUnlock?.();
    ScrollTrigger.refresh();
    const top = section.current!.getBoundingClientRect().top + window.scrollY;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top: top + (T.releaseFrom + .35) * stage.current!.clientHeight, behavior: reduce ? 'auto' : 'smooth' });
  }, [unlocked, onUnlock]);

  function choose(next: Pausa) {
    const value = pausa === next ? null : next;
    onPausa(value);
    control.current.choice = value;
    control.current.dirty = true;
    if (value && value !== 'ninguna') {
      bubbles.current.filter(b => b.category === value).forEach((b, n) => sound.get()?.chime((b.sx - .5) * 1.6, n, n * .09, .025));
    }
  }

  const onMode = useCallback((mode: 'none' | 'quiet' | 'busy') => {
    control.current.hushTarget = mode === 'quiet' ? 1 : 0;
    control.current.dirty = true;
    // Al terminar, salir o reiniciar la ronda, las interrupciones se detienen por completo.
    if (mode !== 'busy') setToasts([]);
  }, []);

  // Una demanda de la escena interrumpe: se agita, suena y aparece como aviso ficticio.
  const { get } = sound;
  const onDistract = useCallback(() => {
    const list = bubbles.current;
    const index = Math.floor(Math.random() * list.length);
    const b = list[index];
    control.current.pulse = { index, at: performance.now() };
    const slot = Math.floor(Math.random() * 4);
    get()?.notify(slot % 2 ? .6 : -.6);
    const key = performance.now();
    setToasts(list => [...list.filter(t => t.slot !== slot).slice(-1), { title: b.title, sub: b.sub, key, slot }]);
    window.setTimeout(() => setToasts(list => list.filter(t => t.key !== key)), 2600);
  }, [get]);

  function release() {
    control.current.hushTarget = 0;
    setToasts([]);
    if (!unlocked) { setUnlocked(true); return; }
    const top = section.current!.getBoundingClientRect().top + window.scrollY;
    window.scrollTo({ top: top + (T.releaseFrom + .35) * stage.current!.clientHeight, behavior: 'smooth' });
  }

  const [lead, rest] = phrases[pausa ?? 'ninguna'];

  return <section ref={section} className="opening" style={{ height: `${(unlocked ? T.unlockedScreens : T.lockedScreens) * 100}svh` }} aria-label="¿Por qué necesito descansar? Apertura">
    <div ref={stage} className="opening-stage">
      <canvas ref={canvas} aria-hidden="true" />

      <div className="opening-copy"><p className="eyebrow">OSOMI · MIRA MÁS DE CERCA</p><h1>¿Por qué necesito descansar?</h1><p>Explora a tu ritmo. Desplázate para comenzar.</p></div>
      <div className="opening-copy"><h2>A veces el día termina.</h2></div>
      <div className="opening-copy"><h2>Las demandas, no.</h2></div>
      <div className="opening-copy"><h2>Soltar no es olvidar.</h2><p>Es dejar cada cosa en su lugar, por un momento.</p></div>
      <div className="opening-copy"><h2>{lead}</h2><p>{rest}</p></div>

      {toasts.map(t => <div key={t.key} className="opening-toast" data-slot={t.slot} aria-hidden="true"><b>{t.title}</b>{t.sub && <span>{t.sub}</span>}</div>)}

      <div ref={station} className="opening-station" data-step={step} role="group" aria-label={step === 'choose' ? '¿Qué te cuesta dejar en pausa?' : 'Pequeño laboratorio'}>
        {step === 'choose' ? <>
          <h2>¿Qué te cuesta dejar en pausa?</h2>
          <div className="opening-choices">{choices.map(([value, label]) =>
            <button key={value} aria-pressed={pausa === value} onClick={() => choose(value)}>{label}</button>)}
          </div>
          <button className="opening-continue" onClick={() => setStep('lab')}>Continuar</button>
        </> : unlocked
          ? <><h2>Las dejaste en pausa.</h2><button className="opening-continue" onClick={release}>Seguir bajando ↓</button></>
          : <Lab active={stationVisible} onMode={onMode} onDistract={onDistract} onRelease={release} />}
      </div>
    </div>
  </section>;
}
