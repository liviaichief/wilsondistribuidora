
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing env vars");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function bumpSequence() {
    console.log("Attempting to bump sequence to start at 100...");

    // Insert ID 99. 
    // If successful, next auto-id should be 100 (if sequence updates).
    // Note: In Postgres 'BY DEFAULT', inserting a value usually updates the sequence MAX value if the inserted value is higher than current sequence.

    const { data, error } = await supabase.from('orders').insert([
        {
            id: 99,
            customer_name: 'Sequence Bump',
            customer_phone: '000000000',
            payment_method: 'test',
            total: 0,
            items: [] // assuming jsonb or similar
        }
    ]).select();

    if (error) {
        console.error("Insert Error:", error);
    } else {
        console.log("Inserted ID 99 successfully:", data);

        // Now delete it
        const { error: delError } = await supabase.from('orders').delete().eq('id', 99);
        if (delError) {
            console.error("Delete Error:", delError);
        } else {
            console.log("Deleted ID 99. Next order should be 100.");
        }
    }
}

bumpSequence();
