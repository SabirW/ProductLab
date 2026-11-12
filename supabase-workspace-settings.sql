-- ProductLab workspace settings upgrade. Run once in Supabase SQL Editor.
alter table public.workspaces add column if not exists logo_path text not null default '';
drop policy if exists "workspace owners update settings" on public.workspaces;
create policy "workspace owners update settings" on public.workspaces for update to authenticated
using (created_by = (select auth.uid())) with check (created_by = (select auth.uid()));
grant update on public.workspaces to authenticated;
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('workspace-logos','workspace-logos',false,2097152,array['image/jpeg','image/png','image/webp'])
on conflict(id) do update set public=false,file_size_limit=2097152,allowed_mime_types=array['image/jpeg','image/png','image/webp'];
drop policy if exists "members read workspace logos" on storage.objects;
create policy "members read workspace logos" on storage.objects for select to authenticated
using(bucket_id='workspace-logos' and public.is_workspace_member((storage.foldername(name))[1]::uuid));
drop policy if exists "workspace owners manage logo" on storage.objects;
create policy "workspace owners manage logo" on storage.objects for all to authenticated
using(bucket_id='workspace-logos' and (storage.foldername(name))[2]=(select auth.uid())::text and exists(select 1 from public.workspaces w where w.id=(storage.foldername(name))[1]::uuid and w.created_by=(select auth.uid())))
with check(bucket_id='workspace-logos' and (storage.foldername(name))[2]=(select auth.uid())::text and exists(select 1 from public.workspaces w where w.id=(storage.foldername(name))[1]::uuid and w.created_by=(select auth.uid())));
create or replace function public.rotate_workspace_invite()
returns uuid language plpgsql security definer set search_path = '' as $$
declare code uuid;
begin
 update public.workspaces w set invite_code=gen_random_uuid()
 where w.created_by=auth.uid() and exists(select 1 from public.workspace_members m where m.workspace_id=w.id and m.user_id=auth.uid())
 returning w.invite_code into code;
 if code is null then raise exception 'Only the workspace owner can change the invite'; end if;
 return code;
end;
$$;
revoke all on function public.rotate_workspace_invite() from anon;
revoke all on function public.rotate_workspace_invite() from public;
grant execute on function public.rotate_workspace_invite() to authenticated;
