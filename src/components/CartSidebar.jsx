import React, { useState } from 'react'; // Added useState
import { useCart } from '../context/CartContext';
import { useOrder } from '../context/OrderContext';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useAlert } from '../context/AlertContext';
import { createOrder } from '../services/dataService';
import { X, Trash2, ShoppingBag, Plus, Minus, CreditCard, Banknote, Landmark, QrCode } from 'lucide-react'; // Added icons
import { getImageUrl } from '../lib/imageUtils';
import './CartSidebar.css';

const CartSidebar = () => {
    const {
        cartItems,
        isCartOpen,
        toggleCart,
        removeFromCart,
        updateQuantity,
        cartTotal,
        cartCount,
        clearCart
    } = useCart();

    const { user, profile, guestMode, openAuthModal, updateProfile, refreshProfile } = useAuth();
    const navigate = useNavigate();

    const [customerName, setCustomerName] = useState('');
    const [customerPhone, setCustomerPhone] = useState('');

    const { showAlert } = useAlert(); // Moved up
    const { addOrder } = useOrder(); // Moved up

    // Helper to format phone
    const formatPhone = (val) => {
        if (!val) return '';
        const numbers = val.replace(/\D/g, '').slice(0, 11);
        if (numbers.length > 7) {
            return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7)}`;
        }
        if (numbers.length > 2) {
            return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
        }
        return numbers;
    };

    // Auto-fill form if user is logged in
    React.useEffect(() => {
        if (isCartOpen && user) {
            // Reload profile to get latest data
            refreshProfile();
        }
    }, [isCartOpen, user]);

    React.useEffect(() => {
        if (user) {
            // Priority: Profile (DB) > Metadata (Auth)
            const nameToUse = profile?.full_name || user.name || user.user_metadata?.full_name || user.user_metadata?.name || '';
            const rawPhone = profile?.whatsapp || profile?.phone || user.phone || user.user_metadata?.phone || '';

            if (nameToUse) setCustomerName(nameToUse);
            if (rawPhone) setCustomerPhone(formatPhone(rawPhone));
        }
    }, [user, profile]);

    const handlePhoneChange = (e) => {
        setCustomerPhone(formatPhone(e.target.value));
    };

    if (!isCartOpen) return null;

    // [NEW] Auto-open checkout form if guest mode is enabled while cart is open
    React.useEffect(() => {
        if (isCartOpen && guestMode && cartItems.length > 0) {
            // Ensure we are ready to checkout
            console.log("Guest mode active, ready for checkout form");
        }
    }, [isCartOpen, guestMode, cartItems]);

    const handleCheckout = async () => {
        if (!user && !guestMode) {
            openAuthModal('login');
            return;
        }

        if (!customerName || !customerPhone) {
            showAlert('Ops! Para finalizar seu pedido, precisaremos do seu nome e WhatsApp. 📝', 'warning', 'Dados Incompletos');
            return;
        }

        const orderData = {
            customer_name: customerName,
            customer_phone: customerPhone,
            paymentMethod: 'A combinar', // Default value since selection is removed
            total: cartTotal,
            user_id: user ? user.id : null,
            items: cartItems // Sending array directly to backend function
        };

        // 0. Update User Profile if phone changed (Sync logic)
        if (user && profile && customerPhone) {
            const currentPhone = (profile.phone || profile.whatsapp || '').replace(/\D/g, '');
            const newPhone = customerPhone.replace(/\D/g, '');

            if (newPhone && newPhone !== currentPhone) {
                console.log("Updating user phone from cart...");
                // Update both to be consistent
                updateProfile({ phone: customerPhone, whatsapp: customerPhone });
            }
        }

        // 1. Create order in DB (or try to)
        let orderResult;
        try {
            orderResult = await createOrder(orderData);
        } catch (err) {
            console.error("Order creation crashed:", err);
            orderResult = { success: false, error: err.message };
        }

        // 2. Determine Order Number for WhatsApp
        let orderNumDisplay = "";
        if (orderResult.success) {
            orderNumDisplay = orderResult.order_number
                ? orderResult.order_number.toString().padStart(5, '0')
                : orderResult.id.slice(-6).toUpperCase();

            // Add to local history if success
            addOrder(orderResult);
        } else {
            console.error("Order creation failed:", orderResult.error);
            // Alert for awareness, but continue to WhatsApp fallback
            showAlert(`Erro ao salvar pedido: ${orderResult.error}`, 'error');

            // Fallback for WhatsApp if DB fails (timestamp/random)
            orderNumDisplay = Date.now().toString().slice(-6);
            console.warn("Using offline fallback ID for WhatsApp");
        }


        // 3. Construct WhatsApp Message
        const itemsList = cartItems.map(item =>
            `• ${item.quantity}x ${item.title} - R$ ${(item.price * item.quantity).toFixed(2)}`
        ).join('\n');

        const message = `*NOVO PEDIDO #${orderNumDisplay} - 3R GRILL*\n\n` +
            `*Itens do Pedido:*\n${itemsList}\n\n` +
            `*Dados do Cliente:*\n` +
            `Nome: ${customerName}\n` +
            `Telefone: ${customerPhone}`;

        const phoneNumber = import.meta.env.VITE_WHATSAPP_NUMBER || '5511999999999';
        const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;

        // 4. Open WhatsApp
        window.open(whatsappUrl, '_blank');

        // 5. Cleanup
        clearCart();
        toggleCart(); // Close cart sidebar
    };

    return (
        <>
            <div className="cart-backdrop" onClick={toggleCart}></div>
            <div className={`cart-sidebar ${isCartOpen ? 'open' : ''}`}>
                <div className="cart-header">
                    <h2><ShoppingBag size={20} /> Seu Carrinho</h2>
                    <button className="close-cart" onClick={toggleCart}>
                        <X size={24} />
                    </button>
                </div>

                <div className="cart-items">
                    {cartItems.length === 0 ? (
                        <div className="empty-cart">
                            <ShoppingBag size={48} opacity={0.3} />
                            <p>Seu carrinho está vazio.</p>
                        </div>
                    ) : (
                        cartItems.map(item => (
                            <div key={item.id} className="cart-item">
                                <img src={getImageUrl(item.image)} alt={item.title} className="cart-item-img" />
                                <div className="cart-item-info">
                                    <h4>{item.title}</h4>
                                    <p className="cart-item-price">R$ {item.price.toFixed(2)}</p>
                                    <div className="cart-item-controls">
                                        <div className="qty-selector small">
                                            <button onClick={() => updateQuantity(item.id, item.quantity - 1)}><Minus size={14} /></button>
                                            <span>{item.quantity}</span>
                                            <button onClick={() => updateQuantity(item.id, item.quantity + 1)}><Plus size={14} /></button>
                                        </div>
                                        <button className="remove-btn" onClick={() => removeFromCart(item.id)}>
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {cartItems.length > 0 && (user || guestMode) && (
                    <div className="checkout-form">
                        <h3><ShoppingBag size={16} style={{ marginBottom: -2 }} /> Cliente</h3>
                        <div className="form-group">
                            <input
                                type="text"
                                placeholder="Seu Nome"
                                value={customerName}
                                onChange={(e) => setCustomerName(e.target.value)}
                                className="checkout-input"
                            />
                        </div>
                        <div className="form-group">
                            <input
                                type="tel"
                                placeholder="Seu WhatsApp"
                                value={customerPhone}
                                onChange={handlePhoneChange}
                                className="checkout-input"
                                maxLength={15}
                            />
                        </div>
                    </div>
                )}

                <div className="cart-footer">
                    <div className="cart-summary">
                        <div className="cart-summary">
                            <span className="summary-total" style={{ width: '100%', textAlign: 'center' }}>Total: {cartCount} {cartCount === 1 ? 'item' : 'itens'}</span>
                        </div>
                    </div>
                    <button
                        className="checkout-btn"
                        disabled={cartItems.length === 0}
                        onClick={handleCheckout}
                    >
                        Finalizar Pedido
                    </button>
                </div>
            </div>
        </>
    );
};

export default CartSidebar;
