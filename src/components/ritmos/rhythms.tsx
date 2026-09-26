'use client';

import { useEffect, useRef, useState } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useSound } from '../descanso/sound';
import { createStars, ramp } from '../apertura/draw';
import { R, autoHour, darkness, dialLayout, drawRhythms, sleeperLayout } from './draw';

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

function band(hour: number): [string, string] {
  const h = ((hour % 24) + 24) % 24;
  if (h >= 5 && h < 8) return ['Amanecer', 'La luz de la mañana es una de las señales que ayudan a sincronizar tu reloj interno.'];
  if (h >= 8 && h < 17) return ['Día', 'Con la luz del día, el organismo tiende a mantenerse más alerta.'];
  if (h >= 17 && h < 20.5) return ['Atardecer', 'Al disminuir la luz, el cuerpo empieza a prepararse para el descanso.'];
  return ['Noche', 'En la oscuridad, el organismo favorece el sueño.'];
}
const clock = (hour: number) => { const h = ((hour % 24) + 24) % 24; return `${String(Math.floor(h)).padStart(2, '0')}:${String(Math.round((h % 1) * 60) % 60).padStart(2, '0')}`; };
const fade = (s: number, a: number, b: number, f = .3) => ramp(s, a, a + f) * (1 - ramp(s, b - f, b));
const copyRanges: [number, number][] = [[-.5, 1.4], [2.5, 3.6], [6.4, 7.9]];

export function Rhythms({ intencion, onIntencion, onUnlock }: { intencion: Intencion | null; onIntencion: (value: Intencion | null) => void; onUnlock?: () => void }) {
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
  const control = useRef({ touched: false, hour: 1, dirty: true, unlocked: false });
  const sound = useSound();
  const [open, setOpen] = useState<Spot>('memoria');
  const [unlocked, setUnlocked] = useState(false);

  useGSAP(() => {
    const g = canvas.current!.getContext('2d');
    if (!g) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const stars = createStars(260);
    const earth = new Image();
    earth.src = '/textures/earth-day.jpg';
    const state = control.current;
    earth.onload = () => { state.dirty = true; };
    const copies = Array.from(stage.current!.querySelectorAll<HTMLElement>('.rhythm-copy'));
    const spotButtons = Array.from(spotLayer.current!.querySelectorAll<HTMLElement>('[data-spot]'));
    let width = 1, height = 1, target = 0, s = 0, prev = -1, visible = true, lastBand = '';

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
    const trigger = ScrollTrigger.create({
      trigger: section.current, start: 'top top', end: 'bottom bottom',
      onUpdate: self => { target = (self.scroll() - self.start) / Math.max(height, 1); },
      onRefresh: self => { target = Math.max(0, self.scroll() - self.start) / Math.max(height, 1); state.dirty = true; },
    });
    const io = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; state.dirty = true; });
    io.observe(stage.current!);

    const show = (el: HTMLElement, opacity: number) => { el.style.opacity = opacity.toFixed(3); el.inert = opacity < .4; };

    const tick = (now: number, delta: number) => {
      if (document.hidden || !visible) return;
      const follow = reduce ? 1 : 1 - Math.pow(.88, Math.min(delta, 60) / 16.7);
      s += (target - s) * follow;
      if (Math.abs(target - s) < 1e-4) s = target;
      const hour = state.touched && s >= 3.4 ? state.hour : autoHour(s);
      const animated = !reduce && (s < 2.7 || darkness(hour) > 0);
      if (s === prev && !state.dirty && !animated) return;
      state.dirty = false;
      prev = s;

      drawRhythms(g, { s, now, width, height, reduce, hour, stars, earth });
      sound.get()?.update(0, 1, 1 - ramp(s, R.volumeFrom, R.volumeTo));

      copies.forEach((el, i) => { el.style.opacity = fade(s, ...copyRanges[i]).toFixed(3); });
      const layout = sleeperLayout(width, height);
      spotButtons.forEach(el => {
        const p = layout[el.dataset.spot as Spot];
        el.style.transform = `translate(${p.x}px, ${p.y}px)`;
      });
      show(spotLayer.current!, fade(s, .5, 2.2));
      show(clockPanel.current!, fade(s, 3.3, 5));
      show(station.current!, fade(s, R.station, state.unlocked ? R.volumeFrom + .1 : 99));
      stage.current!.dataset.light = darkness(hour) < .5 && s > 2.8 && s < 5.3 ? 'true' : 'false';
      if (slider.current && !state.touched) slider.current.value = String(Math.round(hour * 4) / 4);
      readout.current!.textContent = clock(hour);
      const [title, text] = band(hour);
      if (title !== lastBand) { lastBand = title; bandTitle.current!.textContent = title; bandText.current!.textContent = text; }
      const dial = dialLayout(width, height);
      clockPanel.current!.style.setProperty('--dial-bottom', `${dial.y + dial.r + 24}px`);
    };
    gsap.ticker.add(tick);
    return () => { gsap.ticker.remove(tick); trigger.kill(); observer.disconnect(); io.disconnect(); };
  }, { scope: section });

  const [nudge, setNudge] = useState(0);
  useEffect(() => {
    control.current.unlocked = unlocked;
    control.current.dirty = true;
    if (!unlocked) return;
    onUnlock?.();
    ScrollTrigger.refresh();
    const top = section.current!.getBoundingClientRect().top + window.scrollY;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top: top + (R.volumeFrom + .2) * stage.current!.clientHeight, behavior: reduce ? 'auto' : 'smooth' });
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
  function onSlide(event: React.FormEvent<HTMLInputElement>) {
    control.current.touched = true;
    control.current.hour = Number(event.currentTarget.value);
    control.current.dirty = true;
  }

  return <section ref={section} className="rhythms" style={{ height: `${(unlocked ? R.unlockedScreens : R.lockedScreens) * 100}svh` }} aria-label="El sueño y los ritmos diarios">
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
        <label htmlFor="rhythm-hour">Mueve el día: <span ref={readout}>01:00</span></label>
        <input id="rhythm-hour" ref={slider} type="range" min={0} max={24} step={.25} defaultValue={1} onInput={onSlide} />
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
