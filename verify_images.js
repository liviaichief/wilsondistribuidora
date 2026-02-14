
import { createClient } from '@supabase/supabase-js';

const url = "https://ofpqtmiyuffmfgeoocml.supabase.co";
const anonKey = process.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9mcHF0bWl5dWZmbWZnZW9vY21sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA1MDUxMTYsImV4cCI6MjA4NjA4MTExNn0.Xru6uVIpRwVGp3nNIJyt3vNHyAJFf0tC8IdzRrlQthw";

const supabase = createClient(url, anonKey);

async function verifyImages() {
    console.log("Fetching products to verify image URLs...");
    const { data: products, error } = await supabase
        .from('products')
        .select('title, image');

    if (error) {
        console.error("Error fetching products:", error);
        return;
    }

    console.log(`Found ${products.length} products. Checking images...`);

    for (const p of products) {
        let imageUrl = p.image;
        let finalUrl = "";

        if (!imageUrl) {
            console.log(`[SKIP] ${p.title}: No image`);
            continue;
        }

        if (imageUrl.startsWith('http')) {
            if (imageUrl.includes('supabase.co')) {
                finalUrl = `${imageUrl}?width=300`;
            } else {
                finalUrl = imageUrl;
            }
        } else {
            // Simulate the logic added to ProductCard.jsx
            const storagePath = imageUrl.startsWith('product-images')
                ? imageUrl
                : `product-images/${imageUrl}`;
            finalUrl = `${url}/storage/v1/object/public/${storagePath}`;
        }

        console.log(`[CHECK] ${p.title}`);
        console.log(`   Raw: ${imageUrl}`);
        console.log(`   Final: ${finalUrl}`);

        try {
            const res = await fetch(finalUrl, { method: 'HEAD' });
            if (res.ok) {
                console.log(`   STATUS: OK (${res.status})`);
            } else {
                console.error(`   STATUS: FAIL (${res.status})`);
            }
        } catch (e) {
            console.error(`   STATUS: ERROR (${e.message})`);
        }
        console.log('---');
    }
}

verifyImages();
