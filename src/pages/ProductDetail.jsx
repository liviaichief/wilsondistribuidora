import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getProductById } from '../services/dataService';
import { useCart } from '../context/CartContext';
import { Plus, Minus, ShoppingCart, ArrowLeft, Loader2, X } from 'lucide-react';
import { getImageUrl } from '../lib/imageUtils';
import { trackEvent } from '../services/analytics';
import { getProducts } from '../services/dataService';
import Header from '../components/shop/Header';
import './ProductDetail.css';

const ProductDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [relatedProducts, setRelatedProducts] = useState([]);

    const { cartItems, addToCart, updateQuantity, removeFromCart } = useCart();

    useEffect(() => {
        window.scrollTo(0, 0); // Força a tela a começar no topo

        const fetchProduct = async () => {
            setLoading(true);
            try {
                const data = await getProductById(id);
                if (data) {
                    setProduct(data);
                    // Track Product View
                    trackEvent('view_item', {
                        currency: 'BRL',
                        value: data.price,
                        items: [{
                            item_id: data.id || data.$id,
                            item_name: data.title,
                            price: data.price,
                            item_category: data.category
                        }]
                    });

                    // Load Related Products (Upselling)
                    loadRelated(data);
                } else {
                    setError('Produto não encontrado.');
                }
            } catch (err) {
                console.error("Error loading product detail:", err);
                setError('Erro ao carregar os detalhes do produto.');
            } finally {
                setLoading(false);
            }
        };

        const loadRelated = async (currentProd) => {
            try {
                // Sugere itens de acompanhamento (Id fixo ou nome da categoria)
                const all = await getProducts();
                const filtered = all.documents
                    .filter(p => p.$id !== currentProd.$id && (p.category_name?.toLowerCase().includes('acompanhamento') || p.category_name?.toLowerCase().includes('bebida')))
                    .slice(0, 4);
                setRelatedProducts(filtered);
            } catch (e) { console.warn("Failed to load related products", e); }
        };

        if (id) {
            fetchProduct();
        }
    }, [id]);

    const [isImageLoading, setIsImageLoading] = useState(true);

    if (loading) {
        return (
            <>
                <Header />
                <div className="product-detail-container loading-state">
                    <Loader2 className="spinner" size={40} />
                    <p>Carregando produto...</p>
                </div>
            </>
        );
    }

    if (error || !product) {
        return (
            <>
                <Header />
                <div className="product-detail-container error-state">
                    <p>{error || 'Produto não encontrado.'}</p>
                    <button className="btn-back" onClick={() => navigate(-1)}>
                        <ArrowLeft size={20} /> Voltar
                    </button>
                </div>
            </>
        );
    }

    // Find current quantity in global cart state
    const cartItem = cartItems.find(item => item.id === product.id);
    const quantity = cartItem ? cartItem.quantity : 0;

    const handleAdd = () => {
        addToCart(product, 1);
    };

    const handleIncrement = () => {
        updateQuantity(product.id, quantity + 1);
    };

    const handleDecrement = () => {
        if (quantity > 1) {
            updateQuantity(product.id, quantity - 1);
        } else {
            removeFromCart(product.id);
        }
    };

    return (
        <>
            <Header />
            <div className="product-detail-container">
                <div className="product-detail-top-bar">
                    <button className="btn-back-nav" onClick={() => navigate(-1)}>
                        <ArrowLeft size={20} /> Voltar
                    </button>
                    <button className="btn-close-nav" onClick={() => navigate('/')} title="Fechar e ir para o início">
                        <X size={24} />
                    </button>
                </div>

                <div className="product-detail-content">
                    <div className="product-detail-image-wrapper">
                        {product.video_url ? (
                            <div className="video-container-reels">
                                <iframe 
                                    src={product.video_url.replace('watch?v=', 'embed/')} 
                                    title="Product Video" 
                                    frameBorder="0" 
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                                    allowFullScreen
                                    style={{ width: '100%', aspectRatio: '9/16', borderRadius: '20px' }}
                                ></iframe>
                            </div>
                        ) : (
                            <>
                                {isImageLoading && <div className="image-skeleton" />}
                                <img
                                    src={getImageUrl(product.image)}
                                    alt={product.title}
                                    className="product-detail-image"
                                    onLoad={() => setIsImageLoading(false)}
                                    onError={(e) => {
                                        setIsImageLoading(false);
                                        e.target.onerror = null;
                                        e.target.src = 'https://placehold.co/600x400/1e1e1e/D4AF37?text=Sem+Imagem';
                                    }}
                                />
                            </>
                        )}
                        {product.is_promotion && (
                            <div className="promo-badge-large">PROMOÇÃO</div>
                        )}
                    </div>

                    <div className="product-detail-info">
                        <h1 className="product-title-detail">{product.title}</h1>

                        <div className="product-price-section">
                            {product.is_promotion && product.promo_price ? (
                                <div className="price-container">
                                    <span className="original-price-detail">
                                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(product.price)}
                                    </span>
                                    <span className="promo-price-detail">
                                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(parseFloat(product.promo_price))}
                                        <span className="uom"> / {product.uom || 'KG'}</span>
                                    </span>
                                </div>
                            ) : (
                                <div className="price-container">
                                    <span className="regular-price-detail">
                                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(product.price)}
                                        <span className="uom"> / {product.uom || 'KG'}</span>
                                    </span>
                                </div>
                            )}
                        </div>

                        <div className="product-description-container">
                            <h3>Descrição do Produto</h3>
                            <p className="product-description-detail">
                                {product.description || 'Nenhuma descrição detalhada disponível para este produto.'}
                            </p>
                        </div>

                        <div className="product-detail-actions">
                            {product.manage_stock && product.stock_quantity <= 0 && !product.allow_backorder ? (
                                <button
                                    className="btn-add-large"
                                    disabled
                                    style={{ background: '#333', color: '#888', cursor: 'not-allowed' }}
                                >
                                    Esgotado
                                </button>
                            ) : quantity === 0 ? (
                                <button
                                    className="btn-add-large"
                                    onClick={handleAdd}
                                >
                                    <ShoppingCart size={20} /> ADICIONAR
                                </button>
                            ) : (
                                <div className="qty-selector-large">
                                    <button onClick={handleDecrement} className="btn-qty"><Minus size={20} /></button>
                                    <span className="qty-display-large">{quantity}</span>
                                    <button onClick={handleIncrement} className="btn-qty"><Plus size={20} /></button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* SEÇÃO COMBINA COM ESTE CORTE */}
                {relatedProducts.length > 0 && (
                    <div className="related-products-section" style={{ padding: '20px', maxWidth: '1200px', margin: '40px auto' }}>
                        <h3 style={{ fontSize: '1.2rem', fontWeight: 900, marginBottom: '20px', color: '#D4AF37' }}>🔥 COMBINA COM ESTE CORTE</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '15px' }}>
                            {relatedProducts.map(rel => (
                                <div 
                                    key={rel.$id} 
                                    onClick={() => navigate(`/produto/${rel.$id}`)}
                                    style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '15px', padding: '10px', cursor: 'pointer', border: '1px solid rgba(255,255,255,0.05)' }}
                                >
                                    <img src={getImageUrl(rel.image)} alt={rel.title} style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', borderRadius: '10px' }} />
                                    <p style={{ margin: '8px 0 2px', fontSize: '0.8rem', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{rel.title}</p>
                                    <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: 900, color: '#D4AF37' }}>R$ {rel.price.toFixed(2)}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </>
    );
};

export default ProductDetail;
