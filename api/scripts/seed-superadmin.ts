import 'dotenv/config';
import { createClient, User } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const userId = process.env.SUPERADMIN_USER_ID;
const email = process.env.SUPERADMIN_EMAIL?.trim().toLowerCase();
const password = process.env.SUPERADMIN_PASSWORD;

if (!url || !serviceRoleKey || !userId || !email || !password) {
  throw new Error(
    'Set SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SUPERADMIN_USER_ID, SUPERADMIN_EMAIL, and SUPERADMIN_PASSWORD in api/.env.',
  );
}

if (password.length < 8) {
  throw new Error('SUPERADMIN_PASSWORD must be at least 8 characters.');
}

const supabase = createClient(url, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function seed() {
  const { data: existingProfile, error: profileError } = await supabase
    .from('profiles')
    .select('id, user_id, email, role')
    .eq('role', 'superadmin')
    .maybeSingle();

  if (profileError) throw new Error(`Could not check profiles: ${profileError.message}`);

  if (existingProfile) {
    if (existingProfile.user_id === userId || existingProfile.email === email) {
      console.log(`Superadmin already seeded for user ID: ${existingProfile.user_id}`);
      return;
    }
    throw new Error('A different superadmin already exists. Seed aborted.');
  }

  const { data: users, error: usersError } = await supabase.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  });
  if (usersError) throw new Error(`Could not check Auth users: ${usersError.message}`);

  const authUsers = users.users as User[];
  let authUser: User | undefined = authUsers.find((user) => user.email?.toLowerCase() === email);
  let createdAuthUser = false;

  if (!authUser) {
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      app_metadata: { role: 'superadmin' },
    });
    if (error || !data.user) throw new Error(error?.message ?? 'Could not create the superadmin Auth user.');
    authUser = data.user;
    createdAuthUser = true;
  }

  const { error: insertError } = await supabase.from('profiles').insert({
    id: authUser.id,
    user_id: userId,
    email,
    role: 'superadmin',
    full_name: userId,
  });

  if (insertError) {
    if (createdAuthUser) await supabase.auth.admin.deleteUser(authUser.id);
    throw new Error(`Could not create the superadmin profile: ${insertError.message}`);
  }

  console.log(`Superadmin seeded successfully for user ID: ${userId}`);
}

seed().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
