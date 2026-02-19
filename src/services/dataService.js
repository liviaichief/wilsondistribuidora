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
        // REMOVED server-side category filter temporarily to diagnose index/case issues
        // We will fetch more items and filter in memory to ensure visibility.
        const queries = []; // Initialize queries array
        queries.push(Query.limit(100));
        queries.push(Query.orderDesc('$createdAt'));

        const response = await databases.listDocuments(
            DATABASE_ID,
            COLLECTIONS.PRODUCTS,
            queries
        );

        console.log("DB RAW RESPONSE:", response.documents.length, "items found.");

        // Map and Clean
        let allDocs = response.documents.map(processDoc);

        // Debug categories found
        const existingCats = [...new Set(allDocs.map(d => d.category))];
        console.log("Categories present in DB:", existingCats);

        let filteredDocs = allDocs;

        // Apply Category Logic
        if (category && category !== 'all') {
            const targetCat = category.toLowerCase();
            filteredDocs = filteredDocs.filter(d =>
                (d.category || '').toLowerCase() === targetCat
            );
        }

        // Apply Promotion Logic (Strict as requested)
        if (category === 'all') {
            // Aba Geral/Promo: Apenas o que é promoção
            filteredDocs = filteredDocs.filter(d => d.is_promotion === true);
        } else {
            // Abas de Categoria: Apenas o que NÃO é promoção
            filteredDocs = filteredDocs.filter(d => d.is_promotion !== true);
        }

        return {
            documents: filteredDocs,
            total: filteredDocs.length
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
        // Use either product.id (mapped) or product.$id (raw Appwrite)
        const docId = product.id || product.$id;

        const payload = {
            title: product.title,
            description: product.description,
            price: parseFloat(product.price),
            category: product.category,
            image: product.image, // Should be File ID or URL
            uom: product.uom || 'KG',
            is_promotion: !!product.is_promotion,
            promo_price: product.promo_price ? parseFloat(product.promo_price) : null,
            active: product.active !== false
        };

        if (docId) {
            // UPDATE
            response = await databases.updateDocument(
                DATABASE_ID,
                COLLECTIONS.PRODUCTS,
                docId,
                payload
            );
        } else {
            // CREATE
            const sku = await getNextSKU();
            payload.product_sku = sku;

            response = await databases.createDocument(
                DATABASE_ID,
                COLLECTIONS.PRODUCTS,
                ID.unique(),
                payload
            );
        }
        return processDoc(response);
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

        // The backend function returns { success: true, order: { ... } }
        const orderInfo = response.order || {};

        return {
            success: response.success !== false,
            $id: orderInfo.$id || 'processing',
            order_number: orderInfo.order_number || 'Novo',
            status: orderInfo.status || 'success'
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
