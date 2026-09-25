import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { safeNext } from '@/lib/auth-input.mjs';
import { siteOrigin } from '@/lib/http';
import { finishSignIn } from '@/lib/preferences';
export async function GET(request:Request){
 const params=new URL(request.url).searchParams;const code=params.get('code');
 const next=safeNext(params.get('next'));
 const redirect=(path:string)=>NextResponse.redirect(new URL(path,siteOrigin),{headers:{'Cache-Control':'private, no-store','Referrer-Policy':'no-referrer'}});
 if(!code||params.has('error'))return redirect('/acceso?error=callback');
 const client=await createClient();const {error}=await client.auth.exchangeCodeForSession(code);
 if(error)return redirect('/acceso?error=callback');
 if(next==='/actualizar-contrasena')return redirect(next);
 try{await finishSignIn();}catch{return redirect('/mi-cuenta?sync=pending');}
 return redirect(next);
}
