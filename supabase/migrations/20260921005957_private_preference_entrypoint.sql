alter function public.set_topic_preference(uuid,boolean,bigint,uuid) set schema private;
grant usage on schema private to authenticated;
create function public.set_topic_preference(p_topic uuid,p_active boolean,p_revision bigint,p_request uuid) returns jsonb language sql security invoker set search_path='' as $$
 select private.set_topic_preference(p_topic,p_active,p_revision,p_request);
$$;
revoke all on function public.set_topic_preference(uuid,boolean,bigint,uuid) from public,anon;
grant execute on function public.set_topic_preference(uuid,boolean,bigint,uuid) to authenticated;
