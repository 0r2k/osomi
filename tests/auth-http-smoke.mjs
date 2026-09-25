import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {createClient} from '@supabase/supabase-js';
if (process.env.OSOMI_REMOTE_TEST !== '1') throw new Error('Set OSOMI_REMOTE_TEST=1 to create and delete a disposable development account.');
process.loadEnvFile('.env');
const admin=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.SUPABASE_SECRET_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
const origin='http://localhost:3100', jar=new Map();
async function req(path,body,override={}){const r=await fetch(origin+path,{redirect:'manual',headers:{origin,'content-type':'application/json',cookie:[...jar].map(([k,v])=>k+'='+v).join('; '),...override},...(body?{method:'POST',body:JSON.stringify(body)}:{})});for(const c of r.headers.getSetCookie()){const pair=c.split(';')[0],i=pair.indexOf('=');jar.set(pair.slice(0,i),pair.slice(i+1));}return r;}
async function post(path,body){const r=await req(path,body);const d=await r.json();assert.equal(r.status,200,JSON.stringify(d));return d;}
let userId;
try{
 assert.equal((await req('/mi-cuenta')).status,307);
 assert.equal((await req('/api/preferences',{action:'initialize'},{origin:'https://invalid.example'})).status,403);
 const init=await req('/api/preferences',{action:'initialize'});assert.equal(init.status,200);assert(init.headers.getSetCookie().some(c=>/HttpOnly/i.test(c)));
 const like=await post('/api/preferences',{active:true,revision:0,requestId:randomUUID()});assert.equal(like.active,true);
 const before=await (await req('/api/preferences')).json();assert.equal(before.active,true);assert.equal(before.registered,false);
 const email='osomi-qa-'+randomUUID()+'@example.invalid',password=randomUUID()+'aA!';
 const created=await admin.auth.admin.createUser({email,password,email_confirm:true});assert.ifError(created.error);userId=created.data.user.id;
 const login=await post('/api/auth',{action:'login',email,password});assert.equal(login.redirect,'/mi-cuenta');
 const after=await (await req('/api/preferences')).json();assert.equal(after.active,true);assert.equal(after.registered,true);assert.equal(after.id,before.id);
 await post('/api/auth',{action:'reconcile'});
 const rows=await admin.from('topic_preferences').select('id').eq('user_id',userId);assert.ifError(rows.error);assert.equal(rows.data.length,1);
 assert.equal((await req('/api/preferences',{active:false,revision:0,requestId:randomUUID()})).status,409);
 const updated=await post('/api/preferences',{active:false,revision:after.revision,requestId:randomUUID()});assert.equal(updated.active,false);
 const account=await req('/mi-cuenta');assert.equal(account.status,200);assert.match(account.headers.get('cache-control'),/no-store/);
 await post('/api/auth',{action:'signout'});
 const link=await admin.auth.admin.generateLink({type:'recovery',email});assert.ifError(link.error);
 const recovery=await req('/auth/confirm?type=recovery&token_hash='+encodeURIComponent(link.data.properties.hashed_token));assert.equal(new URL(recovery.headers.get('location')).pathname,'/actualizar-contrasena');
 const nextPassword=randomUUID()+'bB!';await post('/api/auth',{action:'password',password:nextPassword});
 await post('/api/auth',{action:'login',email,password:nextPassword});await post('/api/auth',{action:'signout'});
 const google=await post('/api/auth',{action:'google'});const url=new URL(google.url);assert.equal(url.searchParams.get('provider'),'google');assert.equal(url.searchParams.get('redirect_to'),origin+'/auth/callback');
 const provider=await fetch(google.url,{redirect:'manual'});const destination=new URL(provider.headers.get('location'));assert.equal(destination.hostname,'accounts.google.com');
 console.log('PASS: origin, HttpOnly, anonymous persistence, real login, same favorite ID, idempotent claim, stale revision, private cache, recovery token, new password, signout, Google provider redirect.');
}finally{if(userId){const deleted=await admin.auth.admin.deleteUser(userId);assert.ifError(deleted.error);console.log('Disposable Auth account removed.');}}
