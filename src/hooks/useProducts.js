import { useState, useEffect, useCallback } from 'react';

// Initial Mock Data to seed localStorage
const SEED_PRODUCTS = Array.from({ length: 50 }).map((_, i) => ({
    id: `prod-${i}`,
    title: `Corte Premium ${i + 1}`,
    description: 'Um corte suculento e macio, perfeito para churrasco ou grelhados. Qualidade garantida.',
    price: 49.90 + (i * 2),
    category: ['beef', 'pork', 'poultry'][i % 3],
    image: `https://placehold.co/400x400/e2e8f0/1e293b?text=Carne+${i + 1}`
}));

const STORAGE_KEY = 'boutique_products';

export function useProducts(category = 'all') {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [page, setPage] = useState(1);

    // Load initial data
    const getAllProducts = useCallback(() => {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) return JSON.parse(stored);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_PRODUCTS));
        return SEED_PRODUCTS;
    }, []);

    const fetchProducts = useCallback(async (pageNum, cat, isReset = false) => {
        setLoading(true);
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 600));

        const allProducts = getAllProducts();
        const filtered = cat === 'all'
            ? allProducts
            : allProducts.filter(p => p.category === cat);

        const LIMIT = 12;
        const start = (pageNum - 1) * LIMIT;
        const end = start + LIMIT;
        const newItems = filtered.slice(start, end);

        if (isReset) {
            setProducts(newItems);
        } else {
            setProducts(prev => [...prev, ...newItems]);
        }

        if (end >= filtered.length) {
            setHasMore(false);
        }

        setPage(pageNum);
        setLoading(false);
    }, [getAllProducts]);

    // Initial fetch
    useEffect(() => {
        setPage(1);
        setHasMore(true);
        fetchProducts(1, category, true);
    }, [category, fetchProducts]);

    const loadMore = () => {
        if (!loading && hasMore) {
            fetchProducts(page + 1, category);
        }
    };

    // CRUD Operations
    const addProduct = async (product) => {
        const all = getAllProducts();
        const newProduct = { ...product, id: `prod-${Date.now()}` };
        const updated = [newProduct, ...all]; // Add to top
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        // Refresh current view
        fetchProducts(1, category, true);
        return newProduct;
    };

    const updateProduct = async (id, updates) => {
        const all = getAllProducts();
        const updated = all.map(p => p.id === id ? { ...p, ...updates } : p);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        fetchProducts(1, category, true);
    };

    const deleteProduct = async (id) => {
        const all = getAllProducts();
        const updated = all.filter(p => p.id !== id);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        fetchProducts(1, category, true);
    };

    return { products, loading, hasMore, loadMore, addProduct, updateProduct, deleteProduct };
}
