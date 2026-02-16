
import { Client, Databases, ID, Permission, Role, Query } from 'node-appwrite'; // Using import for local test (ESM)
import dotenv from 'dotenv';
dotenv.config();

const client = new Client()
    .setEndpoint(process.env.VITE_APPWRITE_ENDPOINT)
    .setProject(process.env.VITE_APPWRITE_PROJECT_ID)
    .setKey('standard_b6cd42bf7c58b5449ecb614ace3be50ab1f5c21900cfe1d83fe521b6aa848d2a7c625c58a64bc770b3612e62e2940df27df51671ff287184ed374b60f75b177f06d6a64b6e391e047e8590ce7ebc91c7a77c8b244a5c9135c67028f55f240ccdaf4528634410fdd34fad22baaaeeddd7097a877dbb250c73aa538ade05c7d0b1');

const databases = new Databases(client);
const DATABASE_ID = process.env.VITE_DATABASE_ID || 'boutique_carne_db';
const PRODUCTS_COLLECTION = 'products';
const ORDERS_COLLECTION = 'orders';

// Mock Data
const user_id = '698e79cb002edf956809'; // Talita's ID from debug logs
const payload = {
    items: [{ id: '67aebdc5003c40ecc903', quantity: 1 }], // Use a known existing product ID (need to find one)
    user_id: user_id,
    customer_name: 'Test User',
    customer_phone: '5511999999999',
    payment_method: 'credit_card'
};

async function testPlaceOrder() {
    console.log("=== STARTING LOCAL ORDER TEST ===");
    console.log("Endpoint:", process.env.VITE_APPWRITE_ENDPOINT);
    console.log("Project:", process.env.VITE_APPWRITE_PROJECT_ID);

    // 1. Fetch a valid product ID first if needed
    let validItemId = null;
    try {
        const products = await databases.listDocuments(DATABASE_ID, PRODUCTS_COLLECTION, [Query.limit(1)]);
        if (products.documents.length > 0) {
            validItemId = products.documents[0].$id;
            console.log("Found valid product:", validItemId);
            payload.items[0].id = validItemId;
        } else {
            console.error("No products found to test with.");
            return;
        }
    } catch (e) {
        console.error("Failed to list products:", e);
        return;
    }

    try {
        const { items, user_id, customer_name, customer_phone, payment_method } = payload;

        console.log(`Processing order for User: ${user_id}`);

        // 1. Validate Items & Calculate
        const productPromises = items.map(async (item) => {
            try {
                const product = await databases.getDocument(
                    DATABASE_ID,
                    PRODUCTS_COLLECTION,
                    item.id
                );
                return { item, product };
            } catch (err) {
                console.error(`Error fetching product ${item.id}:`, err);
                throw new Error(`Error fetching product ${item.id}: ${err.message}`);
            }
        });

        const results = await Promise.all(productPromises);
        let calculatedTotal = 0;
        const validatedItems = [];

        for (const { item, product } of results) {
            const qty = parseInt(item.quantity) || 1;
            const price = parseFloat(product.price);
            calculatedTotal += price * qty;

            validatedItems.push({
                product_id: product.$id,
                title: product.title,
                price: price,
                quantity: qty,
                image: product.image
            });
        }
        console.log(`Total calculated: ${calculatedTotal}`);

        // 2. Generate Next Order Number
        let lastOrders;
        try {
            lastOrders = await databases.listDocuments(
                DATABASE_ID,
                ORDERS_COLLECTION,
                [
                    Query.orderDesc('order_number'),
                    Query.limit(1)
                ]
            );
        } catch (err) {
            console.error('Error fetching last order:', err);
            throw new Error(`Error fetching last order: ${err.message}`);
        }

        let nextNumber = 100;
        if (lastOrders.documents.length > 0) {
            const lastNum = lastOrders.documents[0].order_number;
            console.log("Last Order Number:", lastNum);
            if (lastNum) nextNumber = lastNum + 1;
        }
        console.log(`Next Order Number: ${nextNumber}`);

        // 3. Create Order
        const orderData = {
            order_number: nextNumber,
            total: calculatedTotal,
            items: JSON.stringify(validatedItems),
            user_id: user_id || 'guest',
            customer_name,
            customer_phone,
            payment_method,
            status: 'confirmed'
        };

        const permissions = [];
        if (user_id && user_id !== 'guest') {
            permissions.push(Permission.read(Role.user(user_id)));
            permissions.push(Permission.update(Role.user(user_id)));
        }

        console.log("Creating order document...");
        const order = await databases.createDocument(
            DATABASE_ID,
            ORDERS_COLLECTION,
            ID.unique(),
            orderData,
            permissions
        );
        console.log(`Order created successfully: ${order.$id}`);
        console.log("=== TEST SUCCESS ===");

    } catch (error) {
        console.error("=== TEST FAILED ===");
        console.error(error);
    }
}

testPlaceOrder();
