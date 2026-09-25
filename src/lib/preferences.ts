import 'server-only';
import { cookies } from 'next/headers';
import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { createClient } from './supabase/server';
import { createAdminClient } from './supabase/admin';
import { parseVisitor } from './auth-input.mjs';
import { ApiError, siteOrigin } from './http';
export const pilotId='6c756361-7269-4000-8000-000000000001';
const cookieName='lucarit_visitor';
const hash=(secret:string)=>createHash('sha256').update(secret).digest('hex');
export async function verifiedUser(){
 const client=await createClient();const {data,error}=await client.auth.getUser();
 if(error&&error.name!=='AuthSessionMissingError')throw new ApiError(503,'No pudimos verificar tu sesión. Inténtalo de nuevo.');
 return {client,user:data.user};
}
export async function visitor(){return parseVisitor((await cookies()).get(cookieName)?.value);}
export async function initializeVisitor(){
 const current=await visitor();if(current)return;
 const value={id:randomUUID(),secret:randomBytes(32).toString('hex')};
 const {error}=await createAdminClient().rpc('create_visitor',{p_id:value.id,p_hash:hash(value.secret),p_expires:new Date(Date.now()+30*86400000).toISOString()});
 if(error)throw new ApiError(503,'No pudimos preparar el guardado. Inténtalo de nuevo.');
 (await cookies()).set(cookieName,value.id+'.'+value.secret,{httpOnly:true,secure:siteOrigin.startsWith('https:'),sameSite:'lax',path:'/',maxAge:30*86400});
}
export async function reconcile(userId:string){
 const value=await visitor();if(!value)return;
 const {error}=await createAdminClient().rpc('claim_visitor_preferences',{p_visitor:value.id,p_hash:hash(value.secret),p_user:userId,p_request:value.id});
 if(error){
  if(error.message.includes('invalid visitor')||error.message.includes('already claimed')||error.message.includes('request reused')){
   (await cookies()).delete(cookieName);return;
  }
  throw new ApiError(503,'Entraste en tu cuenta, pero falta sincronizar tu favorito. Puedes reintentar sin perderlo.');
 }
 (await cookies()).delete(cookieName);
}
export async function finishSignIn(){
 const {client,user}=await verifiedUser();if(!user)throw new ApiError(401,'Inicia sesión para continuar.');
 const {error}=await client.from('profiles').upsert({user_id:user.id},{onConflict:'user_id',ignoreDuplicates:true});
 if(error)throw new ApiError(503,'Tu cuenta está creada; falta preparar el perfil. Inténtalo de nuevo.');
 await reconcile(user.id);
}
export async function readPreference(){
 const {client,user}=await verifiedUser();
 if(user){await reconcile(user.id);const {data,error}=await client.from('topic_preferences').select('id,active,revision').eq('user_id',user.id).eq('experience_id',pilotId).maybeSingle();if(error)throw new ApiError(503,'No pudimos leer el favorito.');return {...(data??{active:false,revision:0}),registered:true};}
 const value=await visitor();if(!value)return {active:false,revision:0,registered:false};
 const {data,error}=await createAdminClient().rpc('read_visitor_preferences',{p_visitor:value.id,p_hash:hash(value.secret)});
 if(error){if(error.message.includes('invalid visitor')){(await cookies()).delete(cookieName);return {active:false,revision:0,registered:false};}throw new ApiError(503,'No pudimos leer el favorito.');}
 const rows=data as {id:string;experience_id:string;active:boolean;revision:number}[];
 return {...(rows.find(row=>row.experience_id===pilotId)??{active:false,revision:0}),registered:false};
}
export async function writePreference(active:boolean,revision:number,requestId:string){
 const {client,user}=await verifiedUser();let result;
 if(user){await reconcile(user.id);result=await client.rpc('set_topic_preference',{p_topic:pilotId,p_active:active,p_revision:revision,p_request:requestId});}
 else{const value=await visitor();if(!value)throw new ApiError(409,'Recarga la página para preparar el guardado.');result=await createAdminClient().rpc('set_visitor_preference',{p_visitor:value.id,p_hash:hash(value.secret),p_topic:pilotId,p_active:active,p_revision:revision,p_request:requestId});}
 if(result.error){if(result.error.message.includes('stale revision'))throw new ApiError(409,'El favorito cambió en otra pestaña. Revisa su estado e inténtalo otra vez.');throw new ApiError(503,'No pudimos guardar tu elección. Inténtalo de nuevo.');}
 return result.data;
}
