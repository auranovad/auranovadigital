-- RLS isolation tests
truncate core.memberships, omni.messages, crm.leads, sch.events, core.tenants restart identity cascade;

insert into core.tenants (id, name) values
  ('11111111-1111-1111-1111-111111111111','Tenant A'),
  ('22222222-2222-2222-2222-222222222222','Tenant B');

insert into core.memberships (user_id, tenant_id, role) values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa','11111111-1111-1111-1111-111111111111','owner'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb','22222222-2222-2222-2222-222222222222','owner');

insert into omni.messages (tenant_id, channel, user_ref, direction, content)
values
  ('11111111-1111-1111-1111-111111111111','wa','userX','in','{"text":"hola A"}'::jsonb),
  ('22222222-2222-2222-2222-222222222222','wa','userY','in','{"text":"hola B"}'::jsonb);

create or replace function core.assert_eq(actual int, expected int, msg text)
returns void language plpgsql as $$
begin
  if actual != expected then
    raise exception 'ASSERT_EQ failed: % (expected %, got %)', msg, expected, actual;
  end if;
end $$;

do $$
declare c int;
begin
  perform set_config('request.jwt.claims','{"sub":"aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa","role":"authenticated"}', true);
  set local role authenticated;
  select count(*) into c from omni.messages;
  perform core.assert_eq(c, 1, 'u1 solo ve sus mensajes');
  begin
    insert into omni.messages (tenant_id, channel, user_ref, direction, content)
    values ('22222222-2222-2222-2222-222222222222','wa','hack','in','{"text":"no"}');
    raise exception 'INSERT no bloqueado por RLS (u1 -> tenant B)';
  exception when others then null;
  end;
end $$;

do $$
declare c int;
begin
  perform set_config('request.jwt.claims','{"sub":"bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb","role":"authenticated"}', true);
  set local role authenticated;
  select count(*) into c from omni.messages;
  perform core.assert_eq(c, 1, 'u2 solo ve sus mensajes');
end $$;

reset role;
