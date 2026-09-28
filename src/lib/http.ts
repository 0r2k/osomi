import 'server-only';
import { createHash } from 'node:crypto';
import { NextResponse } from 'next/server';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
export const siteOrigin=process.env.APP_ORIGIN || 'http://localhost:3100';
export class ApiError extends Error { constructor(public status:number,message:string){super(message);} }
export function json(value:unknown,status=200){return NextResponse.json(value,{status,headers:{'Cache-Control':'private, no-store','Referrer-Policy':'no-referrer'}});}
export function failure(error:unknown){return json({error:error instanceof ApiError?error.message:'No pudimos completar la solicitud. Inténtalo de nuevo.'},error instanceof ApiError?error.status:503);}
export async function input(request:Request):Promise<Record<string,unknown>> {
 if(request.headers.get('origin')!==siteOrigin) throw new ApiError(403,'La solicitud no procede de Osomi.');
 if(!request.headers.get('content-type')?.startsWith('application/json')) throw new ApiError(415,'Formato de solicitud no válido.');
 const declared=Number(request.headers.get('content-length'));
 if(declared>4096) throw new ApiError(413,'La solicitud es demasiado grande.');
 const reader=request.body?.getReader(); let text=''; let bytes=0;
 if(!reader) throw new ApiError(400,'Faltan datos.');
 const decoder=new TextDecoder();
 while(true){const part=await reader.read(); if(part.done)break; bytes+=part.value.byteLength; if(bytes>4096){await reader.cancel();throw new ApiError(413,'La solicitud es demasiado grande.');} text+=decoder.decode(part.value,{stream:true});}
 try{const value=JSON.parse(text+decoder.decode());if(!value||Array.isArray(value)||typeof value!=='object')throw new Error();return value;}catch{throw new ApiError(400,'Datos no válidos.');}
}
// Shared limiter (Upstash Redis, works across serverless instances). Without credentials it falls back to a per-process guard, fine for local development only.
const redisUrl=process.env.UPSTASH_REDIS_REST_URL||process.env.KV_REST_API_URL;
const redisToken=process.env.UPSTASH_REDIS_REST_TOKEN||process.env.KV_REST_API_TOKEN;
const redis=redisUrl&&redisToken?new Redis({url:redisUrl,token:redisToken}):null;
if(!redis&&process.env.NODE_ENV==='production')console.warn('rateLimit: sin credenciales de Upstash; el límite es solo por instancia.');
const limiters=new Map<string,Ratelimit>();
function limiterFor(client:Redis,limit:number,windowMs:number){
 const id=limit+':'+windowMs;let limiter=limiters.get(id);
 if(!limiter){limiter=new Ratelimit({redis:client,limiter:Ratelimit.slidingWindow(limit,`${windowMs} ms`),prefix:'osomi:rl:'+id});limiters.set(id,limiter);}
 return limiter;
}
const buckets=new Map<string,{count:number;until:number}>();
function localLimit(key:string,limit:number,windowMs:number){
 const now=Date.now();
 if(buckets.size>2000)for(const [k,v] of buckets)if(v.until<=now)buckets.delete(k);
 if(buckets.size>10000)throw new ApiError(429,'Hay muchas solicitudes. Inténtalo más tarde.');
 const entry=buckets.get(key);
 if(entry&&entry.until>now){if(entry.count>=limit)throw new ApiError(429,'Espera un momento antes de intentarlo otra vez.');entry.count++;}
 else buckets.set(key,{count:1,until:now+windowMs});
}
export async function rateLimit(request:Request,action:string,limit=20,windowMs=60_000){
 const ip=request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()||'local';
 const key=createHash('sha256').update(ip+':'+action).digest('hex');
 if(!redis)return localLimit(key,limit,windowMs);
 let allowed=true;
 try{allowed=(await limiterFor(redis,limit,windowMs).limit(key)).success;}
 catch(error){console.error('rateLimit: Upstash no respondió; se deja pasar la solicitud.',error);return;}
 if(!allowed)throw new ApiError(429,'Espera un momento antes de intentarlo otra vez.');
}
