
import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import ProductCard from '../ProductCard';
import { CartProvider } from '../../context/CartContext';
import { AuthProvider } from '../../context/AuthContext';
import { BrowserRouter } from 'react-router-dom';

// Simple mock for useAuth if needed, or just wrap in AuthProvider
// But AuthProvider calls Appwrite, so better mock it or mock the hook
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
                <CartProvider>
                    <ProductCard product={product} />
                </CartProvider>
            </BrowserRouter>
        );
    };

    it('renders normal price correctly', () => {
        renderCard(mockProduct);
        expect(screen.getByText('Picanha Premium')).toBeInTheDocument();
        expect(screen.getByText(/R\$ 120\.00/)).toBeInTheDocument();
    });

    it('renders promo price and badge when in promotion', () => {
        renderCard(mockPromoProduct);
        expect(screen.getByText('PROMOÇÃO')).toBeInTheDocument();
        expect(screen.getByText(/R\$ 99\.90/)).toBeInTheDocument();
        // Use querySelector to check for class if needed, or by text
        const prices = screen.getAllByText(/R\$/);
        expect(prices.length).toBeGreaterThan(1); // Should have both prices
    });
});
