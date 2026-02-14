import React, { createContext, useState, useContext, useEffect } from 'react';

const OrderContext = createContext();

export const useOrder = () => useContext(OrderContext);

export const OrderProvider = ({ children }) => {
    const [orders, setOrders] = useState(() => {
        const storedOrders = localStorage.getItem('my_orders');
        return storedOrders ? JSON.parse(storedOrders) : [];
    });
    const [isOrderSidebarOpen, setIsOrderSidebarOpen] = useState(false);

    useEffect(() => {
        localStorage.setItem('my_orders', JSON.stringify(orders));
    }, [orders]);

    const addOrder = (order) => {
        setOrders(prev => [order, ...prev]);
    };

    const toggleOrderSidebar = () => {
        setIsOrderSidebarOpen(prev => !prev);
    };

    return (
        <OrderContext.Provider value={{
            orders,
            addOrder,
            isOrderSidebarOpen,
            toggleOrderSidebar
        }}>
            {children}
        </OrderContext.Provider>
    );
};
