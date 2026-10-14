// Negative test for database and storage lockdown, run against a real
// Supabase project. Everything here is read-only / non-mutating:
//   - table checks use SELECT and a DELETE whose filter can never match;
//   - the service-role key is only used to *list* one real object per private
//     bucket, so the anon/authenticated download attempts target a file that
//     actually exists.
//
//   SUPABASE_ANON_KEY=... npm run verify:rls
//   # optionally also as a signed-in user (any real member account):
//   SUPABASE_ANON_KEY=... RLS_TEST_EMAIL=... RLS_TEST_PASSWORD=... npm run verify:rls
//
// SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are read from api/.env.
import 'dotenv/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL;
const anonKey = process.env.SUPABASE_ANON_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !anonKey || !serviceRoleKey)
  throw new Error('Set SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (api/.env) and SUPABASE_ANON_KEY.');

const TABLES = [
  'audit_logs', 'career_openings', 'categories', 'certificates', 'chat_messages',
  'dividend_distributions', 'dividend_runs', 'documents', 'landing_content', 'landing_items',
  'landing_people', 'ledger_entries', 'loan_fines', 'loan_installments', 'loan_payments', 'loans',
  'media', 'meeting_notifications', 'meetings', 'member_benefits', 'member_document_types',
  'member_documents', 'member_ledger_settings', 'member_limits', 'member_profiles', 'members',
  'monthly_deposits', 'news_posts', 'notification_deliveries', 'notifications', 'payment_receipts',
  'payment_schedules', 'profiles', 'public_documents', 'quick_link_recipients', 'quick_links',
  'savings_ledger_entries', 'share_contributions', 'system_settings', 'wafa_fund_transactions',
];
const PRIVATE_BUCKETS = ['receipts', 'member-documents', 'certificates', 'landing-documents'];
const NEVER = '00000000-0000-0000-0000-000000000000';
const PERMISSION_DENIED = '42501';

let failures = 0;
let warnings = 0;
const fail = (msg: string) => { failures++; console.log(`  FAIL  ${msg}`); };
const warn = (msg: string) => { warnings++; console.log(`  WARN  ${msg}`); };
const pass = (msg: string) => console.log(`  ok    ${msg}`);

const options = { auth: { persistSession: false, autoRefreshToken: false } };

async function checkTables(label: string, client: SupabaseClient) {
  console.log(`\n[${label}] tables`);
  for (const table of TABLES) {
    const read = await client.from(table).select('*').limit(1);
    if (read.data?.length) fail(`${table}: ${label} can READ rows`);
    else if (read.error?.code === PERMISSION_DENIED) pass(`${table}: read denied`);
    else if (read.error) warn(`${table}: read error ${read.error.code} ${read.error.message}`);
    else warn(`${table}: read returned 0 rows without "permission denied" (grants still present?)`);

    // Matches nothing, so it can't change data whatever the outcome.
    const write = await client.from(table).delete().eq('id', NEVER);
    if (write.error?.code === PERMISSION_DENIED) pass(`${table}: write denied`);
    else if (write.error) warn(`${table}: write probe error ${write.error.code} ${write.error.message}`);
    else warn(`${table}: write not refused outright (grants still present; RLS untested)`);
  }
}

async function checkStorage(label: string, client: SupabaseClient, samples: Record<string, string | null>) {
  console.log(`\n[${label}] private buckets`);
  for (const bucket of PRIVATE_BUCKETS) {
    const listed = await client.storage.from(bucket).list('', { limit: 5 });
    if (listed.data?.length) fail(`${bucket}: ${label} can LIST objects`);
    else pass(`${bucket}: listing returns nothing`);

    const key = samples[bucket];
    if (!key) {
      warn(`${bucket}: empty bucket, download not tested`);
      continue;
    }
    const download = await client.storage.from(bucket).download(key);
    if (download.data) fail(`${bucket}: ${label} can DOWNLOAD ${key}`);
    else pass(`${bucket}: download denied`);

    const signed = await client.storage.from(bucket).createSignedUrl(key, 60);
    if (signed.data?.signedUrl) fail(`${bucket}: ${label} can mint a signed URL`);
    else pass(`${bucket}: signed URL denied`);

    const publicUrl = `${url}/storage/v1/object/public/${bucket}/${key}`;
    const res = await fetch(publicUrl);
    if (res.ok) fail(`${bucket}: object is served at its PUBLIC url`);
    else pass(`${bucket}: public url refused (${res.status})`);
  }
}

async function sampleKeys() {
  // Service role, list only: find one real object per bucket (one level deep).
  const admin = createClient(url!, serviceRoleKey!, options);
  const samples: Record<string, string | null> = {};
  for (const bucket of PRIVATE_BUCKETS) {
    samples[bucket] = null;
    const top = await admin.storage.from(bucket).list('', { limit: 20 });
    for (const entry of top.data ?? []) {
      if (entry.id) { samples[bucket] = entry.name; break; }
      const inner = await admin.storage.from(bucket).list(entry.name, { limit: 20 });
      const file = inner.data?.find((item) => item.id);
      if (file) { samples[bucket] = `${entry.name}/${file.name}`; break; }
    }
  }
  return samples;
}

async function main() {
  const samples = await sampleKeys();

  const anon = createClient(url!, anonKey!, options);
  await checkTables('anon', anon);
  await checkStorage('anon', anon, samples);

  const email = process.env.RLS_TEST_EMAIL;
  const password = process.env.RLS_TEST_PASSWORD;
  if (email && password) {
    const user = createClient(url!, anonKey!, options);
    const { error } = await user.auth.signInWithPassword({ email, password });
    if (error) throw new Error(`Could not sign in as ${email}: ${error.message}`);
    await checkTables(`authenticated (${email})`, user);
    await checkStorage(`authenticated (${email})`, user, samples);
    await user.auth.signOut();
  } else {
    console.log('\n(skipping authenticated checks: set RLS_TEST_EMAIL / RLS_TEST_PASSWORD)');
  }

  console.log(`\n${failures} failure(s), ${warnings} warning(s)`);
  process.exit(failures ? 1 : 0);
}

void main();
