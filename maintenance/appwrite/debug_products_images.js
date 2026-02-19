
import { createClient } from '@supabase/supabase-js';

const url = process.env.VITE_SUPABASE_URL || "https://ofpqtmiyuffmfgeoocml.supabase.co";
const anonKey = process.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9mcHF0bWl5dWZmbWZnZW9vY21sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA1MDUxMTYsImV4cCI6MjA4NjA4MTExNn0.Xru6uVIpRwVGp3nNIJyt3vNHyAJFf0tC8IdzRrlQthw";

const supabase = createClient(url, anonKey);

async function checkProducts() {
    const { data: products, error } = await supabase
        .from('products')
        .select('title, image');

    if (error) {
        console.error("Error:", error);
        return;
    }

    console.log(`Found ${products.length} products:`);
    products.forEach(p => console.log(`- ${p.title}: ${p.image}`));
}

checkProducts();
