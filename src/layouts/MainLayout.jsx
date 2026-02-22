import React from 'react';
import { Outlet } from 'react-router-dom';
import CartSidebar from '../components/shop/CartSidebar';
import OrderSidebar from '../components/shop/OrderSidebar';
import AuthModal from '../components/auth/AuthModal';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from "@vercel/speed-insights/react";

const MainLayout = () => {
    return (
        <div className="app-container">
            <CartSidebar />
            <OrderSidebar />
            <AuthModal />
            <Analytics />
            <SpeedInsights />
            <main className="main-content">
                <Outlet />
            </main>
        </div>
    );
};

export default MainLayout;
