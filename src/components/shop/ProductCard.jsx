import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { Plus, Minus, ShoppingCart, Eye, Sparkles, ChevronLeft, ChevronRight } from 'lucide-react';
import { getImageUrl } from '../../lib/imageUtils';
import { formatTitleCase } from '../../lib/utils';
import './ProductCard.css';

const ProductCard = ({ product }) => {
    const { cartItems, addToCart, updateQuantity, removeFromCart } = useCart();
    const navigate = useNavigate();
    const cartItem = cartItems.find(item => item.id === product.id);
    const quantity = cartItem ? cartItem.quantity : 0;

    const [isImageLoading, setIsImageLoading] = React.useState(true);
    const [currentImgIndex, setCurrentImgIndex] = React.useState(0);
    
    const images = [product.image];
    if (product.image_2) images.push(product.image_2);

    const handleAdd = (e) => {
        e.stopPropagation();
        addToCart(product, 1);
    };

    const handleIncrement = (e) => {
        e.stopPropagation();
        if (product.manage_stock && !product.allow_backorder && quantity >= product.stock_quantity) return;
        updateQuantity(product.id, quantity + 1);
    };

    const handleDecrement = (e) => {
        e.stopPropagation();
        if (quantity > 1) updateQuantity(product.id, quantity - 1);
        else removeFromCart(product.id);
    };

    const nextImage = (e) => {
        e.stopPropagation();
        setCurrentImgIndex((prev) => (prev + 1) % images.length);
    };

    const prevImage = (e) => {
        e.stopPropagation();
        setCurrentImgIndex((prev) => (prev - 1 + images.length) % images.length);
    };
    
    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className={`premium-card ${product.is_promotion ? 'promo-variant' : ''}`}
            onClick={() => navigate(`/produto/${product.id}`)}
        >
            {/* Promo Badge */}
            <AnimatePresence>
                {product.is_promotion && (
                    <motion.div 
                        initial={{ scale: 0, rotate: -10 }}
                        animate={{ scale: 1, rotate: 0 }}
                        className="glass-promo-badge"
                    >
                        <span>PROMOÇÃO</span>
                    </motion.div>
                )}
            </AnimatePresence>
 
            {/* Image Section */}
            <div className="card-media">
                {isImageLoading && <div className="image-skeleton" />}
                
                <AnimatePresence mode="wait">
                    <motion.img
                        key={images[currentImgIndex]}
                        src={getImageUrl(images[currentImgIndex], { width: 400 })}
                        alt={product.title}
                        loading="lazy"
                        drag={images.length > 1 ? "x" : false}
                        dragConstraints={{ left: 0, right: 0 }}
                        onDragEnd={(_, info) => {
                            if (images.length <= 1) return;
                            const swipeThreshold = 50;
                            if (info.offset.x < -swipeThreshold) {
                                nextImage({ stopPropagation: () => {} });
                            } else if (info.offset.x > swipeThreshold) {
                                prevImage({ stopPropagation: () => {} });
                            }
                        }}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        onLoad={() => setIsImageLoading(false)}
                        onError={(e) => {
                            setIsImageLoading(false);
                            e.target.style.display = 'none';
                            e.target.parentNode.classList.add('show-placeholder');
                        }}
                    />
                </AnimatePresence>

                <div className="no-image-placeholder">
                    <Sparkles size={40} strokeWidth={1} />
                    <span>PRODUTO PREMIUM</span>
                </div>

                {images.length > 1 && (
                    <>
                        <button className="carousel-nav-btn btn-left" onClick={prevImage}>
                            <ChevronLeft size={18} />
                        </button>
                        <button className="carousel-nav-btn btn-right" onClick={nextImage}>
                            <ChevronRight size={18} />
                        </button>
                        <div className="carousel-dots">
                            {images.map((_, idx) => (
                                <div key={idx} className={`dot ${idx === currentImgIndex ? 'active' : ''}`} />
                            ))}
                        </div>
                    </>
                )}

                <div className={`card-price-float ${product.is_promotion ? 'promo-active' : ''}`}>
                    {product.is_promotion && product.promo_price ? (
                        <div className="price-stack">
                            <span className="old-price">
                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(parseFloat(product.price))}
                            </span>
                            <span className="main-price">
                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(parseFloat(product.promo_price))}
                            </span>
                        </div>
                    ) : (
                        <span className="main-price">
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(parseFloat(product.price))}
                        </span>
                    )}
                </div>
            </div>

            {/* Info Section */}
            <div className="card-content">
                <div className="title-row">
                    <h3 className="card-title">{formatTitleCase(product.title)}</h3>
                    <span className="card-category">{(product.category_name || 'Geral').toUpperCase()}</span>
                </div>
                <p className="card-description">{product.description}</p>
                <div className="card-uom-badge">{product.uom || 'KG'}</div>
                
                <div className="card-footer">
                    <div className="action-area" onClick={e => e.stopPropagation()}>
                        {product.manage_stock && product.stock_quantity <= 0 && !product.allow_backorder ? (
                            <button className="sold-out-btn" disabled>ESGOTADO</button>
                        ) : quantity === 0 ? (
                            <motion.button
                                whileTap={{ scale: 0.95 }}
                                className="add-cart-btn"
                                onClick={handleAdd}
                            >
                                <ShoppingCart size={18} />
                                <span>ADICIONAR</span>
                            </motion.button>
                        ) : (
                            <div className="qty-control">
                                <button onClick={handleDecrement} className="qty-btn"><Minus size={16} /></button>
                                <span className="qty-num">{quantity}</span>
                                <button onClick={handleIncrement} className="qty-btn"><Plus size={16} /></button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export default ProductCard;
