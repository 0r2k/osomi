-- Restore the narrow auth helper access required by the no-login preference role.
-- Verified missing remotely although the initial migration requested it.
grant usage on schema auth to evangelizar_preferences;
grant execute on function auth.uid() to evangelizar_preferences;
