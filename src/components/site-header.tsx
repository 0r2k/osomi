import Link from 'next/link';
import { brand } from '@/lib/brand';
export function SiteHeader(){return <header className="site-header"><Link className="wordmark" href="/">{brand.name}<span>{brand.tagline}</span></Link><Link href="/mi-cuenta">Mi cuenta</Link></header>;}
