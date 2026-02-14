
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixAdminProfile() {
    console.log('Attempting to fix admin profile...');
    const email = 'admin@local.com';
    const password = 'adminpassword123';

    // 1. Sign In to get User ID
    const { data: { user }, error: loginError } = await supabase.auth.signInWithPassword({
        email,
        password
    });

    if (loginError) {
        console.error('Login failed:', loginError.message);
        return;
    }

    if (!user) {
        console.error('User not found after login?');
        return;
    }

    console.log(`User ID: ${user.id}`);

    // 2. Check if profile exists
    const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

    if (profile) {
        console.log('Profile already exists. Updating role to admin...');
        const { error: updateError } = await supabase
            .from('profiles')
            .update({ role: 'admin' })
            .eq('id', user.id);

        if (updateError) console.error('Update failed:', updateError);
        else console.log('Profile updated to admin successfully.');
    } else {
        console.log('Profile missing. Creating new admin profile...');
        const { error: insertError } = await supabase
            .from('profiles')
            .insert([{
                id: user.id,
                email: email,
                role: 'admin'
            }]);

        if (insertError) console.error('Insert failed:', insertError);
        else console.log('Admin profile created successfully.');
    }
}

fixAdminProfile();
