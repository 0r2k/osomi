import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { siteOrigin } from '@/lib/http';
import { finishSignIn } from '@/lib/preferences';
export async function GET(request:Request){
 const params=new URL(request.url).searchParams;const token=params.get('token_hash');const type=params.get('type');
 const redirect=(path:string)=>NextResponse.redirect(new URL(path,siteOrigin),{headers:{'Cache-Control':'private, no-store','Referrer-Policy':'no-referrer'}});
 if(!token||!['signup','recovery'].includes(type??''))return redirect('/acceso?error=callback');
 const client=await createClient();const {error}=await client.auth.verifyOtp({token_hash:token,type:type as 'signup'|'recovery'});
 if(error)return redirect('/acceso?error=callback');
 if(type==='recovery')return redirect('/actualizar-contrasena');
 try{await finishSignIn();}catch{return redirect('/mi-cuenta?sync=pending');}
 return redirect('/mi-cuenta');
}
