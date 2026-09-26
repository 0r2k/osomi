'use client';

import dynamic from 'next/dynamic';
import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { BiblicalStory } from './biblical-story';

const Scene = dynamic(() => import('./scene'), { ssr: false, loading: () => <p className="p08-loading">Preparando la escena… Puedes leer la explicación más abajo.</p> });

// En el recorrido completo (embedded), P08 se funde sobre el globo de P07 durante una pantalla de scroll.
const CROSSFADE_SCREENS = 1, EMBEDDED_SCROLL_SCREENS = 6.5;

export function P08Experience({ pausa = null, embedded = false }: { pausa?: string | null; embedded?: boolean }) {
  const section = useRef<HTMLElement>(null);
  const [reading, setReading] = useState(true);
  const [ready, setReady] = useState(false);
  const [choice, setChoice] = useState<'bible' | 'close' | null>(null);
  const [scrollRequest, setScrollRequest] = useState(0);
  const choose = (next: 'bible' | 'close') => { setChoice(next); if (next === 'bible') setScrollRequest(n => n + 1); };
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
  return <section ref={section} id="escena" className={`p08-experience${embedded ? ' p08-embedded' : ''}`}>
    {!embedded && <div className="p08-mode"><span>UN DÍA / UN AÑO / UNA SEMANA</span><button onClick={() => setReading(!reading)}>{reading ? 'Explorar con movimiento' : 'Leer sin movimiento'}</button></div>}
    {ready && !reading ? <Scene onChoice={choose} choice={choice} pausa={pausa} lead={embedded ? CROSSFADE_SCREENS / EMBEDDED_SCROLL_SCREENS : 0} onReading={embedded ? () => setReading(true) : undefined} /> : <div className="p08-static">{embedded && <button className="p08-motion" onClick={() => setReading(false)}>Explorar con movimiento</button>}<p>{ready ? 'Modo de lectura sin movimiento.' : 'También puedes explorar esta historia sin animación.'}</p><ol>{Array.from({ length: 7 }, (_, i) => <li key={i}><span>DÍA</span>{i + 1}</li>)}</ol><a href="#lectura">Leer la explicación completa ↓</a><p>La Biblia da a este ritmo un significado particular. ¿Quieres explorarlo?</p><div className="p09-actions"><button onClick={() => choose('bible')}>Explorar la perspectiva bíblica</button><button onClick={() => setChoice('close')}>Ir al cierre</button></div></div>}
    {choice && <section id="continuacion" className="p10-intro" tabIndex={-1} aria-live="polite">
      {choice === 'bible' ? <BiblicalStory reading={reading} scrollRequest={scrollRequest} onClose={() => { setChoice('close'); requestAnimationFrame(() => document.getElementById('continuacion')?.focus()); }} /> : <><p className="eyebrow">PARA LLEVAR CONTIGO</p><h2>¿Qué espacio quieres darle al descanso?</h2><p>Exploraste cómo medimos un día, un año y una semana. Puedes volver a la escena o consultar la explicación y sus fuentes.</p><a href="#escena">Volver a explorar ↑</a><button onClick={() => choose('bible')}>Explorar la perspectiva bíblica</button><p>Este cierre corresponde al prototipo. Los tres caminos de continuación del piloto se incorporarán en P12.</p></>}
    </section>}
  </section>;
}
