'use client';

import { useEffect, useRef, useState } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useSound } from '../descanso/sound';
import { createBubbles, createStars, ramp } from '../apertura/draw';
import type { Pausa } from '../apertura/opening';
import { handoff } from '../descanso/handoff';
import { R, band, bedLayout, bedOffset, clock, darkness, dialLayout, drawRhythms, hourAt, scrollAt } from './draw';

gsap.registerPlugin(useGSAP, ScrollTrigger);

export type Intencion = 'relaciones' | 'contemplacion' | 'servicio' | 'pausa' | 'ninguna';

const SLEEP_SOURCE = 'https://www.nhlbi.nih.gov/health/sleep/why-sleep-important';
const RHYTHM_SOURCE = 'https://www.nhlbi.nih.gov/health/sleep/sleep-wake-cycle';
const spots = {
  memoria: { label: 'Memoria', text: 'Dormir bien ayuda a recordar lo aprendido. También facilita prestar atención, tomar decisiones y ser creativo.' },
  aprendizaje: { label: 'Aprendizaje', text: 'Mientras duermes, el cerebro se prepara para el día siguiente y forma conexiones que ayudan a aprender.' },
  cuerpo: { label: 'Cuerpo', text: 'Durante el sueño, el organismo realiza procesos que contribuyen a la salud física; por ejemplo, participa en la reparación del corazón y de los vasos sanguíneos.' },
};
type Spot = keyof typeof spots;

const intentions: [Intencion, string][] = [
  ['relaciones', 'Tiempo para mis relaciones'], ['contemplacion', 'Contemplar sin prisa'], ['servicio', 'Servir a otros'],
  ['pausa', 'Pausar mis tareas'], ['ninguna', 'Prefiero no elegir'],
];
const echoes: Record<Intencion, string> = {
  relaciones: 'Tiempo para las personas que quieres.',
  contemplacion: 'Tiempo para mirar con calma.',
  servicio: 'Tiempo para servir sin prisa.',
  pausa: 'Tiempo en que las tareas esperan.',
  ninguna: 'Un tiempo con otro sentido.',
};

const fade = (s: number, a: number, b: number, f = .3) => ramp(s, a, a + f) * (1 - ramp(s, b - f, b));
const copyRanges: [number, number][] = [[1.2, 2.8], [3.7, 4.8], [7.5, 8.7]];

