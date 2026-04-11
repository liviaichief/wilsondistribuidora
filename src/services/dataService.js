import { databases, functions, DATABASE_ID, COLLECTIONS } from '../lib/appwrite';
import { Query, ID, Permission, Role } from 'appwrite';
import axios from 'axios';

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
        queries.push(Query.limit(100));
        queries.push(Query.orderDesc('$createdAt'));

        const [response, blockDoc] = await Promise.all([
            databases.listDocuments(DATABASE_ID, COLLECTIONS.PRODUCTS, queries),
            databases.getDocument(DATABASE_ID, 'settings', 'system_blocked').catch(() => null)
        ]);

        if (blockDoc && blockDoc.value === 'true') {
            console.warn("[SECURITY] Sistema Bloqueado. Ocultando produtos.");
            return { documents: [], total: 0, system_blocked: true };
        }

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

        // Apply Promotion Logic
        if (category === 'all') {
            // Aba Geral/Promo: Apenas o que é promoção
            filteredDocs = filteredDocs.filter(d => d.is_promotion === true);
        }

        // If category is provided (even 'all'), it implies public store view. 
        // We MUST filter out inactive products for the public store.
        if (category !== undefined && category !== null) {
            filteredDocs = filteredDocs.filter(d => d.active !== false);
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

export const getProductById = async (id) => {
    try {
        const response = await databases.getDocument(
            DATABASE_ID,
            COLLECTIONS.PRODUCTS,
            id
        );
        return processDoc(response);
    } catch (error) {
        console.error("Error fetching product by id:", error);
        return null;
    }
};

// Helper to get next SKU number
const getNextSKU = async () => {
    try {
        const response = await databases.listDocuments(DATABASE_ID, COLLECTIONS.PRODUCTS, [
            Query.orderDesc('sku'), 
            Query.limit(1)
        ]);
        
        // Se não houver produtos, começamos em WD0100
        if (response.documents.length === 0) return 'WD0100';

        const lastSku = response.documents[0].sku;
        
        // Tenta extrair o número do SKU atual (WD0100 -> 100)
        let lastNumber = 99; // Default para começar em 100 se falhar
        if (lastSku && lastSku.startsWith('WD')) {
            const numPart = lastSku.substring(2);
            const parsed = parseInt(numPart, 10);
            if (!isNaN(parsed)) lastNumber = parsed;
        }

        return `WD${String(lastNumber + 1).padStart(4, '0')}`;
    } catch (error) {
        console.error("Error generating sequential SKU:", error);
        return `WD${Math.floor(1000 + Math.random() * 9000)}`; // Fallback mais curto no padrão WD
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
            payload.sku = product.sku; // Mantém o SKU existente ou atualiza se fornecido
            response = await databases.updateDocument(
                DATABASE_ID,
                COLLECTIONS.PRODUCTS,
                docId,
                payload
            );
        } else {
            // CREATE
            const sku = await getNextSKU();
            payload.sku = sku;

            // Usamos o SKU como ID do documento para garantir unicidade e padrão solicitado
            response = await databases.createDocument(
                DATABASE_ID,
                COLLECTIONS.PRODUCTS,
                sku, // <--- Aqui o ID do banco se torna o SKU
                payload,
                [
                    Permission.read(Role.any()),
                    Permission.write(Role.users())
                ]
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
        // 1. Prepare standardized order object
        const payload = {
            customer_name: orderData.customer_name,
            customer_phone: orderData.customer_phone,
            payment_method: orderData.paymentMethod || 'A combinar',
            total: parseFloat(orderData.total || 0),
            user_id: orderData.user_id || null,
            items: typeof orderData.items === 'string' ? orderData.items : JSON.stringify(orderData.items || []),
            status: 'pending',
            delivery_mode: orderData.delivery_mode || 'pickup',
            delivery_address: orderData.delivery_address ? JSON.stringify(orderData.delivery_address) : null
        };

        // 2. Try creation via Appwrite Function (if configured)
        if (PLACE_ORDER_FUNC_ID && PLACE_ORDER_FUNC_ID !== 'place_order' && PLACE_ORDER_FUNC_ID.trim() !== '') {
            try {
                const execution = await functions.createExecution(
                    PLACE_ORDER_FUNC_ID,
                    JSON.stringify({
                        ...orderData,
                        items: orderData.items // Backend function handles calculation usually
                    }),
                    false // SYNC
                );
                const response = JSON.parse(execution.responseBody);
                if (response.success !== false) {
                    return {
                        success: true,
                        $id: response.order?.$id || 'processing',
                        order_number: response.order?.order_number || 'Novo',
                        status: response.order?.status || 'pending'
                    };
                }
                console.warn("Backend function failed, falling back to direct DB write.");
            } catch (funcErr) {
                console.warn("Function execution error, falling back to direct DB write:", funcErr);
            }
        }

        // 3. Direct DB Write (Fallback or Default if no function)
        // This ensures the order IS registered as requested by the user.
        const res = await databases.createDocument(
            DATABASE_ID,
            COLLECTIONS.ORDERS,
            ID.unique(),
            payload,
            [
                Permission.read(Role.any()), // Client can see their own (or all if public read, though user_id filter is applied)
                Permission.write(Role.users())
            ]
        );

        return {
            success: true,
            $id: res.$id,
            order_number: res.$id.slice(-6).toUpperCase(), // Fallback order number
            status: res.status
        };

    } catch (error) {
        console.error("Critical Error creating order:", error);
        // LAST RESORT FALLBACK: Allow WhatsApp checkout even if DB fails
        return { 
            success: true, 
            $id: 'fallback_' + Date.now(),
            order_number: 'WHATSAPP',
            status: 'fallback' 
        };
    }
};

/**
 * Sends a direct message via Evolution API (or similar)
 * @param {string} phone - Target phone with 55
 * @param {string} message - Text to send
 * @returns {Promise<boolean>}
 */
export const sendWhatsAppMessage = async (phone, message) => {
    try {
        const settings = await getSettings();
        if (!settings.whatsapp_use_api || !settings.whatsapp_api_url) {
            return false;
        }

        const provider = settings.whatsapp_api_provider || 'evolution';
        const cleanPhone = phone.replace(/\D/g, '');
        const fullPhone = cleanPhone.startsWith('55') ? cleanPhone : '55' + cleanPhone;

        const apiUrl = settings.whatsapp_api_url.endsWith('/') 
            ? settings.whatsapp_api_url.slice(0, -1) 
            : settings.whatsapp_api_url;
            
        const instance = settings.whatsapp_instance;
        const apiKey = settings.whatsapp_api_key; // No Z-API isso é o Instance Token

        let endpoint = '';
        let body = {};
        let headers = { 'Content-Type': 'application/json' };

        if (provider === 'zapi') {
            // Z-API Standard: {url}/instances/{instance}/token/{token}/send-text
            endpoint = `${apiUrl}/instances/${instance}/token/${apiKey}/send-text`;
            body = {
                phone: fullPhone,
                message: message
            };
            if (settings.whatsapp_client_token) {
                headers['Client-Token'] = settings.whatsapp_client_token;
            }
        } else {
            // Evolution API Standard: {url}/message/sendText/{instance}
            endpoint = `${apiUrl}/message/sendText/${instance}`;
            body = {
                number: fullPhone,
                text: message,
                delay: 1200,
                linkPreview: true
            };
            headers['apikey'] = apiKey;
        }

        const response = await axios.post(endpoint, body, { headers });

        return response.status === 200 || response.status === 201;
    } catch (error) {
        console.error(`Error sending WhatsApp message via ${settings.whatsapp_api_provider}:`, error.response?.data || error.message);
        return false;
    }
};

export const backfillSKUs = async () => {
    try {
        console.log('Starting SKU backfill (Sequential SKU-00110+)...');
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
        let nextSkuNumber = 100;

        for (const doc of products) {
            const newSku = `WD${String(nextSkuNumber).padStart(4, '0')}`;

            // Only update if different to save calls
            if (doc.sku !== newSku) {
                await databases.updateDocument(
                    DATABASE_ID,
                    COLLECTIONS.PRODUCTS,
                    doc.$id,
                    { sku: newSku }
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
            let val = doc.value;
            // Attempt to parse JSON (for booleans, numbers, and objects)
            if (val === 'true') val = true;
            else if (val === 'false') val = false;
            else {
                try {
                    val = JSON.parse(doc.value);
                } catch (e) {
                    // Stay as string
                }
            }
            settings[doc.key] = val;
        });
        return settings;
    } catch (e) {
        console.error("Error fetching settings:", e);
        return {};
    }
};

export const updateSettings = async (key, value) => {
    try {
        const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
        try {
            await databases.updateDocument(DATABASE_ID, 'settings', key, { value: stringValue });
            return true;
        } catch (e) {
            // Se o erro for 404 (Document not found), significa que a configuração ainda não existe no banco
            if (e.code === 404) {
                await databases.createDocument(DATABASE_ID, 'settings', key, {
                    key: key,
                    value: stringValue
                }, [
                    Permission.read(Role.any()),
                    Permission.write(Role.users())
                ]);
                return true;
            }
            throw e;
        }
    } catch (e) {
        console.error("Error updating settings:", e);
        throw e;
    }
};

// --- CATEGORIES MANAGEMENT ---

export const getCategories = async () => {
    try {
        const response = await databases.getDocument(DATABASE_ID, 'settings', 'project_categories');
        if (response && response.value) {
            return JSON.parse(response.value);
        }
    } catch (e) {
        // Se não existir, retorna as padrões
        return [
            { id: '1', name: 'Bovinos', active: true },
            { id: '2', name: 'Suínos', active: true },
            { id: '3', name: 'Aves', active: true },
            { id: '4', name: 'Kits', active: true },
            { id: '5', name: 'Mercado', active: true }
        ];
    }
    return [];
};

export const saveCategories = async (categories) => {
    try {
        await updateSettings('project_categories', JSON.stringify(categories));
        return true;
    } catch (e) {
        console.error("Error saving categories:", e);
        throw e;
    }
};

/**
 * Atualiza uma categoria e propaga para todos os produtos
 * @param {string} oldId ID antigo da categoria
 * @param {Object} category Novo objeto da categoria
 */
export const updateCategoryGlobal = async (oldId, category) => {
    try {
        // 1. Carregar categorias atuais
        const currentCats = await getCategories();
        
        // 2. Atualizar a lista
        const newCats = currentCats.map(cat => cat.id === oldId ? category : cat);
        
        // 3. Salvar lista atualizada
        await saveCategories(newCats);

        // 4. Se o ID mudou, atualizar todos os produtos desta categoria
        if (oldId !== category.id) {
            const productsResponse = await databases.listDocuments(
                DATABASE_ID,
                COLLECTIONS.PRODUCTS,
                [Query.equal('category', oldId), Query.limit(100)]
            );

            for (const product of productsResponse.documents) {
                await databases.updateDocument(
                    DATABASE_ID,
                    COLLECTIONS.PRODUCTS,
                    product.$id,
                    { category: category.id }
                );
            }
            console.log(`Global Update: ${productsResponse.total} produtos atualizados de ${oldId} para ${category.id}`);
        }

        return true;
    } catch (e) {
        console.error("Global Category Update Error:", e);
        throw e;
    }
};

export const deleteCategoryGlobal = async (categoryId) => {
    try {
        const currentCats = await getCategories();
        const newCats = currentCats.filter(cat => cat.id !== categoryId);
        await saveCategories(newCats);
        
        // Opcional: Desativar produtos ou marcar como sem categoria
        const productsResponse = await databases.listDocuments(
            DATABASE_ID,
            COLLECTIONS.PRODUCTS,
            [Query.equal('category', categoryId), Query.limit(100)]
        );

        for (const product of productsResponse.documents) {
            await databases.updateDocument(
                DATABASE_ID,
                COLLECTIONS.PRODUCTS,
                product.$id,
                { category: '99' }
            );
        }
        
        return true;
    } catch (e) {
        console.error("Global Category Delete Error:", e);
        throw e;
    }
};

