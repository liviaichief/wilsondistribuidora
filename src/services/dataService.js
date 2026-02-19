import { databases, functions, DATABASE_ID, COLLECTIONS } from '../lib/appwrite';
import { Query, ID, Permission, Role } from 'appwrite';

// Function IDs - Should be in environment variables in production
const PLACE_ORDER_FUNC_ID = import.meta.env.VITE_FUNC_PLACE_ORDER || 'place_order';
const CREATE_PRODUCT_FUNC_ID = import.meta.env.VITE_FUNC_CREATE_PRODUCT || 'create_product';

// Helper to expand image URL if needed (Appwrite might return file ID)
const processDoc = (doc) => ({
    ...doc,
    id: doc.$id
});

export const getProducts = async (category, page = 1, limit = 20) => {
    try {
        const queries = [];
        if (category && category === 'all') {
            // "PROMOÇÕES" tab - only show items in promotion
            queries.push(Query.equal('is_promotion', true));
        } else if (category && category !== 'all') {
            // Specific category - show only items for this category
            queries.push(Query.equal('category', category));
            // Removed is_promotion filter here to show both regular and promo items
            // inside their respective categories as requested.
        }

        // Task-2: Only show active products on Home (Admin will likely call this differently or we check category)
        // If it's a category fetch (likely from Home), only show active
        // If it's a category fetch (likely from Home), show items that are NOT explicitly disabled
        if (category) {
            queries.push(Query.notEqual('active', false));
        }

        // Pagination
        const offset = (page - 1) * limit;
        queries.push(Query.limit(limit));
        queries.push(Query.offset(offset));

        queries.push(Query.orderDesc('$createdAt'));

        const response = await databases.listDocuments(
            DATABASE_ID,
            COLLECTIONS.PRODUCTS,
            queries
        );

        return {
            documents: response.documents.map(processDoc),
            total: response.total
        };
    } catch (error) {
        console.error("Error fetching products:", error);
        return { documents: [], total: 0 };
    }
};

// Helper to get next SKU number
const getNextSKU = async () => {
    try {
        const response = await databases.listDocuments(
            DATABASE_ID,
            COLLECTIONS.PRODUCTS,
            [
                Query.orderDesc('product_sku'), // Assuming lexical sort works for fixed format
                Query.limit(1)
            ]
        );

        if (response.documents.length === 0) return '3RG-00110';

        const lastSku = response.documents[0].product_sku;
        if (!lastSku || !lastSku.startsWith('3RG-')) return '3RG-00110';

        const lastNumberPart = lastSku.split('-')[1];
        const lastNumber = parseInt(lastNumberPart, 10);

        if (isNaN(lastNumber)) return '3RG-00110';

        return `3RG-${String(lastNumber + 1).padStart(5, '0')}`;
    } catch (error) {
        console.error("Error getting next SKU:", error);
        return `3RG-${Math.floor(10000 + Math.random() * 90000)}`; // Fallback
    }
};

export const saveProduct = async (product) => {
    try {
        let response;
        if (product.id) {
            // Update: Standard DB update
            const payload = {
                title: product.title,
                description: product.description,
                price: parseFloat(product.price),
                category: product.category,
                image: product.image,
                uom: product.uom || 'KG',
                is_promotion: !!product.is_promotion,
                promo_price: product.promo_price ? parseFloat(product.promo_price) : null,
                active: product.active !== false
            };

            response = await databases.updateDocument(
                DATABASE_ID,
                COLLECTIONS.PRODUCTS,
                product.id,
                payload
            );
            return processDoc(response);
        } else {
            // Create: Client-side SKU generation (Fallback due to function limit)
            const sku = await getNextSKU();

            const payload = {
                title: product.title,
                description: product.description,
                price: parseFloat(product.price),
                category: product.category,
                image: product.image,
                product_sku: sku,
                uom: product.uom || 'KG',
                is_promotion: !!product.is_promotion,
                promo_price: product.promo_price ? parseFloat(product.promo_price) : null,
                active: product.active !== false
            };

            response = await databases.createDocument(
                DATABASE_ID,
                COLLECTIONS.PRODUCTS,
                ID.unique(),
                payload
            );
            return processDoc(response);
        }
    } catch (error) {
        console.error('Error saving product:', error);
        throw error;
    }
};

