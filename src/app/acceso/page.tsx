import { AuthForm } from '@/components/auth-form';
import { SiteHeader } from '@/components/site-header';
export default async function Page({searchParams}:{searchParams:Promise<{error?:string;updated?:string}>}){const params=await searchParams;const notice=params.error?'El acceso no se completó o el enlace venció. Puedes intentarlo otra vez.':params.updated?'Contraseña actualizada. Ya puedes ingresar.':undefined;return <><SiteHeader/><main className="auth-layout"><AuthForm mode="login" notice={notice}/></main></>;}
