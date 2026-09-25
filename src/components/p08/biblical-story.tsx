'use client';

import { useEffect, useRef, useState } from 'react';
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

const clamp = (n: number) => Math.max(0, Math.min(1, n));
const smooth = (t: number) => t * t * (3 - 2 * t);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
// Capítulos pares: texto a la derecha y ficha a la izquierda; impares, al revés.
const cardOnLeft = (index: number) => index % 2 === 0;

export function BiblicalStory({ reading, scrollRequest, onClose }: { reading: boolean; scrollRequest: number; onClose: () => void }) {
  const root = useRef<HTMLElement>(null);
  const marker = useRef<HTMLDivElement>(null);
  const hint = useRef<HTMLParagraphElement>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const opener = useRef<HTMLButtonElement | null>(null);
  const firstRequest = useRef(scrollRequest);
  const [selected, setSelected] = useState(0);

  // El día 7 baja desde la pila de P09 y acompaña cada explicación, cruzando de lado.
  useGSAP(() => {
    const reduce = reading || window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const chapters = gsap.utils.toArray<HTMLElement>('.p10-chapter', root.current);
    const scene = document.getElementById('escena');
    const card = marker.current!, label = card.querySelector<HTMLElement>('.p10-rest')!;
    if (!reduce) chapters.forEach(chapter => {
      gsap.fromTo(chapter.querySelector('.p10-copy'), { opacity: .15, y: 28 }, { opacity: 1, y: 0, ease: 'none', scrollTrigger: { trigger: chapter, start: 'top 80%', end: 'top 30%', scrub: true } });
    });

    const place = () => {
      const W = window.innerWidth, H = window.innerHeight, mobile = W < 700;
      const slot = (left: boolean) => (left ? (mobile ? .2 : .25) : (mobile ? .8 : .75)) * W;
      const d = chapters.map(chapter => { const r = chapter.getBoundingClientRect(); return r.top + r.height / 2 - H / 2; });
      const w = card.offsetWidth;
      let x: number, y = H / 2, scale = 1, rotate = 0, entry = 1;
      if (d[0] > 0) {
        // Entrada: desde la ficha 7 de la pila (si está en pantalla) hasta el primer capítulo.
        entry = smooth(clamp(1 - d[0] / H));
        const source = document.querySelector('.p08-cards li:last-child')?.getBoundingClientRect();
        const from = source && source.width > 0 ? { x: source.left + source.width / 2, y: source.top + source.height / 2, s: source.width / w } : { x: slot(true), y: H * 1.2, s: 1 };
        x = lerp(from.x, slot(true), entry); y = lerp(from.y, H / 2, entry); scale = lerp(from.s, 1, entry);
        rotate = Math.sin(entry * Math.PI) * -6;
      } else {
        const last = d.length - 1;
        let k = 0;
        while (k < last && d[k + 1] <= 0) k++;
        if (k === last) {
          x = slot(cardOnLeft(last)); y = H / 2 + Math.min(0, d[last]);   // Sale con el último capítulo.
        } else {
          const t = smooth(clamp(-d[k] / (d[k + 1] - d[k])));
          x = lerp(slot(cardOnLeft(k)), slot(cardOnLeft(k + 1)), t);
          y = H / 2 - Math.sin(t * Math.PI) * H * .08;
          rotate = Math.sin(t * Math.PI) * (cardOnLeft(k) ? 8 : -8);
        }
      }
      const active = d[0] < H * 1.05;
      card.style.visibility = active ? 'visible' : 'hidden';
      card.style.transform = `translate(${x - w / 2}px, ${y - card.offsetHeight / 2}px) rotate(${rotate}deg) scale(${scale})`;
      label.style.opacity = String(clamp((entry - .7) / .3));
      scene?.setAttribute('data-handoff', String(active && d[0] < H * .98));
      const lastIndex = d.length - 1;
      hint.current!.style.opacity = d[0] <= H * .1 && d[lastIndex] > H * .1 ? '1' : '0';
    };

    if (reduce) {
      scene?.setAttribute('data-handoff', 'false');
      return;
    }
    gsap.ticker.add(place);
    return () => { gsap.ticker.remove(place); scene?.removeAttribute('data-handoff'); };
  }, { scope: root, dependencies: [reading], revertOnUpdate: true });

  // Al elegir la perspectiva bíblica: esperar a que se forme la pila y centrar el primer tema.
  useEffect(() => {
    const reduce = reading || window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const delay = scrollRequest === firstRequest.current && !reduce ? 2300 : 0;
    let cancelled = false;
    const cancel = () => { cancelled = true; };
    const events = ['wheel', 'touchstart', 'keydown'] as const;
    events.forEach(name => window.addEventListener(name, cancel, { passive: true, once: true }));
    const timer = window.setTimeout(() => {
      if (cancelled) return;
      const first = root.current?.querySelector<HTMLElement>('.p10-chapter');
      if (!first) return;
      const r = first.getBoundingClientRect();
      window.scrollTo({ top: window.scrollY + r.top + r.height / 2 - window.innerHeight / 2, behavior: reduce ? 'auto' : 'smooth' });
      first.querySelector<HTMLElement>('h2')?.focus({ preventScroll: true });
    }, delay);
    return () => { window.clearTimeout(timer); events.forEach(name => window.removeEventListener(name, cancel)); };
  }, [scrollRequest, reading]);

  function open(index: number, button: HTMLButtonElement) {
    opener.current = button;
    setSelected(index);
    dialog.current?.showModal();
  }
  return <section ref={root} className={`p10-story${reading ? ' p10-reading' : ''}`} aria-label="El significado bíblico del sábado">
    <div ref={marker} className="p10-marker" aria-hidden="true"><span>DÍA</span><strong>7</strong><span className="p10-rest">DESCANSO</span></div>
    {passages.map((passage, index) => <article className="p10-chapter" data-side={cardOnLeft(index) ? 'right' : 'left'} key={passage.reference}>
      <div className="p10-copy"><p className="eyebrow">PERSPECTIVA BÍBLICA · INTERPRETACIÓN ADVENTISTA</p><span className="p10-number">0{index + 1} / 04</span><h2 tabIndex={-1}>{passage.title}</h2><p>{passage.text}</p><ul className="p10-words">{passage.words.map(word => <li key={word}>{word}</li>)}</ul><button onClick={event => open(index, event.currentTarget)}>{index === 3 ? 'Consultar la fuente' : 'Explorar la referencia'} · {passage.reference}</button></div>
    </article>)}
    <div className="p10-exit"><a href="#escena">Volver al calendario ↑</a><button onClick={onClose}>Ir al cierre del prototipo</button></div>
    <p ref={hint} className="p10-hint" aria-hidden="true">Sigue hacia abajo ↓</p>
    <dialog ref={dialog} className="p10-dialog" aria-labelledby="p10-reference-title" onClose={() => opener.current?.focus({ preventScroll: true })}>
      <button className="p10-dialog-close" onClick={() => dialog.current?.close()} autoFocus>Cerrar ×</button><p className="eyebrow">REFERENCIA Y CONTEXTO</p><h2 id="p10-reference-title">{passages[selected].reference}</h2><p>{passages[selected].context}</p><p className="p10-note">Resumen editorial del pasaje o de la creencia; no es una cita literal de una traducción bíblica.</p><a href="https://gc.adventist.org/beliefs/" target="_blank" rel="noreferrer">Consultar las creencias adventistas oficiales ↗</a>
    </dialog>
  </section>;
}
