
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function createAdmin2() {
    console.log('Creating admin2@local.com...');
    const email = 'admin2@local.com';
    const password = 'adminpassword123';

    // 1. Sign Up
    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: {
                full_name: 'Admin Local 2',
                phone: '000000000'
            }
        }
    });

    if (error) {
        console.error('SignUp failed:', error.message);
        // Try sign in
        const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({ email, password });
        if (loginError) {
            console.error('And Login failed:', loginError.message);
            return;
        }
        console.log('Logged in as existing admin2.');
        await ensureProfile(loginData.user.id, email);
    } else if (data?.user) {
        console.log('SignUp successful. User ID:', data.user.id);
        await ensureProfile(data.user.id, email);
    }
}

async function ensureProfile(userId, email) {
    console.log(`Ensuring profile for ${userId}...`);

    // Check if profile exists
    const { data: profile } = await supabase.from('profiles').select('*').eq('id', userId).single();

    if (profile) {
        console.log('Profile exists. Updating to admin...');
        const { error } = await supabase.from('profiles').update({ role: 'admin' }).eq('id', userId);
        if (error) console.error('Update failed:', error);
        else console.log('Updated successfully.');
    } else {
        console.log('Profile missing. Inserting admin profile...');
        const { error } = await supabase.from('profiles').insert([{
            id: userId,
            email: email,
            role: 'admin',
            full_name: 'Admin Local 2'
        }]);
        if (error) console.error('Insert failed:', error);
        else console.log('Inserted successfully.');
    }
}

createAdmin2();
