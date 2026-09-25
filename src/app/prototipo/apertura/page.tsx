import { SiteHeader } from '@/components/site-header';
import { Favorite } from '@/components/favorite';
import { Opening } from '@/components/apertura/opening';
import './apertura.css';

export const metadata = { title: '¿Por qué necesito descansar? · Osomi' };

export default function AperturaPage() {
  return <>
    <SiteHeader />
    <main className="opening-page"><Opening /></main>
    <Favorite fixed />
  </>;
}
