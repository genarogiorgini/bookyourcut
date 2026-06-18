# Supabase setup

Apply the SQL in order against your Supabase project (SQL Editor, or `psql`):

1. `migrations/0001_init.sql` — tables, indexes, no-overlap constraint
2. `migrations/0002_rls.sql` — RLS policies + `auth_tenant_id()` helper
3. `seed.sql` — demo shop, barbers, schedules, sample appointments

Then create a demo admin user (needs the service role key):

```powershell
$env:SUPABASE_URL="https://<ref>.supabase.co"
$env:SUPABASE_SERVICE_ROLE_KEY="<service-role-key>"
node create-admin.mjs admin@barberia.test SuperSecret123
```

Storage (optional): create public buckets `barber-photos` and `hero-videos`
for barber avatars and the landing video, then store their public URLs on
`barbers.photo_url` / `tenants.hero_video_url`.

> The API connects with the **service role key** and bypasses RLS. RLS is the
> safety net for any direct `supabase-js` access from the browser (anon or admin).
