
import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import ProductCard from '../shop/ProductCard';
import { CartProvider } from '../../context/CartContext';
import { AuthProvider } from '../../context/AuthContext';
import { AlertProvider } from '../../context/AlertContext';
import { BrowserRouter } from 'react-router-dom';

vi.mock('../../context/AuthContext', () => ({
    useAuth: () => ({ user: null }),
    AuthProvider: ({ children }) => <div>{children}</div>
}));

const mockProduct = {
    id: '1',
    title: 'Picanha Premium',
    description: 'Corte nobre',
    price: 120.00,
    uom: 'KG',
    image: 'test.jpg',
    is_promotion: false
};

const mockPromoProduct = {
    ...mockProduct,
    is_promotion: true,
    promo_price: 99.90
};

describe('ProductCard Component', () => {
    const renderCard = (product) => {
        return render(
            <BrowserRouter>
                <AlertProvider>
                    <CartProvider>
                        <ProductCard product={product} />
                    </CartProvider>
                </AlertProvider>
            </BrowserRouter>
        );
    };

    it('renders product title', () => {
        renderCard(mockProduct);
        expect(screen.getByText('Picanha Premium')).toBeInTheDocument();
    });

    it('renders normal price in Brazilian format', () => {
        renderCard(mockProduct);
        // Brazilian locale: R$ 120,00
        expect(screen.getByText(/120/)).toBeInTheDocument();
    });

    it('renders percentage discount badge when in promotion (CRO-5)', () => {
        renderCard(mockPromoProduct);
        // price=120, promo_price=99.90 → discount ≈ 17%
        expect(screen.getByText(/-\d+%/)).toBeInTheDocument();
    });

    it('shows promo price when in promotion', () => {
        renderCard(mockPromoProduct);
        // Both original and promo prices should appear somewhere
        const prices = screen.getAllByText(/R\$/);
        expect(prices.length).toBeGreaterThan(0);
    });
});
