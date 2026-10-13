-- Administrador de plataforma y organizaciones inactivas hasta que se activen.
-- Ejecutar en el proyecto de Supabase que ya tiene la migración inicial.

create table if not exists platform_admins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table organizations add column if not exists active boolean not null default true;
alter table organizations alter column active set default false;

create or replace function is_platform_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from platform_admins where user_id = auth.uid())
$$;

create or replace function handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  oid uuid;
  inv invitations%rowtype;
  token text;
  meta_org uuid;
begin
  insert into profiles (id, email, full_name)
  values (new.id, coalesce(new.email, ''), coalesce(new.raw_user_meta_data->>'full_name', ''));
  token := coalesce(new.raw_user_meta_data->>'invitation', '');
  if token <> '' then
    select * into inv from invitations where invitations.token = token and accepted_at is null limit 1;
    if inv.id is null then
      raise exception 'Invitación no válida';
    end if;
    insert into organization_members (org_id, user_id, role) values (inv.org_id, new.id, inv.role);
    update invitations set accepted_at = now() where id = inv.id;
  else
    meta_org := nullif(new.raw_user_meta_data->>'org_id', '')::uuid;
    if meta_org is not null then
      insert into organization_members (org_id, user_id, role)
      values (meta_org, new.id, coalesce(new.raw_user_meta_data->>'role', 'consulta'));
    else
      insert into organizations (name, active)
      values (
        coalesce(nullif(new.raw_user_meta_data->>'org_name', ''), 'Organización'),
        not exists (select 1 from platform_admins)
      )
      returning id into oid;
      insert into organization_members (org_id, user_id, role) values (oid, new.id, 'admin');
      if not exists (select 1 from platform_admins) then
        insert into platform_admins (user_id) values (new.id);
      end if;
      perform seed_org_catalog(oid);
    end if;
  end if;
  return new;
end;
$$;

alter table platform_admins enable row level security;

drop policy if exists platform_admins_select on platform_admins;
create policy platform_admins_select on platform_admins for select using (user_id = auth.uid() or is_platform_admin());

drop policy if exists profiles_select on profiles;
create policy profiles_select on profiles for select using (id = auth.uid() or shares_org(id) or is_platform_admin());

drop policy if exists organizations_select on organizations;
create policy organizations_select on organizations for select using (is_org_member(id) or is_platform_admin());

drop policy if exists organizations_update on organizations;
create policy organizations_update on organizations for update using (is_org_admin(id) or is_platform_admin());

drop policy if exists members_select on organization_members;
create policy members_select on organization_members for select using (is_org_member(org_id) or user_id = auth.uid() or is_platform_admin());

insert into platform_admins (user_id)
select om.user_id
from organization_members om
join organizations o on o.id = om.org_id
where om.role = 'admin'
  and not exists (select 1 from platform_admins)
order by o.created_at
limit 1;

grant select on platform_admins to authenticated;
