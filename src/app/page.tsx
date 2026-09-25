import { SiteHeader } from '@/components/site-header';
import { Favorite } from '@/components/favorite';
import Link from 'next/link';

export default function Home() {
  return (
    <>
    <SiteHeader/>
    <main>
      <p className="eyebrow">PRIMERA EXPERIENCIA</p>
      <h1>¿Por qué necesito descansar?</h1>
      <p className="intro">Un espacio para detenerse, descubrir y seguir explorando.</p>
      <aside>
        <h2>La primera experiencia está en preparación.</h2>
        <p>Esta es una vista provisional de Osomi. Aquí iremos dando forma al recorrido, sus historias y sus experimentos.</p>
      </aside>
      <p><Link href="/prototipo/apertura">Comenzar la experiencia →</Link></p>
      <p><Link href="/prototipo/p08">Explorar día, año y semana →</Link></p>
      <p><Link href="/registro">Crear mi cuenta →</Link></p>
      <footer>Vista de desarrollo · Piloto en construcción</footer>
    </main>
    <Favorite fixed/>
    </>
  );
}
