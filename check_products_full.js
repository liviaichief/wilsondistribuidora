
import { createClient } from '@supabase/supabase-js';

const url = process.env.VITE_SUPABASE_URL || "https://ofpqtmiyuffmfgeoocml.supabase.co";
const anonKey = process.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9mcHF0bWl5dWZmbWZnZW9vY21sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA1MDUxMTYsImV4cCI6MjA4NjA4MTExNn0.Xru6uVIpRwVGp3nNIJyt3vNHyAJFf0tC8IdzRrlQthw";

const supabase = createClient(url, anonKey);

async function checkProducts() {
    console.log("Checking products in 'embutidos' category...");

    // 1. Get products in 'embutidos' (case sensitive check)
    const { data: embutidos, error } = await supabase
        .from('products')
        .select('*')
        .eq('category', 'embutidos');

    if (error) {
        console.error("Error fetching embutidos:", error);
    } else {
        console.log(`Found ${embutidos.length} products with category='embutidos':`);
        console.log(JSON.stringify(embutidos, null, 2));
    }

    // 2. Check if there are any products with 'Embutidos' (Capitalized)
    const { data: capitalized } = await supabase
        .from('products')
        .select('*')
        .eq('category', 'Embutidos');

    if (capitalized && capitalized.length > 0) {
        console.log(`Found ${capitalized.length} products with category='Embutidos' (Capitalized):`);
        console.log(JSON.stringify(capitalized, null, 2));
    }
}

checkProducts();
