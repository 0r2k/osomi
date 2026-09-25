-- Lucarit: versioned catalogue, personal journeys and isolated operations.
alter table public.experiences add column visibility text not null default 'hidden' check(visibility in ('hidden','listed'));
alter table public.experiences add constraint experience_summary_length check(length(summary)<=500);
create table public.experience_versions (
 id uuid primary key default gen_random_uuid(),
 experience_id uuid not null references public.experiences,
 version integer not null check(version>0),
 status text not null default 'draft' check(status in ('draft','published','retired')),
 content_path text not null check(content_path ~ '^content/[a-zA-Z0-9_/-]+[.]json$' and content_path not like '%..%'),
 content_hash text not null check(content_hash ~ '^[a-f0-9]{64}$'),
 published_at timestamptz,
 unique(experience_id,version), unique(experience_id,id),
 check((status='draft' and published_at is null) or (status<>'draft' and published_at is not null))
);
alter table public.experiences add column published_version_id uuid;
alter table public.experiences add constraint published_version_owner foreign key(id,published_version_id) references public.experience_versions(experience_id,id);
create table public.scene_manifest (
 version_id uuid not null references public.experience_versions on delete cascade,
 scene_key text not null check(scene_key ~ '^[A-Za-z0-9_-]{1,64}$'),
 position integer not null check(position>0),
 kind text not null check(kind in ('narrative','interaction','closing')),
 primary key(version_id,scene_key),unique(version_id,position)
);
create table public.experience_edges (
 source_id uuid not null references public.experiences on delete cascade,
 target_id uuid not null references public.experiences on delete cascade,
 prompt text not null check(length(prompt) between 1 and 160),
 reason text not null check(length(reason) between 1 and 500),
 rank integer not null default 0 check(rank>=0),
 primary key(source_id,target_id),check(source_id<>target_id)
);
create index edges_target on public.experience_edges(target_id);

-- Publish a draft only after the deployment pipeline has checked its file/hash.
-- These triggers enforce database invariants; they cannot verify a deployment file.
create function private.guard_version() returns trigger language plpgsql set search_path='' as $$
begin
 if TG_OP='INSERT' then
  if new.status<>'draft' then raise exception 'version must start as draft'; end if;
  return new;
 end if;
 if TG_OP='DELETE' then
  if old.status<>'draft' then raise exception 'published version immutable'; end if;
  return old;
 end if;
 if old.status<>'draft' then
  if (new.id,new.experience_id,new.version,new.content_path,new.content_hash,new.published_at) is distinct from
     (old.id,old.experience_id,old.version,old.content_path,old.content_hash,old.published_at)
     or new.status='draft' or (old.status='retired' and new.status<>'retired') then raise exception 'published version immutable'; end if;
  if new.status='retired' and exists(select 1 from public.experiences where published_version_id=old.id) then raise exception 'detach current version before retiring'; end if;
 elsif new.status='published' then
  if not exists(select 1 from public.scene_manifest where version_id=new.id and kind='closing') then raise exception 'manifest needs closing scene'; end if;
  new.published_at:=statement_timestamp();
 elsif new.status<>'draft' then raise exception 'invalid publication transition';
 end if;
 return new;
end $$;
create trigger guard_version before insert or update or delete on public.experience_versions for each row execute function private.guard_version();
create function private.guard_manifest() returns trigger language plpgsql set search_path='' as $$
declare v_status text;
begin
 if TG_OP='UPDATE' and new.version_id<>old.version_id then raise exception 'scene version immutable'; end if;
 select status into v_status from public.experience_versions where id=case when TG_OP='DELETE' then old.version_id else new.version_id end for update;
 if v_status is not null and v_status<>'draft' then raise exception 'published manifest immutable'; end if;
 if TG_OP='DELETE' then return old; end if;
 return new;
end $$;
create trigger guard_manifest before insert or update or delete on public.scene_manifest for each row execute function private.guard_manifest();
create function private.guard_published_pointer() returns trigger language plpgsql set search_path='' as $$
declare v_status text;
begin
 if new.published_version_id is not null then
  select status into v_status from public.experience_versions where id=new.published_version_id and experience_id=new.id for update;
  if v_status is distinct from 'published' then raise exception 'invalid published version'; end if;
 end if;
 return new;
end $$;
create trigger guard_published_pointer before insert or update of published_version_id on public.experiences for each row execute function private.guard_published_pointer();

