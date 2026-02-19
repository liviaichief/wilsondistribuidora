
import { createClient } from '@supabase/supabase-js';
import { Client, Databases, ID } from 'node-appwrite';

// --- Configuration ---
// Supabase (Source)
const SUPABASE_URL = "https://ofpqtmiyuffmfgeoocml.supabase.co";
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9mcHF0bWl5dWZmbWZnZW9vY21sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA1MDUxMTYsImV4cCI6MjA4NjA4MTExNn0.Xru6uVIpRwVGp3nNIJyt3vNHyAJFf0tC8IdzRrlQthw";

// Appwrite (Destination)
const APPWRITE_ENDPOINT = 'https://sfo.cloud.appwrite.io/v1';
const APPWRITE_PROJECT_ID = '698e695d001d446b21d9';
const APPWRITE_API_KEY = 'standard_b6cd42bf7c58b5449ecb614ace3be50ab1f5c21900cfe1d83fe521b6aa848d2a7c625c58a64bc770b3612e62e2940df27df51671ff287184ed374b60f75b177f06d6a64b6e391e047e8590ce7ebc91c7a77c8b244a5c9135c67028f55f240ccdaf4528634410fdd34fad22baaaeeddd7097a877dbb250c73aa538ade05c7d0b1';
const DATABASE_ID = 'boutique_carne_db';

// --- Clients ---
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const client = new Client()
    .setEndpoint(APPWRITE_ENDPOINT)
    .setProject(APPWRITE_PROJECT_ID)
    .setKey(APPWRITE_API_KEY);

const databases = new Databases(client);

// --- Helpers ---
const productMap = new Map(); // Map Supabase ID -> Appwrite ID

async function migrateProducts() {
    console.log('--- Migrating Products ---');
    const { data: products, error } = await supabase.from('products').select('*');

    if (error) {
        console.error('Error fetching Supabase products:', error.message);
        return;
    }

    console.log(`Found ${products.length} products.`);

    for (const p of products) {
        try {
            // Appwrite uses string IDs. We can keep the numeric ID as string or let Appwrite generate one.
            // Using ID.unique() is safer, but keeping original ID might help with relations if they were UUIDs.
            // Since Postgres IDs are integers here, let's generate new unique IDs and map them.
            const newId = ID.unique();

            await databases.createDocument(
                DATABASE_ID,
                'products',
                newId,
                {
                    title: p.title,
                    description: p.description || '',
                    price: parseFloat(p.price),
                    category: p.category,
                    image: p.image
                }
            );
            console.log(`Migrated: ${p.title} (${p.id} -> ${newId})`);
            productMap.set(p.id, newId);
        } catch (e) {
            console.error(`Failed to migrate product ${p.title}:`, e.message);
        }
    }
}

async function migrateBanners() {
    console.log('\n--- Migrating Banners ---');
    const { data: banners, error } = await supabase.from('banners').select('*');

    if (error) { // Banners table might not exist or be empty if not migrated in Supabase yet?
        // Actually we know it exists from previous steps.
        console.error('Error fetching Supabase banners:', error.message);
        // If error is 404 (table not found), strictly proceed.
        if (error.code === '42P01') {
            console.log("Banners table not found in Supabase, skipping.");
            return;
        }
        return;
    }

    console.log(`Found ${banners.length} banners.`);

    for (const b of banners) {
        try {
            const payload = {
                title: b.title,
                image_url: b.image_url,
                link: b.link || '',
                active: b.active,
                display_order: b.display_order,
                duration: b.duration || 5
            };

            // Link to product if it exists and was migrated
            if (b.product_id && productMap.has(b.product_id)) {
                payload.product = productMap.get(b.product_id);
            }

            await databases.createDocument(
                DATABASE_ID,
                'banners',
                ID.unique(),
                payload
            );
            console.log(`Migrated Banner: ${b.title}`);
        } catch (e) {
            console.error(`Failed to migrate banner ${b.title}:`, e.message);
        }
    }
}

async function run() {
    await migrateProducts();
    await migrateBanners();
    console.log('\nMigration Complete!');
}

run();
