'use client';

import { useEffect, useRef, useState } from 'react';
import { useSound } from '../descanso/sound';

// P03–P04 · Pequeño laboratorio. Demostración educativa, no prueba clínica:
// sin cronómetro, sin rapidez, sin diagnóstico. Registra errores y correcciones.

type Shape = 'triángulo' | 'cuadrado' | 'círculo' | 'rombo' | 'estrella' | 'cruz' | 'luna' | 'hexágono';
const SHAPES: Shape[] = ['triángulo', 'cuadrado', 'círculo', 'rombo', 'estrella', 'cruz', 'luna', 'hexágono'];
const PATHS: Record<Shape, React.ReactNode> = {
  'triángulo': <polygon points="20,5 36,34 4,34" />,
  'cuadrado': <rect x="7" y="7" width="26" height="26" rx="2" />,
  'círculo': <circle cx="20" cy="20" r="15" />,
  'rombo': <polygon points="20,3 37,20 20,37 3,20" />,
  'estrella': <polygon points="20,3 24.9,14.6 37.3,15.6 27.9,23.8 30.7,36 20,29.5 9.3,36 12.1,23.8 2.7,15.6 15.1,14.6" />,
  'cruz': <path d="M15 4h10v11h11v10H25v11H15V25H4V15h11z" />,
  'luna': <path d="M26 4a16 16 0 1 0 10 26A13 13 0 0 1 26 4z" />,
  'hexágono': <polygon points="20,3 35,11.5 35,28.5 20,37 5,28.5 5,11.5" />,
};

function Symbol({ shape, size = 40 }: { shape: Shape; size?: number }) {
  return <svg viewBox="0 0 40 40" width={size} height={size} aria-hidden="true" className="lab-symbol">{PATHS[shape]}</svg>;
}

type Condition = 'quiet' | 'busy' | 'intense';
type Trial = { sequence: Shape[]; palette: Shape[] };
type Score = { errors: number; corrections: number; done: boolean };

function shuffle<T>(items: T[]) {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}
// Cinco símbolos por secuencia (misma dificultad en las tres rondas) entre ocho opciones.
const LENGTH = 5;
function makeTrial(): Trial {
  const picked = shuffle(SHAPES);
  return { sequence: picked.slice(0, LENGTH), palette: shuffle(picked) };
}
// Tres rondas de una secuencia, de menos a más interrupciones.
const ROUNDS: Condition[] = ['quiet', 'busy', 'intense'];
const ROUND_NAME: Record<Condition, string> = { quiet: 'tranquila', busy: 'con avisos', intense: 'con avisos y sacudidas' };
const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;
const emptyScore = (): Score => ({ errors: 0, corrections: 0, done: false });

type Phase =
  | { name: 'intro' }
  | { name: 'example'; step: number }
  | { name: 'brief' | 'memorize' | 'recall' | 'feedback'; round: number }
  | { name: 'results'; complete: boolean };

