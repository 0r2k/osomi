import { redirect } from 'next/navigation';
import { AuthForm } from '@/components/auth-form';
import { SiteHeader } from '@/components/site-header';
import { verifiedUser } from '@/lib/preferences';
export default async function Page(){const {user}=await verifiedUser();if(!user)redirect('/recuperar');return <><SiteHeader/><main className="auth-layout"><AuthForm mode="password"/></main></>;}
