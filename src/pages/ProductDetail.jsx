import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getProductById } from '../services/dataService';
import { useCart } from '../context/CartContext';
import { Plus, Minus, ShoppingCart, ArrowLeft, Loader2, X } from 'lucide-react';
import { getImageUrl } from '../lib/imageUtils';
import Header from '../components/shop/Header';
import './ProductDetail.css';

const ProductDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const { cartItems, addToCart, updateQuantity, removeFromCart } = useCart();

    useEffect(() => {
        window.scrollTo(0, 0); // Força a tela a começar no topo

        const fetchProduct = async () => {
            setLoading(true);
            try {
                const data = await getProductById(id);
                if (data) {
                    setProduct(data);
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

        if (id) {
            fetchProduct();
        }
    }, [id]);

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
                        <img
                            src={getImageUrl(product.image)}
                            alt={product.title}
                            className="product-detail-image"
                            onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = 'https://placehold.co/600x400/1e1e1e/D4AF37?text=Sem+Imagem';
                            }}
                        />
                        {product.is_promotion && (
                            <div className="promo-badge-large">PROMOÇÃO</div>
                        )}
                    </div>

                    <div className="product-detail-info">
                        <div className="product-meta">
                            <span className="product-category-detail">{product.category}</span>
                        </div>

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
                                    <ShoppingCart size={20} /> Adicionar ao Carrinho
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
            </div>
        </>
    );
};

export default ProductDetail;