export function Lab({ active, onMode, onDistract, onRelease }: {
  active: boolean;
  onMode: (mode: 'none' | 'quiet' | 'busy') => void;
  /** `intense`: la tercera ronda, en la que además tiembla el panel. */
  onDistract: (intense: boolean) => void;
  onRelease: () => void;
}) {
  const [phase, setPhase] = useState<Phase>({ name: 'intro' });
  const [trial, setTrial] = useState<Trial>(makeTrial);
  const [placed, setPlaced] = useState<Shape[]>([]);
  const [scores, setScores] = useState<Record<Condition, Score>>({ quiet: emptyScore(), busy: emptyScore(), intense: emptyScore() });
  const [perception, setPerception] = useState<string | null>(null);
  const [exampleInterrupted, setExampleInterrupted] = useState(false);
  const heading = useRef<HTMLHeadingElement>(null);
  const correctionsThisTrial = useRef(0);
  const sound = useSound();

  const round = 'round' in phase ? phase.round : null;
  const condition: Condition | null = round === null ? null : ROUNDS[round];
  const running = phase.name === 'memorize' || phase.name === 'recall' || phase.name === 'feedback' || phase.name === 'brief';

  useEffect(() => { onMode(running && condition ? (condition === 'quiet' ? 'quiet' : 'busy') : 'none'); }, [running, condition, onMode]);
  useEffect(() => { heading.current?.focus({ preventScroll: true }); }, [phase.name]);

  // Avisos ficticios en las rondas 2 y 3; se pausan si la pestaña o el panel no están visibles.
  const distracting = active && condition !== null && condition !== 'quiet' && (phase.name === 'memorize' || phase.name === 'recall');
  const intense = distracting && condition === 'intense';
  useEffect(() => {
    if (!distracting) return;
    let timer = 0;
    const schedule = () => {
      const wait = intense ? 750 + Math.random() * 650 : 1100 + Math.random() * 1000;
      timer = window.setTimeout(() => { if (!document.hidden) onDistract(intense); schedule(); }, wait);
    };
    timer = window.setTimeout(() => { if (!document.hidden) onDistract(intense); schedule(); }, 600);
    return () => window.clearTimeout(timer);
  }, [distracting, intense, onDistract]);

  function startTrial(nextRound: number) {
    setTrial(makeTrial());
    setPlaced([]);
    correctionsThisTrial.current = 0;
    setPhase({ name: 'memorize', round: nextRound });
  }

  function check() {
    if (phase.name !== 'recall') return;
    const errors = trial.sequence.filter((shape, i) => placed[i] !== shape).length;
    const c = ROUNDS[phase.round];
    setScores(s => ({ ...s, [c]: { errors, corrections: correctionsThisTrial.current, done: true } }));
    setPhase({ ...phase, name: 'feedback' });
  }

  function next() {
    if (phase.name !== 'feedback') return;
    if (phase.round + 1 < ROUNDS.length) return setPhase({ name: 'brief', round: phase.round + 1 });
    setPhase({ name: 'results', complete: true });
  }

  const eyebrow = <p className="eyebrow">PEQUEÑO LABORATORIO · DEMOSTRACIÓN EDUCATIVA, NO PRUEBA CLÍNICA</p>;
  const roundLabel = round === null ? '' : `Ronda ${round + 1} de ${ROUNDS.length} · ${ROUND_NAME[ROUNDS[round]]}`;
  const exit = <button className="lab-quiet" onClick={() => setPhase({ name: 'results', complete: false })}>Salir de la actividad</button>;

  if (phase.name === 'intro') return <div className="lab">
    {eyebrow}
    <h2 ref={heading} tabIndex={-1}>Una tarea, tres condiciones.</h2>
    <p>Memoriza cinco símbolos y reconstruye su orden. Lo harás tres veces: en calma, con avisos que interrumpen y con más interrupciones todavía. No hay reloj ni prisa.</p>
    <div className="lab-actions">
      <button className="lab-primary" onClick={() => setPhase({ name: 'brief', round: 0 })}>Realizar la actividad</button>
      <button onClick={() => setPhase({ name: 'example', step: 0 })}>Ver un ejemplo paso a paso</button>
      <button className="lab-quiet" onClick={onRelease}>Continuar sin la actividad</button>
    </div>
  </div>;
  if (phase.name === 'example') {
    const example: Shape[] = ['estrella', 'círculo', 'luna', 'cuadrado', 'rombo'];
    const steps = [
      <><h2 ref={heading} tabIndex={-1}>1 · La tarea</h2><p>Se muestra una secuencia de cinco símbolos. Hay que recordarla y luego reconstruir el orden.</p><div className="lab-row">{example.map((s, i) => <figure key={s} aria-label={s}><Symbol shape={s} /><figcaption>{i + 1}</figcaption></figure>)}</div></>,
      <><h2 ref={heading} tabIndex={-1}>2 · Llega una interrupción</h2><p>Mientras intentas recordar, aparece un aviso. Puedes mostrarlo cuando quieras.</p>{exampleInterrupted ? <div className="lab-toast-inline"><b>Jefe</b><span>¿tienes un minuto?</span></div> : <button onClick={() => setExampleInterrupted(true)}>Mostrar una interrupción</button>}</>,
      <><h2 ref={heading} tabIndex={-1}>3 · Volver a la tarea</h2><p>Después de la interrupción hay que recordar dos cosas: la secuencia y hasta dónde ibas.</p><div className="lab-row">{example.map((s, i) => <figure key={s} className={i < 2 ? '' : 'lab-empty'}>{i < 2 ? <Symbol shape={s} /> : <span>?</span>}<figcaption>{i + 1}</figcaption></figure>)}</div></>,
      <><h2 ref={heading} tabIndex={-1}>4 · Lo que se compara</h2><p>En la actividad se cuentan los símbolos fuera de lugar y las veces que se usa «Deshacer» en cada una de las tres rondas. No se mide rapidez. Un resultado así describe un momento de juego, no tu salud ni tu capacidad.</p></>,
    ];
    return <div className="lab">
      {eyebrow}
      {steps[phase.step]}
      <div className="lab-actions">
        {phase.step < steps.length - 1
          ? <button className="lab-primary" onClick={() => setPhase({ name: 'example', step: phase.step + 1 })}>Siguiente paso</button>
          : <button className="lab-primary" onClick={onRelease}>Dejarlas en pausa por un momento</button>}
        {phase.step === steps.length - 1 && <button onClick={() => setPhase({ name: 'brief', round: 0 })}>Probar la actividad</button>}
      </div>
    </div>;
  }

  if (phase.name === 'brief') {
    const c = ROUNDS[phase.round];
    const title = { quiet: 'Primero, una ronda tranquila.', busy: 'Ahora, con avisos.', intense: 'Por último, más interrupciones.' }[c];
    const text = {
      quiet: 'Las demandas quedarán en silencio mientras juegas.',
      busy: 'Aparecerán avisos como los de antes, con sonido de notificación. Son ficticios: no necesitas responderlos. No habrá destellos.',
      intense: 'Los avisos llegarán más seguido y el panel temblará con cada uno. Siguen siendo ficticios; puedes salir cuando quieras.',
    }[c];
    return <div className="lab">
      {eyebrow}
      <p className="lab-step">{roundLabel}</p>
      <h2 ref={heading} tabIndex={-1}>{title}</h2>
      <p>{text}</p>
      {c !== 'quiet' && !sound.enabled && <p className="lab-note">La ronda funciona mejor con sonido. <button className="lab-inline" onClick={() => void sound.toggle()}>Activar sonido</button></p>}
      <div className="lab-actions"><button className="lab-primary" onClick={() => startTrial(phase.round)}>Empezar</button>{exit}</div>
    </div>;
  }

  if (phase.name === 'memorize') return <div className="lab">
    {eyebrow}
    <p className="lab-step">{roundLabel}</p>
    <h2 ref={heading} tabIndex={-1}>Memoriza este orden.</h2>
    {/* Solo las figuras: sin nombres, para que haya que recordarlas de verdad. */}
    <ol className="lab-row" aria-label="Secuencia para memorizar">{trial.sequence.map((s, i) => <li key={s} aria-label={`${i + 1}. ${s}`}><Symbol shape={s} size={52} /><span aria-hidden="true">{i + 1}</span></li>)}</ol>
    <div className="lab-actions"><button className="lab-primary" onClick={() => setPhase({ ...phase, name: 'recall' })}>Ya lo memoricé</button>{exit}</div>
  </div>;

  if (phase.name === 'recall' || phase.name === 'feedback') {
    const done = phase.name === 'feedback';
    const hits = trial.sequence.filter((s, i) => placed[i] === s).length;
    return <div className="lab">
      {eyebrow}
      <p className="lab-step">{roundLabel}</p>
      <h2 ref={heading} tabIndex={-1}>{done ? `${hits} de ${LENGTH} en su lugar.` : '¿En qué orden estaban?'}</h2>
      <ol className="lab-slots" aria-label="Tu respuesta">{trial.sequence.map((_, i) => {
        const shape = placed[i];
        const state = done ? (shape === trial.sequence[i] ? 'ok' : 'miss') : '';
        return <li key={i} data-state={state} aria-label={shape ? `${i + 1}. ${shape}` : `${i + 1}. vacío`}>{shape ? <Symbol shape={shape} size={40} /> : <span className="lab-slot-empty">{i + 1}</span>}</li>;
      })}</ol>
      {done
        ? <><div className="lab-answer"><span>Orden original:</span><ol className="lab-mini" aria-label={`Orden original: ${trial.sequence.join(', ')}`}>{trial.sequence.map(s => <li key={s}><Symbol shape={s} size={24} /></li>)}</ol></div><div className="lab-actions"><button className="lab-primary" onClick={next}>Continuar</button>{exit}</div></>
        : <>
          <div className="lab-palette" role="group" aria-label="Símbolos disponibles">{trial.palette.map(s =>
            <button key={s} disabled={placed.includes(s) || placed.length >= LENGTH} onClick={() => setPlaced(p => [...p, s])}><Symbol shape={s} size={34} /><span>{s}</span></button>)}
          </div>
          <p className="visually-hidden" aria-live="polite">{placed.length ? `Colocado: ${placed.at(-1)}, ${placed.length} de ${LENGTH}.` : ''}</p>
          <div className="lab-actions">
            <button className="lab-primary" disabled={placed.length < LENGTH} onClick={check}>Comprobar</button>
            <button disabled={!placed.length} onClick={() => { correctionsThisTrial.current++; setPlaced(p => p.slice(0, -1)); }}>Deshacer</button>
            {exit}
          </div>
        </>}
    </div>;
  }

  // P04 · Mirar el resultado: todos los casos tienen un texto coherente y honesto.
  const { quiet, busy, intense: hard } = scores;
  const complete = phase.name === 'results' && phase.complete && quiet.done && busy.done && hard.done;
  const worst = Math.max(busy.errors, hard.errors), best = Math.min(busy.errors, hard.errors);
  let summary: string;
  if (!complete) summary = 'La actividad quedó incompleta, así que no mostramos un resultado. Está bien: lo importante es lo que viene después.';
  else if (worst > quiet.errors) summary = `Con interrupciones te costó más: en calma dejaste ${plural(quiet.errors, 'símbolo', 'símbolos')} fuera de lugar; con avisos, ${busy.errors}; con más interrupciones, ${hard.errors}.`;
  else if (best < quiet.errors) summary = `Esta vez te fue mejor con interrupciones: ${quiet.errors} fuera de lugar en calma, ${busy.errors} con avisos y ${hard.errors} con más interrupciones. Es un resultado posible y válido.`;
  else summary = `Tu resultado fue parecido en las tres rondas: ${plural(quiet.errors, 'símbolo', 'símbolos')} fuera de lugar en cada una.`;
  const perceptions = ['Me costó más concentrarme con los avisos', 'No noté diferencia', 'Me concentré mejor con los avisos', 'Prefiero no responder'];

  return <div className="lab">
    <p className="eyebrow">LO QUE OBSERVASTE</p>
    <h2 ref={heading} tabIndex={-1}>¿Qué notaste?</h2>
    <p className="lab-summary">{summary}</p>
    {complete && <p className="lab-note">Usaste «Deshacer» {plural(quiet.corrections, 'vez', 'veces')} en calma, {plural(busy.corrections, 'vez', 'veces')} con avisos y {plural(hard.corrections, 'vez', 'veces')} con más interrupciones.</p>}
    <div className="lab-choices" role="group" aria-label="Tu percepción">{perceptions.map(p =>
      <button key={p} aria-pressed={perception === p} onClick={() => setPerception(perception === p ? null : p)}>{p}</button>)}
    </div>
    <p className="lab-note">Una prueba breve no describe cómo funciona tu atención. La práctica, el azar, el orden de las rondas y el dispositivo influyen. Lo que sí puedes observar es cómo se sintió intentar concentrarte mientras las demandas llamaban.</p>
    <div className="lab-actions"><button className="lab-primary" onClick={onRelease}>Dejarlas en pausa por un momento</button></div>
  </div>;
}
