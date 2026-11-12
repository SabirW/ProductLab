-- ProductLab profile and avatar setup. Run after supabase-setup.sql.
create table if not exists public.member_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default '' check (char_length(display_name) <= 80),
  bio text not null default '' check (char_length(bio) <= 500),
  instagram_url text not null default '' check (char_length(instagram_url) <= 500),
  linkedin_url text not null default '' check (char_length(linkedin_url) <= 500),
  avatar_path text not null default '',
  updated_at timestamptz not null default now()
);
alter table public.member_profiles enable row level security;
create policy "members read group profiles" on public.member_profiles for select to authenticated
using (user_id = (select auth.uid()) or exists (
  select 1 from public.workspace_members mine
  join public.workspace_members theirs on theirs.workspace_id = mine.workspace_id
  where mine.user_id = (select auth.uid()) and theirs.user_id = member_profiles.user_id
));
create policy "users manage own profile" on public.member_profiles for insert to authenticated
with check (user_id = (select auth.uid()));
create policy "users update own profile" on public.member_profiles for update to authenticated
using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
grant select, insert, update on public.member_profiles to authenticated;

insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
values ('profile-photos','profile-photos',false,2097152,array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set public=false,file_size_limit=2097152,allowed_mime_types=array['image/jpeg','image/png','image/webp'];
create policy "group members read profile photos" on storage.objects for select to authenticated
using (bucket_id='profile-photos' and public.is_workspace_member((storage.foldername(name))[1]::uuid));
create policy "users upload own profile photo" on storage.objects for insert to authenticated
with check (bucket_id='profile-photos' and (storage.foldername(name))[2] = (select auth.uid())::text
  and public.is_workspace_member((storage.foldername(name))[1]::uuid));
create policy "users update own profile photo" on storage.objects for update to authenticated
using (bucket_id='profile-photos' and (storage.foldername(name))[2] = (select auth.uid())::text
  and public.is_workspace_member((storage.foldername(name))[1]::uuid))
with check (bucket_id='profile-photos' and (storage.foldername(name))[2] = (select auth.uid())::text
  and public.is_workspace_member((storage.foldername(name))[1]::uuid));
create policy "users delete own profile photo" on storage.objects for delete to authenticated
using (bucket_id='profile-photos' and (storage.foldername(name))[2] = (select auth.uid())::text
  and public.is_workspace_member((storage.foldername(name))[1]::uuid));

create or replace function public.get_workspace_invite()
returns uuid language sql stable security definer set search_path = '' as $$
  select w.invite_code from public.workspaces w
  join public.workspace_members m on m.workspace_id=w.id
  where m.user_id=auth.uid() limit 1
$$;
revoke all on function public.get_workspace_invite() from public;
grant execute on function public.get_workspace_invite() to authenticated;
