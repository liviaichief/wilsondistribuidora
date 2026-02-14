
import { createClient } from '@supabase/supabase-js';

const url = "https://ofpqtmiyuffmfgeoocml.supabase.co";
const key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9mcHF0bWl5dWZmbWZnZW9vY21sIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDUwNTExNiwiZXhwIjoyMDg2MDgxMTE2fQ.AsYCovObyFapILqv-92aogd-Lz_kPhsyJn0t6wsgb4E";
const supabase = createClient(url, key);

async function setup() {
    const email = 'automation@test.com';
    const password = 'password123';
    console.log(`Setting up ${email}...`);

    // 1. Create Identity
    const { data, error } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { role: 'admin' } // Try metadata approach
    });

    if (error) {
        console.log("Create result:", error.message);
        // If already exists, find ID
        if (error.message.includes("already registered")) {
            const { data: { users } } = await supabase.auth.admin.listUsers();
            const user = users.find(u => u.email === email);
            if (user) await promote(user.id);
        }
    } else {
        console.log("User Created. ID:", data.user.id);
        await promote(data.user.id);
    }
}

async function promote(id) {
    console.log(`Promoting ${id} to admin in profiles...`);

    // Upsert profile just in case
    const { error } = await supabase
        .from('profiles')
        .upsert({
            id: id,
            email: 'automation@test.com',
            role: 'admin',
            // updated_at: new Date() 
        });

    if (error) console.error("Profile Error:", error);
    else console.log("Profile updated to ADMIN.");
}

setup();
