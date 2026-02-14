import React from 'react';
import { motion } from 'framer-motion';
import { useCart } from '../context/CartContext';
import { Plus, Minus, ShoppingCart } from 'lucide-react';
import { getImageUrl } from '../lib/imageUtils';
import './ProductCard.css';

const ProductCard = ({ product }) => {
    const { cartItems, addToCart, updateQuantity, removeFromCart } = useCart();

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
        <motion.div
            id={`product-${product.id}`} // [NEW] Anchor for banner navigation
            className="product-card"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
        >
            <div className="image-container">
                <img
                    // Optimization: Append width parameter if it's a Supabase URL to resize on fly
                    src={getImageUrl(product.image)}
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
                <div className="price-tag">
                    R$ {product.price.toFixed(2)}
                </div>
            </div>
            <div className="product-info">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span className="product-category">{product.category}</span>
                    <span className="product-id" style={{ fontSize: '0.7rem', color: '#666', opacity: 0.7 }}>#{product.product_sku || product.id}</span>
                </div>
                <h3 className="product-title">{product.title}</h3>
                <p className="product-desc">{product.description}</p>

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

export default ProductCard;
