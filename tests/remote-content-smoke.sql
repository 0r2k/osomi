-- Development only. Fixtures are rolled back; no messages are sent.
begin;
do $$
declare u uuid:=gen_random_uuid(); v uuid:=gen_random_uuid(); t uuid:=gen_random_uuid(); hidden uuid:=gen_random_uuid(); n uuid;
begin
 insert into auth.users(id) values(u);
 insert into public.experiences(id,slug,title,visibility) values(t,'qa-'||t::text,'QA temporary','listed'),(hidden,'qa-'||hidden::text,'QA hidden','hidden');
 insert into public.experience_versions(id,experience_id,version,content_path,content_hash) values(v,t,1,'content/qa/v1.json',repeat('a',64));
 insert into public.scene_manifest values(v,'P12',1,'closing');
 update public.experience_versions set status='published' where id=v;
 update public.experiences set published_version_id=v where id=t;
 insert into public.notes(user_id,version_id,body) values(u,v,'QA temporary') returning id into n;
 perform set_config('lucarit.qa_user',u::text,true);
 perform set_config('lucarit.qa_version',v::text,true);
 perform set_config('lucarit.qa_hidden',hidden::text,true);
 perform set_config('lucarit.qa_note',n::text,true);
end $$;
set local role authenticated;
select set_config('request.jwt.claim.sub',current_setting('lucarit.qa_user'),true);
do $$
declare count_changed integer;
begin
 if not exists(select 1 from public.notes where id=current_setting('lucarit.qa_note')::uuid) then raise exception 'own note unavailable'; end if;
 update public.notes set body='Updated' where id=current_setting('lucarit.qa_note')::uuid and revision=1;
 get diagnostics count_changed=row_count;
 if count_changed<>1 then raise exception 'own update failed'; end if;
 update public.notes set body='Stale' where id=current_setting('lucarit.qa_note')::uuid and revision=1;
 get diagnostics count_changed=row_count;
 if count_changed<>0 then raise exception 'stale update accepted'; end if;
 begin
  perform 1 from private.question_threads;
  raise exception 'private access leaked';
 exception when insufficient_privilege then null;
 end;
 begin
  update public.notes set user_id=gen_random_uuid() where id=current_setting('lucarit.qa_note')::uuid;
  raise exception 'owner column writable';
 exception when insufficient_privilege then null;
 end;
end $$;
select set_config('request.jwt.claim.sub',gen_random_uuid()::text,true);
do $$
begin
 if exists(select 1 from public.notes where id=current_setting('lucarit.qa_note')::uuid) then raise exception 'cross-user note leaked'; end if;
end $$;
set local role anon;
do $$
begin
 if exists(select 1 from public.experiences where id=current_setting('lucarit.qa_hidden')::uuid) then raise exception 'hidden catalogue leaked'; end if;
 if not exists(select 1 from public.scene_manifest where version_id=current_setting('lucarit.qa_version')::uuid) then raise exception 'published scene unavailable'; end if;
 begin
  perform 1 from public.notes;
  raise exception 'anon note access leaked';
 exception when insufficient_privilege then null;
 end;
end $$;
reset role;
rollback;
select 'PASS: ownership, revision, private access, catalogue; fixtures rolled back' as verification;
