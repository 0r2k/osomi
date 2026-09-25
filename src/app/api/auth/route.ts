import { createClient } from '@/lib/supabase/server';
import { finishSignIn,verifiedUser } from '@/lib/preferences';
import { ApiError,failure,input,json,rateLimit,siteOrigin } from '@/lib/http';
import { validEmail,validPassword } from '@/lib/auth-input.mjs';
export async function POST(request:Request){
 try{
  const body=await input(request);const action=body.action;const client=await createClient();
  if(typeof action!=='string'||!['signup','login','recover','google','signout','password','reconcile'].includes(action))throw new ApiError(400,'Acción no válida.');
  rateLimit(request,'auth:'+action,action==='recover'||action==='signup'?5:20,action==='recover'||action==='signup'?900000:60000);
  if(action==='google'){
   const {data,error}=await client.auth.signInWithOAuth({provider:'google',options:{redirectTo:siteOrigin+'/auth/callback',queryParams:{prompt:'select_account'}}});
   if(error||!data.url)throw new ApiError(503,'No pudimos abrir Google. Inténtalo de nuevo.');return json({url:data.url});
  }
  if(action==='signout'){const {error}=await client.auth.signOut({scope:'local'});if(error)throw new ApiError(503,'No pudimos cerrar la sesión.');return json({redirect:'/'});}
  if(action==='reconcile'){await finishSignIn();return json({redirect:'/mi-cuenta'});}
  if(action==='password'){
   if(!validPassword(body.password))throw new ApiError(400,'Usa una contraseña de entre 10 y 128 caracteres.');
   const {user}=await verifiedUser();if(!user)throw new ApiError(401,'Abre de nuevo el enlace de recuperación.');
   const {error}=await client.auth.updateUser({password:body.password as string});
   if(error)throw new ApiError(400,'No se pudo actualizar. Prueba otra contraseña o solicita un enlace nuevo.');
   await client.auth.signOut({scope:'local'});return json({redirect:'/acceso?updated=1'});
  }
  const email=typeof body.email==='string'?body.email.trim():'';
  if(!validEmail(email))throw new ApiError(400,'Escribe un correo electrónico válido.');
  if(action==='recover'){
   const {error}=await client.auth.resetPasswordForEmail(email,{redirectTo:siteOrigin+'/auth/callback?next=/actualizar-contrasena'});
   if(error&&error.status===429)throw new ApiError(429,'Espera unos minutos antes de pedir otro enlace.');
   if(error)throw new ApiError(503,'No pudimos solicitar el correo de recuperación. Inténtalo más tarde.');
   return json({message:'Si hay una cuenta asociada a ese correo, recibirás un enlace para crear una nueva contraseña.'});
  }
  if(typeof body.password!=='string'||(action==='signup'?!validPassword(body.password):!body.password.length||body.password.length>128))throw new ApiError(400,'Revisa la contraseña. Para registrarte, usa entre 10 y 128 caracteres.');
  if(action==='signup'){
   const {data,error}=await client.auth.signUp({email,password:body.password,options:{emailRedirectTo:siteOrigin+'/auth/callback'}});
   if(error)throw new ApiError(error.status===429?429:400,error.status===429?'Espera unos minutos antes de solicitar otro correo.':'No pudimos completar el registro. Revisa los datos o intenta recuperar tu cuenta.');
   if(data.session){await finishSignIn();return json({redirect:'/mi-cuenta'});}
   return json({message:'Revisa tu correo para confirmar la cuenta. Si ya tenías una cuenta, puedes ingresar o recuperar tu contraseña.'});
  }
  const {error}=await client.auth.signInWithPassword({email,password:body.password});
  if(error)throw new ApiError(400,'No pudimos ingresar. Revisa el correo y la contraseña; si acabas de registrarte, confirma primero tu correo.');
  try{await finishSignIn();}catch{return json({redirect:'/mi-cuenta?sync=pending'});}
  return json({redirect:'/mi-cuenta'});
 }catch(error){return failure(error);}
}
