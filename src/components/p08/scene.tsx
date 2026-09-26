'use client';

import { useRef, useState } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import * as THREE from 'three';
import { createCosmos } from './cosmos';
import { handoff } from '../descanso/handoff';

gsap.registerPlugin(useGSAP, ScrollTrigger);
const clamp = (n: number) => Math.max(0, Math.min(1, n));
const ramp = (p: number, a: number, b: number) => clamp((p - a) / (b - a));
const smooth = (p: number) => p * p * (3 - 2 * p);
const TAU = Math.PI * 2;
// Idea 1: los seis días se llenan de lo que ocupa al visitante (elección de P02, si la hizo).
const sixDays: Record<string, string> = {
  trabajo: 'Seis días para el trabajo y todo lo que te ocupa.',
  telefono: 'Seis días para los mensajes y todo lo que te ocupa.',
  responsabilidades: 'Seis días para tus responsabilidades y todo lo que te ocupa.',
  preocupaciones: 'Seis días para lo que te ocupa y te preocupa.',
};
const chapters = [
  ['01 / UN DÍA', 'Un giro cambia la luz.', 'La rotación terrestre se relaciona con la alternancia entre día y noche.', 'Día solar medio · aproximadamente 24 horas'],
  ['02 / UN AÑO', 'Ampliemos la mirada.', 'La Tierra también se mueve alrededor del Sol.', 'Sigue bajando para revelar el recorrido.'],
  ['02 / UN AÑO', 'Otro movimiento. Otro ritmo.', 'Una vuelta de la Tierra alrededor del Sol define aproximadamente un año.', 'Aproximadamente 365¼ días'],
  ['03 / UNA SEMANA', '¿Por qué de siete en siete?', 'Estas fichas representan días de un calendario. No son planetas ni una órbita semanal.', 'Calendario · representación visual'],
  ['03 / UNA SEMANA', 'Damos forma a nuestros días.', 'La semana organiza el tiempo de otra manera: su historia incluye tradiciones culturales y religiosas.', 'Siete días · un ritmo de calendario'],
];

