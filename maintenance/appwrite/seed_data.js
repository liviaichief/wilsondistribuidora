
import { Client, Databases, ID } from 'node-appwrite';

// --- Configuration ---
const APPWRITE_ENDPOINT = 'https://sfo.cloud.appwrite.io/v1';
const APPWRITE_PROJECT_ID = '698e695d001d446b21d9';
const APPWRITE_API_KEY = 'standard_b6cd42bf7c58b5449ecb614ace3be50ab1f5c21900cfe1d83fe521b6aa848d2a7c625c58a64bc770b3612e62e2940df27df51671ff287184ed374b60f75b177f06d6a64b6e391e047e8590ce7ebc91c7a77c8b244a5c9135c67028f55f240ccdaf4528634410fdd34fad22baaaeeddd7097a877dbb250c73aa538ade05c7d0b1';
const DATABASE_ID = 'boutique_carne_db';

const client = new Client()
    .setEndpoint(APPWRITE_ENDPOINT)
    .setProject(APPWRITE_PROJECT_ID)
    .setKey(APPWRITE_API_KEY);

const databases = new Databases(client);

// --- Sample Data ---
const products = [
    {
        title: 'Kit Churrasco Completo',
        description: 'O kit ideal para seu churrasco! Contém: 1kg de Picanha Premium, 1kg de Linguiça Artesanal, 1kg de Asa de Frango Temperada, 1pct de Carvão 4kg e 1 Sal de Parrilla.',
        price: 249.90,
        category: 'carne',
        // Using placeholders or external URLs since we couldn't migrate storage
        image: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&q=80&w=800'
    },
    {
        title: 'Picanha Angus Premium',
        description: 'Corte nobre com alto marmoreio e suculência incomparável.',
        price: 129.90,
        category: 'carne',
        image: 'https://images.unsplash.com/photo-1603048297172-c92544798d5e?auto=format&fit=crop&q=80&w=800'
    },
    {
        title: 'Asa de Frango Temperada 1kg',
        description: 'Asinhas de frango marinadas no tempero especial da casa.',
        price: 28.90,
        category: 'frango',
        image: 'https://images.unsplash.com/photo-1567620832903-9fc6debc209f?auto=format&fit=crop&q=80&w=800'
    },
    {
        title: 'Linguiça Cuiabana',
        description: 'Linguiça artesanal de pernil com queijo coalho e ervas.',
        price: 35.00,
        category: 'embutidos',
        image: 'https://images.unsplash.com/photo-1595295333158-4742f28fbd85?auto=format&fit=crop&q=80&w=800'
    },
    {
        title: 'Carvão Premium 4kg',
        description: 'Carvão de eucalipto selecionado, acendimento rápido.',
        price: 24.90,
        category: 'insumos',
        image: 'https://images.unsplash.com/photo-1541696432-82c6da8ce7bf?auto=format&fit=crop&q=80&w=800'
    },
    {
        title: 'Tábua Rústica',
        description: 'Tábua de corte em madeira maciça tratada.',
        price: 119.90,
        category: 'acessorios',
        image: 'https://images.unsplash.com/photo-1627993077678-57d6928e0850?auto=format&fit=crop&q=80&w=800'
    }
];

const banners = [
    {
        title: 'Churrasco Premium',
        image_url: 'https://images.unsplash.com/photo-1558030006-450675393462?auto=format&fit=crop&q=80&w=1600',
        active: true,
        display_order: 1
    },
    {
        title: 'Sabor Inigualável',
        image_url: 'https://images.unsplash.com/photo-1603360946369-dc9bb6258143?auto=format&fit=crop&q=80&w=1600',
        active: true,
        display_order: 2
    },
    {
        title: 'Cortes Selecionados',
        image_url: 'https://images.unsplash.com/photo-1544025162-d76690b67f66?auto=format&fit=crop&q=80&w=1600',
        active: true,
        display_order: 3
    }
];

const productMap = [];

async function seedData() {
    console.log('--- Seeding Products ---');
    for (const p of products) {
        try {
            const doc = await databases.createDocument(
                DATABASE_ID,
                'products',
                ID.unique(),
                p
            );
            console.log(`Created Product: ${p.title}`);
            productMap.push({ title: p.title, id: doc.$id });
        } catch (e) {
            console.error(`Error creating product ${p.title}:`, e.message);
        }
    }

    console.log('\n--- Seeding Banners ---');
    for (const b of banners) {
        try {
            // Try to link first banner to first product, etc.
            let productId = null;
            if (b.title.includes('Premium') && productMap.length > 0) {
                // Find Picanha or Kit
                const p = productMap.find(pm => pm.title.includes('Picanha') || pm.title.includes('Kit'));
                if (p) productId = p.id;
            }

            const payload = { ...b };
            if (productId) payload.product = productId;

            await databases.createDocument(
                DATABASE_ID,
                'banners',
                ID.unique(),
                payload
            );
            console.log(`Created Banner: ${b.title}`);
        } catch (e) {
            console.error(`Error creating banner ${b.title}:`, e.message);
        }
    }

    console.log('\nSeeding Complete!');
}

seedData();
