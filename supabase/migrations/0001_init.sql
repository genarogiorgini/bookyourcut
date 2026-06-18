-- Turnero — initial schema
-- Multi-tenant barbershop appointments. One deployment, many barbershops (tenants).

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- tenants (barbershops)
-- ---------------------------------------------------------------------------
create table public.tenants (
  id              uuid primary key default gen_random_uuid(),
  slug            text not null unique,
  name            text not null,
  whatsapp_number text not null,                 -- E.164 digits only (no +)
  hero_video_url  text,
  logo_url        text,
  primary_color   text,                          -- hex, e.g. #B89364
  timezone        text not null default 'America/Argentina/Buenos_Aires',
  created_at      timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- profiles (admin users) — 1:1 with auth.users
-- ---------------------------------------------------------------------------
create table public.profiles (
  id         uuid primary key references auth.users (id) on delete cascade,
  tenant_id  uuid not null references public.tenants (id) on delete cascade,
  role       text not null default 'manager' check (role in ('owner', 'manager')),
  full_name  text,
  created_at timestamptz not null default now()
);
create index profiles_tenant_idx on public.profiles (tenant_id);

-- ---------------------------------------------------------------------------
-- barbers
-- ---------------------------------------------------------------------------
create table public.barbers (
  id                   uuid primary key default gen_random_uuid(),
  tenant_id            uuid not null references public.tenants (id) on delete cascade,
  name                 text not null,
  photo_url            text,
  instagram            text,
  bio                  text,
  price_per_cut        numeric(10, 2) not null default 0,
  default_duration_min int not null default 30 check (default_duration_min > 0),
  active               boolean not null default true,
  sort_order           int not null default 0,
  created_at           timestamptz not null default now()
);
create index barbers_tenant_idx on public.barbers (tenant_id);

-- ---------------------------------------------------------------------------
-- barber_schedules — recurring weekly working hours (local clock times)
-- weekday: 0=Sunday .. 6=Saturday (matches JS Date.getDay()).
-- Multiple rows per (barber, weekday) allowed to model split shifts.
-- ---------------------------------------------------------------------------
create table public.barber_schedules (
  id         uuid primary key default gen_random_uuid(),
  barber_id  uuid not null references public.barbers (id) on delete cascade,
  weekday    int not null check (weekday between 0 and 6),
  start_time time not null,
  end_time   time not null,
  check (end_time > start_time)
);
create index barber_schedules_barber_idx on public.barber_schedules (barber_id, weekday);

-- ---------------------------------------------------------------------------
-- time_off — one-off blocks/holidays/vacations (absolute datetimes)
-- ---------------------------------------------------------------------------
create table public.time_off (
  id        uuid primary key default gen_random_uuid(),
  barber_id uuid not null references public.barbers (id) on delete cascade,
  starts_at timestamptz not null,
  ends_at   timestamptz not null,
  reason    text,
  check (ends_at > starts_at)
);
create index time_off_barber_idx on public.time_off (barber_id, starts_at);

-- ---------------------------------------------------------------------------
-- appointments
-- ---------------------------------------------------------------------------
create table public.appointments (
  id                 uuid primary key default gen_random_uuid(),
  tenant_id          uuid not null references public.tenants (id) on delete cascade,
  barber_id          uuid not null references public.barbers (id) on delete cascade,
  client_name        text not null,
  client_phone       text not null,
  starts_at          timestamptz not null,
  ends_at            timestamptz not null,
  status             text not null default 'pending'
                       check (status in ('pending','confirmed','cancelled','completed','no_show')),
  price              numeric(10, 2),
  notes              text,                        -- private admin note
  created_via        text not null default 'client' check (created_via in ('client','admin')),
  pending_expires_at timestamptz,                 -- set only while status='pending'
  created_at         timestamptz not null default now(),
  check (ends_at > starts_at)
);
create index appointments_barber_time_idx on public.appointments (barber_id, starts_at);
create index appointments_tenant_time_idx on public.appointments (tenant_id, starts_at);

-- Prevent double-booking the same barber for overlapping ACTIVE slots
-- (pending + confirmed block the slot; cancelled/completed/no_show do not).
create extension if not exists btree_gist;
alter table public.appointments
  add constraint appointments_no_overlap
  exclude using gist (
    barber_id with =,
    tstzrange(starts_at, ends_at) with &&
  ) where (status in ('pending', 'confirmed'));
