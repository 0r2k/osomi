-- Enforce limits on the stored value, including surrounding whitespace.
alter table public.notes add constraint notes_raw_body_limit check(length(body)<=10000);
alter table private.question_messages add constraint messages_raw_body_limit check(length(body)<=2000);
alter table private.contact_requests add constraint contacts_raw_value_limit check(length(contact_value)<=320);