export default function P08Scene({ onChoice, choice, pausa, lead = 0, onReading }: { onChoice: (choice: 'bible' | 'close') => void; choice: 'bible' | 'close' | null; pausa?: string | null; lead?: number; onReading?: () => void }) {
  const root = useRef<HTMLDivElement>(null);
  const viewport = useRef<HTMLDivElement>(null);
  const cards = useRef<HTMLOListElement>(null);
  const captions = useRef<HTMLDivElement>(null);
  const sunCover = useRef<HTMLCanvasElement>(null);
  const [chapter, setChapter] = useState(0);
  const [paused, setPaused] = useState(false);
  const [failed, setFailed] = useState(false);
  const control = useRef({ paused: false, yaw: 0, pitch: 0, dirty: true, gather: 0 });

  useGSAP(() => {
    const state = control.current;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    // Primero se llenan los seis días (CSS); después se forma la pila con el día 7 encima.
    const tween = gsap.to(state, { gather: choice === 'bible' ? 1 : 0, delay: choice === 'bible' && !reduce ? 1 : 0, duration: reduce ? 0 : 1.15, ease: 'power2.inOut', onUpdate: () => { state.dirty = true; } });
    return () => { tween.kill(); };
  }, { dependencies: [choice], scope: root });

  useGSAP(() => {
    if (failed) return;
    const holder = viewport.current!;
    const section = root.current!;
    let renderer: THREE.WebGLRenderer;
    try { renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' }); }
    catch { setFailed(true); return; }
    const canvas = renderer.domElement;
    canvas.setAttribute('aria-hidden', 'true');
    holder.prepend(canvas);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, 1, .1, 100);
    const system = new THREE.Group();
    scene.add(system);
    const cosmos = createCosmos(renderer, () => { state.dirty = true; });
    const { sun, earth, spin, axis, stars } = cosmos;
    scene.add(stars);
    system.add(sun);
    system.add(earth);
    const orbitPoints = Array.from({ length: 161 }, (_, i) => new THREE.Vector3(Math.cos(i / 160 * TAU) * 4, 0, Math.sin(i / 160 * TAU) * 4));
    const orbit = new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(orbitPoints), new THREE.LineBasicMaterial({ color: '#8fa3b4', transparent: true, opacity: .32 }));
    system.add(orbit);
    const cover = sunCover.current!.getContext('2d');
    let width = 1, height = 1, visible = false, phase = -.62, lastChapter = -1;
    let pointer: { id: number; x: number; y: number; horizontal: boolean } | null = null;
    const playhead = { p: 0 };
    const state = control.current;
    const target = new THREE.Vector3();
    const projected = new THREE.Vector3();
    const cardElements = Array.from(cards.current!.children) as HTMLElement[];
    const captionElements = Array.from(captions.current!.children) as HTMLElement[];
    const cardSetters = cardElements.map(el => ({ x: gsap.quickSetter(el, 'x', 'px'), y: gsap.quickSetter(el, 'y', 'px'), scaleX: gsap.quickSetter(el, 'scaleX'), scaleY: gsap.quickSetter(el, 'scaleY'), rotation: gsap.quickSetter(el, 'rotation', 'deg'), opacity: gsap.quickSetter(el, 'opacity') }));
    // Con `lead`, la escena espera quieta mientras se funde sobre el globo de P07.
    const progress = () => lead ? ramp(playhead.p, lead, 1) : playhead.p;
    const canDrag = () => progress() >= .42 && progress() < .76;
    const resize = () => {
      width = holder.clientWidth; height = holder.clientHeight;
      camera.aspect = width / Math.max(height, 1); camera.updateProjectionMatrix();
      renderer.setSize(width, height); state.dirty = true;
      // Dónde aparece la Tierra al inicio (distancia 2,65, radio 0,58, fov 40°): P07 crece hasta aquí.
      const hr = holder.getBoundingClientRect(), sr = section.querySelector('.p08-stage')!.getBoundingClientRect();
      handoff.earth = { x: hr.left - sr.left + hr.width / 2, y: hr.top - sr.top + hr.height / 2, r: height / 2 * Math.tan(Math.asin(.58 / 2.65)) / Math.tan(THREE.MathUtils.degToRad(20)) };
    };
    const observer = new ResizeObserver(resize); observer.observe(holder); resize();
    const timeline = gsap.to(playhead, { p: 1, ease: 'none', scrollTrigger: {
      trigger: section, start: 'top top', end: 'bottom bottom', scrub: true,
      onUpdate: () => { state.dirty = true; },
    } });
    const visibility = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; state.dirty = true; });
    visibility.observe(holder);
    const tabVisibility = () => { state.dirty = true; };
    document.addEventListener('visibilitychange', tabVisibility);
    const down = (event: PointerEvent) => {
      if (!canDrag() || event.button !== 0) return;
      pointer = { id: event.pointerId, x: event.clientX, y: event.clientY, horizontal: false };
    };
    const move = (event: PointerEvent) => {
      if (!pointer || pointer.id !== event.pointerId || !canDrag()) return;
      const dx = event.clientX - pointer.x, dy = event.clientY - pointer.y;
      if (!pointer.horizontal) {
        if (Math.abs(dx) + Math.abs(dy) < 5) return;
        if (event.pointerType === 'touch' && Math.abs(dy) > Math.abs(dx)) { pointer = null; return; }
        pointer.horizontal = true; canvas.setPointerCapture(event.pointerId);
      }
      state.yaw += dx * .005;
      if (event.pointerType !== 'touch') state.pitch = Math.max(-.2, Math.min(.4, state.pitch + dy * .003));
      pointer.x = event.clientX; pointer.y = event.clientY; state.dirty = true;
    };
    const up = () => { if (pointer && canvas.hasPointerCapture(pointer.id)) canvas.releasePointerCapture(pointer.id); pointer = null; };
    canvas.addEventListener('pointerdown', down); canvas.addEventListener('pointermove', move);
    canvas.addEventListener('pointerup', up); canvas.addEventListener('pointercancel', up);
    const contextLost = (event: Event) => { event.preventDefault(); setFailed(true); };
    canvas.addEventListener('webglcontextlost', contextLost);
    const render = (_time: number, delta: number) => {
      if (document.hidden || !visible) return;
      const p = progress();
      const autonomous = p >= .22 && p < .94 && !state.paused;
      if (!state.dirty && !autonomous) return;
      state.dirty = false;
      if (autonomous) { phase = (phase + Math.min(delta, 40) * .00018) % TAU; cosmos.advance(Math.min(delta, 40)); }
      const reveal = smooth(ramp(p, .22, .42));
      const align = smooth(ramp(p, .88, .97));
      const day = ramp(p, 0, .22);
      const angle = phase;
      earth.position.set(Math.cos(angle) * 4, 0, Math.sin(angle) * 4);
      spin.rotation.y = 6.45 + day * (TAU + TAU / 365.25);
      axis.visible = p < .42;
      orbit.visible = reveal > 0;
      target.copy(earth.position).multiplyScalar(1 - reveal);
      const yaw = .35 + state.yaw * reveal * (1 - align);
      const pitch = .36 + (.36 + state.pitch * (1 - align)) * reveal;
      const radius = THREE.MathUtils.lerp(2.65, width < 600 ? 20 : 15, reveal);
      camera.position.set(target.x + Math.sin(yaw) * Math.cos(pitch) * radius, Math.sin(pitch) * radius, target.z + Math.cos(yaw) * Math.cos(pitch) * radius);
      camera.lookAt(target); camera.updateMatrixWorld();
      stars.position.copy(camera.position);
      canvas.style.opacity = String(1 - align);
      canvas.style.cursor = canDrag() ? 'grab' : 'auto';
      renderer.render(scene, camera);
      const stage = p < .22 ? 0 : p < .42 ? 1 : p < .58 ? 2 : p < .83 ? 3 : 4;
      if (stage !== lastChapter) { lastChapter = stage; setChapter(stage); }
      const boundaries = [.22, .42, .58, .83];
      captionElements.forEach((el, i) => {
        const enter = i === 0 ? 1 : smooth(ramp(p, boundaries[i - 1] - .018, boundaries[i - 1] + .018));
        const leave = i === 4 ? 0 : smooth(ramp(p, boundaries[i] - .018, boundaries[i] + .018));
        el.style.opacity = String(enter * (1 - leave));
        el.style.transform = `translateY(${(1 - enter) * 8 - leave * 8}px)`;
      });
      section.dataset.phase = p >= .94 ? 'calendar' : p >= .76 ? 'alignment' : p >= .58 ? 'cards' : p >= .42 ? 'explore' : p >= .22 ? 'reveal' : 'day';
      projected.set(0, 0, 0).project(camera);
      const sunX = (projected.x * .5 + .5) * width;
      const sunY = (-projected.y * .5 + .5) * height;
      const sunDiameter = height * .9 / (Math.tan(THREE.MathUtils.degToRad(20)) * Math.sqrt(camera.position.lengthSq() - .81));
      Object.assign(sunCover.current!.style, { left: `${sunX}px`, top: `${sunY}px`, width: `${sunDiameter}px`, height: `${sunDiameter}px`, opacity: String(p >= .58 ? 1 - align : 0) });
      // Las fichas salen de detrás del Sol: una copia circular del disco renderizado las cubre.
      if (cover && p >= .58 && align < 1) {
        const ratio = renderer.getPixelRatio(), size = Math.max(1, Math.round(sunDiameter * ratio)), el = sunCover.current!;
        if (el.width !== size) { el.width = size; el.height = size; }
        cover.clearRect(0, 0, size, size);
        cover.drawImage(canvas, (sunX - sunDiameter / 2) * ratio, (sunY - sunDiameter / 2) * ratio, size, size, 0, 0, size, size);
      }
      cardElements.forEach((el, i) => {
        const travel = smooth(ramp(p, .58 + i * .043, .64 + i * .043));
        const opacity = ramp(travel, 0, .16);
        projected.set(0, 0, 0).project(camera);
        const x = (projected.x * .5 + .5) * width;
        const y = (-projected.y * .5 + .5) * height;
        const mobile = width < 600;
        const destinationX = mobile ? width / 2 + ((i < 4 ? i : i - 4) - (i < 4 ? 1.5 : 1)) * 72 : width / 2 + (i - 3) * Math.min(100, width / 8);
        const destinationY = mobile ? height / 2 + (i < 4 ? -44 : 52) : height / 2;
        // A single elliptical arc from the Sun to each permanent calendar slot.
        const arc = Math.sin(Math.PI * travel);
        const gather = state.gather * smooth(ramp(p, .9, .94));
        const offsets = [[-14, 5, -17], [12, -8, 13], [-8, -12, -9], [16, 7, 18], [-12, 10, -13], [8, -5, 8], [0, 0, 0]];
        const [dx, dy, tilt] = offsets[i];
        const size = Math.max(1, Math.min(mobile ? 2.5 : 3.4, height / (mobile ? 125 : 150), width / 150));
        cardSetters[i].x(THREE.MathUtils.lerp(THREE.MathUtils.lerp(x, destinationX, travel) + arc * Math.min(width * .22, 160), width / 2 + dx * size, gather));
        cardSetters[i].y(THREE.MathUtils.lerp(THREE.MathUtils.lerp(y, destinationY, travel) - arc * Math.min(height * .35, 180), height / 2 + dy * size, gather));
        // Keep scale inside GSAP's transform so it cannot scale the translation.
        // Cards are laid out at 4x resolution in CSS; never magnify a small raster layer.
        const cardScale = (.12 + .88 * travel) * THREE.MathUtils.lerp(1, size, gather) / 4;
        cardSetters[i].scaleX(cardScale);
        cardSetters[i].scaleY(cardScale);
        cardSetters[i].rotation(tilt * gather);
        el.style.zIndex = travel < .45 ? '1' : String(3 + i);
        cardSetters[i].opacity(opacity);
        el.style.visibility = opacity > 0 ? 'visible' : 'hidden';
      });
    };
    gsap.ticker.add(render);
    return () => {
      gsap.ticker.remove(render); timeline.scrollTrigger?.kill(); timeline.kill(); observer.disconnect(); visibility.disconnect();
      document.removeEventListener('visibilitychange', tabVisibility);
      canvas.removeEventListener('pointerdown', down); canvas.removeEventListener('pointermove', move); canvas.removeEventListener('pointerup', up); canvas.removeEventListener('pointercancel', up); canvas.removeEventListener('webglcontextlost', contextLost);
      scene.traverse(object => { const mesh = object as THREE.Mesh; mesh.geometry?.dispose(); if (mesh.material) (Array.isArray(mesh.material) ? mesh.material : [mesh.material]).forEach(material => material.dispose()); });
      handoff.earth = null; cosmos.dispose(); renderer.dispose(); canvas.remove();
    };
  }, { scope: root, dependencies: [failed], revertOnUpdate: true });

  function pause() { control.current.paused = !control.current.paused; control.current.dirty = true; setPaused(control.current.paused); }
  function rotate(amount: number) { control.current.yaw += amount; control.current.dirty = true; }
  function reset() { control.current.yaw = 0; control.current.pitch = 0; control.current.dirty = true; }
  if (failed) return <div className="p08-static"><h2>Continúa con la explicación.</h2><p>La vista 3D no está disponible en este dispositivo. Puedes explorar los mismos hechos en la lectura.</p><a href="#lectura">Leer día, año y semana ↓</a></div>;
  return <div ref={root} className={`p08-scroll${choice === 'bible' ? ' p08-bible-chosen' : ''}`} data-phase="day">
    <div className="p08-stage">
      <div className="p08-caption-stack" ref={captions}>{chapters.map((text, i) => <div key={i} className="p08-caption" aria-hidden={chapter !== i} style={{opacity: i === 0 ? 1 : 0}}><p className="eyebrow">{text[0]}</p><h2>{text[1]}</h2><p>{text[2]}</p><span>{text[3]}</span></div>)}</div>
      <div className="p08-universe" ref={viewport} role="img" aria-label="Modelo de la Tierra, el Sol y su órbita. La explicación completa está disponible después de la escena.">
        <ol className="p08-cards" ref={cards} aria-hidden="true">{Array.from({ length: 7 }, (_, i) => <li key={i}><span>DÍA</span>{i + 1}{i < 6 && <i className="p08-tasks"><b data-urgent={i % 2 === 0} /><b data-urgent={i % 3 === 1} /></i>}</li>)}</ol>
        <canvas ref={sunCover} aria-hidden="true" className="p08-sun-cover" />
      </div>
      <div className="p08-controls">
        <div className="p09-gate"><p>La Biblia da a este ritmo un significado particular. ¿Quieres explorarlo?</p><div><button onClick={() => onChoice('bible')} aria-pressed={choice === 'bible'}>Explorar la perspectiva bíblica</button><button onClick={() => onChoice('close')} aria-pressed={choice === 'close'}>Ir al cierre</button></div>{choice === 'bible' && <p className="p09-six"><small>PERSPECTIVA BÍBLICA · ÉXODO 20:9–10, PARÁFRASIS</small>{sixDays[pausa ?? ''] ?? 'Seis días para todo lo que te ocupa.'} <em>Uno que no se mide en tareas.</em></p>}{choice && <a href="#continuacion">{choice === 'bible' ? 'Continuar con la perspectiva bíblica ↓' : 'Continuar al cierre ↓'}</a>}</div>
        <div className="p08-orbit-controls"><button onClick={pause} aria-pressed={paused}>{paused ? 'Reanudar órbita' : 'Pausar órbita'}</button><button onClick={() => rotate(-.25)} aria-label="Girar perspectiva a la izquierda">←</button><button onClick={() => rotate(.25)} aria-label="Girar perspectiva a la derecha">→</button><button onClick={reset}>Restablecer vista</button></div>
        <p className="p08-drag-hint">Arrastra a los lados para cambiar de perspectiva. Sigue bajando para continuar.</p>
        <p className="p08-scroll-hint">Desplázate para continuar ↓</p>
        <span>Tamaños, distancias y velocidad simplificados.</span>{onReading && <button className="p08-reading-toggle" onClick={onReading}>Leer sin movimiento</button>}<a href="#lectura">Explicación y fuentes ↓</a>
      </div>
    </div>
  </div>;
}
