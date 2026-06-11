import { createClient } from '@supabase/supabase-js';
import { fileURLToPath } from 'url';
import fs from 'fs';
import path from 'path';

// Read .env.local manually
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname, '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');

let supabaseUrl = '';
let serviceRoleKey = '';

envContent.split('\n').forEach(line => {
  if (line.startsWith('NEXT_PUBLIC_SUPABASE_URL=')) supabaseUrl = line.split('=')[1].trim();
  if (line.startsWith('SUPABASE_SERVICE_ROLE_KEY=')) serviceRoleKey = line.split('=')[1].trim();
});

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

const USERS = [
  {
    email: 'admin@hospitalk.com',
    password: 'password123',
    name: 'Admin System',
    role: 'admin'
  },
  {
    email: 'doctor@hospitalk.com',
    password: 'password123',
    name: 'Daffa Ahmad Al Attas',
    role: 'doctor'
  },
  {
    email: 'nurse@hospitalk.com',
    password: 'password123',
    name: 'Suster Ratna',
    role: 'nurse'
  }
];

async function seed() {
  console.log('Seeding users...');
  for (const u of USERS) {
    // Check if user already exists in auth
    const { data: existing, error: err } = await supabase.auth.admin.listUsers();
    const exists = existing?.users?.find(x => x.email === u.email);

    let userId = exists?.id;
    if (!exists) {
      console.log(`Creating user: ${u.email}...`);
      const { data, error } = await supabase.auth.admin.createUser({
        email: u.email,
        password: u.password,
        email_confirm: true,
        user_metadata: { name: u.name, role: u.role }
      });
      if (error) {
        console.error(`Failed to create ${u.email}:`, error);
        continue;
      }
      userId = data.user.id;
    } else {
      console.log(`User ${u.email} already exists in auth.`);
    }

    // Insert or update into public.users
    const { error: dbError } = await supabase
      .from('users')
      .upsert({
        id: userId,
        email: u.email,
        name: u.name,
        role: u.role,
        password_hash: 'managed_by_supabase_auth' // We don't use this anymore since using Supabase Auth
      });

    if (dbError) {
      console.error(`Failed to insert ${u.email} into public.users:`, dbError);
    } else {
      console.log(`User ${u.email} synced to public.users.`);
    }
  }
  console.log('Seeding complete.');
}

seed().catch(console.error);
