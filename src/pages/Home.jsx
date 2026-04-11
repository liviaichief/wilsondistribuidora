import React, { useState, useEffect, useRef, useCallback } from 'react';
import HeroCarousel from '../components/shop/HeroCarousel';
import Header from '../components/shop/Header';
import ProductCard from '../components/shop/ProductCard';
import { getProducts } from '../services/dataService';
import './Home.css';

const ITEMS_PER_PAGE = 8; // Aumentado um pouco para preencher telas iniciais maiores



const Home = () => {
    // Banco em cache local 
    const [allProducts, setAllProducts] = useState([]);
    const [isSystemBlocked, setIsSystemBlocked] = useState(false);
    const [showBlockMessage, setShowBlockMessage] = useState(true);

    // Visão atual
    const [filteredItems, setFilteredItems] = useState([]);
    const [displayItems, setDisplayItems] = useState([]);
    const [activeCategory, setActiveCategory] = useState('all');
    const [page, setPage] = useState(1);

    // Status de loading global apenas para o primeiro carregamento
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const loader = useRef(null);

    const hasMore = displayItems.length < filteredItems.length;

    // 1. Carrega todos os produtos de uma VEZ SÓ quando a tela abre.
    // Isso economiza incontáveis requisições ao Appwrite.
    useEffect(() => {
        const fetchInitialData = async () => {
            setLoading(true);
            try {
                const { getCategories } = await import('../services/dataService');
                const [data, categoriesList] = await Promise.all([
                    getProducts(),
                    getCategories()
                ]);

                if (data.system_blocked) {
                    setIsSystemBlocked(true);
                } else {
                    setIsSystemBlocked(false);
                }

                // Lista de IDs de categorias ativas
                const activeCatIds = categoriesList.filter(c => c.active !== false).map(c => c.id);

                // Filtramos produtos desativados E produtos de categorias desativadas para o cliente:
                const activeOnly = data.documents.filter(d => 
                    d.active !== false && 
                    activeCatIds.includes(d.category)
                );
                
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
        if (isSystemBlocked && showBlockMessage) {
            const timer = setTimeout(() => {
                setShowBlockMessage(false);
            }, 20000);
            return () => clearTimeout(timer);
        }
    }, [isSystemBlocked, showBlockMessage]);

    // 2. Filtra a base local (Memória) toda vez que a Categoria muda, instântaneamente.
    useEffect(() => {
        let newFiltered = [];
        if (activeCategory === 'all') {
            // Aba Promoções: Mostrar promoções + Cópia de todos os outros produtos ordenados por categoria
            const promoProducts = allProducts.filter(d => d.is_promotion === true);
            const otherProducts = allProducts.filter(d => d.is_promotion !== true);

            newFiltered = [...promoProducts, ...otherProducts];
        } else {
            // Abas Específicas
            newFiltered = allProducts.filter(d => (d.category || '').toLowerCase() === activeCategory.toLowerCase());
        }

        setFilteredItems(newFiltered);
        setPage(1); // Reseta a paginação (scroll) pro topo ao trocar aba
    }, [activeCategory, allProducts]);

    // 3. Gerencia o "Slice" da lista para evitar criar 100 cartões HTML de uma vez (Performance do Navegador)
    useEffect(() => {
        setDisplayItems(filteredItems.slice(0, page * ITEMS_PER_PAGE));
    }, [filteredItems, page]);

    // Lógica do Infinite Scroll Local (Apenas revela mais HTML, sem chamar o banco)
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

    return (
        <div className="home-container">
            {isSystemBlocked && showBlockMessage && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', padding: '20px' }}>
                    <div style={{ backgroundColor: '#141414', border: '1px solid #333', borderRadius: '30px', padding: '40px', maxWidth: '450px', width: '100%', textAlign: 'center', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }}>
                        <div style={{ fontSize: '100px', marginBottom: '10px', animation: 'pulse 2s infinite' }}>😔</div>
                        <h2 style={{ fontSize: '1.8rem', fontWeight: 900, color: '#fff', marginBottom: '15px', letterSpacing: '-1px' }}>Sistema Indisponível</h2>
                        <p style={{ color: '#aaa', fontSize: '1rem', lineHeight: 1.6, marginBottom: '30px' }}>
                            No momento, nossa plataforma encontra-se temporariamente fora do ar devido a problemas financeiros. Por favor, regularize as pendências para restaurar a operação da loja.
                        </p>
                        <div style={{ display: 'inline-block', padding: '10px 20px', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '2px' }}>
                            Aguardando Pagamento
                        </div>
                    </div>
                </div>
            )}

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

                    {loading ? (
                        <></> // Espera carregar a primeira vez para não pipocar erros
                    ) : displayItems.length > 0 ? (
                        displayItems.map((item, index) => (
                            <ProductCard key={item.id || index} product={item} />
                        ))
                    ) : (
                        !error && (
                            <div className="no-products" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem 1rem', color: '#888' }}>
                                <h3>Nenhum produto nesta sessão!</h3>
                                <p style={{ fontSize: '0.9rem', color: '#666', marginTop: '10px' }}>
                                    Estamos abastecendo o estoque. Tente verificar outras categorias.
                                </p>
                            </div>
                        )
                    )}
                </div>

                <div ref={loader} className="loading-indicator" style={{ height: '40px', padding: '10px' }}>
                    {/* Se estiver arrastando a tela para baixo e ainda tiver itens locais escondidos, mostra loader */}
                    {hasMore && !loading && <div className="spinner"></div>}
                </div>
            </main>
        </div>
    );
};

export default Home;
