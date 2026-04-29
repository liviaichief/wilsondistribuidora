import { databases, functions, DATABASE_ID, COLLECTIONS } from '../lib/appwrite';
import { Query, ID, Permission, Role } from 'appwrite';
import axios from 'axios';
export { ID };

// Function IDs - Should be in environment variables in production
const PLACE_ORDER_FUNC_ID = import.meta.env.VITE_FUNC_PLACE_ORDER || 'place_order';
const CREATE_PRODUCT_FUNC_ID = import.meta.env.VITE_FUNC_CREATE_PRODUCT || 'create_product';

// Security Helper: Basic Sanitization to prevent XSS
const sanitize = (val) => {
    if (typeof val !== 'string') return val;
    return val
        .replace(/<script\b[^>]*>([\s\S]*?)<\/script>/gim, "")
        .replace(/on\w+="[^"]*"/gim, "")
        .replace(/javascript:/gim, "")
        .trim();
};

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

// Helper to get next Order Number
const getNextOrderNumber = async () => {
    try {
        // Buscamos os últimos 100 pedidos para garantir que achamos um no padrão WD
        const response = await databases.listDocuments(DATABASE_ID, COLLECTIONS.ORDERS, [
            Query.orderDesc('$createdAt'),
            Query.limit(100)
        ]);

        if (response.documents.length === 0) return 'WD0001';

        // Encontrar o maior número entre os que seguem o padrão WD
        let maxNumber = 0;
        response.documents.forEach(doc => {
            if (doc.$id && doc.$id.startsWith('WD')) {
                const numPart = doc.$id.substring(2);
                const parsed = parseInt(numPart, 10);
                if (!isNaN(parsed) && parsed > maxNumber) {
                    maxNumber = parsed;
                }
            }
        });

        // Se não achou nenhum no padrão WD entre os últimos 100, assume que começa agora ou 
        // incrementa baseado no total se for o caso, mas o mais seguro é WD0001 se for o primeiro padrão.
        const nextNum = maxNumber + 1;
        return `WD${String(nextNum).padStart(4, '0')}`;
    } catch (error) {
        console.error("Error generating sequential Order Number:", error);
        return `WD${Date.now().toString().slice(-6)}`; // Fallback baseado em timestamp
    }
};

