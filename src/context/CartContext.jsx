import React, { createContext, useState, useContext, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { useAlert } from './AlertContext';

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

    const addToCart = (product, quantity = 1) => {
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

    const removeFromCart = (id) => {
        setCartItems(prev => prev.filter(item => item.id !== id));
    };

    const updateQuantity = (id, newQuantity) => {
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
            cartCount
        }}>
            {children}
        </CartContext.Provider>
    );
};
