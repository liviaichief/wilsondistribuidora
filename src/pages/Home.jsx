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
    // State management for server-side pagination
    const [items, setItems] = useState([]);
    const [displayItems, setDisplayItems] = useState([]); // Keep for compatibility if used elsewhere, or just sync
    const [activeCategory, setActiveCategory] = useState('all');
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const loader = useRef(null);

    const hasMore = items.length < total;

    // Load data when Category or Page changes
    useEffect(() => {
        const loadData = async () => {
            // If page is 1, we show loading indicator more prominently or clear items
            // But to avoid flash, we might keep items? 
            // Better UX: If category changed, clear items. If just page changed, keep items.
            setLoading(true);
            setError(null);

            try {
                // If it's a new category (page 1), we might want to clear old items immediately 
                // to avoid showing wrong products while loading.
                // But we handle that by dependency array logic below.

                const data = await getProducts(activeCategory, page, ITEMS_PER_PAGE);

                if (page === 1) {
                    setItems(data.documents);
                } else {
                    setItems(prev => [...prev, ...data.documents]);
                }
                setTotal(data.total);

            } catch (err) {
                console.error("Home load error:", err);
                setError("Falha ao carregar produtos.");
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [activeCategory, page]);

    // Reset state when category changes
    useEffect(() => {
        setPage(1);
        setItems([]);
        setTotal(0);
    }, [activeCategory]);

    // Infinite Scroll Logic
    const handleObserver = useCallback((entries) => {
        const target = entries[0];
        if (target.isIntersecting && !loading && hasMore) {
            setPage(prev => prev + 1);
        }
    }, [loading, hasMore]);

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

    // Sync displayItems with items (since we now fetch exactly what we display)
    useEffect(() => {
        setDisplayItems(items);
    }, [items]);

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
                                    Total de itens: {total} <br />
                                    Categoria Ativa: {activeCategory === 'all' ? 'TODOS' : activeCategory} <br />
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
