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
      <footer className="p08-outro"><p className="eyebrow">UNA PREGUNTA PARA LLEVAR CONTIGO</p><h2>Medimos el paso del tiempo.<br />¿Qué significado queremos darle?</h2><Link href="/">Volver al tema →</Link></footer>
    </main>
  </>;
}
