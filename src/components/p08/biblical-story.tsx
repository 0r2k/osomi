'use client';

import { useRef, useState } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(useGSAP, ScrollTrigger);

const passages = [
  { title: 'Un tiempo apartado', reference: 'Génesis 2:1–3', text: 'En el relato de la creación, el séptimo día tiene un lugar especial: Dios descansa, lo bendice y lo aparta como santo.', context: 'Estos versículos cierran el relato de la creación. Presentan la obra terminada y describen el séptimo día como bendecido y santificado por Dios.', words: ['Descanso'] },
  { title: 'Descanso compartido', reference: 'Éxodo 20:8–11', text: 'El mandamiento incluye a quienes viven y trabajan contigo. El descanso alcanza también a otras personas y a los animales.', context: 'El cuarto mandamiento forma parte del Decálogo. Vincula el descanso del séptimo día con la creación e incluye a hijos, hijas, siervos, animales y al extranjero que vive en la comunidad.', words: ['Tú', 'Quienes te rodean', 'Quienes trabajan contigo'] },
  { title: 'Un bien para las personas', reference: 'Marcos 2:23–28', text: 'Jesús presenta el sábado como un bien para el ser humano. Su sentido nos lleva a mirar a las personas.', context: 'La conversación surge cuando los discípulos recogen espigas en sábado y son cuestionados. En el versículo 27, Jesús explica que el sábado fue hecho para el ser humano; el pasaje continúa afirmando su autoridad sobre el sábado.', words: ['Descanso', 'Adoración', 'Servicio'] },
  { title: 'Un encuentro que vuelve cada semana', reference: 'Creencia adventista 20', text: 'Para los adventistas, el sábado es el séptimo día dedicado al descanso, la adoración y el servicio. Es un tiempo de encuentro con Dios y con otras personas.', context: 'Esta es una explicación de la interpretación adventista. La creencia fundamental 20 presenta el sábado como recuerdo de la creación y un día de comunión con Dios y con los demás. No es una conclusión derivada del modelo astronómico.', words: ['Con Dios', 'Con otras personas'] },
];

export function BiblicalStory({ reading, onClose }: { reading: boolean; onClose: () => void }) {
  const root = useRef<HTMLElement>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const opener = useRef<HTMLButtonElement | null>(null);
  const [selected, setSelected] = useState(0);
  useGSAP(() => {
    if (reading || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const panels = gsap.utils.toArray<HTMLElement>('.p10-chapter', root.current);
    panels.forEach(panel => {
      gsap.fromTo(panel.querySelector('.p10-copy'), { opacity: .2, y: 28 }, { opacity: 1, y: 0, ease: 'none', scrollTrigger: { trigger: panel, start: 'top 85%', end: 'top 40%', scrub: true } });
    });
    gsap.to('.p10-marker', { rotation: -5, scale: .72, ease: 'none', scrollTrigger: { trigger: root.current, start: 'top top', end: 'bottom bottom', scrub: true } });
  }, { scope: root, dependencies: [reading], revertOnUpdate: true });

  function open(index: number, button: HTMLButtonElement) {
    opener.current = button;
    setSelected(index);
    dialog.current?.showModal();
  }
  return <section ref={root} className="p10-story" aria-label="El significado bíblico del sábado">
    <div className="p10-visual" aria-hidden="true"><div className="p10-marker"><span>DÍA</span><strong>7</strong><span>DESCANSO</span></div></div>
    <div className="p10-chapters">{passages.map((passage, index) => <article className="p10-chapter" key={passage.reference}>
      <div className="p10-copy"><p className="eyebrow">PERSPECTIVA BÍBLICA · INTERPRETACIÓN ADVENTISTA</p><span className="p10-number">0{index + 1} / 04</span><h2>{passage.title}</h2><p>{passage.text}</p><ul className="p10-words">{passage.words.map(word => <li key={word}>{word}</li>)}</ul><button onClick={event => open(index, event.currentTarget)}>{index === 3 ? 'Consultar la fuente' : 'Explorar la referencia'} · {passage.reference}</button></div>
    </article>)}<div className="p10-exit"><a href="#escena">Volver al calendario ↑</a><button onClick={onClose}>Ir al cierre del prototipo</button></div></div>
    <dialog ref={dialog} className="p10-dialog" aria-labelledby="p10-reference-title" onClose={() => opener.current?.focus({ preventScroll: true })}>
      <button className="p10-dialog-close" onClick={() => dialog.current?.close()} autoFocus>Cerrar ×</button><p className="eyebrow">REFERENCIA Y CONTEXTO</p><h2 id="p10-reference-title">{passages[selected].reference}</h2><p>{passages[selected].context}</p><p className="p10-note">Resumen editorial del pasaje o de la creencia; no es una cita literal de una traducción bíblica.</p><a href="https://gc.adventist.org/beliefs/" target="_blank" rel="noreferrer">Consultar las creencias adventistas oficiales ↗</a>
    </dialog>
  </section>;
}