create table public.experience_progress (
 id uuid primary key default gen_random_uuid(), user_id uuid not null default auth.uid() references auth.users on delete cascade,
 version_id uuid not null references public.experience_versions,
 last_scene_key text not null,
 status text not null default 'started' check(status in ('started','completed')),
 biblical_choice text not null default 'unknown' check(biblical_choice in ('unknown','explored','skipped')),
 revision bigint not null default 1 check(revision>0),
 created_at timestamptz not null default now(),updated_at timestamptz not null default now(),
 unique(user_id,version_id),foreign key(version_id,last_scene_key) references public.scene_manifest
);
create table public.notes (
 id uuid primary key default gen_random_uuid(), user_id uuid not null default auth.uid() references auth.users on delete cascade,
 version_id uuid not null references public.experience_versions,
 scene_key text,
 body text not null check(length(btrim(body)) between 1 and 10000),
 revision bigint not null default 1 check(revision>0),
 created_at timestamptz not null default now(),updated_at timestamptz not null default now(),
 foreign key(version_id,scene_key) references public.scene_manifest
);
create index progress_version_scene on public.experience_progress(version_id,last_scene_key);
create index progress_user_updated on public.experience_progress(user_id,updated_at desc);
create index notes_version_scene on public.notes(version_id,scene_key);
create index notes_user_updated on public.notes(user_id,updated_at desc);
create function private.advance_revision() returns trigger language plpgsql set search_path='' as $$
begin
 new.revision:=old.revision+1; new.updated_at:=statement_timestamp();
 return new;
end $$;
create trigger advance_note_revision before update on public.notes for each row execute function private.advance_revision();
create trigger advance_progress_revision before update on public.experience_progress for each row execute function private.advance_revision();
alter table public.profiles add column updated_at timestamptz not null default now();
alter table public.topic_preferences add column created_at timestamptz not null default now();
alter table public.topic_preferences add column updated_at timestamptz not null default now();
create function private.touch_updated_at() returns trigger language plpgsql set search_path='' as $$
begin new.updated_at:=statement_timestamp(); return new; end $$;
create trigger touch_profile before update on public.profiles for each row execute function private.touch_updated_at();
create trigger touch_preference before update on public.topic_preferences for each row execute function private.touch_updated_at();
revoke insert on public.profiles from authenticated;
grant insert(user_id,display_name) on public.profiles to authenticated;
create index preferences_topic_active on public.topic_preferences(experience_id,active);
create index visitor_claimed_user on private.visitors(claimed_user_id);
create index visitors_expiry on private.visitors(expires_at);

create table private.staff_roles (
 user_id uuid not null references auth.users on delete cascade,
 role text not null check(role in ('responder','coordinator','editor','admin')),
 active boolean not null default true,primary key(user_id,role)
);
create table private.question_threads (
 id uuid primary key default gen_random_uuid(),secret_hash text not null unique check(secret_hash ~ '^[a-f0-9]{64}$'),
 status text not null default 'received' check(status in ('received','in_review','answered','closed')),
 assigned_to uuid references auth.users on delete set null,
 created_at timestamptz not null default now(),updated_at timestamptz not null default now()
);
create table private.question_messages (
 id uuid primary key default gen_random_uuid(),thread_id uuid not null references private.question_threads on delete cascade,
 author_kind text not null check(author_kind in ('visitor','staff')),
 staff_id uuid references auth.users on delete set null,
 body text not null check(length(btrim(body)) between 1 and 2000),
 request_id uuid not null,created_at timestamptz not null default now(),
 unique(thread_id,request_id),check(author_kind='staff' or staff_id is null)
);
-- Staff attribution may become NULL only after account deletion; responses survive.
create function private.guard_message_author() returns trigger language plpgsql set search_path='' as $$
begin
 if new.author_kind='staff' and new.staff_id is null then raise exception 'staff author required'; end if;
 return new;
