-- ============================================================
-- Single-tenant: loosen RLS paa ALLE vvs_*-data-tabeller saa
-- anon kan udfoere CRUD. Bevidst tradeoff: appen er kun til
-- ÉT firma, og access-kontrol haandhaeves via login frem for RLS.
--
-- Koer i Supabase Studio efter den foerste seed-migration.
-- Idempotent — kan koeres flere gange.
-- ============================================================

-- Helper: drop alle eksisterende policies + opret aabne
do $$
declare
  t text;
  tables text[] := array[
    'vvs_customers',
    'vvs_jobs',
    'vvs_rooms',
    'vvs_room_packages',
    'vvs_package_templates',
    'vvs_items',
    'vvs_package_items',
    'vvs_customer_actions',
    'vvs_activity_log',
    'vvs_room_templates'
  ];
  pol record;
begin
  foreach t in array tables loop
    -- Drop alle eksisterende policies paa tabellen
    for pol in
      select policyname from pg_policies
      where schemaname = 'public' and tablename = t
    loop
      execute format('drop policy if exists %I on public.%I', pol.policyname, t);
    end loop;

    -- Opret 4 aabne policies for anon + authenticated
    execute format('create policy "%s_read_anon"   on public.%I for select using (true)', t, t);
    execute format('create policy "%s_insert_anon" on public.%I for insert with check (true)', t, t);
    execute format('create policy "%s_update_anon" on public.%I for update using (true) with check (true)', t, t);
    execute format('create policy "%s_delete_anon" on public.%I for delete using (true)', t, t);
  end loop;
end $$;
