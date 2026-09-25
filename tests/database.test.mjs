import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';
let db;
const userA='10000000-0000-0000-0000-000000000001', userB='10000000-0000-0000-0000-000000000002';
const topic='20000000-0000-0000-0000-000000000001', visitor='30000000-0000-0000-0000-000000000001';
const hash='a'.repeat(64);
before(async()=>{
 db=new PGlite();
 await db.exec(`create role anon nologin; create role authenticated nologin; create role service_role nologin bypassrls;
 create schema auth; create table auth.users(id uuid primary key);
 create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
 grant usage on schema auth to anon,authenticated,service_role;
 insert into auth.users values ('${userA}'),('${userB}');`);
 const files=await readdir(new URL('../supabase/migrations/',import.meta.url)).catch(()=>[]);
 assert.ok(files.some(f=>f.endsWith('.sql')),'Debe existir al menos una migración SQL');
 for(const f of files.filter(f=>f.endsWith('.sql')).sort()) await db.exec(await readFile(new URL('../supabase/migrations/'+f,import.meta.url),'utf8'));
 await db.exec(`insert into public.experiences(id,slug,title,is_entry) values ('${topic}','test-descanso','¿Por qué necesito descansar?',true)`);
});
after(async()=>{await db?.close()});
async function as(role,user,sql,args=[]){
 await db.exec(`set role ${role}; select set_config('request.jwt.claim.sub','${user??''}',false)`);
 try{return await db.query(sql,args)}finally{await db.exec('reset role')}
}
test('los perfiles no se exponen entre usuarios',async()=>{
 await as('authenticated',userA,'insert into public.profiles(user_id,display_name) values ($1,$2)',[userA,'A']);
 assert.equal((await as('authenticated',userB,'select * from public.profiles')).rows.length,0);
 await assert.rejects(as('authenticated',userB,'insert into public.profiles(user_id,display_name) values ($1,$2)',[userA,'Intruso']));
 await assert.rejects(as('anon',null,'select * from public.profiles'));
});
test('RPC de servidor y tablas privadas no se pueden invocar desde usuario',async()=>{
 await assert.rejects(as('authenticated',userA,'select * from private.visitors'));
 await assert.rejects(as('anon',null,'select public.create_visitor($1,$2,$3)',[visitor,hash,new Date(Date.now()+86400000).toISOString()]));
});
test('like anónimo conserva ID al reclamar, sin duplicar ni reactivar',async()=>{
 await as('service_role',null,'select public.create_visitor($1,$2,$3)',[visitor,hash,new Date(Date.now()+86400000).toISOString()]);
 const set=await as('service_role',null,'select public.set_visitor_preference($1,$2,$3,$4,$5,$6) as result',[visitor,hash,topic,true,0,crypto.randomUUID()]);
 const original=set.rows[0].result;
 const read=await as('service_role',null,'select public.read_visitor_preferences($1,$2) as result',[visitor,hash]);
 assert.equal(read.rows[0].result[0].id,original.id);
 await assert.rejects(as('authenticated',userA,'select public.read_visitor_preferences($1,$2)',[visitor,hash]));
 await assert.rejects(as('service_role',null,'select public.read_visitor_preferences($1,$2)',[visitor,'f'.repeat(64)]));
 await assert.rejects(as('service_role',null,'select public.claim_visitor_preferences($1,$2,$3,$4)',[visitor,'b'.repeat(64),userA,crypto.randomUUID()]));
 const request=crypto.randomUUID();
 const claim=await as('service_role',null,'select public.claim_visitor_preferences($1,$2,$3,$4) as result',[visitor,hash,userA,request]);
 const retry=await as('service_role',null,'select public.claim_visitor_preferences($1,$2,$3,$4) as result',[visitor,hash,userA,request]);
 assert.deepEqual(claim.rows,retry.rows);
 const rows=(await as('authenticated',userA,'select id,active,visitor_id from public.topic_preferences')).rows;
 assert.equal(rows.length,1);assert.equal(rows[0].id,original.id);assert.equal(rows[0].visitor_id,null);
 assert.equal((await as('authenticated',userB,'select * from public.topic_preferences')).rows.length,0);
 await assert.rejects(as('service_role',null,'select public.claim_visitor_preferences($1,$2,$3,$4)',[visitor,hash,userB,crypto.randomUUID()]));
 await assert.rejects(as('service_role',null,'select public.set_visitor_preference($1,$2,$3,$4,$5,$6)',[visitor,hash,topic,false,1,crypto.randomUUID()]));
});
test('preferencia: revisión e idempotencia impiden revertir elecciones nuevas',async()=>{
 const current=(await as('authenticated',userA,'select revision from public.topic_preferences')).rows[0];
 const request=crypto.randomUUID();
 const first=await as('authenticated',userA,'select public.set_topic_preference($1,$2,$3,$4) as result',[topic,false,current.revision,request]);
 await as('authenticated',userA,'select public.set_topic_preference($1,$2,$3,$4)',[topic,true,first.rows[0].result.revision,crypto.randomUUID()]);
 await as('authenticated',userA,'select public.set_topic_preference($1,$2,$3,$4)',[topic,false,current.revision,request]);
 assert.equal((await as('authenticated',userA,'select active from public.topic_preferences')).rows[0].active,true);
 await assert.rejects(as('authenticated',userA,'select public.set_topic_preference($1,$2,$3,$4)',[topic,false,current.revision,crypto.randomUUID()]));
 await assert.rejects(as('authenticated',userA,'select public.set_topic_preference($1,$2,$3,$4)',[topic,true,current.revision,request]));
});
test('una elección anónima posterior de desmarcar gana al fusionar',async()=>{
 const v=crypto.randomUUID();
 await as('service_role',null,'select public.create_visitor($1,$2,$3)',[v,'c'.repeat(64),new Date(Date.now()+86400000).toISOString()]);
 await as('service_role',null,'select public.set_visitor_preference($1,$2,$3,$4,$5,$6)',[v,'c'.repeat(64),topic,false,0,crypto.randomUUID()]);
 await as('service_role',null,'select public.claim_visitor_preferences($1,$2,$3,$4)',[v,'c'.repeat(64),userA,crypto.randomUUID()]);
 const rows=(await as('authenticated',userA,'select active from public.topic_preferences')).rows;
 assert.equal(rows.length,1);assert.equal(rows[0].active,false);
});
