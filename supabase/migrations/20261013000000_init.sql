-- Cimenta: organizaciones, catálogo, presupuesto, reajuste, cronograma y ejecución.

create extension if not exists pgcrypto;

create table profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null default '',
  full_name text not null default '',
  created_at timestamptz not null default now()
);

create table organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

create table organization_members (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null check (role in ('admin', 'presupuestador', 'bodega', 'consulta')),
  unique (org_id, user_id)
);

create table invitations (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations (id) on delete cascade,
  email text not null,
  role text not null check (role in ('admin', 'presupuestador', 'bodega', 'consulta')),
  token text not null unique,
  created_at timestamptz not null default now(),
  accepted_at timestamptz
);

create table units (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations (id) on delete cascade,
  code text not null,
  name text not null
);

create table unit_conversions (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations (id) on delete cascade,
  from_qty numeric not null,
  from_unit text not null,
  to_qty numeric not null,
  to_unit text not null
);

create table cities (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations (id) on delete cascade,
  name text not null
);

create table suppliers (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations (id) on delete cascade,
  city_id uuid references cities (id),
  name text not null,
  address text not null default ''
);

create table materials (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations (id) on delete cascade,
  code text not null default '',
  name text not null,
  unit text not null default '',
  chamber_price numeric not null default 0,
  personal_price numeric not null default 0
);

create table material_suppliers (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations (id) on delete cascade,
  material_id uuid not null references materials (id) on delete cascade,
  supplier_id uuid not null references suppliers (id) on delete cascade
);

create table equipment (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations (id) on delete cascade,
  code text not null default '',
  name text not null,
  hourly_chamber numeric not null default 0,
  hourly_personal numeric not null default 0,
  yield_rate numeric not null default 1,
  power text not null default '',
  brand text not null default '',
  machine_type text not null default '',
  uses_gasoline boolean not null default false,
  chamber_code text not null default ''
);

create table labor_categories (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations (id) on delete cascade,
  code text not null default '',
  name text not null,
  hourly_chamber numeric not null default 0,
  hourly_personal numeric not null default 0
);

create table transport_rates (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations (id) on delete cascade,
  code text not null default '',
  name text not null,
  unit text not null default '',
  rate_chamber numeric not null default 0,
  rate_personal numeric not null default 0
);

create table catalog_chapters (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations (id) on delete cascade,
  code text not null default '',
  name text not null,
  sort_order integer not null default 0
);

create table rubro_types (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations (id) on delete cascade,
  name text not null
);

create table catalog_rubros (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations (id) on delete cascade,
  chapter_id uuid references catalog_chapters (id) on delete set null,
  type_id uuid references rubro_types (id) on delete set null,
  code text not null default '',
  name text not null,
  unit text not null default '',
  yield_rate numeric not null default 1
);

create table catalog_apu_lines (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations (id) on delete cascade,
  rubro_id uuid not null references catalog_rubros (id) on delete cascade,
  kind text not null,
  ref_id uuid,
  code text not null default '',
  name text not null default '',
  unit text not null default '',
  quantity numeric not null default 0,
  origin text not null default 'ND',
  cpc_code text not null default '',
  sort_order integer not null default 0
);

create table price_snapshots (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations (id) on delete cascade,
  captured_on date not null default current_date,
  note text not null default ''
);

create table price_snapshot_lines (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations (id) on delete cascade,
  snapshot_id uuid not null references price_snapshots (id) on delete cascade,
  family text not null,
  item_id uuid,
  code text not null default '',
  name text not null default '',
  chamber_price numeric not null default 0,
  personal_price numeric not null default 0
);

create table cpc_codes (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations (id) on delete cascade,
  code text not null,
  description text not null default ''
);

create table vae_thresholds (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations (id) on delete cascade,
  name text not null,
  percent numeric not null default 0,
  note text not null default ''
);