end $$;
create trigger guard_message_author before insert on private.question_messages for each row execute function private.guard_message_author();
create table private.contact_requests (
 id uuid primary key default gen_random_uuid(),secret_hash text not null unique check(secret_hash ~ '^[a-f0-9]{64}$'),
 channel text not null check(channel in ('email','whatsapp')),
 contact_value text not null check(length(btrim(contact_value)) between 3 and 320),
 display_name text check(length(display_name)<=80),
 consent_version text not null check(length(consent_version) between 1 and 80),consented_at timestamptz not null default now(),
 status text not null default 'received' check(status in ('received','assigned','attempted','conversation_done','closed','cancelled')),
 assigned_to uuid references auth.users on delete set null,
 created_at timestamptz not null default now(),updated_at timestamptz not null default now()
);
create table private.operation_audit (
 id uuid primary key default gen_random_uuid(),actor_id uuid references auth.users on delete set null,
 resource_type text not null check(resource_type in ('question','contact')),
 resource_id uuid not null,action text not null check(action in ('assign','answer','close','cancel','transition','delete')),
 from_state text check(from_state in ('received','in_review','answered','closed','assigned','attempted','conversation_done','cancelled')),
 to_state text check(to_state in ('received','in_review','answered','closed','assigned','attempted','conversation_done','cancelled')),
 created_at timestamptz not null default now()
);
create table private.analytics_events (
 id uuid primary key default gen_random_uuid(),event_key uuid not null unique,
 event_name text not null check(event_name in ('experience_started','scene_view','experience_completed')),
 session_id uuid not null,user_id uuid references auth.users on delete cascade,
 version_id uuid not null references public.experience_versions,scene_key text,
 consent_version text not null check(length(consent_version) between 1 and 80),
 occurred_at timestamptz not null default now(),received_at timestamptz not null default now(),
 props jsonb not null default '{}'::jsonb check(props='{}'::jsonb),
 foreign key(version_id,scene_key) references public.scene_manifest
);
-- No free-form event props until a reviewed per-event allowlist exists.
create index questions_assigned on private.question_threads(assigned_to,status,created_at);
create index questions_queue on private.question_threads(status,created_at);
create index messages_staff on private.question_messages(staff_id);
create index contacts_assigned on private.contact_requests(assigned_to,status,created_at);
create index contacts_queue on private.contact_requests(status,created_at);
create index audit_actor on private.operation_audit(actor_id);
create index events_version_scene on private.analytics_events(version_id,scene_key);
create index events_version_time on private.analytics_events(version_id,received_at);
create index events_user on private.analytics_events(user_id);
create trigger touch_question before update on private.question_threads for each row execute function private.touch_updated_at();
create trigger touch_contact before update on private.contact_requests for each row execute function private.touch_updated_at();

-- Explicit privileges override permissive project defaults.
revoke all on public.experience_versions,public.scene_manifest,public.experience_edges,public.notes,public.experience_progress from public,anon,authenticated;
grant select on public.experiences,public.experience_versions,public.scene_manifest,public.experience_edges to anon,authenticated;
grant select,delete on public.notes,public.experience_progress to authenticated;
grant insert(user_id,version_id,scene_key,body) on public.notes to authenticated;
grant update(body) on public.notes to authenticated;
grant insert(user_id,version_id,last_scene_key,status,biblical_choice) on public.experience_progress to authenticated;
grant update(last_scene_key,status,biblical_choice) on public.experience_progress to authenticated;
grant select,insert,update,delete on public.experiences,public.experience_versions,public.scene_manifest,public.experience_edges,public.notes,public.experience_progress to service_role;
grant usage on schema private to service_role;
revoke all on private.staff_roles,private.question_threads,private.question_messages,private.contact_requests,private.operation_audit,private.analytics_events from public,anon,authenticated;
grant select,insert,update,delete on private.staff_roles,private.question_threads,private.question_messages,private.contact_requests,private.operation_audit,private.analytics_events to service_role;
alter table public.experience_versions enable row level security;
alter table public.scene_manifest enable row level security;
alter table public.experience_edges enable row level security;
alter table public.notes enable row level security;
alter table public.experience_progress enable row level security;
alter table private.staff_roles enable row level security;
alter table private.question_threads enable row level security;
alter table private.question_messages enable row level security;
alter table private.contact_requests enable row level security;
alter table private.operation_audit enable row level security;
alter table private.analytics_events enable row level security;
create policy listed_experiences on public.experiences for select to anon,authenticated using(visibility='listed');
create policy published_versions on public.experience_versions for select to anon,authenticated using(status in ('published','retired') and experience_id in (select id from public.experiences));
create policy published_manifest on public.scene_manifest for select to anon,authenticated using(version_id in (select id from public.experience_versions));
create policy listed_edges on public.experience_edges for select to anon,authenticated using(source_id in (select id from public.experiences) and target_id in (select id from public.experiences));
create policy own_notes on public.notes to authenticated using(user_id=(select auth.uid())) with check(user_id=(select auth.uid()) and version_id in (select id from public.experience_versions));
create policy own_progress on public.experience_progress to authenticated using(user_id=(select auth.uid())) with check(user_id=(select auth.uid()) and version_id in (select id from public.experience_versions));
revoke all on function private.guard_version(),private.guard_manifest(),private.guard_published_pointer(),private.advance_revision(),private.touch_updated_at(),private.guard_message_author() from public,anon,authenticated;
