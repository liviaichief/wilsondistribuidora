const { Client, Databases, Query } = require('node-appwrite');

const ENDPOINT = "https://sfo.cloud.appwrite.io/v1";
const PROJECT_ID = "69d59db800358cca9f27";
const DATABASE_ID = "main_db";
const COLLECTION_PRODUCTS = "products";
const API_KEY = "standard_dc313f0ead20b43da4c50584f76ea0316cba57d539fc7586bc7dd8cb8de5d9903afecaa10aa40ebb11b0a63f73706bc9e61c1132d3342b85a40651096b43b9d04fdd54a0bc55317ef9b516542d4c10e91505aaae2d909025c7c779e2dfd09a060cf2e2d69b27f88f85eeb188ea0ada1614ecf6e01f6fb0e8d6932f6f9b37d140";

const client = new Client()
    .setEndpoint(ENDPOINT)
    .setProject(PROJECT_ID)
    .setKey(API_KEY);

const databases = new Databases(client);

async function migrate() {
    console.log("Starting Category Migration to Numeric IDs...");

    const mapping = {
        'bovinos': '1',
        'suinos': '2',
        'aves': '3',
        'kits': '4',
        'mercado': '5',
        'suínos': '2',
        'carne': '1',
        'frango': '3'
    };

    const newCategories = [
        { id: '1', name: 'Bovinos', active: true },
        { id: '2', name: 'Suínos', active: true },
        { id: '3', name: 'Aves', active: true },
        { id: '4', name: 'Kits', active: true },
        { id: '5', name: 'Mercado', active: true }
    ];

    try {
        // 1. Update Settings
        try {
            await databases.updateDocument(DATABASE_ID, 'settings', 'project_categories', {
                value: JSON.stringify(newCategories)
            });
        } catch (e) {
            if (e.code === 404) {
                await databases.createDocument(DATABASE_ID, 'settings', 'project_categories', {
                    key: 'project_categories',
                    value: JSON.stringify(newCategories)
                });
            } else throw e;
        }
        console.log("Saved new numeric categories to settings.");

        // 2. Fetch Products
        console.log("Fetching products to process...");
        const response = await databases.listDocuments(DATABASE_ID, COLLECTION_PRODUCTS, [Query.limit(100)]);
        console.log(`Found ${response.documents.length} products to process.`);

        for (const doc of response.documents) {
            const currentCat = (doc.category || '').toLowerCase();
            const newCatId = mapping[currentCat];

            if (newCatId) {
                console.log(`Updating product: ${doc.title}...`);
                await databases.updateDocument(DATABASE_ID, COLLECTION_PRODUCTS, doc.$id, {
                    category: newCatId
                });
                console.log(`Updated [${doc.title}] from ${currentCat} to ${newCatId}`);
            } else {
                // If it's already numeric, leave it
                if (!isNaN(currentCat) && currentCat !== "") {
                     console.log(`Skipping [${doc.title}] - already numeric (${currentCat})`);
                } else {
                     console.log(`Assigning 99 to product: ${doc.title}...`);
                     await databases.updateDocument(DATABASE_ID, COLLECTION_PRODUCTS, doc.$id, {
                        category: '99'
                    });
                    console.log(`Assigned 99 to [${doc.title}] (was: ${currentCat})`);
                }
            }
        }

        console.log("Migration complete successfully.");
    } catch (err) {
        console.error("Migration failed with error:", err);
    }
}

migrate();
