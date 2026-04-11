import { databases, DATABASE_ID, COLLECTIONS } from './src/lib/appwrite.js';
import { Query } from 'appwrite';

async function migrate() {
    console.log("Starting Category Migration to Numeric IDs...");

    // 1. Define Mapping
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
        // 2. Save New Categories to settings
        try {
            await databases.updateDocument(DATABASE_ID, 'settings', 'project_categories', {
                value: JSON.stringify(newCategories)
            });
            console.log("Saved new numeric categories to settings.");
        } catch (e) {
            console.error("Error saving categories:", e.message);
        }

        // 3. Update Products
        console.log("Fetching products to update...");
        const response = await databases.listDocuments(DATABASE_ID, COLLECTIONS.PRODUCTS, [Query.limit(100)]);
        
        let count = 0;
        for (const doc of response.documents) {
            const currentCat = (doc.category || '').toLowerCase();
            const newCatId = mapping[currentCat];

            if (newCatId) {
                await databases.updateDocument(DATABASE_ID, COLLECTIONS.PRODUCTS, doc.$id, {
                    category: newCatId
                });
                console.log(`Updated product [${doc.title}] from ${currentCat} to ${newCatId}`);
                count++;
            } else {
                // If not in mapping, assign '99' (Other)
                 await databases.updateDocument(DATABASE_ID, COLLECTIONS.PRODUCTS, doc.$id, {
                    category: '99'
                });
                console.log(`Warning: Product [${doc.title}] had unknown category ${currentCat}. Assigned 99.`);
            }
        }

        console.log(`Migration finished. ${count} products updated.`);
        
        // Add one more category for 99 if needed
        newCategories.push({ id: '99', name: 'Outros', active: false });
        await databases.updateDocument(DATABASE_ID, 'settings', 'project_categories', {
            value: JSON.stringify(newCategories)
        });

    } catch (err) {
        console.error("Migration failed:", err);
    }
}

migrate();
