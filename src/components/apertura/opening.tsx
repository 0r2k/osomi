'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { OpeningAudio } from './audio';
import { T, createBubbles, createStars, drawOpening, measureBubbles, narrative, ramp, type Category } from './draw';

gsap.registerPlugin(useGSAP, ScrollTrigger);

type Choice = Category | 'ninguna';
const choices: [Choice, string][] = [
  ['trabajo', 'El trabajo'], ['telefono', 'El teléfono'], ['responsabilidades', 'Mis responsabilidades'],
  ['preocupaciones', 'Mis preocupaciones'], ['ninguna', 'Prefiero no responder'],
];
const phrases: Record<Choice, [string, string]> = {
  trabajo: ['El trabajo seguirá ahí mañana.', 'Tú también necesitas un tiempo que no se mida en tareas.'],
  telefono: ['Los mensajes pueden esperar.', 'Tú también necesitas un tiempo sin notificaciones.'],
  responsabilidades: ['Cuidar de otros es valioso.', 'Tú también necesitas un tiempo para que te cuiden.'],
  preocupaciones: ['Algunas preocupaciones no se resuelven esta noche.', 'Tú también necesitas un tiempo para soltar.'],
  ninguna: ['Hay cosas que no se resuelven en un día.', 'Tú también necesitas un tiempo para detenerte.'],
};

// [inicio, fin] de cada texto, en pantallas desplazadas.
const copyRanges: [number, number][] = [[-1, .55], [.8, 1.9], [2, 3.2], [5, 6.3], [6.5, 7.7], [7.9, 99]];
const fade = (s: number, a: number, b: number, f = .3) => ramp(s, a, a + f) * (1 - ramp(s, b - f, b));

export function Opening() {
  const section = useRef<HTMLElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const station = useRef<HTMLDivElement>(null);
  const audio = useRef<OpeningAudio | null>(null);
  const control = useRef({ choice: null as Choice | null, unlocked: false, dirty: true });
  const [choice, setChoice] = useState<Choice | null>(null);
  const [unlocked, setUnlocked] = useState(false);
  const [sound, setSound] = useState(false);
  const bubbles = useRef(createBubbles());

  useGSAP(() => {
    const g = canvas.current!.getContext('2d');
    if (!g) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const stars = createStars(260);
    const state = control.current;
    const copies = Array.from(stage.current!.querySelectorAll<HTMLElement>('.opening-copy'));
    let width = 1, height = 1, target = 0, s = 0, prev = 0, visible = true;

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
    const onVisibility = () => { void audio.current?.hold(document.hidden); state.dirty = true; };
    document.addEventListener('visibilitychange', onVisibility);

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
      const { stress, night, calm } = narrative(s);
      const twinkling = night > 0 && !reduce;
      if (s === prev && !state.dirty && !settling && !twinkling) return;
      state.dirty = false;

      const events = drawOpening(g, { s, now, width, height, reduce, chosen: !!chosenCategory }, prev, bubbles.current, stars);
      const a = audio.current;
      if (a) {
        events.fired.slice(0, 5).forEach((i, n) => a.ping((bubbles.current[i].sx - .5) * 1.6, i, stress, n * .04));
        events.released.slice(0, 5).forEach((i, n) => a.chime((bubbles.current[i].sx - .5) * 1.6, i, n * .12));
        a.update(stress, night, calm);
      }

      copies.forEach((el, i) => { el.style.opacity = fade(s, ...copyRanges[i]).toFixed(3); });
      const st = station.current!;
      const stationOpacity = fade(s, T.station, state.unlocked ? T.releaseFrom + .2 : 99);
      st.style.opacity = stationOpacity.toFixed(3);
      st.inert = stationOpacity < .4;
      stage.current!.dataset.night = night > .5 ? 'true' : 'false';
      prev = s;
    };
    gsap.ticker.add(tick);

    return () => {
      gsap.ticker.remove(tick); trigger.kill(); observer.disconnect(); io.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, { scope: section });

  // El audio nunca sobrevive a la escena (incluida la navegación que oculta la página).
  useEffect(() => () => { audio.current?.close(); audio.current = null; }, []);

  useEffect(() => {
    control.current.unlocked = unlocked;
    control.current.dirty = true;
    if (!unlocked) return;
    ScrollTrigger.refresh();
    const top = section.current!.getBoundingClientRect().top + window.scrollY;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top: top + (T.releaseFrom + .35) * stage.current!.clientHeight, behavior: reduce ? 'auto' : 'smooth' });
  }, [unlocked]);

  async function toggleSound() {
    if (!audio.current) audio.current = new OpeningAudio();
    await audio.current.setEnabled(!sound);
    setSound(!sound);
    control.current.dirty = true;
  }

  function choose(next: Choice) {
    const value = choice === next ? null : next;
    setChoice(value);
    control.current.choice = value;
    control.current.dirty = true;
    if (value && value !== 'ninguna') {
      bubbles.current.filter(b => b.category === value).forEach((b, n) => audio.current?.chime((b.sx - .5) * 1.6, n, n * .09, .025));
    }
  }

  function goOn() {
    if (!unlocked) { setUnlocked(true); return; }
    const top = section.current!.getBoundingClientRect().top + window.scrollY;
    window.scrollTo({ top: top + (T.releaseFrom + .35) * stage.current!.clientHeight, behavior: 'smooth' });
  }

  const [lead, rest] = phrases[choice ?? 'ninguna'];

  return <section ref={section} className="opening" style={{ height: `${(unlocked ? T.unlockedScreens : T.lockedScreens) * 100}svh` }} aria-label="¿Por qué necesito descansar? Apertura">
    <div ref={stage} className="opening-stage">
      <canvas ref={canvas} aria-hidden="true" />
      <button className="opening-sound" onClick={toggleSound} aria-pressed={sound}>{sound ? 'Silenciar' : 'Activar sonido'}</button>

      <div className="opening-copy"><p className="eyebrow">OSOMI · MIRA MÁS DE CERCA</p><h1>¿Por qué necesito descansar?</h1><p>Explora a tu ritmo. Desplázate para comenzar.</p></div>
      <div className="opening-copy"><h2>A veces el día termina.</h2></div>
      <div className="opening-copy"><h2>Las demandas, no.</h2></div>
      <div className="opening-copy"><h2>Soltar no es olvidar.</h2><p>Es dejar cada cosa en su lugar, por un momento.</p></div>
      <div className="opening-copy"><h2>{lead}</h2><p>{rest}</p></div>
      <div className="opening-copy opening-next">
        <h2>¿Por qué necesitamos ese tiempo?</h2>
        <p>Miremos más de cerca: lo que pasa mientras duermes, los ritmos de tu cuerpo y los del planeta.</p>
        <Link href="/prototipo/p08">Continuar: día, año y semana →</Link>
        <small>Prototipo: P03–P07 (laboratorio, sueño y ritmos) están en construcción.</small>
      </div>

      <div ref={station} className="opening-station" role="group" aria-labelledby="opening-question">
        <h2 id="opening-question">¿Qué te cuesta dejar en pausa?</h2>
        <div className="opening-choices">{choices.map(([value, label]) =>
          <button key={value} aria-pressed={choice === value} onClick={() => choose(value)}>{label}</button>)}
        </div>
        <button className="opening-continue" onClick={goOn}>{unlocked ? 'Seguir bajando ↓' : 'Dejarlas en pausa por un momento'}</button>
      </div>
    </div>
  </section>;
}
