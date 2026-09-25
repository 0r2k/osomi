'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import { BiblicalStory } from './biblical-story';

const Scene = dynamic(() => import('./scene'), { ssr: false, loading: () => <p className="p08-loading">Preparando la escena… Puedes leer la explicación más abajo.</p> });

export function P08Experience() {
  const [reading, setReading] = useState(true);
  const [ready, setReady] = useState(false);
  const [choice, setChoice] = useState<'bible' | 'close' | null>(null);
  useEffect(() => {
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => { setReading(preference.matches); setReady(true); };
    update();
    preference.addEventListener('change', update);
    return () => preference.removeEventListener('change', update);
  }, []);
  return <section id="escena" className="p08-experience">
    <div className="p08-mode"><span>UN DÍA / UN AÑO / UNA SEMANA</span><button onClick={() => setReading(!reading)}>{reading ? 'Explorar con movimiento' : 'Leer sin movimiento'}</button></div>
    {ready && !reading ? <Scene onChoice={setChoice} choice={choice} /> : <div className="p08-static"><p>{ready ? 'Modo de lectura sin movimiento.' : 'También puedes explorar esta historia sin animación.'}</p><ol>{Array.from({ length: 7 }, (_, i) => <li key={i}><span>DÍA</span>{i + 1}</li>)}</ol><a href="#lectura">Leer la explicación completa ↓</a><p>La Biblia da a este ritmo un significado particular. ¿Quieres explorarlo?</p><div className="p09-actions"><button onClick={() => setChoice('bible')}>Explorar la perspectiva bíblica</button><button onClick={() => setChoice('close')}>Ir al cierre</button></div></div>}
    {choice && <section id="continuacion" className="p10-intro" tabIndex={-1} aria-live="polite">
      {choice === 'bible' ? <BiblicalStory reading={reading} onClose={() => { setChoice('close'); requestAnimationFrame(() => document.getElementById('continuacion')?.focus()); }} /> : <><p className="eyebrow">PARA LLEVAR CONTIGO</p><h2>¿Qué espacio quieres darle al descanso?</h2><p>Exploraste cómo medimos un día, un año y una semana. Puedes volver a la escena o consultar la explicación y sus fuentes.</p><a href="#escena">Volver a explorar ↑</a><button onClick={() => setChoice('bible')}>Explorar la perspectiva bíblica</button><p>Este cierre corresponde al prototipo. Los tres caminos de continuación del piloto se incorporarán en P12.</p></>}
    </section>}
  </section>;
}
