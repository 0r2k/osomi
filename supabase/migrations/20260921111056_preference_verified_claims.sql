-- Same identity expression as this project's auth.uid(), from the JWT verified
-- by PostgREST. No caller-supplied user ID, and no extra access to auth tables.
create or replace function private.set_topic_preference(p_topic uuid,p_active boolean,p_revision bigint,p_request uuid) returns jsonb language plpgsql security definer set search_path='' as $$
declare verified_user uuid := coalesce(nullif(current_setting('request.jwt.claim.sub',true),''),nullif(current_setting('request.jwt.claims',true),'')::jsonb->>'sub')::uuid;
begin
 if verified_user is null then raise exception 'authentication required'; end if;
 return private.set_preference(verified_user,null,p_topic,p_active,p_revision,p_request);
end $$;
revoke usage on schema auth from evangelizar_preferences;
revoke execute on function auth.uid() from evangelizar_preferences;
