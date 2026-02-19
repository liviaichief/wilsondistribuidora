
import { createClient } from '@supabase/supabase-js';

const url = process.env.VITE_SUPABASE_URL || "https://ofpqtmiyuffmfgeoocml.supabase.co";
const anonKey = process.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9mcHF0bWl5dWZmbWZnZW9vY21sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA1MDUxMTYsImV4cCI6MjA4NjA4MTExNn0.Xru6uVIpRwVGp3nNIJyt3vNHyAJFf0tC8IdzRrlQthw";
const serviceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9mcHF0bWl5dWZmbWZnZW9vY21sIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDUwNTExNiwiZXhwIjoyMDg2MDgxMTE2fQ.AsYCovObyFapILqv-92aogd-Lz_kPhsyJn0t6wsgb4E";

const supabaseAnon = createClient(url, anonKey);
const supabaseAdmin = createClient(url, serviceKey);

async function diagnose() {
    console.log("--- DIAGNOSTIC START ---");

    // 1. Check Auth Users (Service Key)
    const { data: { users }, error: authError } = await supabaseAdmin.auth.admin.listUsers();
    if (authError) console.error("Auth Error:", authError.message);
    else console.log(`✅ Auth Users Found: ${users.length}`);

    // 2. Check Profiles (Service Key - Bypass RLS)
    const { data: profilesAdmin, error: profAdminError } = await supabaseAdmin.from('profiles').select('*');
    if (profAdminError) console.error("Profile (Admin) Error:", profAdminError.message);
    else console.log(`✅ Profiles (Service Key) Found: ${profilesAdmin.length}`);

    // 3. Check Profiles (Anon Key - Subject to RLS)
    // Note: Anon key usually sees nothing unless public, but we want to see if it Errors or returns Empty
    const { data: profilesAnon, error: profAnonError } = await supabaseAnon.from('profiles').select('*');
    if (profAnonError) console.error("Profile (Anon) Error:", profAnonError.message);
    else console.log(`⚠️ Profiles (Anon Key - Public Read): ${profilesAnon.length} (Expected 0 if RLS is default, or >0 if Public)`);

    // 4. Mismatches
    if (users && profilesAdmin) {
        const missing = users.length - profilesAdmin.length;
        if (missing > 0) {
            console.log(`❌ SYNC ISSUE: ${missing} users are missing from 'profiles' table.`);
            console.log("   Run 'Sincronizar' in the UI or use the sync script.");
        } else {
            console.log("✅ Sync looks good.");
        }
    }

    console.log("--- DIAGNOSTIC END ---");
}

diagnose();
