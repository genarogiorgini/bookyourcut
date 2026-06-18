-- Turnero — Row Level Security
-- The NestJS API talks to Postgres with the SERVICE ROLE key, which bypasses RLS.
-- These policies are defense-in-depth for any direct supabase-js access:
--   * anon key  -> may read public branding only (tenants, barbers, schedules)
--   * logged-in admin -> may read/write only rows within their own tenant
-- Appointment PII (names/phones) is NEVER exposed to anon.

-- Helper: the tenant_id of the currently authenticated admin (NULL for anon).
create or replace function public.auth_tenant_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select tenant_id from public.profiles where id = auth.uid();
$$;

-- ---------------------------------------------------------------------------
alter table public.tenants          enable row level security;
alter table public.profiles         enable row level security;
alter table public.barbers          enable row level security;
alter table public.barber_schedules enable row level security;
alter table public.time_off         enable row level security;
alter table public.appointments     enable row level security;

-- tenants: public can read branding; admins manage their own tenant.
create policy tenants_public_read on public.tenants
  for select using (true);
create policy tenants_admin_all on public.tenants
  for all to authenticated
  using (id = public.auth_tenant_id())
  with check (id = public.auth_tenant_id());

-- profiles: an admin can read/update only their own profile row.
create policy profiles_self on public.profiles
  for select to authenticated
  using (id = auth.uid());

-- barbers: public read (photos/branding); admins manage their tenant's barbers.
create policy barbers_public_read on public.barbers
  for select using (true);
create policy barbers_admin_all on public.barbers
  for all to authenticated
  using (tenant_id = public.auth_tenant_id())
  with check (tenant_id = public.auth_tenant_id());

-- barber_schedules: public read (needed to render availability); admins manage own.
create policy schedules_public_read on public.barber_schedules
  for select using (true);
create policy schedules_admin_all on public.barber_schedules
  for all to authenticated
  using (exists (
    select 1 from public.barbers b
    where b.id = barber_schedules.barber_id and b.tenant_id = public.auth_tenant_id()
  ))
  with check (exists (
    select 1 from public.barbers b
    where b.id = barber_schedules.barber_id and b.tenant_id = public.auth_tenant_id()
  ));

-- time_off: NO public access; admins manage their tenant's barbers' time off.
create policy time_off_admin_all on public.time_off
  for all to authenticated
  using (exists (
    select 1 from public.barbers b
    where b.id = time_off.barber_id and b.tenant_id = public.auth_tenant_id()
  ))
  with check (exists (
    select 1 from public.barbers b
    where b.id = time_off.barber_id and b.tenant_id = public.auth_tenant_id()
  ));

-- appointments: NO public access (PII). Admins see/manage only their tenant.
create policy appointments_admin_all on public.appointments
  for all to authenticated
  using (tenant_id = public.auth_tenant_id())
  with check (tenant_id = public.auth_tenant_id());
