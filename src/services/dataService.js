import { databases, DATABASE_ID, COLLECTIONS } from '../lib/appwrite';
import { Query, ID } from 'appwrite';

// Helper to expand image URL if needed (Appwrite might return file ID)
const processDoc = (doc) => {
    return {
        ...doc,
        id: doc.$id
    };
};

export const getProducts = async (category) => {
    try {
        const queries = [];
        if (category && category !== 'all') {
            queries.push(Query.equal('category', category));
        }
        // Appwrite default limit is 25, increase if needed or implement pagination
        queries.push(Query.limit(100));
        queries.push(Query.orderDesc('$createdAt'));

        const response = await databases.listDocuments(
            DATABASE_ID,
            COLLECTIONS.PRODUCTS,
            queries
        );

        return response.documents.map(processDoc);
    } catch (error) {
        console.error("Error fetching products:", error);
        return [];
    }
};

export const saveProduct = async (product) => {
    try {
        const payload = {
            title: product.title,
            description: product.description,
            price: parseFloat(product.price),
            category: product.category,
            image: product.image
        };

        let response;
        if (product.id) {
            response = await databases.updateDocument(
                DATABASE_ID,
                COLLECTIONS.PRODUCTS,
                product.id,
                payload
            );
        } else {
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
        // 1. Get the last order to determine the next number
        const lastOrders = await databases.listDocuments(
            DATABASE_ID,
            COLLECTIONS.ORDERS,
            [
                Query.orderDesc('$createdAt'),
                Query.limit(1)
            ]
        );

        let nextNumber = 100; // Default start
        if (lastOrders.documents.length > 0) {
            const lastOrder = lastOrders.documents[0];
            if (lastOrder.order_number) {
                nextNumber = lastOrder.order_number + 1;
            }
        }

        // Prepare items as JSON string
        const payload = {
            customer_name: orderData.name,
            customer_phone: orderData.phone,
            payment_method: orderData.paymentMethod,
            total: parseFloat(orderData.total),
            items: JSON.stringify(orderData.items),
            user_id: orderData.user_id || 'guest', // Fallback
            order_number: nextNumber // Save the new sequence number
        };

        const response = await databases.createDocument(
            DATABASE_ID,
            COLLECTIONS.ORDERS,
            ID.unique(),
            payload
        );
        return { success: true, ...processDoc(response) };
    } catch (error) {
        console.error("Error creating order:", error);
        return { success: false, error: error.message };
    }
};
