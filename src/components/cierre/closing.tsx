'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useSound } from '../descanso/sound';
import './closing.css';
import { PASSAGES, QUESTIONS, SOURCES, type SourceKey } from './content';
import { Book3D } from '../libro/book';

gsap.registerPlugin(ScrollTrigger);

// P11 · Comprender y P12 · Elegir. Sin reloj ni nota que bloquee: responder, revisar o continuar.
// Las elecciones viven en memoria durante la visita; nada de esto es analítica.

const NEXT_TOPICS: { id: string; title: string; fits: string[] }[] = [
  { id: 'descansar', title: '¿Qué significa realmente descansar?', fits: ['pausa', 'preocupaciones', 'ninguna'] },
  { id: 'relaciones', title: '¿Cómo cuidar mis relaciones cuando no tengo tiempo?', fits: ['relaciones', 'responsabilidades'] },
  { id: 'desconectar', title: '¿Por qué me cuesta desconectarme?', fits: ['telefono', 'trabajo'] },
  { id: 'trabajo', title: '¿Qué dice la Biblia sobre el trabajo?', fits: ['trabajo', 'servicio'] },
  { id: 'silencio', title: '¿Para qué sirve el silencio?', fits: ['contemplacion'] },
];

const PAUSA_TEXT: Record<string, string> = { trabajo: 'el trabajo', telefono: 'el teléfono', responsabilidades: 'tus responsabilidades', preocupaciones: 'tus preocupaciones' };
const INTENCION_TEXT: Record<string, string> = { relaciones: 'tus relaciones', contemplacion: 'contemplar sin prisa', servicio: 'servir a otros', pausa: 'pausar tus tareas' };


function Bust() {
  // La misma silueta de la apertura, ahora sin demandas alrededor.
  return <svg className="closing-bust" viewBox="-240 -400 480 400" aria-hidden="true">
    <path d="M-230 4C-220-100-150-140-54-154Q-34-164-30-196L30-196Q34-164 54-154C150-140 220-100 230 4Z" />
    <ellipse cx="0" cy="-260" rx="58" ry="74" />
  </svg>;
}

