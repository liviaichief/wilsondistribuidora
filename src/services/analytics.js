
/**
 * Utilitário para rastreamento de E-commerce (GA4 / GTM / Ads)
 */
export const trackEvent = (eventName, params) => {
    if (window.dataLayer) {
        window.dataLayer.push({
            event: eventName,
            ecommerce: params
        });
        console.log(`[Analytics] Tracked: ${eventName}`, params);
    }
};

/**
 * Gera o Feed de Produtos para o Google Merchant Center
 * Nota: Em produção, esta função deve ser executada em uma Appwrite Function 
 * para servir um arquivo XML/JSON dinâmico via URL.
 */
export const generateGoogleMerchantFeed = (products) => {
    const feed = products.map(p => ({
        id: p.$id,
        title: p.title,
        description: p.description,
        link: `${window.location.origin}/product/${p.$id}`,
        image_link: p.image, // URL da imagem principal
        availability: (p.manage_stock && p.stock_quantity <= 0) ? 'out of stock' : 'in stock',
        price: `${p.price} BRL`,
        brand: 'Wilson Distribuidora',
        condition: 'new',
        google_product_category: 'Food, Beverages & Tobacco > Food Items > Meat, Seafood & Eggs'
    }));

    return JSON.stringify(feed, null, 2);
};
