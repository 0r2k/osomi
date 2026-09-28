// El libro "mira" hacia el cursor: de frente cuando el cursor está cerca de su centro y girado,
// sin exagerar, cuando se aleja. Solo con ratón; en pantallas táctiles no hay cursor que seguir.
export function tiltTowardCursor(el: HTMLElement | null, maxY: number, maxX: number, reach = 520, target: HTMLElement | null = el, idle = { ry: -14, rx: 5 }) {
  if (!el || !target || !window.matchMedia('(hover: hover) and (pointer: fine)').matches || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  let frame = 0, px = 0, py = 0;
  const apply = () => {
    frame = 0;
    const r = el.getBoundingClientRect();
    const dx = (px - (r.left + r.width / 2)) / reach, dy = (py - (r.top + r.height / 2)) / reach;
    const clampUnit = (v: number) => Math.max(-1, Math.min(1, v));
    target.style.setProperty('--ry', `${(clampUnit(dx) * maxY).toFixed(2)}deg`);
    target.style.setProperty('--rx', `${(-clampUnit(dy) * maxX).toFixed(2)}deg`);
  };
  const onMove = (e: PointerEvent) => {
    if (e.pointerType !== 'mouse') return;
    px = e.clientX; py = e.clientY;
    if (!frame) frame = requestAnimationFrame(apply);
  };
  const onLeave = () => { target.style.setProperty('--ry', `${idle.ry}deg`); target.style.setProperty('--rx', `${idle.rx}deg`); };
  window.addEventListener('pointermove', onMove);
  document.addEventListener('pointerleave', onLeave);
  return () => { window.removeEventListener('pointermove', onMove); document.removeEventListener('pointerleave', onLeave); cancelAnimationFrame(frame); };
}
