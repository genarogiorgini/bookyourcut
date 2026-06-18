-- Turnero — demo seed data (idempotent-ish; safe to run on a fresh DB).
-- Creates one barbershop, three barbers, weekly schedules, and sample appointments.
-- The admin auth user + profile are created separately via supabase/create-admin.mjs
-- (auth.users must be created through Supabase Auth, not plain SQL).

-- Fixed UUIDs so the data is easy to reference while developing.
-- tenant: 11111111-1111-1111-1111-111111111111
-- barbers: aaaaaaaa.. / bbbbbbbb.. / cccccccc..

insert into public.tenants (id, slug, name, whatsapp_number, hero_video_url, primary_color, timezone)
values (
  '11111111-1111-1111-1111-111111111111',
  'barberia-central',
  'Barbería Central',
  '5491122334455',            -- demo WhatsApp number (E.164 digits, no +)
  null,
  '#B89364',
  'America/Argentina/Buenos_Aires'
)
on conflict (id) do nothing;

insert into public.barbers (id, tenant_id, name, photo_url, instagram, bio, price_per_cut, default_duration_min, sort_order)
values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111',
   'Tomás', null, '@tomas.cuts', 'Fades y diseños.', 8000, 30, 1),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '11111111-1111-1111-1111-111111111111',
   'Lucas', null, '@lucas.barber', 'Clásico y barba.', 7000, 45, 2),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', '11111111-1111-1111-1111-111111111111',
   'Martín', null, '@martin.hair', 'Color y estilismo.', 9000, 30, 3)
on conflict (id) do nothing;

-- Weekly schedules: Tuesday(2)..Saturday(6), split shift 10:00-14:00 & 15:00-19:00.
insert into public.barber_schedules (barber_id, weekday, start_time, end_time)
select b.id, wd, t.start_time, t.end_time
from public.barbers b
cross join generate_series(2, 6) as wd
cross join (values (time '10:00', time '14:00'), (time '15:00', time '19:00')) as t(start_time, end_time)
where b.tenant_id = '11111111-1111-1111-1111-111111111111'
on conflict do nothing;

-- A few sample appointments over the next couple of days (Buenos Aires local time),
-- so the client app shows some slots as "occupied" and the admin calendar has content.
insert into public.appointments
  (tenant_id, barber_id, client_name, client_phone, starts_at, ends_at, status, price, created_via)
values
  ('11111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
   'Juan Pérez', '5491133344455',
   ((current_date + 1) + time '11:00') at time zone 'America/Argentina/Buenos_Aires',
   ((current_date + 1) + time '11:30') at time zone 'America/Argentina/Buenos_Aires',
   'confirmed', 8000, 'admin'),
  ('11111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
   'Diego Gómez', '5491144455566',
   ((current_date + 1) + time '12:00') at time zone 'America/Argentina/Buenos_Aires',
   ((current_date + 1) + time '12:30') at time zone 'America/Argentina/Buenos_Aires',
   'confirmed', 8000, 'client'),
  ('11111111-1111-1111-1111-111111111111', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
   'Sofía Ruiz', '5491155566677',
   ((current_date + 1) + time '15:00') at time zone 'America/Argentina/Buenos_Aires',
   ((current_date + 1) + time '15:45') at time zone 'America/Argentina/Buenos_Aires',
   'confirmed', 7000, 'admin')
on conflict on constraint appointments_no_overlap do nothing;
