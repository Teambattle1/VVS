-- VVS Tilbudssystem - Initial schema
-- White-label multi-tenant SaaS
-- Alle tabeller prefixet med vvs_, RLS aktiveret på alle
-- Prices gemmes EKSKL. moms (dansk moms = 25%)

-- ============================================================
-- Extensions
-- ============================================================
create extension if not exists "pgcrypto";

-- ============================================================
-- vvs_organizations (tenants)
-- ============================================================
create table if not exists public.vvs_organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  logo_url text,
  primary_color text default '#0EA5E9',
  accent_color text default '#F59E0B',
  contact_email text,
  contact_phone text,
  cvr text,
  address text,
  default_hourly_rate numeric(10,2) default 650,
  default_markup_percent numeric(5,2) default 25,
  subscription_tier text not null default 'trial' check (subscription_tier in ('trial','basic','pro')),
  subscription_status text not null default 'active' check (subscription_status in ('active','paused','cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================
-- vvs_users (profiler ovenpå auth.users)
-- ============================================================
create table if not exists public.vvs_users (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  organization_id uuid not null references public.vvs_organizations(id) on delete cascade,
  name text not null,
  role text not null default 'montor' check (role in ('org_admin','montor','super_admin')),
  phone text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (user_id, organization_id)
);

create index if not exists idx_vvs_users_org on public.vvs_users(organization_id);
create index if not exists idx_vvs_users_user on public.vvs_users(user_id);

-- ============================================================
-- vvs_customers
-- ============================================================
create table if not exists public.vvs_customers (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.vvs_organizations(id) on delete cascade,
  name text not null,
  email text,
  phone text,
  address text,
  zip text,
  city text,
  customer_type text not null default 'private' check (customer_type in ('private','business')),
  cvr text,
  default_vat_handling text not null default 'incl' check (default_vat_handling in ('incl','excl','both')),
  user_id uuid references auth.users(id) on delete set null,
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists idx_vvs_customers_org on public.vvs_customers(organization_id);

-- ============================================================
-- vvs_jobs
-- ============================================================
create table if not exists public.vvs_jobs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.vvs_organizations(id) on delete cascade,
  job_number text not null,
  customer_id uuid not null references public.vvs_customers(id) on delete restrict,
  title text not null,
  status text not null default 'draft' check (status in ('draft','sent','approved','rejected','in_progress','done')),
  vat_handling text not null default 'incl' check (vat_handling in ('incl','excl','both')),
  total_price_excl_vat numeric(12,2) default 0,
  total_price_incl_vat numeric(12,2) default 0,
  share_token uuid not null default gen_random_uuid() unique,
  assigned_to uuid references public.vvs_users(id) on delete set null,
  created_by uuid references public.vvs_users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, job_number)
);

create index if not exists idx_vvs_jobs_org on public.vvs_jobs(organization_id);
create index if not exists idx_vvs_jobs_customer on public.vvs_jobs(customer_id);
create index if not exists idx_vvs_jobs_share_token on public.vvs_jobs(share_token);

-- ============================================================
-- vvs_rooms
-- ============================================================
create table if not exists public.vvs_rooms (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.vvs_jobs(id) on delete cascade,
  organization_id uuid not null references public.vvs_organizations(id) on delete cascade,
  name text not null,
  room_type text not null default 'bathroom' check (room_type in ('bathroom','kitchen','utility','outdoor','technical','other')),
  width_cm integer,
  length_cm integer,
  floorplan_mode text not null default 'rectangle' check (floorplan_mode in ('rectangle','freehand','upload','template')),
  floorplan_data jsonb default '{}'::jsonb,
  floorplan_image_url text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists idx_vvs_rooms_job on public.vvs_rooms(job_id);
create index if not exists idx_vvs_rooms_org on public.vvs_rooms(organization_id);

-- ============================================================
-- vvs_package_templates
-- organization_id = NULL => global skabelon
-- ============================================================
create table if not exists public.vvs_package_templates (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.vvs_organizations(id) on delete cascade,
  name text not null,
  category text not null,
  lucide_icon text,
  description text,
  pricing_model text not null default 'fixed' check (pricing_model in ('fixed','hourly','package_plus')),
  base_price numeric(10,2) default 0,
  base_hours numeric(6,2) default 0,
  hourly_rate numeric(10,2),
  default_items jsonb default '[]'::jsonb,
  image_url text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists idx_vvs_package_templates_org on public.vvs_package_templates(organization_id);
create index if not exists idx_vvs_package_templates_category on public.vvs_package_templates(category);

-- ============================================================
-- vvs_room_packages (placerede pakker)
-- ============================================================
create table if not exists public.vvs_room_packages (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.vvs_rooms(id) on delete cascade,
  template_id uuid references public.vvs_package_templates(id) on delete set null,
  organization_id uuid not null references public.vvs_organizations(id) on delete cascade,
  name text not null,
  position_x numeric(8,2) default 0,
  position_y numeric(8,2) default 0,
  pricing_model text not null default 'fixed' check (pricing_model in ('fixed','hourly','package_plus')),
  fixed_price numeric(10,2) default 0,
  hours numeric(6,2) default 0,
  hourly_rate numeric(10,2),
  notes text,
  timeline_text text,
  status text not null default 'draft' check (status in ('draft','approved_by_customer','rejected_by_customer')),
  package_total_excl_vat numeric(12,2) default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_vvs_room_packages_room on public.vvs_room_packages(room_id);
create index if not exists idx_vvs_room_packages_org on public.vvs_room_packages(organization_id);

-- ============================================================
-- vvs_items (varedatabase pr. org)
-- ============================================================
create table if not exists public.vvs_items (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.vvs_organizations(id) on delete cascade,
  sku text,
  name text not null,
  description text,
  category text,
  supplier text default 'manual',
  supplier_sku text,
  unit text default 'stk',
  cost_price numeric(10,2) default 0,
  sales_price numeric(10,2) default 0,
  markup_percent numeric(5,2),
  image_url text,
  lucide_fallback_icon text,
  created_by uuid references public.vvs_users(id) on delete set null,
  active boolean not null default true,
  last_synced_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_vvs_items_org on public.vvs_items(organization_id);
create index if not exists idx_vvs_items_sku on public.vvs_items(organization_id, sku);
create index if not exists idx_vvs_items_search on public.vvs_items using gin (
  to_tsvector('simple', coalesce(name,'') || ' ' || coalesce(sku,'') || ' ' || coalesce(category,''))
);

-- ============================================================
-- vvs_package_items
-- ============================================================
create table if not exists public.vvs_package_items (
  id uuid primary key default gen_random_uuid(),
  room_package_id uuid not null references public.vvs_room_packages(id) on delete cascade,
  item_id uuid references public.vvs_items(id) on delete set null,
  organization_id uuid not null references public.vvs_organizations(id) on delete cascade,
  name_snapshot text not null,
  quantity numeric(8,2) not null default 1,
  unit_price numeric(10,2) not null default 0,
  total_price numeric(12,2) not null default 0,
  added_by text not null default 'montor' check (added_by in ('montor','customer')),
  customer_selected boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists idx_vvs_package_items_package on public.vvs_package_items(room_package_id);
create index if not exists idx_vvs_package_items_org on public.vvs_package_items(organization_id);

-- ============================================================
-- vvs_customer_actions
-- ============================================================
create table if not exists public.vvs_customer_actions (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.vvs_jobs(id) on delete cascade,
  organization_id uuid not null references public.vvs_organizations(id) on delete cascade,
  room_package_id uuid references public.vvs_room_packages(id) on delete cascade,
  package_item_id uuid references public.vvs_package_items(id) on delete cascade,
  action_type text not null check (action_type in ('comment','approve','reject','toggle_item','sign_offer')),
  message text,
  customer_name text,
  customer_email text,
  created_at timestamptz not null default now()
);

create index if not exists idx_vvs_customer_actions_job on public.vvs_customer_actions(job_id);

-- ============================================================
-- vvs_activity_log
-- ============================================================
create table if not exists public.vvs_activity_log (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.vvs_jobs(id) on delete cascade,
  organization_id uuid not null references public.vvs_organizations(id) on delete cascade,
  actor_type text not null check (actor_type in ('montor','customer','system')),
  actor_name text,
  action text not null,
  details jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_vvs_activity_log_job on public.vvs_activity_log(job_id);

-- ============================================================
-- Helper function: current user's organization_id
-- ============================================================
create or replace function public.vvs_current_org_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select organization_id
  from public.vvs_users
  where user_id = auth.uid() and active = true
  limit 1
$$;

create or replace function public.vvs_current_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role
  from public.vvs_users
  where user_id = auth.uid() and active = true
  limit 1
$$;

-- ============================================================
-- Enable RLS on all tables
-- ============================================================
alter table public.vvs_organizations enable row level security;
alter table public.vvs_users enable row level security;
alter table public.vvs_customers enable row level security;
alter table public.vvs_jobs enable row level security;
alter table public.vvs_rooms enable row level security;
alter table public.vvs_package_templates enable row level security;
alter table public.vvs_room_packages enable row level security;
alter table public.vvs_items enable row level security;
alter table public.vvs_package_items enable row level security;
alter table public.vvs_customer_actions enable row level security;
alter table public.vvs_activity_log enable row level security;

-- ============================================================
-- RLS policies
-- ============================================================

-- Organizations: brugere kan læse egen org
drop policy if exists "vvs_org_read_own" on public.vvs_organizations;
create policy "vvs_org_read_own" on public.vvs_organizations
  for select using (id = public.vvs_current_org_id());

drop policy if exists "vvs_org_admin_update" on public.vvs_organizations;
create policy "vvs_org_admin_update" on public.vvs_organizations
  for update using (id = public.vvs_current_org_id() and public.vvs_current_role() in ('org_admin','super_admin'));

-- Users: se kolleger i egen org
drop policy if exists "vvs_users_read_same_org" on public.vvs_users;
create policy "vvs_users_read_same_org" on public.vvs_users
  for select using (organization_id = public.vvs_current_org_id());

drop policy if exists "vvs_users_admin_write" on public.vvs_users;
create policy "vvs_users_admin_write" on public.vvs_users
  for all using (
    organization_id = public.vvs_current_org_id()
    and public.vvs_current_role() in ('org_admin','super_admin')
  ) with check (
    organization_id = public.vvs_current_org_id()
    and public.vvs_current_role() in ('org_admin','super_admin')
  );

-- Customers
drop policy if exists "vvs_customers_org_scope" on public.vvs_customers;
create policy "vvs_customers_org_scope" on public.vvs_customers
  for all using (organization_id = public.vvs_current_org_id())
  with check (organization_id = public.vvs_current_org_id());

-- Jobs
drop policy if exists "vvs_jobs_org_scope" on public.vvs_jobs;
create policy "vvs_jobs_org_scope" on public.vvs_jobs
  for all using (organization_id = public.vvs_current_org_id())
  with check (organization_id = public.vvs_current_org_id());

-- Rooms
drop policy if exists "vvs_rooms_org_scope" on public.vvs_rooms;
create policy "vvs_rooms_org_scope" on public.vvs_rooms
  for all using (organization_id = public.vvs_current_org_id())
  with check (organization_id = public.vvs_current_org_id());

-- Package templates: læs globale + egen org, skriv kun egen org
drop policy if exists "vvs_package_templates_read" on public.vvs_package_templates;
create policy "vvs_package_templates_read" on public.vvs_package_templates
  for select using (
    organization_id is null
    or organization_id = public.vvs_current_org_id()
  );

drop policy if exists "vvs_package_templates_write" on public.vvs_package_templates;
create policy "vvs_package_templates_write" on public.vvs_package_templates
  for all using (organization_id = public.vvs_current_org_id())
  with check (organization_id = public.vvs_current_org_id());

-- Room packages
drop policy if exists "vvs_room_packages_org_scope" on public.vvs_room_packages;
create policy "vvs_room_packages_org_scope" on public.vvs_room_packages
  for all using (organization_id = public.vvs_current_org_id())
  with check (organization_id = public.vvs_current_org_id());

-- Items
drop policy if exists "vvs_items_org_scope" on public.vvs_items;
create policy "vvs_items_org_scope" on public.vvs_items
  for all using (organization_id = public.vvs_current_org_id())
  with check (organization_id = public.vvs_current_org_id());

-- Package items
drop policy if exists "vvs_package_items_org_scope" on public.vvs_package_items;
create policy "vvs_package_items_org_scope" on public.vvs_package_items
  for all using (organization_id = public.vvs_current_org_id())
  with check (organization_id = public.vvs_current_org_id());

-- Customer actions
drop policy if exists "vvs_customer_actions_org_scope" on public.vvs_customer_actions;
create policy "vvs_customer_actions_org_scope" on public.vvs_customer_actions
  for all using (organization_id = public.vvs_current_org_id())
  with check (organization_id = public.vvs_current_org_id());

-- Activity log
drop policy if exists "vvs_activity_log_org_scope" on public.vvs_activity_log;
create policy "vvs_activity_log_org_scope" on public.vvs_activity_log
  for all using (organization_id = public.vvs_current_org_id())
  with check (organization_id = public.vvs_current_org_id());

-- ============================================================
-- Triggers til updated_at
-- ============================================================
create or replace function public.vvs_set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists vvs_organizations_updated_at on public.vvs_organizations;
create trigger vvs_organizations_updated_at before update on public.vvs_organizations
  for each row execute function public.vvs_set_updated_at();

drop trigger if exists vvs_jobs_updated_at on public.vvs_jobs;
create trigger vvs_jobs_updated_at before update on public.vvs_jobs
  for each row execute function public.vvs_set_updated_at();

drop trigger if exists vvs_room_packages_updated_at on public.vvs_room_packages;
create trigger vvs_room_packages_updated_at before update on public.vvs_room_packages
  for each row execute function public.vvs_set_updated_at();
