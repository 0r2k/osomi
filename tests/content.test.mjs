import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';
let db;
const a=crypto.randomUUID(), b=crypto.randomUUID(), topic=crypto.randomUUID(), other=crypto.randomUUID(), version=crypto.randomUUID(), draft=crypto.randomUUID();
async function as(role,user,sql,args=[]){
 await db.exec(`set role ${role}`);
 await db.query("select set_config('request.jwt.claim.sub',$1,false)",[user??'']);
 try{return await db.query(sql,args)}finally{await db.exec('reset role')}
}
before(async()=>{
 db=new PGlite();
 await db.exec(`create role anon nologin; create role authenticated nologin; create role service_role nologin bypassrls;
 create schema auth; create table auth.users(id uuid primary key);
 create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
 grant usage on schema auth to anon,authenticated,service_role;
 alter default privileges in schema public grant all on tables to anon,authenticated,service_role;
 insert into auth.users values('${a}'),('${b}');`);
 for(const f of (await readdir(new URL('../supabase/migrations',import.meta.url))).filter(f=>f.endsWith('.sql')).sort()) await db.exec(await readFile(new URL('../supabase/migrations/'+f,import.meta.url),'utf8'));
 await db.query("insert into public.experiences(id,slug,title,visibility) values($1,'test-entry','Entry','listed'),($2,'test-hidden','Hidden','hidden')",[topic,other]);
 await db.query("insert into public.experience_versions(id,experience_id,version,content_path,content_hash) values($1,$2,1,'content/test/v1.json',$3),($4,$5,1,'content/hidden/v1.json',$3)",[version,topic,'a'.repeat(64),draft,other]);
 await db.query("insert into public.scene_manifest values($1,'P01',1,'narrative'),($1,'P12',2,'closing')",[version]);
 await db.query("update public.experience_versions set status='published' where id=$1",[version]);
 await db.query('update public.experiences set published_version_id=$1 where id=$2',[version,topic]);
});
after(async()=>await db?.close());
test('catálogo: borradores y temas ocultos no se filtran',async()=>{
 const visible=(await as('anon',null,'select id from public.experiences')).rows.map(x=>x.id); assert.ok(visible.includes(topic)); assert.ok(!visible.includes(other));
 assert.deepEqual((await as('anon',null,'select id from public.experience_versions')).rows.map(x=>x.id),[version]);
 assert.equal((await as('anon',null,'select * from public.scene_manifest')).rows.length,2);
 await assert.rejects(as('authenticated',a,"update public.experiences set title='altered'"),/permission denied/);
});
test('publicación: no cruza experiencias ni permite modificar una edición publicada',async()=>{
 await assert.rejects(db.query('update public.experiences set published_version_id=$1 where id=$2',[version,other]));
 await assert.rejects(db.query("update public.experience_versions set content_hash=$1 where id=$2",['b'.repeat(64),version]),/immutable/);
 await assert.rejects(db.query("update public.scene_manifest set kind='interaction' where version_id=$1",[version]),/immutable/);
 await assert.rejects(db.query("insert into public.scene_manifest values($1,'P13',3,'closing')",[version]),/immutable/);
 await assert.rejects(db.query("update public.experience_versions set status='published' where id=$1",[draft]),/manifest/);
});
test('notas: aislamiento de lectura, modificación y borrado; revisión obsoleta no escribe',async()=>{
 const note=(await as('authenticated',a,'insert into public.notes(version_id,scene_key,body) values($1,$2,$3) returning id,revision',[version,'P01','Mi nota'])).rows[0];
 assert.equal((await as('authenticated',b,'select * from public.notes')).rows.length,0);
 assert.equal((await as('authenticated',b,"update public.notes set body='Intruso' where id=$1 returning id",[note.id])).rows.length,0);
 assert.equal((await as('authenticated',b,'delete from public.notes where id=$1 returning id',[note.id])).rows.length,0);
 await assert.rejects(as('authenticated',b,'insert into public.notes(user_id,version_id,body) values($1,$2,$3)',[a,version,'Intruso']));
 await assert.rejects(as('authenticated',a,'update public.notes set user_id=$1 where id=$2',[b,note.id]),/permission denied/);
 await assert.rejects(as('authenticated',a,'update public.notes set revision=50 where id=$1',[note.id]),/permission denied/);
 const changed=await as('authenticated',a,"update public.notes set body='Nueva' where id=$1 and revision=$2 returning revision",[note.id,note.revision]);
 assert.equal(changed.rows[0].revision,2);
 assert.equal((await as('authenticated',a,"update public.notes set body='Vieja' where id=$1 and revision=$2 returning id",[note.id,note.revision])).rows.length,0);
 await assert.rejects(as('anon',null,'select * from public.notes'),/permission denied/);
 assert.equal((await as('authenticated',a,'delete from public.notes where id=$1 returning id',[note.id])).rows.length,1);
});
test('progreso: versión y escena válidas, propietario fijo y borrado de cuenta',async()=>{
 await assert.rejects(as('authenticated',a,"insert into public.experience_progress(version_id,last_scene_key) values($1,'missing')",[version]));
 await assert.rejects(as('authenticated',a,'insert into public.notes(version_id,body) values($1,$2)',[draft,'No publicada']));
 await as('authenticated',a,"insert into public.experience_progress(version_id,last_scene_key) values($1,'P01')",[version]);
 assert.equal((await as('authenticated',b,'select * from public.experience_progress')).rows.length,0);
 await assert.rejects(as('authenticated',a,"update public.experience_progress set status='invented'"));
 await as('authenticated',a,"update public.experience_progress set status='completed',last_scene_key='P12',biblical_choice='skipped' where revision=1");
 assert.equal((await as('authenticated',a,'select revision from public.experience_progress')).rows[0].revision,2);
});
test('operación privada: sin acceso directo ni vínculo entre preguntas e identidad',async()=>{
 for(const role of ['anon','authenticated']) for(const table of ['question_threads','question_messages','contact_requests','staff_roles','operation_audit','analytics_events']){
  await assert.rejects(as(role,a,`select * from private.${table}`),/permission denied/);
 }
 const columns=(await db.query("select column_name from information_schema.columns where table_schema='private' and table_name='question_threads'")).rows.map(x=>x.column_name);
 assert.ok(!columns.includes('user_id')&&!columns.includes('visitor_id')&&!columns.includes('session_id'));
 const q=crypto.randomUUID();
 await as('service_role',null,'insert into private.question_threads(id,secret_hash) values($1,$2)',[q,'d'.repeat(64)]);
 await assert.rejects(as('service_role',null,"insert into private.question_messages(thread_id,author_kind,body,request_id) values($1,'staff','Respuesta',$2)",[q,crypto.randomUUID()]));
 await as('service_role',null,"insert into private.question_messages(thread_id,author_kind,body,request_id) values($1,'visitor','Pregunta',$2)",[q,crypto.randomUUID()]);
 await as('service_role',null,'delete from private.question_threads where id=$1',[q]);
 assert.equal((await db.query('select * from private.question_messages where thread_id=$1',[q])).rows.length,0);
 await assert.rejects(as('service_role',null,"insert into private.analytics_events(event_key,event_name,session_id,version_id,consent_version,props) values($1,'scene_view',$2,$3,'v1',$4)",[crypto.randomUUID(),crypto.randomUUID(),version,{email:'private@example.test'}]));
});
test('borrado de cuenta elimina datos propios y conserva respuesta sin identificar al personal',async()=>{
 const staff=crypto.randomUUID(), q=crypto.randomUUID();
 await db.query('insert into auth.users values($1)',[staff]);
 await as('authenticated',staff,'insert into public.notes(version_id,body) values($1,$2)',[version,'Nota privada']);
 await as('authenticated',staff,"insert into public.experience_progress(version_id,last_scene_key) values($1,'P01')",[version]);
 await as('service_role',null,"insert into private.staff_roles values($1,'responder',true)",[staff]);
 await as('service_role',null,'insert into private.question_threads(id,secret_hash,assigned_to) values($1,$2,$3)',[q,'e'.repeat(64),staff]);
 await as('service_role',null,"insert into private.question_messages(thread_id,author_kind,staff_id,body,request_id) values($1,'staff',$2,'Respuesta',$3)",[q,staff,crypto.randomUUID()]);
 await db.query('delete from auth.users where id=$1',[staff]);
 for(const table of ['public.notes','public.experience_progress','private.staff_roles']) assert.equal((await db.query(`select * from ${table} where user_id=$1`,[staff])).rows.length,0);
 const answer=(await db.query('select staff_id,body from private.question_messages where thread_id=$1',[q])).rows[0];
 assert.equal(answer.staff_id,null); assert.equal(answer.body,'Respuesta');
});
test('límites de texto cuentan espacios y rechazan cuerpos vacíos',async()=>{
 await assert.rejects(as('authenticated',a,'insert into public.notes(version_id,body) values($1,$2)',[version,'a'+' '.repeat(10000)]));
 await assert.rejects(as('authenticated',a,'insert into public.notes(version_id,body) values($1,$2)',[version,'   ']));
 const q=crypto.randomUUID();
 await as('service_role',null,'insert into private.question_threads(id,secret_hash) values($1,$2)',[q,'f'.repeat(64)]);
 await assert.rejects(as('service_role',null,"insert into private.question_messages(thread_id,author_kind,body,request_id) values($1,'visitor',$2,$3)",[q,'a'+' '.repeat(2000),crypto.randomUUID()]));
 await assert.rejects(as('service_role',null,"insert into private.contact_requests(secret_hash,channel,contact_value,consent_version) values($1,'email',$2,'v1')",['1'.repeat(64),'a@b'+' '.repeat(320)]));
});