create table projects (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations (id) on delete cascade,
  name text not null,
  proposed_date date not null default current_date,
  proponent text not null default '',
  owner_name text not null default '',
  calculated_by text not null default '',
  reviewed_by text not null default '',
  description text not null default '',
  province text not null default '',
  canton text not null default '',
  parish text not null default '',
  sector text not null default '',
  address text not null default '',
  yield_mode text not null default 'rubro',
  minor_tool_mode text not null default 'global',
  minor_tool_percent numeric not null default 5,
  transport_materials boolean not null default true,
  transport_equipment boolean not null default true,
  price_scheme text not null default 'chamber',
  indirect_percent numeric not null default 15,
  indirect_prevail text not null default 'general',
  contributors_enabled boolean not null default false,
  vae_threshold_id uuid,
  work_start date,
  calendar_id uuid,
  created_at timestamptz not null default now()
);

create table project_members (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations (id) on delete cascade,
  project_id uuid not null references projects (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  unique (project_id, user_id)
);

create table project_chapters (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations (id) on delete cascade,
  project_id uuid not null references projects (id) on delete cascade,
  name text not null,
  sort_order integer not null default 0
);

create table project_rubros (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations (id) on delete cascade,
  project_id uuid not null references projects (id) on delete cascade,
  chapter_id uuid references project_chapters (id) on delete cascade,
  catalog_rubro_id uuid,
  code text not null default '',
  name text not null,
  unit text not null default '',
  quantity numeric not null default 0,
  yield_rate numeric not null default 1,
  is_subcontract boolean not null default false,
  proposed_value numeric not null default 0,
  is_auxiliary boolean not null default false,
  minor_tool_percent numeric not null default 0,
  origin text not null default 'ND',
  rubro_type text not null default '',
  sort_order integer not null default 0
);

create table project_apu_lines (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations (id) on delete cascade,
  project_id uuid not null references projects (id) on delete cascade,
  rubro_id uuid not null references project_rubros (id) on delete cascade,
  kind text not null,
  catalog_id uuid,
  auxiliary_rubro_id uuid,
  code text not null default '',
  name text not null default '',
  unit text not null default '',
  quantity numeric not null default 0,
  unit_price numeric not null default 0,
  cpc_code text not null default '',
  origin text not null default 'ND',
  sort_order integer not null default 0
);

create table contributors (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations (id) on delete cascade,
  project_id uuid not null references projects (id) on delete cascade,
  company text not null,
  material_percent numeric not null default 0,
  labor_percent numeric not null default 0,
  equipment_percent numeric not null default 0,
  transport_percent numeric not null default 0
);

create table indirect_items (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations (id) on delete cascade,
  project_id uuid not null references projects (id) on delete cascade,
  group_name text not null,
  name text not null,
  enabled boolean not null default true,
  mode text not null,
  monthly_cost numeric not null default 0,
  months numeric not null default 1,
  direct_total numeric not null default 0,
  percent numeric not null default 0,
  advance_percent numeric not null default 0,
  premium_percent numeric not null default 0,
  guarantee_percent numeric not null default 0,
  sort_order integer not null default 0
);

create table adjustment_symbols (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations (id) on delete cascade,
  project_id uuid not null references projects (id) on delete cascade,
  code text not null,
  name text not null,
  family text not null,
  scope text not null default 'family',
  sort_order integer not null default 0
);

create table symbol_components (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations (id) on delete cascade,
  project_id uuid not null references projects (id) on delete cascade,
  symbol_id uuid not null references adjustment_symbols (id) on delete cascade,
  line_id uuid
);

create table polynomial_terms (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations (id) on delete cascade,
  project_id uuid not null references projects (id) on delete cascade,
  symbol_id uuid not null references adjustment_symbols (id) on delete cascade,
  coefficient numeric not null default 0
);

create table price_indices (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations (id) on delete cascade,
  project_id uuid not null references projects (id) on delete cascade,
  symbol_id uuid not null references adjustment_symbols (id) on delete cascade,
  kind text not null,
  period_label text not null default '',
  value numeric not null default 0
);

create table crew_weights (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations (id) on delete cascade,
  project_id uuid not null references projects (id) on delete cascade,
  labor_id text not null default '',
  name text not null default '',
  weight numeric not null default 0
);

create table adjustment_memos (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations (id) on delete cascade,
  project_id uuid not null references projects (id) on delete cascade,
  body text not null default '',
  author text not null default '',
  memo_date date
);

create table work_calendars (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations (id) on delete cascade,
  project_id uuid not null references projects (id) on delete cascade,
  name text not null,
  mon numeric not null default 8,
  tue numeric not null default 8,
  wed numeric not null default 8,
  thu numeric not null default 8,
  fri numeric not null default 8,
  sat numeric not null default 0,
  sun numeric not null default 0
);

create table schedule_groups (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations (id) on delete cascade,
  project_id uuid not null references projects (id) on delete cascade,
  name text not null,
  chapter_id uuid,
  sort_order integer not null default 0
);

create table schedule_tasks (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations (id) on delete cascade,
  project_id uuid not null references projects (id) on delete cascade,
  rubro_id uuid,
  group_id uuid,
  start_date date,
  duration_days numeric not null default 1,
  responsible text not null default ''
);

create table valued_periods (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations (id) on delete cascade,
  project_id uuid not null references projects (id) on delete cascade,
  name text not null,
  start_date date,
  end_date date,
  sort_order integer not null default 0
);

create table valued_allocations (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations (id) on delete cascade,
  project_id uuid not null references projects (id) on delete cascade,
  period_id uuid not null references valued_periods (id) on delete cascade,
  rubro_id uuid,
  percent numeric not null default 0,
  is_subperiod boolean not null default false
);

create table warehouse_movements (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations (id) on delete cascade,
  project_id uuid not null references projects (id) on delete cascade,
  kind text not null check (kind in ('in', 'out')),
  material_name text not null,
  rubro_id uuid,
  quantity numeric not null default 0,
  unit_price numeric not null default 0,
  invoice text not null default '',
  supplier_name text not null default '',
  movement_date date not null default current_date
);

create table contract_advances (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations (id) on delete cascade,
  project_id uuid not null references projects (id) on delete cascade,
  amount numeric not null default 0,
  advance_date date not null default current_date,
  note text not null default ''
);

create table deductions (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations (id) on delete cascade,
  project_id uuid not null references projects (id) on delete cascade,
  name text not null,
  mode text not null default 'amount',
  amount numeric not null default 0
);

create table payment_certificates (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations (id) on delete cascade,
  project_id uuid not null references projects (id) on delete cascade,
  number integer not null,
  period_label text not null default '',
  certificate_date date not null default current_date,
  amortization_percent numeric not null default 0
);

create table certificate_lines (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations (id) on delete cascade,
  project_id uuid not null references projects (id) on delete cascade,
  certificate_id uuid not null references payment_certificates (id) on delete cascade,
  rubro_id uuid,
  quantity_period numeric not null default 0,
  quantity_previous numeric not null default 0
);

create table certificate_adjustments (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations (id) on delete cascade,
  project_id uuid not null references projects (id) on delete cascade,
  certificate_id uuid not null references payment_certificates (id) on delete cascade,
  symbol_id uuid,
  index_period numeric not null default 0,
  index_base numeric not null default 0
);

create index projects_org_idx on projects (org_id);
create index rubros_project_idx on project_rubros (project_id);
create index lines_rubro_idx on project_apu_lines (rubro_id);
create index members_user_idx on organization_members (user_id);

create or replace function org_role(oid uuid)
returns text language sql stable security definer set search_path = public as $$
  select role from organization_members where org_id = oid and user_id = auth.uid()
$$;

create or replace function is_org_member(oid uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select org_role(oid) is not null
$$;

create or replace function is_org_admin(oid uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select org_role(oid) = 'admin'
$$;

create or replace function can_edit_catalog(oid uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select org_role(oid) in ('admin', 'presupuestador')
$$;

create or replace function shares_org(other uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from organization_members a
    join organization_members b on a.org_id = b.org_id
    where a.user_id = auth.uid() and b.user_id = other
  );
$$;

create or replace function can_read_project(pid uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from projects p
    where p.id = pid and (
      org_role(p.org_id) = 'admin'
      or exists (select 1 from project_members pm where pm.project_id = p.id and pm.user_id = auth.uid())
    )
  );
$$;

create or replace function can_write_budget(pid uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from projects p
    where p.id = pid and (
      org_role(p.org_id) = 'admin'
      or (org_role(p.org_id) = 'presupuestador' and exists (
        select 1 from project_members pm where pm.project_id = p.id and pm.user_id = auth.uid()
      ))
    )
  );
$$;

create or replace function can_write_warehouse(pid uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from projects p
    where p.id = pid and (
      org_role(p.org_id) = 'admin'
      or (org_role(p.org_id) = 'bodega' and exists (
        select 1 from project_members pm where pm.project_id = p.id and pm.user_id = auth.uid()
      ))
    )
  );
$$;

create or replace function seed_org_catalog(oid uuid)
returns void language plpgsql security definer set search_path = public as $$
declare
  city uuid := gen_random_uuid();
  ch uuid := gen_random_uuid();
  tipo uuid := gen_random_uuid();
  rubro uuid := gen_random_uuid();
begin
  insert into units (org_id, code, name) values
    (oid, 'm', 'Metro'), (oid, 'm2', 'Metro cuadrado'), (oid, 'm3', 'Metro cúbico'),
    (oid, 'u', 'Unidad'), (oid, 'h', 'Hora'), (oid, 'km', 'Kilómetro'), (oid, 'saco', 'Saco');
  insert into unit_conversions (org_id, from_qty, from_unit, to_qty, to_unit) values (oid, 1000, 'm', 1, 'km');
  insert into cities (id, org_id, name) values (city, oid, 'Loja');
  insert into suppliers (org_id, city_id, name, address) values (oid, city, 'Cantera del Valle', 'Vía a Catamayo');
  insert into materials (org_id, code, name, unit, chamber_price, personal_price) values
    (oid, 'MAT-CEM', 'Cemento portland 50 kg', 'saco', 8.5, 8.1),
    (oid, 'MAT-ARE', 'Arena', 'm3', 18, 16.5),
    (oid, 'MAT-LAD', 'Ladrillo mambrón', 'u', 0.25, 0.22);
  insert into labor_categories (org_id, code, name, hourly_chamber, hourly_personal) values
    (oid, 'MO-PEO', 'Peón', 3.5, 3.8), (oid, 'MO-ALB', 'Albañil', 4.5, 4.8);
  insert into equipment (org_id, code, name, hourly_chamber, hourly_personal, yield_rate, power, brand, machine_type, uses_gasoline, chamber_code)
    values (oid, 'EQ-CON', 'Concretera de un saco', 4.2, 4.5, 2, '8 HP', 'Genérica', 'Hormigonera', true, 'EQ-01');
  insert into transport_rates (org_id, code, name, unit, rate_chamber, rate_personal) values (oid, 'TR-VOL', 'Volquete', 'm3-km', 0.85, 0.9);
  insert into catalog_chapters (id, org_id, code, name, sort_order) values (ch, oid, '02', 'Hormigones', 1);
  insert into rubro_types (id, org_id, name) values (tipo, oid, 'Civil');
  insert into catalog_rubros (id, org_id, chapter_id, type_id, code, name, unit, yield_rate)
    values (rubro, oid, ch, tipo, '02.001', 'Hormigón simple f''c 180 kg/cm2', 'm3', 2);
  insert into cpc_codes (org_id, code, description) values
    (oid, '374400011', 'Cemento portland'), (oid, '872100011', 'Servicios de peón');
  insert into vae_thresholds (org_id, name, percent, note)
    values (oid, 'Umbral de ejemplo', 40, 'Valor de demostración. Confirme el umbral en los pliegos.');
  insert into price_snapshots (org_id, captured_on, note) values (oid, current_date, 'Base inicial de ejemplo');
end;
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
      insert into organizations (name)
      values (coalesce(nullif(new.raw_user_meta_data->>'org_name', ''), 'Organización'))
      returning id into oid;
      insert into organization_members (org_id, user_id, role) values (oid, new.id, 'admin');
      perform seed_org_catalog(oid);
    end if;
  end if;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

alter table profiles enable row level security;
alter table organizations enable row level security;
alter table organization_members enable row level security;
alter table invitations enable row level security;

create policy profiles_select on profiles for select using (id = auth.uid() or shares_org(id));
create policy profiles_update on profiles for update using (id = auth.uid());
create policy organizations_select on organizations for select using (is_org_member(id));
create policy organizations_update on organizations for update using (is_org_admin(id));
create policy members_select on organization_members for select using (is_org_member(org_id) or user_id = auth.uid());
create policy members_write on organization_members for all using (is_org_admin(org_id)) with check (is_org_admin(org_id));
create policy invitations_admin on invitations for all using (is_org_admin(org_id)) with check (is_org_admin(org_id));

do $$
declare
  t text;
begin
  foreach t in array array[
    'units','unit_conversions','cities','suppliers','materials','material_suppliers','equipment','labor_categories',
    'transport_rates','catalog_chapters','rubro_types','catalog_rubros','catalog_apu_lines','price_snapshots',
    'price_snapshot_lines','cpc_codes','vae_thresholds'
  ]
  loop
    execute format('alter table %I enable row level security', t);
    execute format('create policy %I on %I for select using (is_org_member(org_id))', t || '_read', t);
    execute format('create policy %I on %I for all using (can_edit_catalog(org_id)) with check (can_edit_catalog(org_id))', t || '_write', t);
  end loop;
end $$;

alter table projects enable row level security;
create policy projects_read on projects for select using (can_read_project(id));
create policy projects_insert on projects for insert with check (can_edit_catalog(org_id));
create policy projects_update on projects for update using (can_write_budget(id));
create policy projects_delete on projects for delete using (is_org_admin(org_id));

alter table project_members enable row level security;
create policy project_members_read on project_members for select using (can_read_project(project_id) or user_id = auth.uid());
create policy project_members_write on project_members for all using (is_org_admin(org_id) or (user_id = auth.uid() and can_edit_catalog(org_id))) with check (is_org_admin(org_id) or (user_id = auth.uid() and can_edit_catalog(org_id)));

do $$
declare
  t text;
begin
  foreach t in array array[
    'project_chapters','project_rubros','project_apu_lines','contributors','indirect_items','adjustment_symbols',
    'symbol_components','polynomial_terms','price_indices','crew_weights','adjustment_memos','work_calendars',
    'schedule_groups','schedule_tasks','valued_periods','valued_allocations','contract_advances','deductions',
    'payment_certificates','certificate_lines','certificate_adjustments'
  ]
  loop
    execute format('alter table %I enable row level security', t);
    execute format('create policy %I on %I for select using (can_read_project(project_id))', t || '_read', t);
    execute format('create policy %I on %I for all using (can_write_budget(project_id)) with check (can_write_budget(project_id))', t || '_write', t);
  end loop;
end $$;

alter table warehouse_movements enable row level security;
create policy warehouse_read on warehouse_movements for select using (can_read_project(project_id));
create policy warehouse_write on warehouse_movements for all using (can_write_warehouse(project_id)) with check (can_write_warehouse(project_id));

grant usage on schema public to authenticated;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant execute on all functions in schema public to authenticated;

do $$
begin
  if exists (select 1 from information_schema.tables where table_schema = 'storage' and table_name = 'buckets') then
    insert into storage.buckets (id, name, public) values ('respaldos', 'respaldos', false) on conflict (id) do nothing;
  end if;
end $$;
