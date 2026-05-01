import React from 'react';
import { useCart } from '../context/CartContext';
import Header from '../components/shop/Header';
import { ShoppingBag, Trash2, Plus, Minus, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './CartPage.css';

const CartPage = () => {
    const { cartItems, removeFromCart, updateQuantity, clearCart, cartTotal, triggerUpsell, toggleCart } = useCart();
    const [upsellShown, setUpsellShown] = React.useState(false);
    const navigate = useNavigate();

    const handleCheckout = () => {
        if (!upsellShown && cartItems.length > 0) {
            const showed = triggerUpsell(cartItems);
            if (showed) {
                setUpsellShown(true);
                return;
            }
        }
        toggleCart();
    };

    return (
        <div className="cart-page-container">
            <Header activeCategory="none" onCategoryChange={() => { }} />
            
            <main className="cart-content">
                <div className="cart-header-row">
                    <h2><ShoppingBag size={24} color="#D4AF37" /> Meu Carrinho</h2>
                    {cartItems.length > 0 && (
                        <button onClick={clearCart} className="btn-clear-cart">
                            <Trash2 size={16} /> ESVAZIAR
                        </button>
                    )}
                </div>

                {cartItems.length === 0 ? (
                    <div className="empty-cart-state">
                        <ShoppingBag size={64} style={{ opacity: 0.1, marginBottom: '20px' }} />
                        <h3 style={{ color: '#fff', marginBottom: '10px' }}>Seu carrinho está vazio</h3>
                        <p style={{ color: '#888', marginBottom: '30px' }}>Adicione alguns produtos deliciosos para começar.</p>
                        <button onClick={() => navigate('/')} className="btn-profile-primary" style={{ width: 'auto', padding: '12px 40px' }}>
                            IR PARA A LOJA
                        </button>
                    </div>
                ) : (
                    <div className="cart-items-list">
                        {cartItems.map((item) => (
                            <div key={item.id} className="cart-item-card">
                                <img src={item.image} alt={item.title} className="cart-item-img" />
                                <div className="cart-item-details">
                                    <div className="cart-item-top">
                                        <h4>{item.title}</h4>
                                        <button onClick={() => removeFromCart(item.id)} className="btn-remove-item">
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                    <div className="cart-item-bottom">
                                        <div className="qty-control-cart">
                                            <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="btn-qty-cart"><Minus size={16} /></button>
                                            <span className="qty-value-cart">{item.quantity}</span>
                                            <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="btn-qty-cart"><Plus size={16} /></button>
                                        </div>
                                        <span className="cart-item-price">
                                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.price * item.quantity)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}

                        {/* Resumo removido conforme solicitação para evitar checkout direto da página */}
                    </div>
                )}
            </main>
        </div>
    );
};

export default CartPage;
