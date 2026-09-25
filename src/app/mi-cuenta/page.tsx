import { redirect } from 'next/navigation';
import Link from 'next/link';
import { SiteHeader } from '@/components/site-header';
import { AccountActions } from '@/components/account-actions';
import { Favorite } from '@/components/favorite';
import { verifiedUser } from '@/lib/preferences';
export default async function Page({searchParams}:{searchParams:Promise<{sync?:string}>}){
 const {user}=await verifiedUser();if(!user)redirect('/acceso');const params=await searchParams;
 return <><SiteHeader/><main className="account-page"><p className="eyebrow">MI CUENTA</p><h1>Tu curiosidad continúa.</h1><p className="intro">Has ingresado como {user.email}.</p><section className="topic-card"><p className="eyebrow">PRIMERA EXPERIENCIA · EN PREPARACIÓN</p><h2>¿Por qué necesito descansar?</h2><Favorite/><Link href="/">Volver al tema →</Link></section><AccountActions pending={params.sync==='pending'}/></main></>;
}
