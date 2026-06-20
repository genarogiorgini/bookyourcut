// Creates a demo admin auth user and links a profile to the seeded tenant.
// Usage (PowerShell):
//   $env:SUPABASE_URL="https://xxxx.supabase.co"
//   $env:SUPABASE_SERVICE_ROLE_KEY="..."
//   node supabase/create-admin.mjs admin@barberia.test SuperSecret123
//
// Requires @supabase/supabase-js (installed in apps/api or run from there).

import { loadEnvFile } from 'node:process';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
try { loadEnvFile(resolve(__dirname, '../apps/api/.env')); } catch {}

import { createClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const email = process.argv[2] ?? 'admin@barberia.test';
const password = process.argv[3] ?? 'SuperSecret123';
const TENANT_ID = '11111111-1111-1111-1111-111111111111';

if (!url || !serviceKey) {
  console.error('Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY env vars first.');
  process.exit(1);
}

const supabase = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const { data: created, error: createErr } = await supabase.auth.admin.createUser({
  email,
  password,
  email_confirm: true,
});

if (createErr) {
  console.error('createUser failed:', createErr.message);
  process.exit(1);
}

const userId = created.user.id;

const { error: profileErr } = await supabase.from('profiles').upsert({
  id: userId,
  tenant_id: TENANT_ID,
  role: 'owner',
  full_name: 'Demo Admin',
});

if (profileErr) {
  console.error('profile upsert failed:', profileErr.message);
  process.exit(1);
}

console.log(`Admin created: ${email} (user ${userId}) linked to tenant ${TENANT_ID}`);
