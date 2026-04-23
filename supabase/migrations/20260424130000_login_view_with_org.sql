-- ============================================================
-- Udvid vvs_login_candidates saa demo-brugere ogsaa faar org-info
-- (uden at kraeve Supabase auth-session for at laese vvs_organizations)
-- ============================================================

drop view if exists public.vvs_login_candidates;

create view public.vvs_login_candidates as
  select
    u.id,
    u.organization_id,
    u.name,
    u.role,
    u.email,
    u.demo_password,
    u.active,
    o.name         as org_name,
    o.primary_color,
    o.accent_color,
    o.logo_url,
    o.contact_email as org_email,
    o.contact_phone as org_phone,
    o.address      as org_address
  from public.vvs_users u
  left join public.vvs_organizations o on o.id = u.organization_id
  where u.email is not null and u.active = true;

grant select on public.vvs_login_candidates to anon, authenticated;