export const deleteProduct = async (id) => {
    try {
        await databases.deleteDocument(
            DATABASE_ID,
            COLLECTIONS.PRODUCTS,
            id
        );
    } catch (error) {
        console.error('Error deleting product:', error);
        throw error;
    }
};

export const getBanners = async () => {
    try {
        const response = await databases.listDocuments(
            DATABASE_ID,
            COLLECTIONS.BANNERS,
            [
                Query.equal('active', true),
                Query.orderAsc('display_order')
            ]
        );
        return response.documents.map(doc => ({
            ...doc,
            id: doc.$id,
            // Handle relationship expansion: Appwrite returns object if expanded, or ID if not.
            // Our script setup 'product' as the attribute key for the relation.
            product_id: doc.product ? (doc.product.$id || doc.product) : null
        }));
    } catch (error) {
        console.error("Error fetching banners:", error);
        return [];
    }
};

export const createOrder = async (orderData) => {
    try {
        // Create order via Function for secure Order Number and Total calculation
        const execution = await functions.createExecution(
            PLACE_ORDER_FUNC_ID,
            JSON.stringify({
                items: orderData.items,
                user_id: orderData.user_id,
                customer_name: orderData.customer_name,
                customer_phone: orderData.customer_phone,
                payment_method: orderData.paymentMethod
            }),
            false // SYNC MODE - Wait for order number
        );

        const response = JSON.parse(execution.responseBody);
        return {
            success: true,
            $id: response.$id || 'processing',
            order_number: response.order_number || 'Novo',
            status: response.status || 'success'
        };

    } catch (error) {
        console.error("Error creating order:", error);
        return { success: false, error: error.message };
    }
};

export const backfillSKUs = async () => {
    try {
        console.log('Starting SKU backfill (Sequential 3RG-00110+)...');
        // 1. Fetch all products, ordered by creation date to maintain historical sequence
        // Note: If > 100 products, pagination is needed. For now assuming < 100 or increasing limit if feasible.
        const response = await databases.listDocuments(
            DATABASE_ID,
            COLLECTIONS.PRODUCTS,
            [
                Query.limit(100),
                Query.orderAsc('$createdAt')
            ]
        );

        const products = response.documents;
        let updatedCount = 0;
        let nextSkuNumber = 110;

        for (const doc of products) {
            // We will re-assign ALL SKUs to ensure the sequence is clean and continuous
            // or we could only assign missing ones. 
            // Request said "o SKU deve seguir uma sequencia". A clean slate is best for "sequence".

            const newSku = `3RG-${String(nextSkuNumber).padStart(5, '0')}`;

            // Only update if different to save calls
            if (doc.product_sku !== newSku) {
                await databases.updateDocument(
                    DATABASE_ID,
                    COLLECTIONS.PRODUCTS,
                    doc.$id,
                    { product_sku: newSku }
                );
                console.log(`Updated product ${doc.title} (${doc.$id}) to SKU: ${newSku}`);
                updatedCount++;
            }
            nextSkuNumber++;
        }

        console.log(`Backfill complete. Updated ${updatedCount} products.`);
        return { success: true, updatedCount };
    } catch (error) {
        console.error('Error during backfill:', error);
        return { success: false, error: error.message };
    }
};

// Task-5: Settings helper
export const getSettings = async () => {
    try {
        const response = await databases.listDocuments(DATABASE_ID, 'settings');
        const settings = {};
        response.documents.forEach(doc => {
            settings[doc.key] = doc.value;
        });
        return settings;
    } catch (e) {
        console.error("Error fetching settings:", e);
        return {};
    }
};

export const updateSettings = async (key, value) => {
    try {
        await databases.updateDocument(DATABASE_ID, 'settings', key, { value });
        return true;
    } catch (e) {
        console.error("Error updating settings:", e);
        throw e;
    }
};
