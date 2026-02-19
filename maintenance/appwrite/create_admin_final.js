
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function createAdminFinal() {
    const email = 'admin@boutiquecarne.com';
    const password = 'adminpassword123';
    console.log(`Creating ${email}...`);

    // 1. Sign Up
    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: {
                full_name: 'Admin Boutique',
                phone: '11999999999'
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
        console.log('Logged in as existing user.');
        await ensureProfile(loginData.user.id, email);
    } else if (data?.user) {
        console.log('SignUp successful. User ID:', data.user.id);
        // If session is null, maybe email confirmation is required?
        if (!data.session) {
            console.warn('WARNING: Session is null. Email confirmation might be required.');
        }
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
            full_name: 'Admin Boutique'
        }]);
        if (error) console.error('Insert failed:', error);
        else console.log('Inserted successfully.');
    }
}

createAdminFinal();
