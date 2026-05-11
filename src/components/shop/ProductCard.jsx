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
    const [isBoxSelected, setIsBoxSelected] = React.useState(false);

    const currentId = isBoxSelected && product.has_box_option ? `${product.id}_box` : product.id;
    const cartItem = cartItems.find(item => item.id === currentId);
    const quantity = cartItem ? cartItem.quantity : 0;

    const [isImageLoading, setIsImageLoading] = React.useState(true);
    const [currentImgIndex, setCurrentImgIndex] = React.useState(0);
    
    const images = [product.image];
    if (product.image_2) images.push(product.image_2);

    const handleAdd = (e) => {
        e.stopPropagation();
        
        let productToAdd = { ...product };
        if (isBoxSelected && product.has_box_option) {
            productToAdd = {
                ...product,
                id: `${product.id}_box`,
                original_id: product.id,
                price: product.box_price,
                uom: 'Caixa',
                is_box: true,
                title: `${product.title} (Caixa)`,
                is_promotion: false, // Caixa não entra na promoção de unidade por padrão
                promo_price: null
            };
        }
        
        addToCart(productToAdd, 1);
    };

    const handleIncrement = (e) => {
        e.stopPropagation();
        if (product.manage_stock && !product.allow_backorder && quantity >= product.stock_quantity) return;
        updateQuantity(currentId, quantity + 1);
    };

    const handleDecrement = (e) => {
        e.stopPropagation();
        if (quantity > 1) updateQuantity(currentId, quantity - 1);
        else removeFromCart(currentId);
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
            {/* Badge de promoção com percentual de desconto (CRO-5) */}
            <AnimatePresence>
                {product.is_promotion && !isBoxSelected && product.promo_price && product.price && (
                    <motion.div
                        initial={{ scale: 0, rotate: -10 }}
                        animate={{ scale: 1, rotate: 0 }}
                        className="glass-promo-badge"
                    >
                        <span>-{Math.round((1 - product.promo_price / product.price) * 100)}%</span>
                    </motion.div>
                )}
                {product.is_promotion && !(!isBoxSelected && product.promo_price && product.price) && (
                    <motion.div
                        key="promo-plain"
                        initial={{ scale: 0, rotate: -10 }}
                        animate={{ scale: 1, rotate: 0 }}
                        className="glass-promo-badge"
                    >
                        <span>PROMOÇÃO</span>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Indicador de estoque baixo (CRO-7) */}
            {product.manage_stock && product.stock_quantity > 0 && product.stock_quantity <= 5 && (
                <div style={{
                    position: 'absolute', top: '8px', right: '8px', zIndex: 3,
                    background: 'rgba(239,68,68,0.9)', color: '#fff',
                    fontSize: '0.65rem', fontWeight: 900, padding: '3px 8px',
                    borderRadius: '20px', letterSpacing: '0.5px', backdropFilter: 'blur(4px)'
                }}>
                    Apenas {product.stock_quantity} restantes!
                </div>
            )}
 
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

            </div>

            {/* Info Section */}
            <div className="card-content">
                <div className="title-row">
                    <h3 className="card-title">{formatTitleCase(product.title)}</h3>
                    <span className="card-category desktop-only">{(product.category_name || 'Geral').toUpperCase()}</span>
                </div>
                <p className="card-description">{product.description}</p>
                
                
                {product.has_bundle_option && product.unit_price > 0 && (
                    <div style={{ fontSize: '0.75rem', color: '#999', marginBottom: '10px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Sparkles size={12} color="#D4AF37" />
                        Unidade no Fardo: <span style={{ color: '#fff' }}>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(parseFloat(product.unit_price))}</span>
                    </div>
                )}
                
                <div className="price-uom-row">
                    <div className={`inline-price ${(product.is_promotion && !isBoxSelected) ? 'promo-active' : ''}`}>
                        {product.is_promotion && product.promo_price && !isBoxSelected ? (
                            <div className="price-stack-horizontal">
                                <span className="old-price">
                                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(parseFloat(product.price))}
                                </span>
                                <span className="main-price">
                                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(parseFloat(product.promo_price))}
                                </span>
                            </div>
                        ) : (
                            <span className="main-price">
                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                                    parseFloat(isBoxSelected && product.has_box_option ? (product.box_price || 0) : product.price)
                                )}
                            </span>
                        )}
                    </div>

                    {product.has_box_option ? (
                        <div className="box-toggle-mini" onClick={e => e.stopPropagation()}>
                            <button 
                                onClick={() => setIsBoxSelected(false)}
                                className={!isBoxSelected ? 'active' : ''}
                            >
                                <span className="desktop-only">{product.uom || 'UN'}</span>
                                <span className="mobile-only">UNID</span>
                            </button>
                            <button 
                                onClick={() => setIsBoxSelected(true)}
                                className={isBoxSelected ? 'active' : ''}
                            >
                                <span className="desktop-only">CAIXA</span>
                                <span className="mobile-only">CX</span>
                            </button>
                        </div>
                    ) : (
                        <div className="card-uom-badge">{product.uom || 'KG'}</div>
                    )}
                </div>
                
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
