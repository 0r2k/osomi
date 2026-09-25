-- Definers have an empty search_path; only explicit entry points are executable.
create function public.create_visitor(p_id uuid,p_hash text,p_expires timestamptz) returns void language plpgsql security definer set search_path='' as $$
begin
 if p_id is null or p_hash is null or p_expires is null or p_expires<=now() or p_expires>now()+interval '90 days' then raise exception 'invalid visitor'; end if;
 insert into private.visitors(id,secret_hash,expires_at) values(p_id,p_hash,p_expires);
end $$;
create function private.set_preference(p_user uuid,p_visitor uuid,p_topic uuid,p_active boolean,p_revision bigint,p_request uuid) returns jsonb language plpgsql security definer set search_path='' as $$
declare s text; payload text; receipt private.mutation_receipts; pref public.topic_preferences; result jsonb;
begin
 if (p_user is null)=(p_visitor is null) or p_topic is null or p_active is null or p_revision is null or p_revision<0 or p_request is null then raise exception 'invalid preference'; end if;
 s:='preference:'||coalesce(p_user,p_visitor)::text;
 perform pg_advisory_xact_lock(hashtextextended(s,0));
 payload:=jsonb_build_array(p_topic,p_active,p_revision)::text;
 select * into receipt from private.mutation_receipts where scope=s and request_id=p_request;
 if found then
  if receipt.payload<>payload then raise exception 'request reused'; end if;
  return receipt.result;
 end if;
 select * into pref from public.topic_preferences where experience_id=p_topic and (user_id=p_user or visitor_id=p_visitor) for update;
 if coalesce(pref.revision,0)<>p_revision then raise exception 'stale revision'; end if;
 if pref.id is null then
  insert into public.topic_preferences(experience_id,user_id,visitor_id,active,action_seq) values(p_topic,p_user,p_visitor,p_active,nextval('private.preference_order')) returning * into pref;
 else
  update public.topic_preferences set active=p_active,revision=revision+1,action_seq=nextval('private.preference_order') where id=pref.id returning * into pref;
 end if;
 result:=jsonb_build_object('id',pref.id,'active',pref.active,'revision',pref.revision);
 insert into private.mutation_receipts values(s,p_request,payload,result,now());
 return result;
end $$;
create function public.set_topic_preference(p_topic uuid,p_active boolean,p_revision bigint,p_request uuid) returns jsonb language plpgsql security definer set search_path='' as $$
begin
 if auth.uid() is null then raise exception 'authentication required'; end if;
 return private.set_preference(auth.uid(),null,p_topic,p_active,p_revision,p_request);
end $$;
create function public.set_visitor_preference(p_visitor uuid,p_hash text,p_topic uuid,p_active boolean,p_revision bigint,p_request uuid) returns jsonb language plpgsql security definer set search_path='' as $$
declare v private.visitors;
begin
 select * into v from private.visitors where id=p_visitor for update;
 if v.id is null or p_hash is null or v.secret_hash<>p_hash or v.expires_at<=now() or v.claimed_user_id is not null then raise exception 'invalid visitor'; end if;
 return private.set_preference(null,p_visitor,p_topic,p_active,p_revision,p_request);
end $$;
create function public.claim_visitor_preferences(p_visitor uuid,p_hash text,p_user uuid,p_request uuid) returns jsonb language plpgsql security definer set search_path='' as $$
declare v private.visitors; pref public.topic_preferences; target public.topic_preferences; receipt private.mutation_receipts; s text; payload text; result jsonb; n integer:=0;
begin
 if p_user is null or p_request is null then raise exception 'invalid claim'; end if;
 select * into v from private.visitors where id=p_visitor for update;
 if v.id is null or p_hash is null or v.secret_hash<>p_hash or v.expires_at<=now() then raise exception 'invalid visitor'; end if;
 s:='claim:'||p_visitor::text; payload:=p_user::text;
 select * into receipt from private.mutation_receipts where scope=s and request_id=p_request;
 if found then
  if receipt.payload<>payload then raise exception 'request reused'; end if;
  return receipt.result;
 end if;
 if v.claimed_user_id is not null then raise exception 'already claimed'; end if;
 perform pg_advisory_xact_lock(hashtextextended('preference:'||p_user::text,0));
 for pref in select * from public.topic_preferences where visitor_id=p_visitor order by experience_id for update loop
  select * into target from public.topic_preferences where user_id=p_user and experience_id=pref.experience_id for update;
  if target.id is null then
   update public.topic_preferences set user_id=p_user,visitor_id=null,revision=revision+1 where id=pref.id;
  else
   if pref.action_seq>target.action_seq then
    update public.topic_preferences set active=pref.active,action_seq=pref.action_seq,revision=revision+1 where id=target.id;
   end if;
   insert into private.preference_merges values(pref.id,target.id,p_request,now());
   delete from public.topic_preferences where id=pref.id;
  end if;
  n:=n+1;
 end loop;
 update private.visitors set claimed_user_id=p_user where id=p_visitor;
 result:=jsonb_build_object('transferred',n);
 insert into private.mutation_receipts values(s,p_request,payload,result,now());
 return result;
end $$;
revoke all on function private.set_preference(uuid,uuid,uuid,boolean,bigint,uuid) from public,anon,authenticated;
revoke all on function public.create_visitor(uuid,text,timestamptz),public.set_topic_preference(uuid,boolean,bigint,uuid),public.set_visitor_preference(uuid,text,uuid,boolean,bigint,uuid),public.claim_visitor_preferences(uuid,text,uuid,uuid) from public,anon,authenticated;
grant execute on function public.set_topic_preference(uuid,boolean,bigint,uuid) to authenticated;
grant execute on function public.create_visitor(uuid,text,timestamptz),public.set_visitor_preference(uuid,text,uuid,boolean,bigint,uuid),public.claim_visitor_preferences(uuid,text,uuid,uuid) to service_role;
-- Bound the definer's privileges to the preference subsystem.
create role evangelizar_preferences nologin noinherit;
do $$ begin execute format('grant evangelizar_preferences to %I', current_user); end $$;
grant usage on schema public, private, auth to evangelizar_preferences;
grant execute on function auth.uid() to evangelizar_preferences;
grant select on public.experiences to evangelizar_preferences;
grant select,insert,update,delete on public.topic_preferences,private.visitors,private.mutation_receipts,private.preference_merges to evangelizar_preferences;
grant usage on sequence private.preference_order to evangelizar_preferences;
create policy preference_engine on public.topic_preferences to evangelizar_preferences using(true) with check(true);
create policy preference_catalogue on public.experiences for select to evangelizar_preferences using(true);
create policy visitor_engine on private.visitors to evangelizar_preferences using(true) with check(true);
create policy receipt_engine on private.mutation_receipts to evangelizar_preferences using(true) with check(true);
create policy merge_engine on private.preference_merges to evangelizar_preferences using(true) with check(true);
-- ALTER OWNER requires CREATE temporarily; remove it immediately afterwards.
grant create on schema public,private to evangelizar_preferences;
alter function private.set_preference(uuid,uuid,uuid,boolean,bigint,uuid) owner to evangelizar_preferences;
alter function public.create_visitor(uuid,text,timestamptz) owner to evangelizar_preferences;
alter function public.set_topic_preference(uuid,boolean,bigint,uuid) owner to evangelizar_preferences;
alter function public.set_visitor_preference(uuid,text,uuid,boolean,bigint,uuid) owner to evangelizar_preferences;
alter function public.claim_visitor_preferences(uuid,text,uuid,uuid) owner to evangelizar_preferences;
revoke create on schema public,private from evangelizar_preferences;
