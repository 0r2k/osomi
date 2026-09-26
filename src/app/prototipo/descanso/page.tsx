import { SiteHeader } from '@/components/site-header';
import { Favorite } from '@/components/favorite';
import { DescansoExperience } from '@/components/descanso/experience';
import './opening.css';
import '../p08/p08.css';
import './descanso.css';

export const metadata = { title: '¿Por qué necesito descansar? · Osomi' };

export default function DescansoPage() {
  return <>
    <SiteHeader />
    <main className="opening-page p08-page">
      <DescansoExperience />
    </main>
    <Favorite fixed />
  </>;
}