export const saveProduct = async (product) => {
    try {
        let response;
        // Use either product.id (mapped) or product.$id (raw Appwrite)
        const docId = product.id || product.$id;

        const payload = {
            title: sanitize(product.title),
            description: sanitize(product.description),
            price: parseFloat(product.price) || 0,
            category: product.category,
            image: product.image, // Should be File ID or URL
            uom: product.uom || 'KG',
            is_promotion: !!product.is_promotion,
            promo_price: product.promo_price ? (parseFloat(product.promo_price) || 0) : null,
            active: product.active !== false,
            manage_stock: !!product.manage_stock,
            stock_quantity: parseInt(product.stock_quantity) || 0,
            allow_backorder: !!product.allow_backorder,
            disable_on_zero_stock: !!product.disable_on_zero_stock,
            has_box_option: !!product.has_box_option,
            box_price: product.box_price ? (parseFloat(product.box_price) || 0) : null
        };

        if (product.image_2 !== undefined) payload.image_2 = product.image_2;
        if (product.cost_price !== undefined) payload.cost_price = parseFloat(product.cost_price) || 0;
        if (product.video_url !== undefined) payload.video_url = product.video_url;

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
                    Permission.read(Role.any())
                    // Removida permissão de escrita Role.users(). 
                    // A escrita deve ser configurada via Console para Role.team("admin").
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
            customer_name: sanitize(orderData.customer_name),
            customer_phone: sanitize(orderData.customer_phone),
            payment_method: sanitize(orderData.paymentMethod || 'A combinar'),
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
        let retryCount = 0;
        let res = null;
        let lastErr = null;

        while (retryCount < 3) {
            try {
                const nextOrderNumber = await getNextOrderNumber();
                res = await databases.createDocument(
                    DATABASE_ID,
                    COLLECTIONS.ORDERS,
                    nextOrderNumber,
                    payload,
                    orderData.user_id ? [
                        Permission.read(Role.user(orderData.user_id)),
                        Permission.write(Role.user(orderData.user_id))
                    ] : [
                        Permission.read(Role.any())
                    ]
                );
                break; // Sucesso!
            } catch (err) {
                lastErr = err;
                if (err.code === 409) {
                    console.warn(`Order Number collision (${retryCount + 1}), retrying...`);
                    retryCount++;
                    // Pequeno delay para permitir que o outro processo termine
                    await new Promise(r => setTimeout(r, 200 * retryCount));
                } else {
                    throw err; // Outro tipo de erro, não adianta tentar de novo
                }
            }
        }

        if (!res) throw lastErr;

        // --- STOCK DECREMENT LOGIC ---
        try {
            const itemsToProcess = typeof orderData.items === 'string' ? JSON.parse(orderData.items) : orderData.items;
            for (const item of itemsToProcess) {
                if (item.id) {
                    const product = await databases.getDocument(DATABASE_ID, COLLECTIONS.PRODUCTS, item.id);
                    if (product.manage_stock) {
                        let newStock = (product.stock_quantity || 0) - item.quantity;
                        let newActive = product.active;
                        
                        if (newStock <= 0) {
                            newStock = 0; // prevent negative visually
                            if (product.disable_on_zero_stock) {
                                newActive = false;
                            }
                        }

                        await databases.updateDocument(
                            DATABASE_ID,
                            COLLECTIONS.PRODUCTS,
                            item.id,
                            { 
                                stock_quantity: newStock,
                                active: newActive
                            }
                        );
                    }
                }
            }
        } catch (stockErr) {
            console.error("Error decrementing stock:", stockErr);
        }

        return {
            success: true,
            $id: res.$id,
            order_number: res.$id, // Agora o ID já é o WD0000
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

        // Evolution API Standard: {url}/message/sendText/{instance}
        const endpoint = `${apiUrl}/message/sendText/${instance}`;
        const body = {
            number: fullPhone,
            text: message,
            delay: 1200,
            linkPreview: true
        };
        const headers = { 
            'Content-Type': 'application/json',
            'apikey': apiKey 
        };

        const response = await axios.post(endpoint, body, { headers });

        return response.status === 200 || response.status === 201;
    } catch (error) {
        console.error("Error sending WhatsApp message via Evolution API:", error.response?.data || error.message);
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
        const response = await databases.listDocuments(
            DATABASE_ID, 
            'settings',
            [Query.limit(100)]
        );
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

        // [SECURITY] Filter sensitive keys for non-admin requests if this is called in public context
        // Note: In a real scenario, this filter should be even stricter.
        const sensitiveKeys = ['whatsapp_api_key', 'whatsapp_api_url', 'smtp_password'];
        const isClientSide = typeof window !== 'undefined';
        
        // This is a last-resort client-side filter. 
        // Real security MUST be in Appwrite Collection Rules (Read permissions).
        if (isClientSide && !window.location.pathname.startsWith('/admin')) {
            sensitiveKeys.forEach(key => {
                if (settings[key]) settings[key] = '********';
            });
        }

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
                    Permission.read(Role.any())
                    // Removida permissão de escrita Role.users().
                    // Escrita permitida apenas para o time admin no Console.
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

// --- UOM MANAGEMENT ---

export const getUOMs = async () => {
    try {
        const response = await databases.getDocument(DATABASE_ID, 'settings', 'project_uoms');
        if (response && response.value) {
            return JSON.parse(response.value);
        }
    } catch (e) {
        // Se não existir, retorna as padrões que já usamos
        return [
            { id: '1', name: 'KG', active: true },
            { id: '2', name: 'Unidade', active: true },
            { id: '3', name: 'Pacote', active: true },
            { id: '4', name: 'Caixa', active: true }
        ];
    }
    return [];
};

export const saveUOMs = async (uoms) => {
    try {
        await updateSettings('project_uoms', JSON.stringify(uoms));
        return true;
    } catch (e) {
        console.error("Error saving UOMs:", e);
        throw e;
    }
};

// --- ORDERS MANAGEMENT ---

export const getOrders = async () => {
    try {
        const response = await databases.listDocuments(
            DATABASE_ID,
            COLLECTIONS.ORDERS,
            [Query.orderDesc('$createdAt'), Query.limit(100)]
        );
        return response;
    } catch (error) {
        console.error("Error fetching orders:", error);
        throw error;
    }
};

export const updateOrderStatus = async (orderId, status) => {
    try {
        await databases.updateDocument(
            DATABASE_ID,
            COLLECTIONS.ORDERS,
            orderId,
            { status }
        );
        return true;
    } catch (error) {
        console.error("Error updating order status:", error);
        throw error;
    }
};

// --- PROFILES / USERS MANAGEMENT ---

export const getProfiles = async () => {
    try {
        const response = await databases.listDocuments(
            DATABASE_ID,
            COLLECTIONS.PROFILES,
            [
                Query.orderDesc('$createdAt'),
                Query.limit(100)
            ]
        );
        return response;
    } catch (error) {
        console.error("Error fetching profiles:", error);
        throw error;
    }
};

export const updateProfile = async (profileId, data) => {
    try {
        await databases.updateDocument(
            DATABASE_ID,
            COLLECTIONS.PROFILES,
            profileId,
            data
        );
        return true;
    } catch (error) {
        console.error("Error updating profile:", error);
        throw error;
    }
};

export const deleteProfile = async (profileId) => {
    try {
        await databases.deleteDocument(
            DATABASE_ID,
            COLLECTIONS.PROFILES,
            profileId
        );
        return true;
    } catch (error) {
        console.error("Error deleting profile:", error);
        throw error;
    }
};

export const createProfile = async (profileId, data) => {
    try {
        await databases.createDocument(
            DATABASE_ID,
            COLLECTIONS.PROFILES,
            profileId,
            data,
            [
                Permission.read(Role.any()),
                Permission.read(Role.user(profileId)),
                Permission.write(Role.user(profileId))
            ]
        );
        return true;
    } catch (error) {
        console.error("Error creating profile:", error);
        throw error;
    }
};
