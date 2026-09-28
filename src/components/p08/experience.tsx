'use client';

import dynamic from 'next/dynamic';
import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { BiblicalStory } from './biblical-story';
import { Closing } from '../cierre/closing';
import { P08Reading } from './reading';

const Scene = dynamic(() => import('./scene'), { ssr: false, loading: () => <p className="p08-loading">Preparando la escena…</p> });

// En el recorrido completo (embedded), P08 se funde sobre el globo de P07 durante una pantalla de scroll.
// El último tramo llena los seis días y forma la pila; la perspectiva bíblica sigue sin interrupción.
const CROSSFADE_SCREENS = 1, TAIL_SCREENS = 1.5;
const scrollScreens = (embedded: boolean) => embedded ? 8 : 7;

export function P08Experience({ pausa = null, intencion = null, embedded = false }: { pausa?: string | null; intencion?: string | null; embedded?: boolean }) {
  const section = useRef<HTMLElement>(null);
  const sources = useRef<HTMLDialogElement>(null);
  const sourcesOpener = useRef<HTMLElement | null>(null);
  const [reading, setReading] = useState(true);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => { setReading(preference.matches); setReady(true); };
    update();
    preference.addEventListener('change', update);
    return () => preference.removeEventListener('change', update);
  }, []);

  useEffect(() => {
    if (!embedded) return;
    const el = section.current!;
    let last = -1;
    const tick = () => {
      const raw = -el.getBoundingClientRect().top / window.innerHeight;
      const opacity = Math.max(0, Math.min(1, raw / CROSSFADE_SCREENS));
      if (opacity === last) return;
      last = opacity;
      el.style.opacity = String(opacity);
      el.inert = opacity < .5;
    };
    gsap.ticker.add(tick);
    return () => gsap.ticker.remove(tick);
  }, [embedded]);

  const openSources = () => { sourcesOpener.current = document.activeElement as HTMLElement; sources.current?.showModal(); };
  const toClosing = () => requestAnimationFrame(() => {
    const target = document.getElementById('cierre');
    if (!target) return;
    target.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
    target.focus({ preventScroll: true });
  });
  const screens = scrollScreens(embedded);

  return <section ref={section} id="escena" className={`p08-experience${embedded ? ' p08-embedded' : ''}`}>
    {!embedded && <div className="p08-mode"><span>UN DÍA / UN AÑO / UNA SEMANA</span><button onClick={() => setReading(!reading)}>{reading ? 'Explorar con movimiento' : 'Leer sin movimiento'}</button></div>}
    {ready && !reading
      ? <Scene pausa={pausa} onSources={openSources} lead={embedded ? CROSSFADE_SCREENS / screens : 0} tail={TAIL_SCREENS / screens} />
      : <div className="p08-static">
        <ol>{Array.from({ length: 7 }, (_, i) => <li key={i}><span>DÍA</span>{i + 1}</li>)}</ol>
        <button className="p08-sources" onClick={openSources}>Explicación y fuentes</button>
        <p>La Biblia da a este ritmo un significado particular.</p>
      </div>}
    <section id="continuacion" className="p10-intro" tabIndex={-1}>
      <BiblicalStory reading={reading} onClose={toClosing} />
    </section>
    <Closing biblical pausa={pausa} intencion={intencion} />

    <dialog ref={sources} className="sources-modal" aria-label="Explicación y fuentes" onClose={() => sourcesOpener.current?.focus({ preventScroll: true })}>
      <button className="sources-close" onClick={() => sources.current?.close()} autoFocus>Cerrar ×</button>
      <P08Reading />
    </dialog>
  </section>;
}
