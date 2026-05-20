import React, { createContext, useState, useContext, useEffect, useRef, useCallback } from 'react';
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
        try {
            const storedCart = localStorage.getItem('cart');
            return storedCart ? JSON.parse(storedCart) : [];
        } catch {
            return [];
        }
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

    // Lazy-load products/categories/rules only when upsell is first needed
    const upsellDataLoaded = useRef(false);
    const loadUpsellData = useCallback(async () => {
        if (upsellDataLoaded.current) return;
        upsellDataLoaded.current = true;
        try {
            const [prodRes, catRes, settings] = await Promise.all([
                getProducts(),
                getCategories(),
                getSettings()
            ]);
            if (prodRes.documents) setAllProducts(prodRes.documents);
            if (catRes) setCategories(catRes);
            if (settings.upsell_rules) setUpsellRules(settings.upsell_rules);
        } catch (err) {
            console.error("CartContext upsell data load failed:", err);
            upsellDataLoaded.current = false; // allow retry
        }
    }, []);

    // Load user history when user changes
    useEffect(() => {
        if (user?.$id) {
            getUserOrderHistory(user.$id)
                .then(history => setUserHistory(history))
                .catch(() => setUserHistory([]));
        } else {
            setUserHistory([]);
        }
    }, [user]);

    // [CRO-4] Ao fazer logout, salva o carrinho em sessionStorage antes de limpar
    // O cliente pode recuperar os itens ao fazer login novamente na mesma sessão
    const [prevUser, setPrevUser] = useState(user);

    useEffect(() => {
        if (prevUser && !user) {
            // Preserva carrinho para recuperação pós-login (mesma aba/sessão)
            if (cartItems.length > 0) {
                sessionStorage.setItem('cart_backup', JSON.stringify(cartItems));
            }
            setCartItems([]);
        }
        // Ao fazer login, verifica se há carrinho salvo para recuperar
        if (!prevUser && user) {
            const backup = sessionStorage.getItem('cart_backup');
            if (backup) {
                try {
                    const saved = JSON.parse(backup);
                    if (saved?.length > 0) setCartItems(saved);
                    sessionStorage.removeItem('cart_backup');
                } catch (_) {}
            }
        }
        setPrevUser(user);
    }, [user]); // prevUser removido das deps — é atualizado dentro do effect

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

    const triggerUpsell = useCallback(async (items) => {
        if (isUpsellOpen || !items || items.length === 0) return false;

        // Garante que os dados estejam carregados (lazy, só na primeira chamada)
        await loadUpsellData();

        let baseProduct = null;
        let matchedRule = null;

        for (const item of items) {
            const itemIdStr = item.id?.toString().trim();
            const rule = upsellRules.find(r =>
                r.trigger_ids?.some(tid => tid.toString().trim() === itemIdStr)
            );
            if (rule) { baseProduct = item; matchedRule = rule; break; }
        }

        if (!baseProduct) baseProduct = items[0];

        let recommendations = [];

        if (matchedRule && matchedRule.recommended_ids?.length > 0) {
            recommendations = allProducts
                .filter(p => matchedRule.recommended_ids.some(rid => rid.toString().trim() === p.id?.toString().trim()))
                .sort(() => 0.5 - Math.random());
        }

        if (recommendations.length === 0) {
            const cartIds = items.map(i => i.id?.toString());
            const potentialRecs = allProducts.filter(p => !cartIds.includes(p.id?.toString()) && p.active !== false);

            const scoredRecs = potentialRecs.map(p => {
                const pIdStr = p.id?.toString().trim();
                let score = 0;
                let reason = 'default';
                if (userHistory.some(hid => hid.toString().trim() === pIdStr)) { score += 100; reason = 'history'; }
                if (p.category?.toString() === baseProduct.category?.toString())  { score += 50;  if (reason === 'default') reason = 'category'; }
                if (p.is_promotion)                                               { score += 30;  if (reason === 'default') reason = 'promo'; }
                return { ...p, score, reason };
            });

            recommendations = scoredRecs
                .filter(p => p.score > 0)
                .sort((a, b) => (b.score - a.score) || (0.5 - Math.random()))
                .slice(0, 3);

            if (recommendations.length === 0 && potentialRecs.length > 0) {
                recommendations = potentialRecs.sort(() => 0.5 - Math.random()).slice(0, 3).map(p => ({ ...p, reason: 'default' }));
            }
        }

        if (recommendations.length > 0) {
            const catObj = categories.find(c => c.id?.toString() === baseProduct.category?.toString());
            const categoryName = baseProduct.category_name || (catObj ? catObj.name : null) || 'Wilson Distribuidora';
            setUpsellBaseProduct({ ...baseProduct, categoryName: categoryName.toString().toUpperCase() });
            setUpsellRecommendations(recommendations);
            setIsUpsellOpen(true);
            return true;
        }

        return false;
    }, [isUpsellOpen, allProducts, categories, upsellRules, userHistory, loadUpsellData]);

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
