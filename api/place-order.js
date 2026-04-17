
import { Client, Databases, ID, Permission, Role, Query } from 'node-appwrite';
import axios from 'axios';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { 
        items, 
        user_id, 
        customer_name, 
        customer_phone, 
        delivery_mode, 
        delivery_address 
    } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ error: 'Itens inválidos ou vazios.' });
    }

    const client = new Client()
        .setEndpoint(process.env.VITE_APPWRITE_ENDPOINT || 'https://sfo.cloud.appwrite.io/v1')
        .setProject(process.env.VITE_APPWRITE_PROJECT_ID)
        .setKey(process.env.APPWRITE_API_KEY || process.env.VITE_APPWRITE_API_KEY);

    const databases = new Databases(client);
    const DATABASE_ID = process.env.VITE_DATABASE_ID || 'main_db';
    const SETTINGS_COLLECTION = 'settings';
    const ORDERS_COLLECTION = 'orders';
    const PRODUCTS_COLLECTION = 'products';

    try {
        // 1. Fetch Settings
        const settingsRes = await databases.listDocuments(DATABASE_ID, SETTINGS_COLLECTION);
        const settings = {};
        settingsRes.documents.forEach(doc => {
            let val = doc.value;
            if (val === 'true') val = true;
            else if (val === 'false') val = false;
            settings[doc.key] = val;
        });

        // 2. Validate Items & Calculate Total
        const validatedItems = [];
        let calculatedTotal = 0;

        for (const item of items) {
            try {
                const product = await databases.getDocument(DATABASE_ID, PRODUCTS_COLLECTION, item.id || item.$id);
                const price = product.is_promotion && product.promo_price ? product.promo_price : product.price;
                const qty = parseFloat(item.quantity) || 1;
                
                calculatedTotal += price * qty;
                validatedItems.push({
                    id: product.$id,
                    title: product.title,
                    price: price,
                    quantity: qty,
                    sku: product.sku
                });

                // Deduzir o estoque
                if (product.stock !== null && product.stock !== undefined) {
                    const newStock = Math.max(0, product.stock - qty); // Evita estoque negativo
                    await databases.updateDocument(DATABASE_ID, PRODUCTS_COLLECTION, product.$id, {
                        stock: newStock
                    });
                }
            } catch (e) {
                const fallbackQty = parseFloat(item.quantity) || 1;
                calculatedTotal += (parseFloat(item.price) || 0) * fallbackQty;
                validatedItems.push({ ...item, quantity: fallbackQty });
            }
        }

        // 3. Next Order Number
        let nextNumber = 1000;
        try {
            const lastOrders = await databases.listDocuments(DATABASE_ID, ORDERS_COLLECTION, [
                Query.orderDesc('order_number'),
                Query.limit(1)
            ]);
            if (lastOrders.documents.length > 0) {
                const lastNum = parseInt(lastOrders.documents[0].order_number);
                if (!isNaN(lastNum)) nextNumber = lastNum + 1;
            }
        } catch (err) {}

        // 4. Create Order
        const orderData = {
            order_number: String(nextNumber),
            total: calculatedTotal,
            items: JSON.stringify(validatedItems),
            user_id: user_id || 'guest',
            customer_name,
            customer_phone,
            payment_method: 'A combinar',
            status: 'pending',
            delivery_mode: delivery_mode || 'pickup',
            delivery_address: delivery_address ? (typeof delivery_address === 'string' ? delivery_address : JSON.stringify(delivery_address)) : null
        };

        const permissions = [Permission.read(Role.any())];
        if (user_id && user_id !== 'guest') {
            permissions.push(Permission.update(Role.user(user_id)));
        }

        const order = await databases.createDocument(
            DATABASE_ID, 
            ORDERS_COLLECTION, 
            ID.unique(), 
            orderData, 
            permissions
        );

        // 5. WhatsApp API
        let whatsappSent = false;
        if (settings.whatsapp_use_api && settings.whatsapp_api_url) {
            try {
                const itemsList = validatedItems.map(item => 
                    `• ${item.quantity}x ${item.title} - R$ ${(item.price * item.quantity).toFixed(2)}`
                ).join('\n');

                let addressText = '';
                if (delivery_mode === 'pickup') {
                    addressText = '🛵 Opção: Retirar na Loja';
                } else if (delivery_address) {
                    const addr = typeof delivery_address === 'string' ? JSON.parse(delivery_address) : delivery_address;
                    addressText = `🛵 Opção: Entrega\n*Endereço:* ${addr.street}, ${addr.number}\nBairro: ${addr.neighborhood}\n${addr.city}/${addr.state}`;
                }

                let headerText = settings.whatsapp_message || '*NOVO PEDIDO {pedido} - WILSON DISTRIBUIDORA*';
                headerText = headerText.replace('{pedido}', `#${nextNumber}`);

                const message = `${headerText}\n\n` +
                    `*Itens do Pedido:*\n${itemsList}\n\n` +
                    `*Dados do Cliente:*\n` +
                    `Nome: ${customer_name}\n` +
                    `WhatsApp: ${customer_phone}\n\n` +
                    `*Entrega/Retirada:*\n${addressText}`;

                const targetPhone = (settings.whatsapp_number || '').replace(/\D/g, '');
                
                const provider = settings.whatsapp_api_provider || 'evolution';
                const apiUrl = settings.whatsapp_api_url.endsWith('/') ? settings.whatsapp_api_url.slice(0, -1) : settings.whatsapp_api_url;
                const instance = settings.whatsapp_instance;
                const apiKey = settings.whatsapp_api_key;

                let endpoint = '';
                let headers = { 'Content-Type': 'application/json' };
                let body = {};

                if (provider === 'zapi') {
                    endpoint = `${apiUrl}/instances/${instance}/token/${apiKey}/send-text`;
                    body = { phone: targetPhone, message: message };
                    if (settings.whatsapp_client_token) {
                        headers['Client-Token'] = settings.whatsapp_client_token;
                    }
                } else {
                    endpoint = `${apiUrl}/message/sendText/${instance}`;
                    body = { number: targetPhone, text: message };
                    headers['apikey'] = apiKey;
                }

                await axios.post(endpoint, body, { headers });
                whatsappSent = true;

                // Simple confirmation message back to client
                if (customer_phone) {
                    const cleanCustPhone = customer_phone.replace(/\D/g, '');
                    const customerTarget = cleanCustPhone.startsWith('55') ? cleanCustPhone : '55' + cleanCustPhone;
                    const confirmMsg = `Olá *${customer_name}*! Recebemos seu pedido *#${nextNumber}* com sucesso. 🔥`;
                    
                    if (provider === 'zapi') {
                        await axios.post(endpoint, { phone: customerTarget, message: confirmMsg }, { headers });
                    } else {
                        await axios.post(endpoint, { number: customerTarget, text: confirmMsg }, { headers });
                    }
                }
            } catch (waErr) {
                console.error('WhatsApp Error:', waErr.message);
            }
        }

        return res.status(200).json({ 
            success: true, 
            order_id: order.$id, 
            order_number: nextNumber,
            whatsapp_sent: whatsappSent 
        });

    } catch (error) {
        console.error('Server Error:', error);
        return res.status(500).json({ success: false, error: 'Erro interno ao processar pedido.' });
    }
}
