import React, { useState, useEffect, useRef, useCallback } from 'react';
import HeroCarousel from '../components/shop/HeroCarousel';
import Header from '../components/shop/Header';
import ProductCard from '../components/shop/ProductCard';
import { getProducts } from '../services/dataService';
import './Home.css';

const ITEMS_PER_PAGE = 8; // Aumentado um pouco para preencher telas iniciais maiores

const CATEGORY_PRIORITY = {
    'carne': 1,
    'suinos': 2,
    'frango': 3,
    'embutidos': 4,
    'acompanhamentos': 5,
    'acessorios': 6,
    'insumos': 7,
    'bebidas': 8
};

const Home = () => {
    // Banco em cache local 
    const [allProducts, setAllProducts] = useState([]);

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
                // Ao passar null, o dataService nos devolve a base inteira sem filtros severos.
                const data = await getProducts(); // dataService internamente limita a 100 itens ord. por data
                // Filtramos produtos desativados para o cliente:
                const activeOnly = data.documents.filter(d => d.active !== false);
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

    // 2. Filtra a base local (Memória) toda vez que a Categoria muda, instântaneamente.
    useEffect(() => {
        let newFiltered = [];
        if (activeCategory === 'all') {
            // Aba Promoções
            newFiltered = allProducts.filter(d => d.is_promotion === true);
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
