import React, { createContext, useState, useContext, useEffect } from 'react';
import { useAuth } from './AuthContext';

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
    const { user } = useAuth();
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
            if (existing) {
                return prev.map(item =>
                    item.id === product.id
                        ? { ...item, quantity: item.quantity + quantity }
                        : item
                );
            }
            return [...prev, { ...product, quantity }];
        });
        // setIsCartOpen(true); // Changed behavior: don't auto-open
    };

    const removeFromCart = (id) => {
        setCartItems(prev => prev.filter(item => item.id !== id));
    };

    const updateQuantity = (id, newQuantity) => {
        if (newQuantity < 1) {
            removeFromCart(id);
            return;
        }
        setCartItems(prev => prev.map(item =>
            item.id === id ? { ...item, quantity: newQuantity } : item
        ));
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
