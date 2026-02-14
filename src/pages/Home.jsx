import React, { useState, useEffect, useRef, useCallback } from 'react';
import HeroCarousel from '../components/HeroCarousel';
import Header from '../components/Header';
import ProductCard from '../components/ProductCard';
import { getProducts } from '../services/dataService';
import './Home.css';

const ITEMS_PER_PAGE = 6;

const CATEGORY_PRIORITY = {
    'carne': 1,
    'frango': 2,
    'embutidos': 3,
    'acompanhamentos': 4,
    'acessorios': 5,
    'insumos': 6
};

const Home = () => {
    const [items, setItems] = useState([]);
    const [displayItems, setDisplayItems] = useState([]);
    const [activeCategory, setActiveCategory] = useState('all');
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const loader = useRef(null);

    // Load initial data
    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            setError(null);

            let allProducts = null;

            // Add a timeout promise to detect hanging
            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Timeout fetching products (10s)')), 10000)
            );

            try {
                allProducts = await Promise.race([
                    getProducts(),
                    timeoutPromise
                ]);
            } catch (err) {
                // If SDK fails or times out, allProducts remains null, triggering the fallback
            }

            // FALLBACK REMOVED: Appwrite migration complete.
            if (!allProducts || allProducts.length === 0) {
                // No fallback needed, dataService handles Appwrite
            }

            if (allProducts === null) {
                setError("Falha ao carregar produtos. Verifique sua conexão ou contate o suporte.");
                setItems([]);
            } else {
                setItems(allProducts);
            }
            setLoading(false);
        };
        loadData();
    }, []);

    // Filter and Reset when category changes
    useEffect(() => {
        setPage(1);
        let filtered = activeCategory === 'all'
            ? [...items]
            : items.filter(item => item.category?.toLowerCase().trim() === activeCategory.toLowerCase().trim());

        if (activeCategory === 'all') {
            filtered.sort((a, b) => {
                const pA = CATEGORY_PRIORITY[a.category] || 99;
                const pB = CATEGORY_PRIORITY[b.category] || 99;
                return pA - pB;
            });
        }

        // Initial load for this category
        setDisplayItems(filtered.slice(0, ITEMS_PER_PAGE));
    }, [activeCategory, items]);

    // Infinite Scroll Logic
    const handleObserver = useCallback((entries) => {
        const target = entries[0];

        // Calculate total available items for current category
        const totalItems = activeCategory === 'all'
            ? items.length
            : items.filter(i => i.category?.toLowerCase().trim() === activeCategory.toLowerCase().trim()).length;

        if (target.isIntersecting && !loading && displayItems.length < totalItems) {
            setLoading(true);
            setTimeout(() => {
                setPage((prev) => prev + 1);
                setLoading(false);
            }, 800);
        }
    }, [loading, displayItems.length, items, activeCategory]);

    useEffect(() => {
        const option = {
            root: null,
            rootMargin: "20px",
            threshold: 0
        };
        const observer = new IntersectionObserver(handleObserver, option);
        if (loader.current) observer.observe(loader.current);

        return () => {
            if (loader.current) observer.unobserve(loader.current);
        }
    }, [handleObserver]);

    // Load more items when page increases
    useEffect(() => {
        if (page === 1) return;

        let filtered = activeCategory === 'all'
            ? [...items]
            : items.filter(item => item.category?.toLowerCase().trim() === activeCategory.toLowerCase().trim());

        if (activeCategory === 'all') {
            filtered.sort((a, b) => {
                const pA = CATEGORY_PRIORITY[a.category] || 99;
                const pB = CATEGORY_PRIORITY[b.category] || 99;
                return pA - pB;
            });
        }

        // Get next batch of items
        const currentLength = displayItems.length;
        const nextBatch = filtered.slice(currentLength, currentLength + ITEMS_PER_PAGE);

        if (nextBatch.length > 0) {
            setDisplayItems(prev => [...prev, ...nextBatch]);
        } else {
            // No more items to load
            setLoading(false);
        }
    }, [page, activeCategory, items]);

    return (
        <div className="home-container">
            <Header
                activeCategory={activeCategory}
                onCategoryChange={setActiveCategory}
            />

            <main className="main-content">
                <HeroCarousel />

                <div className="products-grid">
                    {error && (
                        <div className="error-message" style={{ textAlign: 'center', color: 'red', gridColumn: '1 / -1', padding: '2rem' }}>
                            <p>{error}</p>
                            <button onClick={() => window.location.reload()} style={{ marginTop: '1rem', padding: '0.5rem 1rem', cursor: 'pointer' }}>
                                Tentar novamente
                            </button>
                        </div>
                    )}

                    {!error && displayItems.length > 0 ? (
                        displayItems.map((item, index) => (
                            <ProductCard key={item.id || index} product={item} />
                        ))
                    ) : (
                        !loading && !error && (
                            <div className="no-products">
                                <p>Nenhum produto encontrado neste filtro.</p>
                                <p style={{ fontSize: '0.8rem', color: '#666' }}>
                                    Total de itens: {items.length} <br />
                                    Categoria Ativa: {activeCategory === 'all' ? 'TODOS' : activeCategory} <br />
                                    Categorias Disponíveis: {[...new Set(items.map(i => i.category))].join(', ')}
                                </p>
                            </div>
                        )
                    )}
                </div>

                <div ref={loader} className="loading-indicator">
                    {loading && <div className="spinner"></div>}
                </div>
            </main>
        </div>
    );
};

export default Home;
