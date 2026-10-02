import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const email = process.env.SUPERADMIN_EMAIL?.trim().toLowerCase();
const password = process.env.SUPERADMIN_PASSWORD;

if (!url || !serviceRoleKey || !email || !password) {
  throw new Error(
    'Set SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SUPERADMIN_EMAIL, and SUPERADMIN_PASSWORD in api/.env.',
  );
}

if (password.length < 8) {
  throw new Error('SUPERADMIN_PASSWORD must be at least 8 characters.');
}

const supabase = createClient(url, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function resetPassword() {
  const { data: users, error: usersError } = await supabase.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  });
  if (usersError) throw new Error(`Could not list Auth users: ${usersError.message}`);

  const authUser = users.users.find((user) => user.email?.toLowerCase() === email);
  if (!authUser) throw new Error(`No Auth user found for email: ${email}`);

  const { error: updateError } = await supabase.auth.admin.updateUserById(authUser.id, {
    password,
  });
  if (updateError) throw new Error(`Could not update password: ${updateError.message}`);

  console.log(`Password reset in Supabase Auth for ${email} (user id: ${authUser.id}).`);
}

resetPassword().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
