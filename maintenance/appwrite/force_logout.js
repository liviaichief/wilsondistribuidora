
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Need Service Role Key for Admin actions

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

const targetEmail = 'marcos.gqrz@gmail.com.br';

async function forceLogout() {
    console.log(`Looking for user: ${targetEmail}...`);

    // 1. Get User ID
    const { data: { users }, error } = await supabase.auth.admin.listUsers();

    if (error) {
        console.error('Error listing users:', error);
        return;
    }

    const user = users.find(u => u.email === targetEmail);

    if (!user) {
        console.error(`User ${targetEmail} not found!`);
        console.log('Available users:', users.map(u => u.email));
        return;
    }

    console.log(`Found user ID: ${user.id}`);
    console.log(`Signing out user sessions...`);

    // 2. Sign out user (Invalidate all sessions)
    const { error: signOutError } = await supabase.auth.admin.signOut(user.id);

    if (signOutError) {
        console.error('Error signing out:', signOutError);
    } else {
        console.log(`✅ User ${targetEmail} has been logged out from all devices.`);
    }
}

forceLogout();
