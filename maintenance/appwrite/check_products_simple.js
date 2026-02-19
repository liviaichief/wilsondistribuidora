
import { createClient } from '@supabase/supabase-js';

const url = process.env.VITE_SUPABASE_URL || "https://ofpqtmiyuffmfgeoocml.supabase.co";
const anonKey = process.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9mcHF0bWl5dWZmbWZnZW9vY21sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA1MDUxMTYsImV4cCI6MjA4NjA4MTExNn0.Xru6uVIpRwVGp3nNIJyt3vNHyAJFf0tC8IdzRrlQthw";

const supabase = createClient(url, anonKey);

async function checkProducts() {
    const { data: embutidos, error } = await supabase
        .from('products')
        .select('*')
        .eq('category', 'embutidos');

    if (error) {
        console.error("Error:", error);
        return;
    }

    console.log(`Found ${embutidos.length} products in 'embutidos':`);
    embutidos.forEach(p => console.log(`- ${p.title} (${p.category})`));

    // Also check for 'imbutidos' just in case
    const { data: typos } = await supabase
        .from('products')
        .select('*')
        .ilike('category', '%imbutido%');

    if (typos && typos.length > 0) {
        console.log(`Found ${typos.length} products with typo 'imbutido':`);
        typos.forEach(p => console.log(`- ${p.title} (${p.category})`));
    }
}

checkProducts();
