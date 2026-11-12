-- Run after the existing ProductLab setup scripts. Safe to rerun.
create table if not exists public.app_collections (
 scope_id uuid not null,
 collection text not null,
 data jsonb not null default '[]'::jsonb check(jsonb_typeof(data)='array'),
 revision integer not null default 1 check(revision>0),
 primary key(scope_id,collection),
 check(collection in ('productlab-products-v1','productlab-custom-sections-v1','productlab-campaigns-v1','productlab-followup-v1','productlab-winners-v1','productlab-prompts-v1'))
);
alter table public.app_collections enable row level security;
drop policy if exists "account or workspace collections" on public.app_collections;
create policy "account or workspace collections" on public.app_collections for all to authenticated
using (
 case when collection in ('productlab-winners-v1','productlab-prompts-v1')
 then public.is_workspace_member(scope_id)
 else scope_id=(select auth.uid()) end
)
with check (
 case when collection in ('productlab-winners-v1','productlab-prompts-v1')
 then public.is_workspace_member(scope_id)
 else scope_id=(select auth.uid()) end
);
grant select,insert,update on public.app_collections to authenticated;
