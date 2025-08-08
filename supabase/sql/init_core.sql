-- (idéntico al anterior) CORE + RLS
create extension if not exists "pgcrypto";
create extension if not exists "uuid-ossp";

create schema if not exists core;
create schema if not exists sec;
create schema if not exists omni;
create schema if not exists sch;
create schema if not exists crm;
create schema if not exists cmp;
create schema if not exists media;
create schema if not exists rpt;

create table if not exists core.tenants (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);
create table if not exists core.memberships (
  user_id uuid not null,
  tenant_id uuid not null references core.tenants(id) on delete cascade,
  role text not null default 'member',
  primary key (user_id, tenant_id),
  created_at timestamptz not null default now()
);
create table if not exists core.audit_logs (
  id bigserial primary key,
  tenant_id uuid,
  actor uuid,
  action text not null,
  meta jsonb,
  created_at timestamptz not null default now()
);
create table if not exists core.tenant_flags (
  tenant_id uuid not null references core.tenants(id) on delete cascade,
  feature_key text not null,
  enabled boolean not null default false,
  variant text,
  updated_at timestamptz not null default now(),
  primary key (tenant_id, feature_key)
);

create table if not exists sec.oauth_tokens (
  id bigserial primary key,
  tenant_id uuid not null references core.tenants(id) on delete cascade,
  provider text not null,
  account_ref text,
  scopes text[],
  enc_payload bytea not null,
  rotated_at timestamptz,
  status text not null default 'active',
  created_at timestamptz not null default now()
);
create table if not exists sec.policies (
  id bigserial primary key,
  tenant_id uuid not null references core.tenants(id) on delete cascade,
  policy_key text not null,
  config jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create table if not exists sec.events (
  id bigserial primary key,
  tenant_id uuid not null references core.tenants(id) on delete cascade,
  category text not null,
  risk_score int,
  payload jsonb,
  created_at timestamptz not null default now()
);

create table if not exists omni.messages (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references core.tenants(id) on delete cascade,
  channel text not null,
  user_ref text,
  direction text not null check (direction in ('in','out')),
  content jsonb not null,
  created_at timestamptz not null default now()
);
create table if not exists sch.events (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references core.tenants(id) on delete cascade,
  title text not null,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  attendee jsonb,
  source text,
  created_at timestamptz not null default now()
);
create table if not exists crm.leads (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references core.tenants(id) on delete cascade,
  name text,
  channel text,
  contact jsonb,
  status text default 'new',
  created_at timestamptz not null default now()
);
create table if not exists core.dlq (
  id bigserial primary key,
  tenant_id uuid,
  source text not null,
  payload jsonb,
  error text,
  created_at timestamptz not null default now()
);
create table if not exists core.agent_runs (
  id bigserial primary key,
  tenant_id uuid not null references core.tenants(id) on delete cascade,
  trace jsonb,
  created_at timestamptz not null default now()
);

create or replace function core.is_member_of(t_id uuid)
returns boolean language sql stable as $$
  select exists(
    select 1 from core.memberships m
    where m.user_id = auth.uid() and m.tenant_id = t_id
  );
$$;

alter table core.tenants enable row level security;
alter table core.memberships enable row level security;
alter table core.audit_logs enable row level security;
alter table core.tenant_flags enable row level security;
alter table sec.oauth_tokens enable row level security;
alter table sec.policies enable row level security;
alter table sec.events enable row level security;
alter table omni.messages enable row level security;
alter table sch.events enable row level security;
alter table crm.leads enable row level security;
alter table core.dlq enable row level security;
alter table core.agent_runs enable row level security;

-- RLS policies (idempotentes)
-- Ten cuidado con el orden: primero tablas, luego políticas
-- TENANTS
drop policy if exists p_tenants_sel on core.tenants;
create policy p_tenants_sel on core.tenants for select
  using (core.is_member_of(id));

drop policy if exists p_tenants_upd on core.tenants;
create policy p_tenants_upd on core.tenants for update
  using (core.is_member_of(id))
  with check (core.is_member_of(id));

-- MEMBERSHIPS
drop policy if exists p_memberships_sel on core.memberships;
create policy p_memberships_sel on core.memberships for select
  using (core.is_member_of(tenant_id));

drop policy if exists p_memberships_ins on core.memberships;
create policy p_memberships_ins on core.memberships for insert
  with check (core.is_member_of(tenant_id));

drop policy if exists p_memberships_upd on core.memberships;
create policy p_memberships_upd on core.memberships for update
  using (core.is_member_of(tenant_id))
  with check (core.is_member_of(tenant_id));

drop policy if exists p_memberships_del on core.memberships;
create policy p_memberships_del on core.memberships for delete
  using (core.is_member_of(tenant_id));

-- AUDIT
drop policy if exists p_audit_sel on core.audit_logs;
create policy p_audit_sel on core.audit_logs for select
  using (core.is_member_of(tenant_id));

-- FLAGS
drop policy if exists p_flags_sel on core.tenant_flags;
create policy p_flags_sel on core.tenant_flags for select
  using (core.is_member_of(tenant_id));

drop policy if exists p_flags_ins on core.tenant_flags;
create policy p_flags_ins on core.tenant_flags for insert
  with check (core.is_member_of(tenant_id));

drop policy if exists p_flags_upd on core.tenant_flags;
create policy p_flags_upd on core.tenant_flags for update
  using (core.is_member_of(tenant_id))
  with check (core.is_member_of(tenant_id));

drop policy if exists p_flags_del on core.tenant_flags;
create policy p_flags_del on core.tenant_flags for delete
  using (core.is_member_of(tenant_id));

-- SECURITY
drop policy if exists p_oauth_sel on sec.oauth_tokens;
create policy p_oauth_sel on sec.oauth_tokens for select
  using (core.is_member_of(tenant_id));

drop policy if exists p_policies_sel on sec.policies;
create policy p_policies_sel on sec.policies for select
  using (core.is_member_of(tenant_id));

drop policy if exists p_events_sel on sec.events;
create policy p_events_sel on sec.events for select
  using (core.is_member_of(tenant_id));

-- OMNI
drop policy if exists p_omni_sel on omni.messages;
create policy p_omni_sel on omni.messages for select
  using (core.is_member_of(tenant_id));
drop policy if exists p_omni_ins on omni.messages;
create policy p_omni_ins on omni.messages for insert
  with check (core.is_member_of(tenant_id));
drop policy if exists p_omni_upd on omni.messages;
create policy p_omni_upd on omni.messages for update
  using (core.is_member_of(tenant_id))
  with check (core.is_member_of(tenant_id));
drop policy if exists p_omni_del on omni.messages;
create policy p_omni_del on omni.messages for delete
  using (core.is_member_of(tenant_id));

-- SCHEDULING
drop policy if exists p_sch_sel on sch.events;
create policy p_sch_sel on sch.events for select
  using (core.is_member_of(tenant_id));
drop policy if exists p_sch_ins on sch.events;
create policy p_sch_ins on sch.events for insert
  with check (core.is_member_of(tenant_id));
drop policy if exists p_sch_upd on sch.events;
create policy p_sch_upd on sch.events for update
  using (core.is_member_of(tenant_id))
  with check (core.is_member_of(tenant_id));
drop policy if exists p_sch_del on sch.events;
create policy p_sch_del on sch.events for delete
  using (core.is_member_of(tenant_id));

-- CRM
drop policy if exists p_crm_sel on crm.leads;
create policy p_crm_sel on crm.leads for select
  using (core.is_member_of(tenant_id));
drop policy if exists p_crm_ins on crm.leads;
create policy p_crm_ins on crm.leads for insert
  with check (core.is_member_of(tenant_id));
drop policy if exists p_crm_upd on crm.leads;
create policy p_crm_upd on crm.leads for update
  using (core.is_member_of(tenant_id))
  with check (core.is_member_of(tenant_id));
drop policy if exists p_crm_del on crm.leads;
create policy p_crm_del on crm.leads for delete
  using (core.is_member_of(tenant_id));

-- DLQ & AGENT RUNS
drop policy if exists p_dlq_sel on core.dlq;
create policy p_dlq_sel on core.dlq for select
  using (core.is_member_of(tenant_id));

drop policy if exists p_agent_runs_sel on core.agent_runs;
create policy p_agent_runs_sel on core.agent_runs for select
  using (core.is_member_of(tenant_id));


grant usage on schema core, sec, omni, sch, crm, cmp, media, rpt to authenticated, anon;
grant select, insert, update, delete on all tables in schema core, sec, omni, sch, crm to authenticated;
