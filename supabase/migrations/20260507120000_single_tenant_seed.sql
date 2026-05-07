-- ============================================================
-- Single-tenant setup: ét firma + INITIAL_TEAM med Anders som admin
--
-- Denne migration:
-- 1. Sikrer at vvs_login_candidates har org-kolonner (genskaber view)
-- 2. Loosener RLS paa vvs_organizations + vvs_users saa anon kan
--    laese og opdatere det ene firma. Bevidst tradeoff for single-tenant:
--    appen er kun til ÉT firma, og access-kontrol haandhaeves via login
--    frem for RLS.
-- 3. Rydder gamle [DEMO]-data og evt. anden org (vi vil kun have én)
-- 4. Seeder firmaet "VVS København ApS" hvis det ikke findes
-- 5. Upsert'er INITIAL_TEAM (5 medarbejdere) med Anders Elmgren
--    som org_admin og password 1234.
--
-- Kør i Supabase Studio SQL Editor. Idempotent — kan køres flere
-- gange uden skade.
-- ============================================================

begin;

-- 1. Login-view med org-info (gen-create saa kolonner sikres)
drop view if exists public.vvs_login_candidates;
create view public.vvs_login_candidates as
  select
    u.id, u.organization_id, u.name, u.role, u.email, u.demo_password, u.active,
    o.name           as org_name,
    o.primary_color,
    o.accent_color,
    o.logo_url,
    o.contact_email  as org_email,
    o.contact_phone  as org_phone,
    o.address        as org_address
  from public.vvs_users u
  left join public.vvs_organizations o on o.id = u.organization_id
  where u.email is not null and u.active = true;
grant select on public.vvs_login_candidates to anon, authenticated;

-- 2. Loosen RLS for single-tenant (anon read+write paa det ene firma)
drop policy if exists "vvs_org_read_anon"  on public.vvs_organizations;
drop policy if exists "vvs_org_write_anon" on public.vvs_organizations;
create policy "vvs_org_read_anon"  on public.vvs_organizations for select using (true);
create policy "vvs_org_write_anon" on public.vvs_organizations for update using (true) with check (true);

drop policy if exists "vvs_users_read_anon"   on public.vvs_users;
drop policy if exists "vvs_users_insert_anon" on public.vvs_users;
drop policy if exists "vvs_users_update_anon" on public.vvs_users;
drop policy if exists "vvs_users_delete_anon" on public.vvs_users;
create policy "vvs_users_read_anon"   on public.vvs_users for select using (true);
create policy "vvs_users_insert_anon" on public.vvs_users for insert with check (true);
create policy "vvs_users_update_anon" on public.vvs_users for update using (true) with check (true);
create policy "vvs_users_delete_anon" on public.vvs_users for delete using (true);

-- 3. Ryd gamle demo-data og enhver anden org end vvs-kbh
delete from public.vvs_users
  where name ilike '%[DEMO]%' or email ilike '%@demo-vvs.dk';
delete from public.vvs_organizations
  where slug <> 'vvs-kbh';

-- 4. Opret eller opdatér firmaet
insert into public.vvs_organizations
  (name, slug, cvr, contact_email, contact_phone, address,
   primary_color, accent_color, default_hourly_rate,
   default_markup_percent, subscription_tier, subscription_status)
values
  ('VVS København ApS', 'vvs-kbh', '12345678',
   'kontakt@vvs-kbh.dk', '+45 70 20 30 40',
   'Vandmålervej 12, 2100 København Ø',
   '#0EA5E9', '#F59E0B', 695, 25, 'pro', 'active')
on conflict (slug) do update set
  updated_at = now();

-- 5. Seed INITIAL_TEAM linket til firmaet (Anders som admin)
do $$
declare org_uuid uuid;
begin
  select id into org_uuid from public.vvs_organizations where slug = 'vvs-kbh' limit 1;

  insert into public.vvs_users
    (organization_id, name, email, phone, role, demo_password, active)
  values
    (org_uuid, 'Anders Elmgren',  'a@a.dk',             '+45 20 00 00 00', 'org_admin', '1234', true),
    (org_uuid, 'Mikkel Montør',   'mikkel@vvs-kbh.dk',  '+45 20 11 22 33', 'org_admin', '1234', true),
    (org_uuid, 'Anne Rasmussen',  'anne@vvs-kbh.dk',    '+45 20 44 55 66', 'montor',    '1234', true),
    (org_uuid, 'Jesper Sørensen', 'jesper@vvs-kbh.dk',  '+45 20 77 88 99', 'montor',    '1234', true),
    (org_uuid, 'Louise Kjær',     'louise@vvs-kbh.dk',  '+45 30 11 22 33', 'montor',    '1234', true)
  on conflict (organization_id, lower(email)) do update set
    name          = excluded.name,
    phone         = excluded.phone,
    role          = excluded.role,
    demo_password = excluded.demo_password,
    active        = excluded.active;
end $$;

commit;

-- Verifikation — efter migrationen bør du se 5 brugere og 1 firma
select 'org' as type, name, slug, cvr from public.vvs_organizations
union all
select 'user' as type, name, role, email from public.vvs_users
order by type, name;
