
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

console.log('Connecting to:', supabaseUrl);

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchemaAndData() {
    try {
        // 1. Check a simple query first
        console.log('Testing connection...');
        const { data: health, error: healthError } = await supabase.from('profiles').select('count', { count: 'exact', head: true });

        if (healthError) {
            console.error('Connection failed:', healthError);
            return;
        }
        console.log('Connection successful.');

        // 2. Check schema detection (by inserting specific data or just selecting)
        console.log('Checking contents of profiles...');
        const { data: profiles, error: profilesError } = await supabase
            .from('profiles')
            .select('*')
            .limit(5);

        if (profilesError) {
            console.error('Error fetching profiles:', profilesError);
        } else {
            console.log(`Found ${profiles.length} profiles.`);
            if (profiles.length > 0) {
                console.log('First profile structure:', Object.keys(profiles[0]));
                console.log('First profile role:', profiles[0].role);
            }
        }

        // 3. Check for admin
        console.log('Checking for admin@local.com...');
        const { data: admin, error: adminError } = await supabase
            .from('profiles')
            .select('*')
            .eq('email', 'admin@local.com')
            .single();

        if (adminError) {
            console.error('Admin lookup error:', adminError);
        } else {
            console.log('Admin profile found:', admin);
        }

    } catch (err) {
        console.error('Unexpected error:', err);
    }
}

checkSchemaAndData();
