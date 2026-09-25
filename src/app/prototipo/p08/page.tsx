import Link from 'next/link';
import { SiteHeader } from '@/components/site-header';
import { P08Experience } from '@/components/p08/experience';
import './p08.css';

export const metadata = { title: 'Día, año, semana · Osomi' };

export default function P08Page() {
  return <>
    <SiteHeader />
    <main className="p08-page">
      <header className="p08-intro">
        <p className="eyebrow">¿POR QUÉ NECESITO DESCANSAR? · ESTUDIO DE ESCENA 08</p>
        <h1>El tiempo tiene ritmos.<br /><em>Y también significado.</em></h1>
        <p>Un giro. Una vuelta. Siete días. Mira de cerca cómo damos forma al tiempo.</p>
        <a href="#escena">Explorar la escena <span aria-hidden="true">↓</span></a>
      </header>
      <P08Experience />
      <section className="p08-reading" id="lectura" tabIndex={-1}>
        <p className="eyebrow">PARA MIRAR CON MÁS DETALLE</p>
        <h2>Los mismos hechos, a tu ritmo.</h2>
        <article><span>01 / EL DÍA</span><h3>La Tierra gira.</h3><p>La rotación terrestre se relaciona con la alternancia entre día y noche. El día solar medio dura aproximadamente 24 horas. Una vuelta respecto a las estrellas dura cerca de 23 horas y 56 minutos: mientras gira, la Tierra también avanza alrededor del Sol.</p><a href="https://science.nasa.gov/learn/basics-of-space-flight/chapter2-1/" target="_blank" rel="noreferrer">NASA · Día solar y sideral ↗</a></article>
        <article><span>02 / EL AÑO</span><h3>La Tierra recorre una órbita.</h3><p>Una vuelta alrededor del Sol dura aproximadamente 365¼ días. En la escena puedes cambiar tu punto de vista; no alteras la trayectoria de la Tierra. Tamaños, distancias y velocidad están simplificados para explicar el movimiento.</p><a href="https://science.nasa.gov/earth/facts/" target="_blank" rel="noreferrer">NASA · Datos de la Tierra ↗</a></article>
        <article><span>03 / LA SEMANA</span><h3>Un ritmo de calendario.</h3><p>La semana de siete días no representa una vuelta de la Tierra de siete días. Su historia incluye tradiciones culturales y religiosas, entre ellas la semana del sábado y la semana planetaria. Las siete fichas representan un calendario, no cuerpos celestes.</p><a href="https://www.ucl.ac.uk/arts-humanities/hebrew-jewish/hjs-research/research-projects-hjs/calendars-late-antiquity-and-middle-ages-standardization-and-fixation/seven-day-week-roman-empire-and-near-east" target="_blank" rel="noreferrer">UCL · Historia de la semana ↗</a></article>
      </section>
      <footer className="p08-outro"><p className="eyebrow">UNA PREGUNTA PARA LLEVAR CONTIGO</p><h2>Medimos el paso del tiempo.<br />¿Qué significado queremos darle?</h2><Link href="/">Volver al tema →</Link></footer>
    </main>
  </>;
}
