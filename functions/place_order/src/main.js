
const { Client, Databases, ID, Permission, Role, Query } = require('node-appwrite');

module.exports = async function (context) {
    const client = new Client()
        .setEndpoint(process.env.APPWRITE_ENDPOINT)
        .setProject(process.env.APPWRITE_PROJECT_ID)
        .setKey('standard_b6cd42bf7c58b5449ecb614ace3be50ab1f5c21900cfe1d83fe521b6aa848d2a7c625c58a64bc770b3612e62e2940df27df51671ff287184ed374b60f75b177f06d6a64b6e391e047e8590ce7ebc91c7a77c8b244a5c9135c67028f55f240ccdaf4528634410fdd34fad22baaaeeddd7097a877dbb250c73aa538ade05c7d0b1');

    const databases = new Databases(client);
    const DATABASE_ID = 'boutique_carne_db';
    const PRODUCTS_COLLECTION = 'products';
    const ORDERS_COLLECTION = 'orders';

    try {
        if (!context.req.body) {
            context.error('No body provided in request');
            return context.res.json({ success: false, error: 'No body provided' }, 400);
        }

        let payload;
        try {
            payload = JSON.parse(context.req.body);
        } catch (e) {
            context.error('Failed to parse body', context.req.body);
            return context.res.json({ success: false, error: 'Invalid JSON body' }, 400);
        }

        context.log('Payload received:', JSON.stringify(payload));
        const { items, user_id, customer_name, customer_phone, payment_method } = payload;

        context.log(`Processing order for User: ${user_id}, Name: ${customer_name}`);

        if (!items || !Array.isArray(items) || items.length === 0) {
            context.error('Invalid items array', items);
            return context.res.json({ success: false, error: 'Invalid items' }, 400);
        }

        // 1. Validate Items & Calculate Total from Real DB Prices
        // Optimization: Fetch all products in parallel
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

            // ... (inside loop)
            validatedItems.push({
                product_id: product.$id,
                title: product.title,
                price: price,
                quantity: qty,
                image: product.image
            });
        }

        context.log(`Total calculated: ${calculatedTotal}, Validated Items: ${validatedItems.length}`);

        // 2. Generate Next Order Number (Server-side)
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
            context.error('Error fetching last order:', err);
            throw new Error(`Error fetching last order: ${err.message}`);
        }

        let nextNumber = 100;
        if (lastOrders.documents.length > 0) {
            const lastNum = lastOrders.documents[0].order_number;
            if (lastNum) nextNumber = lastNum + 1;
        }

        context.log(`Next Order Number: ${nextNumber}`);

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

        context.log(`Creating order document... Permissions: ${JSON.stringify(permissions)}`);

        let order;
        try {
            order = await databases.createDocument(
                DATABASE_ID,
                ORDERS_COLLECTION,
                ID.unique(),
                orderData,
                permissions
            );
            context.log(`Order created successfully: ${order.$id}`);
        } catch (err) {
            context.error('Error creating order document:', err);
            throw new Error(`Error creating order document: ${err.message}`);
        }

        return context.res.json({ success: true, order });

    } catch (error) {
        context.error('Order processing failed:', error.message);

        // Attempt to save the failed order so the user can see it in "My Orders"
        try {
            if (context.req.body) { // If payload exists
                const payload = JSON.parse(context.req.body); // Re-parse safely
                const { items, user_id, customer_name, customer_phone, payment_method } = payload;

                if (user_id && user_id !== 'guest') {
                    // Generate a temporary order number or fetch next (risky if DB fetch fails)
                    // Let's use a random fallback for error cases or 0
                    const fallbackNumber = Math.floor(100000 + Math.random() * 900000);

                    const failedOrderData = {
                        order_number: fallbackNumber,
                        total: 0, // Unknown if calc failed
                        items: JSON.stringify(items || []),
                        user_id: user_id,
                        customer_name: customer_name || 'Erro',
                        customer_phone: customer_phone || '',
                        payment_method: payment_method || 'error',
                        status: 'error'
                    };

                    const permissions = [
                        Permission.read(Role.user(user_id)),
                        Permission.update(Role.user(user_id))
                    ];

                    const failedOrder = await databases.createDocument(
                        DATABASE_ID,
                        ORDERS_COLLECTION,
                        ID.unique(),
                        failedOrderData,
                        permissions
                    );
                    context.log(`Failed order saved for visibility: ${failedOrder.$id}`);
                }
            }
        } catch (saveError) {
            context.error('Could not save failed order record:', saveError.message);
        }

        return context.res.json({ success: false, error: error.message }, 500);
    }
};
