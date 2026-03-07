import React, { useState } from 'react'; // Added useState
import { useCart } from '../../context/CartContext';
import { useOrder } from '../../context/OrderContext';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useAlert } from '../../context/AlertContext';
import { createOrder, getSettings } from '../../services/dataService';
import { X, Trash2, ShoppingBag, Plus, Minus, CreditCard, Banknote, Landmark, QrCode, Loader2 } from 'lucide-react'; // Added icons
import { getImageUrl } from '../../lib/imageUtils';
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
    const [whatsappNumber, setWhatsappNumber] = useState('5511944835865'); // Default fallback
    const [whatsappMessage, setWhatsappMessage] = useState('*NOVO PEDIDO {pedido} - 3R GRILL*'); // Default fallback message
    const [isProcessing, setIsProcessing] = useState(false); // Added processing state

    const [deliveryMode, setDeliveryMode] = useState(''); // 'pickup' | 'delivery'
    const [address, setAddress] = useState({
        cep: '', street: '', neighborhood: '', city: '', state: '', number: '', complement: ''
    });
    const [isFetchingCep, setIsFetchingCep] = useState(false);

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

    const handleCepChange = async (e) => {
        const rawCep = e.target.value.replace(/\D/g, '');
        // Apply mask for user display XXXXX-XXX
        let maskedCep = rawCep;
        if (rawCep.length > 5) {
            maskedCep = `${rawCep.slice(0, 5)}-${rawCep.slice(5, 8)}`;
        }
        setAddress(prev => ({ ...prev, cep: maskedCep }));

        if (rawCep.length === 8) {
            setIsFetchingCep(true);
            try {
                const res = await fetch(`https://viacep.com.br/ws/${rawCep}/json/`);
                const data = await res.json();
                if (!data.erro) {
                    setAddress(prev => ({
                        ...prev,
                        street: data.logradouro || '',
                        neighborhood: data.bairro || '',
                        city: data.localidade || '',
                        state: data.uf || '',
                        number: '',
                        complement: ''
                    }));
                } else {
                    showAlert('CEP não encontrado.', 'warning');
                }
            } catch (err) {
                showAlert('Erro ao buscar o CEP.', 'error');
            } finally {
                setIsFetchingCep(false);
            }
        }
    };


    // Auto-fill form if user is logged in
    React.useEffect(() => {
        if (isCartOpen) {
            if (user) refreshProfile();
            // Fetch system settings for WhatsApp number
            getSettings().then(data => {
                if (data.whatsapp_number) setWhatsappNumber(data.whatsapp_number);
                if (data.whatsapp_message) setWhatsappMessage(data.whatsapp_message);
            });
        }
    }, [isCartOpen, user]);

    React.useEffect(() => {
        if (user) {
            // Priority: Profile (DB) > Metadata (Auth)
            const nameToUse = profile?.full_name || user.name || user.user_metadata?.full_name || user.user_metadata?.name || '';
            const rawPhone = profile?.whatsapp || user.phone || user.user_metadata?.phone || '';

            if (nameToUse) setCustomerName(nameToUse);
            if (rawPhone) setCustomerPhone(formatPhone(rawPhone));

            // Auto fill address from profile if it exists
            if (profile?.address_cep) {
                setAddress({
                    cep: profile.address_cep || '',
                    street: profile.address_street || '',
                    neighborhood: profile.address_neighborhood || '',
                    city: profile.address_city || '',
                    state: profile.address_state || '',
                    number: profile.address_number || '',
                    complement: profile.address_complement || ''
                });
            }
        }
    }, [user, profile]);

    const handlePhoneChange = (e) => {
        setCustomerPhone(formatPhone(e.target.value));
    };

    // [NEW] Auto-open checkout form if guest mode is enabled while cart is open
    React.useEffect(() => {
        if (isCartOpen && guestMode && cartItems.length > 0) {
            // Ready for checkout
        }
    }, [isCartOpen, guestMode, cartItems]);

    if (!isCartOpen) return null;

    const handleCheckout = async () => {
        // If not logged in AND fields are empty, prompt login/guest choice
        // If fields are filled, we assume implicit guest checkout
        if (!user && !guestMode && (!customerName || !customerPhone)) {
            openAuthModal('login');
            return;
        }

        if (!customerName || !customerPhone) {
            showAlert('Ops! Para finalizar seu pedido, precisaremos do seu nome e WhatsApp. 📝', 'warning', 'Dados Incompletos');
            return;
        }

        if (!deliveryMode) {
            showAlert('Por favor, selecione "Retirar na Loja" ou "Entrega".', 'warning', 'Opção Inválida');
            return;
        }

        if (deliveryMode === 'delivery') {
            if (!address.cep || !address.street || !address.number || !address.neighborhood || !address.city) {
                showAlert('Por favor, preencha todos os campos obrigatórios do endereço de entrega.', 'warning', 'Dados Incompletos');
                return;
            }
        }

        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        let popupWindow = null;
        if (!isMobile) {
            // Abre sincronicamente para evitar o bloqueador de popups do navegador
            popupWindow = window.open('about:blank', '_blank', 'noopener,noreferrer');
            if (popupWindow) {
                popupWindow.document.write('<body style="background: #121212; color: white; display: flex; justify-content: center; align-items: center; height: 100vh; font-family: sans-serif; text-align: center;"><h2>Aguarde, processando seu pedido<br/>e redirecionando para o WhatsApp...</h2></body>');
            }
        }

        setIsProcessing(true);

        const orderData = {
            customer_name: customerName,
            customer_phone: customerPhone,
            paymentMethod: 'A combinar', // Default value since selection is removed
            total: cartTotal,
            user_id: user ? user.id : null,
            items: cartItems, // Sending array directly to backend function
            delivery_mode: deliveryMode,
            delivery_address: deliveryMode === 'delivery' ? address : null
        };

        // 0. Update User Profile if phone changed (Sync logic)
        if (user) {
            const updates = {};
            const currentPhone = (profile?.whatsapp || '').replace(/\D/g, '');
            const newPhone = customerPhone.replace(/\D/g, '');

            if (newPhone && newPhone !== currentPhone) {
                updates.whatsapp = customerPhone;
            }

            if (deliveryMode === 'delivery' && address.cep) {
                if (address.cep !== profile?.address_cep || address.number !== profile?.address_number) {
                    updates.address_cep = address.cep;
                    updates.address_street = address.street;
                    updates.address_neighborhood = address.neighborhood;
                    updates.address_city = address.city;
                    updates.address_state = address.state;
                    updates.address_number = address.number;
                    updates.address_complement = address.complement;
                }
            }

            if (Object.keys(updates).length > 0) {
                try {
                    await updateProfile(updates);
                } catch (e) {
                    console.error("Warning: Could not sync profile data", e);
                }
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
            // Priority: order_number (numeric) > $id (uuid)
            const isNumeric = /^\d+$/.test(orderResult.order_number?.toString());

            if (orderResult.order_number && isNumeric) {
                orderNumDisplay = orderResult.order_number.toString().padStart(5, '0');
            } else if (orderResult.$id && orderResult.$id !== 'processing') {
                // If it's the Appwrite ID, take the last 6 chars uppercase
                orderNumDisplay = orderResult.$id.slice(-6).toUpperCase();
            } else {
                orderNumDisplay = "NOVO";
            }

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

        if (!orderResult.success) {
            if (popupWindow) popupWindow.close();
            setIsProcessing(false);
            return;
        }


        // 3. Construct WhatsApp Message
        const itemsList = cartItems.map(item =>
            `• ${item.quantity}x ${item.title} - R$ ${(item.price * item.quantity).toFixed(2)}`
        ).join('\n');

        let addressText = '';
        if (deliveryMode === 'pickup') {
            addressText = '🛵 Opção: Retirar na Loja';
        } else {
            addressText = `🛵 Opção: Entrega\n` +
                `*Endereço:*\n` +
                `${address.street}, ${address.number} ${address.complement ? `- ${address.complement}` : ''}\n` +
                `Bairro: ${address.neighborhood}\n` +
                `CEP: ${address.cep} - ${address.city}/${address.state}`;
        }

        let headerText = whatsappMessage || '*NOVO PEDIDO - 3R GRILL*';
        if (headerText.includes('{pedido}')) {
            headerText = headerText.replace('{pedido}', `#${orderNumDisplay}`);
        } else {
            headerText = `${headerText} #${orderNumDisplay}`;
        }

        const message = `${headerText}\n\n` +
            `*Itens do Pedido:*\n${itemsList}\n\n` +
            `*Dados do Cliente:*\n` +
            `Nome: ${customerName}\n` +
            `WhatsApp: ${customerPhone}\n\n` +
            `*Entrega/Retirada:*\n${addressText}`;

        const phoneNumber = String(whatsappNumber).replace(/\D/g, '');
        const whatsappUrl = `https://api.whatsapp.com/send?phone=${phoneNumber}&text=${encodeURIComponent(message)}`;

        // 4. Cleanup (Before Redirect)
        clearCart();
        toggleCart(); // Close cart sidebar
        setIsProcessing(false);

        // 5. Open WhatsApp (New tab for Web, same tab for Mobile)
        if (isMobile) {
            window.location.href = whatsappUrl;
        } else if (popupWindow) {
            popupWindow.location.href = whatsappUrl;
        } else {
            // Fallback se o navegador bloqueou o popup sincrono
            window.location.href = whatsappUrl;
        }
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

                <div className="cart-scrollable-area" style={{ flexGrow: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
                    <div className="cart-items" style={{ flexGrow: 1, overflowY: 'visible', paddingBottom: cartItems.length > 0 ? '0' : '1rem' }}>
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

                    {cartItems.length > 0 && (
                        <div className="checkout-form" style={{ marginTop: 'auto' }}>
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

                            <div className="delivery-options" style={{ marginTop: '15px' }}>
                                <h4 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>Opção de Entrega</h4>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                    <button
                                        type="button"
                                        onClick={() => setDeliveryMode('pickup')}
                                        style={{
                                            border: 'none',
                                            background: deliveryMode === 'pickup' ? 'var(--primary-color)' : '#333',
                                            color: deliveryMode === 'pickup' ? '#000' : '#fff',
                                            padding: '12px',
                                            borderRadius: '8px',
                                            fontWeight: 'bold',
                                            fontSize: '1rem',
                                            cursor: 'pointer',
                                            transition: 'background-color 0.2s',
                                            width: '100%'
                                        }}
                                    >
                                        Retirar na Loja
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setDeliveryMode('delivery')}
                                        style={{
                                            border: 'none',
                                            background: deliveryMode === 'delivery' ? 'var(--primary-color)' : '#333',
                                            color: deliveryMode === 'delivery' ? '#000' : '#fff',
                                            padding: '12px',
                                            borderRadius: '8px',
                                            fontWeight: 'bold',
                                            fontSize: '1rem',
                                            cursor: 'pointer',
                                            transition: 'background-color 0.2s',
                                            width: '100%'
                                        }}
                                    >
                                        Entrega
                                    </button>
                                </div>
                            </div>

                            {deliveryMode === 'delivery' && (
                                <div className="address-form" style={{ marginTop: '15px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                    <div className="form-group" style={{ position: 'relative' }}>
                                        <input
                                            type="text"
                                            placeholder="CEP (Somente números)"
                                            value={address.cep}
                                            onChange={handleCepChange}
                                            className="checkout-input"
                                            maxLength={9}
                                        />
                                        {isFetchingCep && <Loader2 size={16} className="animate-spin" style={{ position: 'absolute', right: '10px', top: '12px', color: 'var(--primary-color)' }} />}
                                    </div>
                                    <div className="form-group">
                                        <input
                                            type="text"
                                            placeholder="Rua / Logradouro"
                                            value={address.street}
                                            onChange={(e) => setAddress({ ...address, street: e.target.value })}
                                            className="checkout-input"
                                        />
                                    </div>
                                    <div className="form-row" style={{ display: 'flex', gap: '10px' }}>
                                        <div className="form-group" style={{ flex: 1 }}>
                                            <input
                                                type="text"
                                                placeholder="Número"
                                                value={address.number}
                                                onChange={(e) => setAddress({ ...address, number: e.target.value })}
                                                className="checkout-input"
                                            />
                                        </div>
                                        <div className="form-group" style={{ flex: 2 }}>
                                            <input
                                                type="text"
                                                placeholder="Bairro"
                                                value={address.neighborhood}
                                                onChange={(e) => setAddress({ ...address, neighborhood: e.target.value })}
                                                className="checkout-input"
                                            />
                                        </div>
                                    </div>
                                    <div className="form-group">
                                        <input
                                            type="text"
                                            placeholder="Complemento / Ref."
                                            value={address.complement}
                                            onChange={(e) => setAddress({ ...address, complement: e.target.value })}
                                            className="checkout-input"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className="cart-footer">
                    <div className="cart-summary">
                        <div className="cart-summary">
                            <span className="summary-total" style={{ width: '100%', textAlign: 'center' }}>Total: {cartCount} {cartCount === 1 ? 'item' : 'itens'}</span>
                        </div>
                    </div>
                    <button
                        className="checkout-btn"
                        disabled={cartItems.length === 0 || isProcessing}
                        onClick={handleCheckout}
                    >
                        {isProcessing ? (
                            <>
                                <Loader2 size={20} className="spinner" style={{ marginRight: '8px' }} />
                                Processando...
                            </>
                        ) : (
                            'Finalizar Pedido'
                        )}
                    </button>
                </div>
            </div>
        </>
    );
};

export default CartSidebar;


