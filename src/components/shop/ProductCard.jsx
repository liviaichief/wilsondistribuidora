import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { Plus, Minus, ShoppingCart } from 'lucide-react';
import { getImageUrl } from '../../lib/imageUtils';
import './ProductCard.css';

const ProductCard = ({ product }) => {
    const { cartItems, addToCart, updateQuantity, removeFromCart } = useCart();
    const navigate = useNavigate();

    // Find current quantity in global cart state
    const cartItem = cartItems.find(item => item.id === product.id);
    const quantity = cartItem ? cartItem.quantity : 0;

    const handleAdd = (e) => {
        e.stopPropagation();
        addToCart(product, 1);
    };

    const handleIncrement = (e) => {
        e.stopPropagation();
        updateQuantity(product.id, quantity + 1);
    };

    const handleDecrement = (e) => {
        e.stopPropagation();
        if (quantity > 1) {
            updateQuantity(product.id, quantity - 1);
        } else {
            removeFromCart(product.id);
        }
    };

    const handleCardClick = () => {
        navigate(`/produto/${product.id}`);
    };

    return (
        <motion.div
            id={`product-${product.id}`} // [NEW] Anchor for banner navigation
            className={`product-card clickable-card ${product.is_promotion ? 'promo-highlight' : ''}`}
            onClick={handleCardClick}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
        >
            <div className="image-container">
                {product.is_promotion && (
                    <div className="promo-ribbon">Promoção</div>
                )}
                <img
                    // Optimization: Append width parameter if it's a Supabase URL to resize on fly
                    src={getImageUrl(product.image, { width: 400 })}
                    alt={product.title}
                    className="product-image"
                    loading="lazy"
                    decoding="async"
                    onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = 'https://placehold.co/600x400/1e1e1e/D4AF37?text=Sem+Imagem';
                        e.target.style.filter = 'none';
                    }}
                />
                {/* Price tag removed from image overlay to match the reference design */}
            </div>
            <div className="product-info">
                <h3 className="product-title">{product.title}</h3>
                <span className="product-sku">SKU: {product.sku || product.id.substring(0,6)}</span>
                
                <div className="product-price-section">
                    {product.is_promotion && product.promo_price ? (
                        <div className="promo-price-container">
                            <span className="original-price">
                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(product.price)}
                            </span>
                            <div className="current-price-row">
                                <span className="main-price">
                                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(parseFloat(product.promo_price))}
                                </span>
                                <span className="price-uom">/{product.uom || 'KG'}</span>
                            </div>
                        </div>
                    ) : (
                        <div className="current-price-row">
                            <span className="main-price">
                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(product.price)}
                            </span>
                            <span className="price-uom">/{product.uom || 'KG'}</span>
                        </div>
                    )}
                </div>

                <div className="product-actions">
                    {quantity === 0 ? (
                        <button
                            className="btn-add"
                            onClick={handleAdd}
                        >
                            <ShoppingCart size={18} /> Adicionar
                        </button>
                    ) : (
                        <div className="qty-selector full-width">
                            <button onClick={handleDecrement}><Minus size={18} /></button>
                            <span className="qty-display">{quantity}</span>
                            <button onClick={handleIncrement}><Plus size={18} /></button>
                        </div>
                    )}
                </div>
            </div>
        </motion.div >
    );
};

export default React.memo(ProductCard);