export function Closing({ biblical, pausa, intencion, onExploreBible }: { biblical: boolean; pausa: string | null; intencion: string | null; onExploreBible?: () => void }) {
  const questions = QUESTIONS.filter(q => !q.biblical || biblical);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, { first: number; current: number }>>({});
  const [reviewing, setReviewing] = useState(false);
  const [finished, setFinished] = useState(false);
  const [interests, setInterests] = useState<string[]>([]);
  const [bookPage, setBookPage] = useState(0);
  const [note, setNote] = useState('');
  const [book3d, setBook3d] = useState(false);
  const book3dOpener = useRef<HTMLButtonElement | null>(null);
  const card = useRef<HTMLDivElement>(null);
  const dawn = useRef<HTMLDivElement>(null);
  const book = useRef<HTMLDialogElement>(null);
  const bookOpener = useRef<HTMLButtonElement | null>(null);
  const sound = useSound();

  const q = questions[Math.min(index, questions.length - 1)];
  const given = answers[q.id];
  const showFeedback = !!given && !reviewing;
  const chosen = given?.current ?? -1;

  // Cada ficha entra como una tarjeta del calendario.
  useEffect(() => {
    if (!card.current || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const tween = gsap.fromTo(card.current, { x: 40, rotation: 2.5, opacity: 0 }, { x: 0, rotation: 0, opacity: 1, duration: .5, ease: 'power3.out' });
    return () => { tween.kill(); };
  }, [index, finished]);

  // Entre la noche de P11 y P12 amanece: el sol sube con el scroll.
  useEffect(() => {
    if (!dawn.current || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const tween = gsap.fromTo(dawn.current.querySelector('.closing-sun'), { yPercent: 70 }, { yPercent: -10, ease: 'none', scrollTrigger: { trigger: dawn.current, start: 'top bottom', end: 'bottom 40%', scrub: true } });
    return () => { tween.scrollTrigger?.kill(); tween.kill(); };
  }, []);

  function answer(option: number) {
    setAnswers(a => ({ ...a, [q.id]: { first: a[q.id]?.first ?? option, current: option } }));
    setReviewing(false);
    sound.get()?.chime(0, option + 2, 0, .03);
  }
  function next() {
    setReviewing(false);
    if (index + 1 < questions.length) setIndex(index + 1); else setFinished(true);
  }

  const topics = [...NEXT_TOPICS]
    .sort((a, b) => Number(interests.includes(b.id)) - Number(interests.includes(a.id)) || Number(b.fits.includes(pausa ?? '') || b.fits.includes(intencion ?? '')) - Number(a.fits.includes(pausa ?? '') || a.fits.includes(intencion ?? '')))
    .slice(0, 3);
  const pausaText = pausa ? PAUSA_TEXT[pausa] : null;
  const intencionText = intencion ? INTENCION_TEXT[intencion] : null;

  function openBook(button: HTMLButtonElement, page = 0) {
    bookOpener.current = button;
    setBookPage(page);
    book.current?.showModal();
  }

  const pages: [string, React.ReactNode][] = [
    ['Resumen', <>
      <p>Empezaste con una pregunta cotidiana: <em>¿por qué necesito descansar?</em> Observaste cómo se acumulan las demandas y probaste una tarea con y sin interrupciones.</p>
      <p>Viste que dormir participa en procesos que sostienen la salud, el aprendizaje y la memoria, y que el cuerpo sigue ritmos cercanos a 24 horas. Luego miraste cómo medimos el tiempo: el día y el año se relacionan con movimientos de la Tierra; la semana es un ritmo de calendario con historia.</p>
      {biblical ? <p>Exploraste también la perspectiva bíblica: un séptimo día apartado para el descanso, la adoración y el servicio, tal como lo entienden los adventistas.</p> : <p>La perspectiva bíblica sigue disponible cuando quieras explorarla.</p>}
    </>],
    ['Lo que descubriste', <ul key="learned" className="book-list">{questions.map(item => <li key={item.id}>{item.takeaway}{item.source && <> <a href={SOURCES[item.source].href} target="_blank" rel="noreferrer">Fuente ↗</a></>}</li>)}</ul>],
    ['Pasajes bíblicos', <>
      <ul className="book-list">{PASSAGES.map(([ref, text]) => <li key={ref}><strong>{ref}.</strong> {text}</li>)}</ul>
      <p className="book-note">Resúmenes editoriales, no citas literales. La traducción bíblica de referencia está pendiente de revisión.</p>
    </>],
    ['Fuentes', <ul key="sources" className="book-list">{(Object.keys(SOURCES) as SourceKey[]).map(key => <li key={key}><a href={SOURCES[key].href} target="_blank" rel="noreferrer">{SOURCES[key].label} ↗</a><br /><span className="book-note">{SOURCES[key].scope}</span></li>)}</ul>],
    ['Para reflexionar', <ul key="reflect" className="book-list">
      <li>¿Qué demanda te acompaña incluso cuando el día termina?</li>
      <li>¿En qué momento de tu semana podrías dejar de producir, aunque sea un poco?</li>
      <li>¿Con quién te gustaría compartir un tiempo de descanso?</li>
      {biblical && <li>¿Qué te llama la atención de un descanso que incluye a los demás?</li>}
    </ul>],
    ['Tus notas', <>
      <p className="book-note">Esta nota es temporal: se conserva mientras la pestaña esté abierta y se pierde al cerrarla. Guardarla entre visitas requerirá una cuenta.</p>
      <label className="visually-hidden" htmlFor="book-note">Tu nota</label>
      <textarea id="book-note" value={note} onChange={event => setNote(event.target.value)} maxLength={4000} rows={8} placeholder="Escribe lo que quieras recordar…" />
    </>],
  ];

  return <section id="cierre" className="closing" tabIndex={-1} aria-label="Lo que descubriste y cómo continuar">
    {/* P11 · Comprender */}
    <div className="closing-quiz">
      <p className="eyebrow">LO QUE DESCUBRISTE</p>
      <h2>Comprueba lo que te llevas.</h2>
      <p className="closing-lead">Sin reloj ni nota. Puedes responder, cambiar tu respuesta o seguir adelante.</p>
      <ol className="quiz-tabs" aria-label="Preguntas">{questions.map((item, i) =>
        <li key={item.id} data-state={answers[item.id] ? 'done' : i === index && !finished ? 'current' : ''}><button onClick={() => { setIndex(i); setFinished(false); setReviewing(false); }} aria-label={`Pregunta ${i + 1}${answers[item.id] ? ', respondida' : ''}`} aria-current={i === index && !finished ? 'step' : undefined}><span>{i + 1}</span></button></li>)}
      </ol>

      {!finished ? <div ref={card} className="quiz-card" key={q.id}>
        <p className="quiz-count">{index + 1} / {questions.length}{q.biblical && ' · perspectiva bíblica'}</p>
        <h3>{q.ask}</h3>
        <div className="quiz-options" role="group" aria-label="Opciones">{q.options.map((option, i) => {
          const state = showFeedback ? (i === q.answer ? 'right' : i === chosen ? 'chosen' : '') : '';
          return <button key={option} aria-pressed={given?.current === i} data-state={state} disabled={showFeedback} onClick={() => answer(i)}>{option}</button>;
        })}</div>
        <div aria-live="polite">{showFeedback && <div className="quiz-feedback" data-right={chosen === q.answer}>
          <strong>{chosen === q.answer ? 'Así es.' : 'No exactamente.'}</strong> {q.feedback}
          {q.source && <a href={SOURCES[q.source].href} target="_blank" rel="noreferrer">{SOURCES[q.source].label} ↗</a>}
        </div>}</div>
        <div className="quiz-actions">
          {showFeedback && <button onClick={() => setReviewing(true)}>Cambiar respuesta</button>}
          <button className="quiz-next" onClick={next}>{index + 1 < questions.length ? (given ? 'Siguiente' : 'Saltar esta pregunta') : 'Terminar'}</button>
        </div>
      </div> : <div ref={card} className="quiz-card quiz-summary">
        <p className="quiz-count">RESUMEN</p>
        <h3>Te llevas estas ideas</h3>
        <ul>{questions.map(item => <li key={item.id}>{item.takeaway}</li>)}</ul>
        <p className="closing-note">Este resumen describe el contenido que exploraste, no tu fe ni tu capacidad.</p>
        {!biblical && onExploreBible && <button className="closing-link" onClick={onExploreBible}>Explorar también la perspectiva bíblica</button>}
      </div>}

      <div className="closing-reflect">
        <h3>¿Qué quisieras explorar ahora?</h3>
        <p className="closing-note">No hay respuesta correcta; tu elección ordena las sugerencias de abajo.</p>
        <div className="closing-chips" role="group" aria-label="Temas que te interesan">{NEXT_TOPICS.map(topic =>
          <button key={topic.id} aria-pressed={interests.includes(topic.id)} onClick={() => setInterests(list => list.includes(topic.id) ? list.filter(id => id !== topic.id) : [...list, topic.id])}>{topic.title}</button>)}
        </div>
      </div>
    </div>

    <div ref={dawn} className="closing-dawn" aria-hidden="true"><div className="closing-sun" /><div className="closing-horizon" /></div>

    {/* P12 · Elegir */}
    <div className="closing-choose">
      <Bust />
      <h2>¿Cómo quieres continuar?</h2>
      <p className="closing-lead">{pausaText && intencionText
        ? <>Al comenzar, te costaba dejar en pausa {pausaText}. Después pensaste en reservar tiempo para {intencionText}. ¿Qué pequeño espacio podrías darle esta semana?</>
        : pausaText ? <>Al comenzar, te costaba dejar en pausa {pausaText}. ¿Qué pequeño espacio para descansar podrías reservar esta semana?</>
          : intencionText ? <>Pensaste en reservar tiempo para {intencionText}. ¿Qué pequeño espacio podrías darle esta semana?</>
            : <>Medimos el paso del tiempo. También podemos darle un sentido.</>}</p>

      <div className="paths">
        <article className="path">
          <p className="eyebrow">SEGUIR EXPLORANDO</p>
          <h3>Otra pregunta, otro recorrido</h3>
          <ul className="path-topics">{topics.map(topic => <li key={topic.id}><span>{topic.title}</span><small>Próximamente</small></li>)}</ul>
          <p className="closing-note">Los próximos temas están en preparación. Para iniciarlos necesitarás una cuenta gratuita, que también guarda tu favorito.</p>
          <Link className="path-action" href="/registro">Crear una cuenta gratuita</Link>
        </article>
        <article className="path">
          <p className="eyebrow">EXPLORARLO POR MI CUENTA</p>
          <h3>El libro de este tema</h3>
          <p>Resumen, lo que descubriste, pasajes, fuentes y preguntas para reflexionar. Puedes tomar notas.</p>
          <button className="path-action" onClick={event => { book3dOpener.current = event.currentTarget; setBook3d(true); }}>Abrir el libro</button>
        </article>
        <article className="path">
          <p className="eyebrow">EXPLORARLO CON ALGUIEN</p>
          <h3>Una conversación con una persona</h3>
          <p>Un instructor bíblico o colaborador adventista, gratuito y sin compromiso.</p>
          <p className="path-status">El equipo de acompañamiento está en preparación. No te pediremos datos hasta que haya personas disponibles para responder.</p>
        </article>
      </div>

      <aside className="path-question">
        <h3>¿Tienes una pregunta?</h3>
        <p>Podrás enviarla sin dar tu nombre, y consultar la respuesta con un código privado. El buzón anónimo estará disponible pronto; por ahora no recogemos preguntas.</p>
      </aside>
      <p className="closing-note closing-end">Tu «Me encanta este tema» sigue disponible en la esquina, durante todo el recorrido.</p>
    </div>

    <Book3D open={book3d} biblical={biblical} note={note} setNote={setNote}
      takeaways={questions.map(item => ({ text: item.takeaway, source: item.source }))}
      onClose={() => { setBook3d(false); book3dOpener.current?.focus({ preventScroll: true }); }}
      onFlat={() => { setBook3d(false); if (book3dOpener.current) openBook(book3dOpener.current); }} />
    <dialog ref={book} className="book" aria-labelledby="book-title" onClose={() => bookOpener.current?.focus({ preventScroll: true })}>
      <header><p className="eyebrow">¿POR QUÉ NECESITO DESCANSAR?</p><h2 id="book-title">El libro del tema</h2><button onClick={() => book.current?.close()}>Cerrar ×</button></header>
      <nav aria-label="Índice del libro"><ol>{pages.map(([title], i) => <li key={title}><button aria-current={i === bookPage ? 'page' : undefined} onClick={() => setBookPage(i)}>{title}</button></li>)}</ol></nav>
      <article className="book-page" key={bookPage}><h3>{pages[bookPage][0]}</h3>{pages[bookPage][1]}</article>
      <footer>
        <button disabled={bookPage === 0} onClick={() => setBookPage(bookPage - 1)}>← Anterior</button>
        <span>{bookPage + 1} / {pages.length}</span>
        <button disabled={bookPage === pages.length - 1} onClick={() => setBookPage(bookPage + 1)}>Siguiente →</button>
      </footer>
    </dialog>
  </section>;
}
