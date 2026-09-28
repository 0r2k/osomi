import Link from 'next/link';
import { SiteHeader } from '@/components/site-header';
import { legal } from '@/lib/legal';
export function LegalPage({title,children}:{title:string;children:React.ReactNode}){
 return <><SiteHeader/><main className="legal"><p className="eyebrow">{legal.brand.toUpperCase()}</p><h1>{title}</h1><p className="legal-date">Última actualización: {legal.updated}</p>{children}<footer><Link href="/">Volver al inicio</Link> · <Link href="/privacidad">Política de privacidad</Link> · <Link href="/terminos">Términos de servicio</Link></footer></main></>;
}
export function Contact(){return <a href={'mailto:'+legal.contactEmail}>{legal.contactEmail}</a>;}
