
const { Client, Databases, ID, Query } = require('node-appwrite');

module.exports = async function (context) {
    const client = new Client()
        .setEndpoint(process.env.APPWRITE_ENDPOINT)
        .setProject(process.env.APPWRITE_PROJECT_ID)
        .setKey(process.env.APPWRITE_API_KEY);

    const databases = new Databases(client);
    const DATABASE_ID = process.env.DATABASE_ID || 'boutique_carne_db';
    const PRODUCTS_COLLECTION = 'products';

    try {
        if (!context.req.body) {
            return context.res.json({ success: false, error: 'No body provided' }, 400);
        }

        const product = JSON.parse(context.req.body);

        // 1. Generate Secure SKU (Server-side)
        // Fetches the last SKU to increment.
        // Race condition reduced by server-side execution, though atomic counter is better for massive scale.
        const lastProducts = await databases.listDocuments(
            DATABASE_ID,
            PRODUCTS_COLLECTION,
            [
                Query.orderDesc('product_sku'),
                Query.limit(1)
            ]
        );

        let nextSku = '3RG-00110';

        if (lastProducts.documents.length > 0) {
            const lastSku = lastProducts.documents[0].product_sku;
            if (lastSku && lastSku.startsWith('3RG-')) {
                const part = lastSku.split('-')[1];
                const num = parseInt(part, 10);
                if (!isNaN(num)) {
                    nextSku = `3RG-${String(num + 1).padStart(5, '0')}`;
                }
            }
        }

        // 2. Create Product
        const payload = {
            title: product.title,
            description: product.description,
            price: parseFloat(product.price),
            category: product.category,
            image: product.image,
            product_sku: nextSku
        };

        const newProduct = await databases.createDocument(
            DATABASE_ID,
            PRODUCTS_COLLECTION,
            ID.unique(),
            payload
        );

        return context.res.json(newProduct);

    } catch (error) {
        context.error(error.message);
        return context.res.json({ success: false, error: error.message }, 500);
    }
};