export function Rhythms({ intencion, onIntencion, onUnlock, pausa }: { intencion: Intencion | null; onIntencion: (value: Intencion | null) => void; onUnlock?: () => void; pausa: Pausa | null }) {
  const section = useRef<HTMLElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const spotLayer = useRef<HTMLDivElement>(null);
  const clockPanel = useRef<HTMLDivElement>(null);
  const station = useRef<HTMLDivElement>(null);
  const slider = useRef<HTMLInputElement>(null);
  const readout = useRef<HTMLSpanElement>(null);
  const bandTitle = useRef<HTMLElement>(null);
  const bandText = useRef<HTMLSpanElement>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const opener = useRef<HTMLButtonElement | null>(null);
  const control = useRef({ dirty: true, unlocked: false });
  const sound = useSound();
  const [open, setOpen] = useState<Spot>('memoria');
  const [unlocked, setUnlocked] = useState(false);

  useGSAP(() => {
    const g = canvas.current!.getContext('2d');
    if (!g) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const stars = createStars(260);
    // Las mismas estrellas-demanda con que termina la apertura.
    const bubbles = createBubbles().map(b => ({ ...b, highlight: pausa && b.category === pausa ? 1 : 0 }));
    const earth = new Image();
    earth.src = '/textures/earth-day.jpg';
    const state = control.current;
    earth.onload = () => { state.dirty = true; };
    const sleeper = new Image();
    sleeper.src = '/assets/persona-durmiendo.webp';
    sleeper.onload = () => { state.dirty = true; };
    const copies = Array.from(stage.current!.querySelectorAll<HTMLElement>('.rhythm-copy'));
    const spotButtons = Array.from(spotLayer.current!.querySelectorAll<HTMLElement>('[data-spot]'));
    let width = 1, height = 1, s = 0, prev = -1, lastBand = '', first = true;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = stage.current!.clientWidth; height = stage.current!.clientHeight;
      canvas.current!.width = width * dpr; canvas.current!.height = height * dpr;
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      state.dirty = true;
    };
    const observer = new ResizeObserver(resize);
    observer.observe(stage.current!);
    resize();

    const show = (el: HTMLElement, opacity: number) => { el.style.opacity = opacity.toFixed(3); el.inert = opacity < .4; };

    const tick = (now: number, delta: number) => {
      if (document.hidden) return;
      // Posición en pantallas desde que la escena cubre el viewport; negativa mientras llega.
      const raw = -section.current!.getBoundingClientRect().top / Math.max(height, 1);
      // La escena se superpone al último fotograma de la apertura, que es idéntico a su primer fotograma.
      stage.current!.style.visibility = raw >= 0 ? 'visible' : 'hidden';
      if (raw < -1.2 || raw > R.unlockedScreens) return;
      const target = Math.max(0, raw);
      const follow = reduce || first ? 1 : 1 - Math.pow(.88, Math.min(delta, 60) / 16.7);
      first = false;
      s += (target - s) * follow;
      if (Math.abs(target - s) < 1e-4) s = target;
      const hour = hourAt(s);
      const animated = !reduce && darkness(hour) > 0;
      if (s === prev && !state.dirty && !animated) return;
      state.dirty = false;
      const before = prev;
      prev = s;

      // Pasos mientras la persona se aleja caminando.
      if (!reduce && s > .12 && s < .98 && before >= 0 && Math.floor(s * 14 / Math.PI) !== Math.floor(before * 14 / Math.PI)) sound.get()?.footstep(-.3 - s * .5);
      drawRhythms(g, { s, now, width, height, reduce, stars, bubbles, earth, sleeper, target: handoff.earth });
      sound.get()?.update(0, 1, 1 - ramp(s, R.volume[0], R.volume[1]));

      copies.forEach((el, i) => { el.style.opacity = fade(s, ...copyRanges[i]).toFixed(3); });
      const layout = bedLayout(width, height, bedOffset(width, s));
      spotButtons.forEach(el => {
        const p = layout[el.dataset.spot as Spot];
        el.style.transform = `translate(${p.x}px, ${p.y}px)`;
      });
      show(spotLayer.current!, fade(s, 1.7, 3.3));
      show(clockPanel.current!, fade(s, 4.2, 6.6));
      show(station.current!, fade(s, R.station, state.unlocked ? R.volume[0] + .1 : 99));
      stage.current!.dataset.light = darkness(hour) < .5 ? 'true' : 'false';
      // El control refleja la posición del scroll; moverlo desplaza la página (ver onSlide).
      const scrolled = hourAt(target);
      if (slider.current && document.activeElement !== slider.current) slider.current.value = String(Math.round(scrolled * 4) / 4);
      readout.current!.textContent = clock(hour);
      slider.current?.setAttribute('aria-valuetext', clock(hour));
      const [title, text] = band(hour);
      if (title !== lastBand) { lastBand = title; bandTitle.current!.textContent = title; bandText.current!.textContent = text; }
      const dial = dialLayout(width, height);
      clockPanel.current!.style.setProperty('--dial-bottom', `${dial.y + dial.r + 34}px`);
    };
    gsap.ticker.add(tick);
    return () => { gsap.ticker.remove(tick); observer.disconnect(); };
  }, { scope: section, dependencies: [pausa], revertOnUpdate: true });

  const [nudge, setNudge] = useState(0);
  useEffect(() => {
    control.current.unlocked = unlocked;
    control.current.dirty = true;
    if (!unlocked) return;
    onUnlock?.();
    ScrollTrigger.refresh();
    const top = section.current!.getBoundingClientRect().top + window.scrollY;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top: top + (R.volume[0] + .2) * stage.current!.clientHeight, behavior: reduce ? 'auto' : 'smooth' });
  }, [unlocked, nudge, onUnlock]);
  const goOn = () => { setUnlocked(true); setNudge(n => n + 1); };

  function openSpot(key: Spot, button: HTMLButtonElement) {
    opener.current = button;
    setOpen(key);
    dialog.current?.showModal();
    sound.get()?.chime(-.4, key.length, 0, .03);
  }
  function choose(value: Intencion) {
    const next = intencion === value ? null : value;
    onIntencion(next);
    if (next) sound.get()?.chime(0, next.length, 0, .03);
  }
  // Mover el control desplaza la página hasta esa hora; el scroll, a su vez, mueve el control.
  function onSlide(event: React.FormEvent<HTMLInputElement>) {
    const top = section.current!.getBoundingClientRect().top + window.scrollY;
    window.scrollTo({ top: top + scrollAt(Number(event.currentTarget.value)) * stage.current!.clientHeight, behavior: 'instant' });
  }

  return <section ref={section} className="rhythms" style={{ height: `${(unlocked ? R.unlockedScreens : R.lockedScreens) * 100}svh` }} data-handoff="opening" aria-label="El sueño y los ritmos diarios">
    <div ref={stage} className="rhythms-stage" data-light="false">
      <canvas ref={canvas} aria-hidden="true" />
      <div className="rhythm-copy"><h2>Mientras duermes, tu organismo sigue trabajando.</h2><p>Dormir participa en procesos que sostienen tu salud, tu aprendizaje y tu memoria.</p></div>
      <div className="rhythm-copy"><h2>Tu organismo tiene ritmos cercanos a 24 horas.</h2><p>La luz y la oscuridad ayudan a sincronizarlos.</p></div>
      <div className="rhythm-copy"><h2>{echoes[intencion ?? 'ninguna']}</h2><p>Para pensarlo, miremos cómo medimos el tiempo: un día, un año, una semana.</p></div>

      <div ref={spotLayer} className="rhythm-spots" role="group" aria-label="Qué ocurre mientras duermes · esquema conceptual">
        {(Object.keys(spots) as Spot[]).map(key => <button key={key} data-spot={key} onClick={event => openSpot(key, event.currentTarget)}><i aria-hidden="true" /><span>{spots[key].label}</span></button>)}
        <p className="rhythm-caption">Esquema conceptual: toca un punto para saber más. No representa mediciones de tu cuerpo.</p>
      </div>

      <div ref={clockPanel} className="rhythm-clock">
        <label htmlFor="rhythm-hour">Mueve el día <span ref={readout} className="visually-hidden">00:00</span></label>
        <input id="rhythm-hour" ref={slider} type="range" min={0} max={24} step={.25} defaultValue={0} onInput={onSlide} />
        <p aria-live="polite"><strong ref={bandTitle}>Noche</strong> · <span ref={bandText}>En la oscuridad, el organismo favorece el sueño.</span></p>
        <small>Esquema general, no una predicción personal: turnos, estaciones y otras situaciones cambian estos ritmos. <a href={RHYTHM_SOURCE} target="_blank" rel="noreferrer">NHLBI · Ciclo de sueño y vigilia ↗</a></small>
      </div>

      <div ref={station} className="rhythm-station" role="group" aria-label="Otra pregunta">
        <h2>Además de dormir, ¿qué significaría reservar tiempo para dejar de producir?</h2>
        {unlocked
          ? <button className="opening-continue" onClick={goOn}>Seguir bajando ↓</button>
          : <>
            <div className="opening-choices">{intentions.map(([value, label]) =>
              <button key={value} aria-pressed={intencion === value} onClick={() => choose(value)}>{label}</button>)}
            </div>
            <button className="opening-continue" onClick={goOn}>Continuar</button>
          </>}
      </div>

      <dialog ref={dialog} className="rhythm-dialog" aria-labelledby="rhythm-dialog-title" onClose={() => opener.current?.focus({ preventScroll: true })}>
        <button className="rhythm-dialog-close" onClick={() => dialog.current?.close()} autoFocus>Cerrar ×</button>
        <p className="eyebrow">MIENTRAS DUERMES · ESQUEMA CONCEPTUAL</p>
        <h2 id="rhythm-dialog-title">{spots[open].label}</h2>
        <p>{spots[open].text}</p>
        <div className="rhythm-evidence"><strong>Evidencia</strong><p>NHLBI, Institutos Nacionales de Salud de EE. UU.: «Why Is Sleep Important?». Síntesis institucional; no describe tu caso personal ni sustituye una consulta médica.</p><a href={SLEEP_SOURCE} target="_blank" rel="noreferrer">Ver la fuente ↗</a></div>
      </dialog>
    </div>
  </section>;
}
