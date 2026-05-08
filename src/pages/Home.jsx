import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import HeroCarousel from '../components/shop/HeroCarousel';
import Header from '../components/shop/Header';
import CategoryBar from '../components/shop/CategoryBar';
import ProductCard from '../components/shop/ProductCard';
import { getProducts } from '../services/dataService';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, AlertCircle } from 'lucide-react';
import GoogleReviews from '../components/shop/GoogleReviews';
import './Home.css';

const ITEMS_PER_PAGE = 50; // Increased to show more products instantly

const Home = () => {
    const [allProducts, setAllProducts] = useState([]);
    const [isSystemBlocked, setIsSystemBlocked] = useState(false);
    const [showBlockMessage, setShowBlockMessage] = useState(true);
    const [filteredItems, setFilteredItems] = useState([]);
    const [displayItems, setDisplayItems] = useState([]);
    const [activeCategory, setActiveCategory] = useState('all');
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchParams, setSearchParams] = useSearchParams();
    const brandFilter = searchParams.get('brand');
    const loader = useRef(null);

    const hasMore = displayItems.length < filteredItems.length;

    useEffect(() => {
        const fetchInitialData = async () => {
            setLoading(true);
            try {
                // Ao carregar a página (F5), se houver filtros na URL, limpamos para voltar à Home limpa
                if (searchParams.toString() !== '') {
                    setSearchParams({});
                }

                const { getCategories } = await import('../services/dataService');
                const [data, categoriesList] = await Promise.all([
                    getProducts(),
                    getCategories()
                ]);

                if (data.system_blocked) setIsSystemBlocked(true);
                else setIsSystemBlocked(false);

                const activeCatIds = categoriesList.filter(c => c.active !== false).map(c => c.id);
                const enrichedProducts = data.documents.map(d => {
                    const catObj = categoriesList.find(c => c.id?.toString() === d.category?.toString());
                    return {
                        ...d,
                        category_name: catObj ? catObj.name : 'Geral'
                    };
                });

                const activeOnly = enrichedProducts.filter(d => {
                    const isVisible = d.active !== false && activeCatIds.includes(d.category);
                    const isStockDisabled = d.manage_stock && d.stock_quantity <= 0 && d.disable_on_zero_stock;
                    return isVisible && !isStockDisabled;
                });
                
                setAllProducts(activeOnly);
            } catch (err) {
                console.error("Home load error:", err);
                setError("Falha ao carregar o cardápio. Verifique a conexão.");
            } finally {
                setLoading(false);
            }
        };
        fetchInitialData();
    }, []);

    useEffect(() => {
        let items = [...allProducts];
        
        // 1. Aplicar filtro de categoria
        if (activeCategory !== 'all') {
            items = items.filter(d => (d.category || '').toString().trim().toLowerCase() === activeCategory.toString().trim().toLowerCase());
        } else {
            // Se for "Geral", mostramos apenas promoções por padrão (a menos que uma marca seja selecionada)
            if (!brandFilter) {
                items = items.filter(d => d.is_promotion === true);
            }
        }

        // 2. Aplicar Reordenação por Marca (Move para o topo)
        if (brandFilter) {
            const brandItems = items.filter(d => (d.brand || '').toString().trim().toLowerCase() === brandFilter.toLowerCase());
            const otherItems = items.filter(d => (d.brand || '').toString().trim().toLowerCase() !== brandFilter.toLowerCase());
            
            // Combinar: Marca selecionada primeiro, depois o restante
            items = [...brandItems, ...otherItems];
            
            // Feedback visual: scroll suave para o topo
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }

        setFilteredItems(items);
        setPage(1);
    }, [activeCategory, allProducts, brandFilter]);

    useEffect(() => {
        setDisplayItems(filteredItems.slice(0, page * ITEMS_PER_PAGE));
    }, [filteredItems, page]);

    const handleObserver = useCallback((entries) => {
        const target = entries[0];
        if (target.isIntersecting && !loading && hasMore) {
            setPage(prev => prev + 1);
        }
    }, [loading, hasMore]);

    useEffect(() => {
        const option = { root: null, rootMargin: "200px", threshold: 0 };
        const observer = new IntersectionObserver(handleObserver, option);
        if (loader.current) observer.observe(loader.current);
        return () => { if (loader.current) observer.unobserve(loader.current); }
    }, [handleObserver]);

    const handleCategoryChange = (catId) => {
        setActiveCategory(catId);
        setPage(1);
        // Ao trocar de categoria, limpamos o filtro de marca da URL para voltar ao comportamento normal
        if (searchParams.has('brand')) {
            setSearchParams({});
        }
    };

    return (
        <div className="home-container">
            {isSystemBlocked && showBlockMessage && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)', padding: '20px' }}>
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="glass-card" 
                        style={{ padding: '50px', maxWidth: '450px', width: '100%', textAlign: 'center', border: '1px solid rgba(255,255,255,0.1)' }}
                    >
                        <div style={{ fontSize: '80px', marginBottom: '20px' }}>🔐</div>
                        <h2 style={{ fontSize: '1.8rem', fontWeight: 900, color: '#fff', marginBottom: '15px', letterSpacing: '-1px' }}>Sistema Indisponível</h2>
                        <p style={{ color: '#888', fontSize: '1rem', lineHeight: 1.6, marginBottom: '30px', fontWeight: 600 }}>
                            No momento, nossa plataforma encontra-se temporariamente fora do ar. Por favor, entre em contato com o administrador para restaurar a operação.
                        </p>
                        <div style={{ display: 'inline-block', padding: '12px 24px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '2px' }}>
                            Acesso Restrito
                        </div>
                    </motion.div>
                </div>
            )}

            <Header />

            <div className="home-content-wrapper">
                <CategoryBar 
                    activeCategory={activeCategory} 
                    onCategoryChange={handleCategoryChange} 
                />
                
                {activeCategory === 'all' && (
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                    >
                        <HeroCarousel />
                    </motion.div>
                )}

                <div className="products-grid">
                    <AnimatePresence>
                        {error ? (
                            <motion.div 
                                key="error"
                                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                className="no-products"
                                style={{ gridColumn: '1 / -1' }}
                            >
                                <AlertCircle size={50} color="#ef4444" style={{ marginBottom: '20px' }} />
                                <h3>Opa! Algo deu errado.</h3>
                                <p>{error}</p>
                                <button onClick={() => window.location.reload()} style={{ marginTop: '20px', padding: '12px 30px', borderRadius: '14px', background: '#D4AF37', border: 'none', fontWeight: 900, cursor: 'pointer' }}>Tentar Novamente</button>
                            </motion.div>
                        ) : loading ? (
                            Array.from({ length: 8 }).map((_, i) => (
                                <div key={`skeleton-${i}`} className="premium-card" style={{ height: '320px', opacity: 0.1 }}>
                                    <div style={{ flex: 1, background: 'rgba(255,255,255,0.1)' }} />
                                </div>
                            ))
                        ) : displayItems.length > 0 ? (
                            displayItems.map((item, index) => (
                                <ProductCard key={item.$id || index} product={item} />
                            ))
                        ) : (
                            <motion.div 
                                key="empty"
                                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                className="no-products"
                                style={{ gridColumn: '1 / -1' }}
                            >
                                <div style={{ fontSize: '50px', marginBottom: '20px' }}>📦</div>
                                <h3>Nenhum produto encontrado</h3>
                                <p>Estamos preparando novidades para esta categoria. Tente voltar mais tarde!</p>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                <div ref={loader} style={{ height: '100px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {hasMore && !loading && (
                        <div className="spinner"></div>
                    )}
                </div>

                {/* Google Social Proof */}
                {!loading && !isSystemBlocked && <GoogleReviews />}
            </div>
        </div>
    );
};

export default Home;
