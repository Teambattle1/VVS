-- ============================================================
-- Team persistence: gor vvs_users brugbar til demo-brugere
-- uden auth.users FK + tilfoej email + demo_password
-- ============================================================

-- 1. Gor user_id nullable (demo-brugere har ikke Supabase auth-account)
alter table public.vvs_users
  alter column user_id drop not null;

-- 2. Tilfoej email + demo_password hvis de mangler
alter table public.vvs_users
  add column if not exists email text,
  add column if not exists demo_password text default '1234';

-- 3. Unique constraint pa (organization_id, email) — kun hvor email er sat
create unique index if not exists idx_vvs_users_org_email
  on public.vvs_users (organization_id, lower(email))
  where email is not null;

-- 4. Fjern gammelt unique constraint der krævede user_id
alter table public.vvs_users
  drop constraint if exists vvs_users_user_id_organization_id_key;

-- 5. Aaben RLS for SELECT paa eget org (saa login-fallback kan laese email/pw)
drop policy if exists "vvs_users_read_same_org" on public.vvs_users;
create policy "vvs_users_read_same_org" on public.vvs_users
  for select using (
    organization_id = public.vvs_current_org_id()
    or public.vvs_current_role() = 'super_admin'
  );

-- 6. Tillad anon-laesning af email+password KUN til login-flow (begraenset felt-exposure)
-- Dette er en security tradeoff: uden det kan demo-login ikke matche pw foer auth.
-- Vi bruger en dedikeret view med minimum data.
create or replace view public.vvs_login_candidates as
  select id, organization_id, name, role, email, demo_password, active
  from public.vvs_users
  where email is not null and active = true;

grant select on public.vvs_login_candidates to anon, authenticated;
