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

type Condition = 'quiet' | 'busy';
type Trial = { sequence: Shape[]; palette: Shape[] };
type Score = { errors: number; corrections: number; trials: number };

function shuffle<T>(items: T[]) {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}
// Cinco símbolos por secuencia (misma dificultad en ambas rondas) entre ocho opciones.
const LENGTH = 5;
function makeTrial(): Trial {
  const picked = shuffle(SHAPES);
  return { sequence: picked.slice(0, LENGTH), palette: shuffle(picked) };
}
const TRIALS_PER_ROUND = 2;
const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

type Phase =
  | { name: 'intro' }
  | { name: 'example'; step: number }
  | { name: 'brief'; round: number }                 // -1 = práctica
  | { name: 'memorize' | 'recall' | 'feedback'; round: number; trial: number }
  | { name: 'results'; complete: boolean };

export function Lab({ active, onMode, onDistract, onRelease }: {
  active: boolean;
  onMode: (mode: 'none' | Condition) => void;
  /** `intense`: segunda secuencia de la ronda con distracciones, más difícil. */
  onDistract: (intense: boolean) => void;
  onRelease: () => void;
}) {
  const [phase, setPhase] = useState<Phase>({ name: 'intro' });
  const [order] = useState<Condition[]>(() => Math.random() < .5 ? ['quiet', 'busy'] : ['busy', 'quiet']);
  const [trial, setTrial] = useState<Trial>(makeTrial);
  const [placed, setPlaced] = useState<Shape[]>([]);
  const [scores, setScores] = useState<Record<Condition, Score>>({ quiet: { errors: 0, corrections: 0, trials: 0 }, busy: { errors: 0, corrections: 0, trials: 0 } });
  const [perception, setPerception] = useState<string | null>(null);
  const [exampleInterrupted, setExampleInterrupted] = useState(false);
  const heading = useRef<HTMLHeadingElement>(null);
  const correctionsThisTrial = useRef(0);
  const sound = useSound();

  const round = 'round' in phase ? phase.round : null;
  const condition: Condition | null = round === null ? null : round < 0 ? 'quiet' : order[round];
  const running = phase.name === 'memorize' || phase.name === 'recall' || phase.name === 'feedback' || phase.name === 'brief';

  useEffect(() => { onMode(running && condition ? condition : 'none'); }, [running, condition, onMode]);
  useEffect(() => { heading.current?.focus({ preventScroll: true }); }, [phase.name]);

  // Avisos ficticios sólo en la ronda con distracciones; se pausan si la pestaña o el panel no están visibles.
  const distracting = active && condition === 'busy' && (phase.name === 'memorize' || phase.name === 'recall');
  const intense = distracting && 'trial' in phase && phase.trial === 1;
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

  function startTrial(nextRound: number, nextTrial: number) {
    setTrial(makeTrial());
    setPlaced([]);
    correctionsThisTrial.current = 0;
    setPhase({ name: 'memorize', round: nextRound, trial: nextTrial });
  }

  function check() {
    if (phase.name !== 'recall') return;
    const errors = trial.sequence.filter((shape, i) => placed[i] !== shape).length;
    if (phase.round >= 0) {
      const c = order[phase.round];
      setScores(s => ({ ...s, [c]: { errors: s[c].errors + errors, corrections: s[c].corrections + correctionsThisTrial.current, trials: s[c].trials + 1 } }));
    }
    setPhase({ ...phase, name: 'feedback' });
  }

  function next() {
    if (phase.name !== 'feedback') return;
    if (phase.round >= 0 && phase.trial + 1 < TRIALS_PER_ROUND) return startTrial(phase.round, phase.trial + 1);
    if (phase.round + 1 < order.length) return setPhase({ name: 'brief', round: phase.round + 1 });
    setPhase({ name: 'results', complete: true });
  }

  const eyebrow = <p className="eyebrow">PEQUEÑO LABORATORIO · DEMOSTRACIÓN EDUCATIVA, NO PRUEBA CLÍNICA</p>;
  const roundLabel = round === null ? '' : round < 0 ? 'Práctica · sin resultado' : `Ronda ${round + 1} de 2 · ${condition === 'busy' ? 'con distracciones' : 'tranquila'}`;
  const exit = <button className="lab-quiet" onClick={() => setPhase({ name: 'results', complete: false })}>Salir de la actividad</button>;

  if (phase.name === 'intro') return <div className="lab">
    {eyebrow}
    <h2 ref={heading} tabIndex={-1}>Una tarea, dos condiciones.</h2>
    <p>Memoriza cinco símbolos y reconstruye su orden. Lo harás dos veces: una ronda tranquila y otra con avisos que interrumpen. No hay reloj ni prisa.</p>
    <div className="lab-actions">
      <button className="lab-primary" onClick={() => setPhase({ name: 'brief', round: -1 })}>Realizar la actividad</button>
      <button onClick={() => setPhase({ name: 'example', step: 0 })}>Ver un ejemplo paso a paso</button>
      <button className="lab-quiet" onClick={onRelease}>Continuar sin la actividad</button>
    </div>
  </div>;

  if (phase.name === 'example') {
    const example: Shape[] = ['estrella', 'círculo', 'luna', 'cuadrado', 'rombo'];
    const steps = [
      <><h2 ref={heading} tabIndex={-1}>1 · La tarea</h2><p>Se muestra una secuencia de cinco símbolos. Hay que recordarla y luego reconstruir el orden.</p><div className="lab-row">{example.map(s => <figure key={s}><Symbol shape={s} /><figcaption>{s}</figcaption></figure>)}</div></>,
      <><h2 ref={heading} tabIndex={-1}>2 · Llega una interrupción</h2><p>Mientras intentas recordar, aparece un aviso. Puedes mostrarlo cuando quieras.</p>{exampleInterrupted ? <div className="lab-toast-inline"><b>Jefe</b><span>¿tienes un minuto?</span></div> : <button onClick={() => setExampleInterrupted(true)}>Mostrar una interrupción</button>}</>,
      <><h2 ref={heading} tabIndex={-1}>3 · Volver a la tarea</h2><p>Después de la interrupción hay que recordar dos cosas: la secuencia y hasta dónde ibas.</p><div className="lab-row">{example.map((s, i) => <figure key={s} className={i < 2 ? '' : 'lab-empty'}>{i < 2 ? <Symbol shape={s} /> : <span>?</span>}<figcaption>{i < 2 ? s : 'pendiente'}</figcaption></figure>)}</div></>,
      <><h2 ref={heading} tabIndex={-1}>4 · Lo que se compara</h2><p>En la actividad se cuentan los símbolos fuera de lugar y las veces que se usa «Deshacer» en cada ronda. No se mide rapidez. Un resultado así describe un momento de juego, no tu salud ni tu capacidad.</p></>,
    ];
    return <div className="lab">
      {eyebrow}
      {steps[phase.step]}
      <div className="lab-actions">
        {phase.step < steps.length - 1
          ? <button className="lab-primary" onClick={() => setPhase({ name: 'example', step: phase.step + 1 })}>Siguiente paso</button>
          : <button className="lab-primary" onClick={onRelease}>Dejarlas en pausa por un momento</button>}
        {phase.step === steps.length - 1 && <button onClick={() => setPhase({ name: 'brief', round: -1 })}>Probar la actividad</button>}
      </div>
    </div>;
  }

  if (phase.name === 'brief') {
    const busy = phase.round >= 0 && order[phase.round] === 'busy';
    return <div className="lab">
      {eyebrow}
      <p className="lab-step">{roundLabel}</p>
      <h2 ref={heading} tabIndex={-1}>{phase.round < 0 ? 'Primero, una práctica.' : busy ? 'Ahora, con distracciones.' : 'Ahora, una ronda tranquila.'}</h2>
      <p>{phase.round < 0 ? 'Sirve para conocer la tarea. No cuenta para el resultado.' : busy ? 'Aparecerán avisos como los de antes, con sonido de notificación. Son ficticios: no necesitas responderlos. No habrá destellos.' : 'Las demandas quedarán en silencio mientras juegas.'}</p>
      {busy && !sound.enabled && <p className="lab-note">La ronda funciona mejor con sonido. <button className="lab-inline" onClick={() => void sound.toggle()}>Activar sonido</button></p>}
      <div className="lab-actions"><button className="lab-primary" onClick={() => startTrial(phase.round, 0)}>Empezar</button>{exit}</div>
    </div>;
  }

  if (phase.name === 'memorize') return <div className="lab">
    {eyebrow}
    <p className="lab-step">{roundLabel}{phase.round >= 0 && ` · secuencia ${phase.trial + 1} de ${TRIALS_PER_ROUND}`}</p>
    <h2 ref={heading} tabIndex={-1}>Memoriza este orden.</h2>
    <ol className="lab-row" aria-label="Secuencia para memorizar">{trial.sequence.map((s, i) => <li key={s}><Symbol shape={s} size={48} /><span>{i + 1}. {s}</span></li>)}</ol>
    <div className="lab-actions"><button className="lab-primary" onClick={() => setPhase({ ...phase, name: 'recall' })}>Ya lo memoricé</button>{exit}</div>
  </div>;

  if (phase.name === 'recall' || phase.name === 'feedback') {
    const done = phase.name === 'feedback';
    const hits = trial.sequence.filter((s, i) => placed[i] === s).length;
    return <div className="lab">
      {eyebrow}
      <p className="lab-step">{roundLabel}{phase.round >= 0 && ` · secuencia ${phase.trial + 1} de ${TRIALS_PER_ROUND}`}</p>
      <h2 ref={heading} tabIndex={-1}>{done ? `${hits} de ${LENGTH} en su lugar.` : '¿En qué orden estaban?'}</h2>
      <ol className="lab-slots" aria-label="Tu respuesta">{trial.sequence.map((_, i) => {
        const shape = placed[i];
        const state = done ? (shape === trial.sequence[i] ? 'ok' : 'miss') : '';
        return <li key={i} data-state={state}>{shape ? <><Symbol shape={shape} size={36} /><span>{shape}</span></> : <span className="lab-slot-empty">{i + 1}</span>}</li>;
      })}</ol>
      {done
        ? <><p className="lab-answer">Orden original: {trial.sequence.join(' · ')}.</p><div className="lab-actions"><button className="lab-primary" onClick={next}>Continuar</button>{exit}</div></>
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
  const { quiet, busy } = scores;
  const complete = phase.name === 'results' && phase.complete && quiet.trials === TRIALS_PER_ROUND && busy.trials === TRIALS_PER_ROUND;
  let summary: string;
  if (!complete) summary = 'La actividad quedó incompleta, así que no mostramos un resultado. Está bien: lo importante es lo que viene después.';
  else if (busy.errors > quiet.errors) summary = `Con distracciones dejaste ${plural(busy.errors, 'símbolo', 'símbolos')} fuera de lugar; en la ronda tranquila, ${quiet.errors}.`;
  else if (busy.errors < quiet.errors) summary = `Esta vez te fue mejor con distracciones: ${busy.errors} fuera de lugar frente a ${quiet.errors} en la ronda tranquila. Es un resultado posible y válido.`;
  else summary = `Tu resultado fue parecido en las dos rondas: ${plural(busy.errors, 'símbolo', 'símbolos')} fuera de lugar en cada una.`;
  const perceptions = ['Me costó más concentrarme con los avisos', 'No noté diferencia', 'Me concentré mejor con los avisos', 'Prefiero no responder'];

  return <div className="lab">
    <p className="eyebrow">LO QUE OBSERVASTE</p>
    <h2 ref={heading} tabIndex={-1}>¿Qué notaste?</h2>
    <p className="lab-summary">{summary}</p>
    {complete && <p className="lab-note">Usaste «Deshacer» {plural(quiet.corrections, 'vez', 'veces')} en la ronda tranquila y {plural(busy.corrections, 'vez', 'veces')} con distracciones.</p>}
    <div className="lab-choices" role="group" aria-label="Tu percepción">{perceptions.map(p =>
      <button key={p} aria-pressed={perception === p} onClick={() => setPerception(perception === p ? null : p)}>{p}</button>)}
    </div>
    <p className="lab-note">Una prueba breve no describe cómo funciona tu atención. La práctica, el azar, el orden de las rondas y el dispositivo influyen. Lo que sí puedes observar es cómo se sintió intentar concentrarte mientras las demandas llamaban.</p>
    <div className="lab-actions"><button className="lab-primary" onClick={onRelease}>Dejarlas en pausa por un momento</button></div>
  </div>;
}
