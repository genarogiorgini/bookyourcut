# Turnero

Multi-tenant barbershop appointment **PWA**. Software handles availability; the human
keeps the final confirmation over **WhatsApp** (click-to-chat). Built as a pnpm monorepo.

- **Client flow (public):** pick barber → see real availability → choose slot →
  redirect to the shop's WhatsApp with a pre-filled summary.
- **Admin BackOffice (Supabase Auth):** calendar of all barbers, create/edit/cancel
  appointments, manual 24 h reminders (wa.me), per-barber analytics.

## Stack
- **apps/web** — Angular 22 (standalone, signals), Tailwind v4, FullCalendar, PWA.
- **apps/api** — NestJS 11, Supabase (service role), Luxon, class-validator.
- **packages/shared** — TS types + WhatsApp message builders shared by both.
- **supabase/** — SQL migrations, RLS, seed.

## Prerequisites
Node 24 LTS, pnpm 11. (This machine has Volta pinning Node; the Angular/Nest CLIs
need Node ≥ 24.15 — make sure `node -v` reports 24.x before running.)

## Setup
```bash
pnpm install
pnpm build:shared          # build @turnero/shared once (api/web depend on it)
```

### Supabase
1. Create a project, then run in order (SQL editor or psql):
   `supabase/migrations/0001_init.sql`, `0002_rls.sql`, `supabase/seed.sql`.
2. Create the demo admin (see `supabase/README.md`):
   ```bash
   node supabase/create-admin.mjs admin@barberia.test SuperSecret123
   ```

### Env
- API: copy `apps/api/.env.example` → `apps/api/.env`, fill Supabase URL + keys.
- Web: put your Supabase URL + anon key into
  `apps/web/src/environments/environment.ts` (admin login needs them; the client
  booking flow only needs `apiBaseUrl`).

## Run (dev)
```bash
pnpm dev:api     # http://localhost:3000  (GET /health)
pnpm dev:web     # http://localhost:4200
```
Client: open `http://localhost:4200/barberia-central`.
Admin:  `http://localhost:4200/barberia-central/admin`.

## Test
```bash
pnpm --filter @turnero/api test     # availability algorithm unit tests
```

## How the WhatsApp booking works
On "Confirmar", the API creates a `pending` appointment with a short TTL hold
(`PENDING_HOLD_MINUTES`, default 30) so the slot is reserved during the chat, and
returns a `wa.me` link with the summary. The browser opens it; the client sends from
their own phone. The shop confirms in the BackOffice (→ `confirmed`) or the hold
expires and the slot frees automatically. No Meta Cloud API, no per-message cost.

## Notes / future
- Reminders are manual (BackOffice → Recordatorios → "Enviar"). Automating them needs
  the Meta WhatsApp Cloud API + an approved template.
- PWA icons in `apps/web/public/icons` are generated placeholders
  (`node apps/web/scripts/generate-icons.mjs`); swap in real artwork before launch.
