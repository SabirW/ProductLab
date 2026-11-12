-- ProductLab shared workspace foundation
-- Run once in Supabase SQL Editor. Never place secret/service-role keys in the browser.
create extension if not exists pgcrypto with schema extensions;

create table if not exists public.workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) between 1 and 80),
  invite_code uuid not null unique default gen_random_uuid(),
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.workspace_members (
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (workspace_id, user_id)
);

create table if not exists public.private_records (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  record_type text not null check (record_type in ('product','analytics','campaign','followup','custom_section')),
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.shared_items (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  author_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  item_type text not null check (item_type in ('winner_concept','prompt','chat_message')),
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.workspaces enable row level security;
alter table public.workspace_members enable row level security;
alter table public.private_records enable row level security;
alter table public.shared_items enable row level security;

-- SECURITY DEFINER membership checks avoid recursive RLS when policies query memberships.
create or replace function public.is_workspace_member(target_workspace uuid, target_user uuid default auth.uid())
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.workspace_members m where m.workspace_id = target_workspace and m.user_id = target_user)
$$;
revoke all on function public.is_workspace_member(uuid, uuid) from public;
grant execute on function public.is_workspace_member(uuid, uuid) to authenticated;

create policy "members read workspace" on public.workspaces for select to authenticated
using (public.is_workspace_member(id));
create policy "members see membership" on public.workspace_members for select to authenticated
using (user_id = (select auth.uid()) or public.is_workspace_member(workspace_id));
create policy "owners manage private records" on public.private_records for all to authenticated
using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));
create policy "workspace members read shared" on public.shared_items for select to authenticated
using (public.is_workspace_member(workspace_id));
create policy "workspace members add shared" on public.shared_items for insert to authenticated
with check (author_id = (select auth.uid()) and public.is_workspace_member(workspace_id));
create policy "authors update shared" on public.shared_items for update to authenticated
using (author_id = (select auth.uid()) and public.is_workspace_member(workspace_id))
with check (author_id = (select auth.uid()) and public.is_workspace_member(workspace_id));
create policy "authors delete shared" on public.shared_items for delete to authenticated
using (author_id = (select auth.uid()) and public.is_workspace_member(workspace_id));

grant select on public.workspaces, public.workspace_members to authenticated;
grant insert, select, update, delete on public.private_records, public.shared_items to authenticated;

-- First signed-in user creates the private workspace and becomes its first member.
create or replace function public.create_workspace(workspace_name text)
returns table(workspace_id uuid, invite_code uuid)
language plpgsql security definer set search_path = '' as $$
declare new_id uuid;
begin
  if auth.uid() is null then raise exception 'Sign in required'; end if;
  if exists (select 1 from public.workspace_members where user_id = auth.uid()) then raise exception 'You already belong to a workspace'; end if;
  insert into public.workspaces(name, created_by) values (trim(workspace_name), auth.uid()) returning id into new_id;
  insert into public.workspace_members(workspace_id, user_id) values (new_id, auth.uid());
  return query select w.id, w.invite_code from public.workspaces w where w.id = new_id;
end;
$$;

-- Friends join with the workspace invite code; membership is never directly insertable by clients.
create or replace function public.join_workspace(code uuid)
returns uuid
language plpgsql security definer set search_path = '' as $$
declare target_id uuid;
begin
  if auth.uid() is null then raise exception 'Sign in required'; end if;
  if exists (select 1 from public.workspace_members where user_id = auth.uid()) then raise exception 'You already belong to a workspace'; end if;
  select id into target_id from public.workspaces where invite_code = code;
  if target_id is null then raise exception 'Invalid invite code'; end if;
  insert into public.workspace_members(workspace_id, user_id) values (target_id, auth.uid());
  return target_id;
end;
$$;

revoke all on function public.create_workspace(text) from public;
revoke all on function public.join_workspace(uuid) from public;
grant execute on function public.create_workspace(text), public.join_workspace(uuid) to authenticated;
