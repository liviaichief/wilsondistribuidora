
import { createClient } from '@supabase/supabase-js';

const url = "https://ofpqtmiyuffmfgeoocml.supabase.co";
const anonKey = process.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9mcHF0bWl5dWZmbWZnZW9vY21sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA1MDUxMTYsImV4cCI6MjA4NjA4MTExNn0.Xru6uVIpRwVGp3nNIJyt3vNHyAJFf0tC8IdzRrlQthw";

const supabase = createClient(url, anonKey);

async function check() {
    console.log("Checking DB connection...");
    const { data, error } = await supabase.from('products').select('count', { count: 'exact', head: true });

    if (error) {
        console.error("DB Connection Failed:", error.message);
    } else {
        console.log("DB Connection Successful. Product count:", data); // data is null for head:true usually, count is on object
        // Actually count is in the response object, distinct from data.
        // Let's just select one item.
    }

    const { data: items, error: err2 } = await supabase.from('products').select('title').limit(1);
    if (err2) {
        console.error("Fetch One Failed:", err2.message);
    } else {
        console.log("Fetch One Success:", items.length > 0 ? items[0].title : "No items");
    }
}

check();
