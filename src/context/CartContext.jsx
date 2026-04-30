import React, { createContext, useState, useContext, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { useAlert } from './AlertContext';
import { getProducts, getCategories, getUserOrderHistory, getSettings } from '../services/dataService';
import UpsellModal from '../components/shop/UpsellModal';

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
    const { user } = useAuth();
    const { showAlert } = useAlert();
    const [cartItems, setCartItems] = useState(() => {
        const storedCart = localStorage.getItem('cart');
        return storedCart ? JSON.parse(storedCart) : [];
    });
    const [isCartOpen, setIsCartOpen] = useState(false);

    // Upsell State
    const [isUpsellOpen, setIsUpsellOpen] = useState(false);
    const [upsellBaseProduct, setUpsellBaseProduct] = useState(null);
    const [upsellRecommendations, setUpsellRecommendations] = useState([]);
    const [allProducts, setAllProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [userHistory, setUserHistory] = useState([]);
    const [upsellRules, setUpsellRules] = useState([]);

    // Pre-fetch products and categories for recommendations
    useEffect(() => {
        const fetchAll = async () => {
            try {
                const [prodRes, catRes, settings] = await Promise.all([
                    getProducts(),
                    getCategories(),
                    getSettings()
                ]);
                console.log("CartContext Loaded Data:", {
                    products: prodRes.documents?.length || 0,
                    categories: catRes?.length || 0,
                    rules: settings.upsell_rules?.length || 0
                });
                if (prodRes.documents) setAllProducts(prodRes.documents);
                if (catRes) setCategories(catRes);
                if (settings.upsell_rules) setUpsellRules(settings.upsell_rules);
            } catch (err) {
                console.error("CartContext Data Load Failed:", err);
            }
        };
        fetchAll();
    }, []);

    // Load user history when user changes
    useEffect(() => {
        if (user?.$id) {
            getUserOrderHistory(user.$id).then(history => setUserHistory(history));
        } else {
            setUserHistory([]);
        }
    }, [user]);

    // [COMPORTAMENTO] Esvaziar carrinho ao fazer logout
    // Detectamos a transição de user (logado) para null (não logado)
    const [prevUser, setPrevUser] = useState(user);

    useEffect(() => {
        if (prevUser && !user) {
            console.log("Detectado logout, esvaziando carrinho...");
            setCartItems([]);
        }
        setPrevUser(user);
    }, [user, prevUser]);

    useEffect(() => {
        localStorage.setItem('cart', JSON.stringify(cartItems));
    }, [cartItems]);

    // Trava o scroll do body quando o carrinho está aberto
    useEffect(() => {
        if (isCartOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'auto';
        }
        
        return () => {
            document.body.style.overflow = 'auto';
        };
    }, [isCartOpen]);

    const addToCart = (product, quantity = 1, skipUpsell = false) => {
        triggerHaptic();
        setCartItems(prev => {
            const existing = prev.find(item => item.id === product.id);
            const proposedQuantity = existing ? existing.quantity + quantity : quantity;
            
            // Stock Rules Validation
            if (product.manage_stock && !product.allow_backorder) {
                if (proposedQuantity > product.stock_quantity) {
                    showAlert(`Desculpe, temos apenas ${product.stock_quantity} un. de ${product.title} em estoque.`, 'warning', 'Estoque Insuficiente', 2000);
                    return prev; // Do not add
                }
            }

            if (existing) {
                return prev.map(item =>
                    item.id === product.id
                        ? { ...item, quantity: proposedQuantity }
                        : item
                );
            }

            const effectivePrice = product.is_promotion && product.promo_price ? parseFloat(product.promo_price) : parseFloat(product.price);

            return [...prev, { ...product, quantity: proposedQuantity, price: effectivePrice, original_price: parseFloat(product.price) }];
        });
    };

    const triggerUpsell = (items) => {
        if (isUpsellOpen || !items || items.length === 0) {
            console.log("Upsell Aborted: Modal already open or cart empty");
            return false;
        }

        console.log("--- UPSELL DEBUG START ---");
        console.log("Items in Cart:", items.map(i => `${i.title} (ID: ${i.id})`));
        console.log("Available Rules:", upsellRules);
        
        let baseProduct = null;
        let matchedRule = null;

        // Procura em cada item do carrinho se ele é um gatilho de alguma regra
        for (const item of items) {
            const itemIdStr = item.id?.toString().trim();
            const rule = upsellRules.find(r => 
                r.trigger_ids?.some(tid => tid.toString().trim() === itemIdStr)
            );

            if (rule) {
                console.log(`Match Found! Item "${item.title}" triggers rule "${rule.name}"`);
                baseProduct = item;
                matchedRule = rule;
                break;
            }
        }

        // Se nenhuma regra manual bater, usamos o primeiro item como base para o fallback inteligente
        if (!baseProduct) {
            baseProduct = items[0];
            console.log("No manual rule found. Using first item as base for intelligent fallback:", baseProduct.title);
        }

        let recommendations = [];

        // 1. Tentar Regras Manuais
        if (matchedRule && matchedRule.recommended_ids?.length > 0) {
            recommendations = allProducts
                .filter(p => matchedRule.recommended_ids.some(rid => rid.toString().trim() === p.id?.toString().trim()))
                .sort(() => 0.5 - Math.random());
            console.log("Manual recommendations found:", recommendations.length);
        }

        // 2. Tentar Fallback Inteligente (History > Category > Promo)
        if (recommendations.length === 0) {
            console.log("Falling back to intelligent logic...");
            const cartIds = items.map(i => i.id?.toString());
            let potentialRecs = allProducts.filter(p => !cartIds.includes(p.id?.toString()) && p.active !== false);

            const scoredRecs = potentialRecs.map(p => {
                let score = 0;
                const pIdStr = p.id?.toString().trim();
                if (userHistory.some(hid => hid.toString().trim() === pIdStr)) score += 100;
                if (p.category?.toString() === baseProduct.category?.toString()) score += 50;
                if (p.is_promotion) score += 30;
                return { ...p, score };
            });

            recommendations = scoredRecs
                .filter(p => p.score > 0)
                .sort((a, b) => (b.score - a.score) || (0.5 - Math.random()))
                .slice(0, 6); // Para o inteligente, 6 itens é um bom limite
            
            // 3. Fallback Total (Aleatório do Catálogo)
            if (recommendations.length === 0 && potentialRecs.length > 0) {
                console.log("Absolute fallback: Random products");
                recommendations = potentialRecs
                    .sort(() => 0.5 - Math.random())
                    .slice(0, 6);
            }
        }

        console.log("Final Recommendations List:", recommendations.map(r => r.title));

        if (recommendations.length > 0) {
            const catObj = categories.find(c => c.id?.toString() === baseProduct.category?.toString());
            const categoryName = baseProduct.category_name || (catObj ? catObj.name : null) || 'Wilson Distribuidora';

            setUpsellBaseProduct({ ...baseProduct, categoryName: categoryName.toString().toUpperCase() });
            setUpsellRecommendations(recommendations);
            
            console.log("DISPATCHING MODAL OPEN");
            setIsUpsellOpen(true);
            return true;
        }

        console.log("--- UPSELL DEBUG END - NO RECS ---");
        return false;
    };

    const removeFromCart = (id) => {
        setCartItems(prev => prev.filter(item => item.id !== id));
    };

    const updateQuantity = (id, newQuantity) => {
        triggerHaptic();
        if (newQuantity < 1) {
            removeFromCart(id);
            return;
        }

        setCartItems(prev => {
            const itemToUpdate = prev.find(item => item.id === id);
            
            // Stock Rules Validation
            if (itemToUpdate && itemToUpdate.manage_stock && !itemToUpdate.allow_backorder) {
                if (newQuantity > itemToUpdate.stock_quantity) {
                    showAlert(`Apenas ${itemToUpdate.stock_quantity} un. de ${itemToUpdate.title} disponíveis.`, 'warning');
                    return prev;
                }
            }

            return prev.map(item =>
                item.id === id ? { ...item, quantity: newQuantity } : item
            );
        });
    };

    const clearCart = () => setCartItems([]);
    const toggleCart = () => setIsCartOpen(prev => !prev);

    const cartTotal = cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
    const cartCount = cartItems.reduce((count, item) => count + item.quantity, 0);

    // Haptic Feedback Helper
    const triggerHaptic = () => {
        if ('vibrate' in navigator) {
            navigator.vibrate(40);
        }
    };

    return (
        <CartContext.Provider value={{
            cartItems,
            addToCart,
            removeFromCart,
            updateQuantity,
            clearCart,
            isCartOpen,
            toggleCart,
            cartTotal,
            cartCount,
            triggerUpsell
        }}>
            {children}

            <UpsellModal 
                isOpen={isUpsellOpen}
                onClose={() => {
                    setIsUpsellOpen(false);
                    setIsCartOpen(true);
                }}
                baseProduct={upsellBaseProduct}
                recommendations={upsellRecommendations}
                cartItems={cartItems}
                onAdd={(item) => addToCart(item, 1, true)}
                onUpdateQuantity={updateQuantity}
            />
        </CartContext.Provider>
    );
};
