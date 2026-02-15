
const { Client, Databases, ID, Permission, Role, Query } = require('node-appwrite');

module.exports = async function (context) {
    const client = new Client()
        .setEndpoint(process.env.APPWRITE_ENDPOINT)
        .setProject(process.env.APPWRITE_PROJECT_ID)
        .setKey(process.env.APPWRITE_API_KEY);

    const databases = new Databases(client);
    const DATABASE_ID = process.env.DATABASE_ID || 'boutique_carne_db';
    const PRODUCTS_COLLECTION = 'products';
    const ORDERS_COLLECTION = 'orders';

    try {
        if (!context.req.body) {
            return context.res.json({ success: false, error: 'No body provided' }, 400);
        }

        const payload = JSON.parse(context.req.body);
        const { items, user_id, customer_name, customer_phone, payment_method } = payload;

        if (!items || !Array.isArray(items) || items.length === 0) {
            return context.res.json({ success: false, error: 'Invalid items' }, 400);
        }

        // 1. Validate Items & Calculate Total from Real DB Prices
        let calculatedTotal = 0;
        const validatedItems = [];

        for (const item of items) {
            // item should be { id: '...', quantity: 1 }
            const product = await databases.getDocument(
                DATABASE_ID,
                PRODUCTS_COLLECTION,
                item.id
            );

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

        // 2. Generate Next Order Number (Server-side)
        // Note: For high scale, use a separate atomic counter collection. 
        // For this implementation, we reduce race window by running on server.
        const lastOrders = await databases.listDocuments(
            DATABASE_ID,
            ORDERS_COLLECTION,
            [
                Query.orderDesc('order_number'),
                Query.limit(1)
            ]
        );

        let nextNumber = 100;
        if (lastOrders.documents.length > 0) {
            const lastNum = lastOrders.documents[0].order_number;
            if (lastNum) nextNumber = lastNum + 1;
        }

        // 3. Create Order
        const orderData = {
            order_number: nextNumber,
            total: calculatedTotal,
            items: JSON.stringify(validatedItems),
            user_id: user_id || 'guest',
            customer_name,
            customer_phone,
            payment_method,
            status: 'pending'
        };

        const permissions = [];
        if (user_id && user_id !== 'guest') {
            permissions.push(Permission.read(Role.user(user_id)));
            // Users typically can't update their order status directly, only admin
            // But they might need update perm if they can cancel? Let's stick to read for now unless defined otherwise.
            // Actually, existing code gave update permission. Let's keep it to avoid regression.
            permissions.push(Permission.update(Role.user(user_id)));
        }

        const order = await databases.createDocument(
            DATABASE_ID,
            ORDERS_COLLECTION,
            ID.unique(),
            orderData,
            permissions
        );

        return context.res.json({ success: true, order });

    } catch (error) {
        context.error(error.message);
        return context.res.json({ success: false, error: error.message }, 500);
    }
};
