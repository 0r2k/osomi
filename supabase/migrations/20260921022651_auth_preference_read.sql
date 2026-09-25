create function private.read_visitor_preferences(p_visitor uuid,p_hash text) returns jsonb language plpgsql security definer set search_path='' as $$
declare v private.visitors;
begin
 select * into v from private.visitors where id=p_visitor;
 if v.id is null or p_hash is null or v.secret_hash<>p_hash or v.expires_at<=now() or v.claimed_user_id is not null then raise exception 'invalid visitor'; end if;
 return coalesce((select jsonb_agg(jsonb_build_object('id',id,'experience_id',experience_id,'active',active,'revision',revision)) from public.topic_preferences where visitor_id=p_visitor),'[]'::jsonb);
end $$;
grant create on schema private to evangelizar_preferences;
alter function private.read_visitor_preferences(uuid,text) owner to evangelizar_preferences;
revoke create on schema private from evangelizar_preferences;
revoke all on function private.read_visitor_preferences(uuid,text) from public,anon,authenticated;
grant execute on function private.read_visitor_preferences(uuid,text) to service_role;
create function public.read_visitor_preferences(p_visitor uuid,p_hash text) returns jsonb language sql security invoker set search_path='' as $$select private.read_visitor_preferences(p_visitor,p_hash);$$;
revoke all on function public.read_visitor_preferences(uuid,text) from public,anon,authenticated;
grant execute on function public.read_visitor_preferences(uuid,text) to service_role;
-- Visible pilot card only: no fabricated content version is published.
insert into public.experiences(id,slug,title,summary,is_entry,visibility) values('6c756361-7269-4000-8000-000000000001','descanso','¿Por qué necesito descansar?','Una experiencia para explorar el descanso.',true,'listed');
