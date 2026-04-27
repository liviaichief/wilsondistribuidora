import React, { useState } from 'react'; // Added useState
import { useCart } from '../../context/CartContext';
import { useOrder } from '../../context/OrderContext';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useAlert } from '../../context/AlertContext';
import { createOrder, getSettings, sendWhatsAppMessage } from '../../services/dataService';
import { X, Trash2, ShoppingBag, Plus, Minus, CreditCard, Box, ChevronRight, User, Loader2 } from 'lucide-react'; // Added icons
import { getImageUrl } from '../../lib/imageUtils';
import { formatTitleCase } from '../../lib/utils';
import { fetchGoogleReviews } from '../../services/googleService';
import './CartSidebar.css';

// Load Google Maps Script
const loadGoogleMapsScript = (apiKey) => {
    if (window.google) return;
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);
};

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

    const { user, profile, guestMode, openAuthModal, updateProfile, refreshProfile, sharedCustomerData, setSharedCustomerData } = useAuth();
    const navigate = useNavigate();

    const [customerName, setCustomerName] = useState('');
    const [customerPhone, setCustomerPhone] = useState('');
    const [whatsappNumber, setWhatsappNumber] = useState(''); // Default fallback
    const [whatsappMessage, setWhatsappMessage] = useState('*NOVO PEDIDO {pedido} - BASE APP*'); // Default fallback message
    const [isProcessing, setIsProcessing] = useState(false); // Added processing state

    const [deliveryMode, setDeliveryMode] = useState(''); // 'pickup' | 'delivery'
    const [address, setAddress] = useState({
        cep: '', street: '', neighborhood: '', city: '', state: '', number: '', complement: '',
        lat: null, lng: null
    });
    const [isFetchingCep, setIsFetchingCep] = useState(false);
    const [googleConfig, setGoogleConfig] = useState(null);
    const [deliveryDistance, setDeliveryDistance] = useState(null); // in KM
    const [deliveryFee, setDeliveryFee] = useState(0);
    const [isCalculatingDistance, setIsCalculatingDistance] = useState(false);

    const { showAlert } = useAlert(); // Moved up
    const { addOrder } = useOrder(); // Moved up
    const [useCashback, setUseCashback] = useState(false);
    const [cashbackAvailable, setCashbackAvailable] = useState(0);

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
            // Fetch system settings for WhatsApp and Google
            getSettings().then(data => {
                setGoogleConfig(data);
                if (data.whatsapp_number) setWhatsappNumber(data.whatsapp_number);
                if (data.whatsapp_message) setWhatsappMessage(data.whatsapp_message);
                if (data.google_api_key) loadGoogleMapsScript(data.google_api_key);
            });
        }
    }, [isCartOpen, user]);

    // Initialize Autocomplete
    const autocompleteRef = React.useRef(null);
    const initAutocomplete = () => {
        if (!window.google || !autocompleteRef.current) return;
        const autocomplete = new window.google.maps.places.Autocomplete(autocompleteRef.current, {
            componentRestrictions: { country: 'BR' },
            fields: ['address_components', 'geometry', 'formatted_address']
        });

        autocomplete.addListener('place_changed', () => {
            const place = autocomplete.getPlace();
            if (!place.geometry) return;

            const components = place.address_components;
            const find = (type) => components.find(c => c.types.includes(type))?.long_name || '';

            const newAddress = {
                ...address,
                street: find('route'),
                neighborhood: find('sublocality_level_1') || find('neighborhood'),
                city: find('administrative_area_level_2') || find('locality'),
                state: find('administrative_area_level_1'),
                cep: find('postal_code'),
                lat: place.geometry.location.lat(),
                lng: place.geometry.location.lng()
            };
            setAddress(newAddress);
            calculateShipping(place.geometry.location.lat(), place.geometry.location.lng());
        });
    };

    React.useEffect(() => {
        if (deliveryMode === 'delivery' && googleConfig?.google_api_key) {
            setTimeout(initAutocomplete, 500);
        }
    }, [deliveryMode, googleConfig]);

    const calculateShipping = async (destLat, destLng) => {
        if (!googleConfig?.google_api_key || !googleConfig?.store_latitude) return;
        
        setIsCalculatingDistance(true);
        try {
            const origin = new window.google.maps.LatLng(googleConfig.store_latitude, googleConfig.store_longitude);
            const destination = new window.google.maps.LatLng(destLat, destLng);
            const service = new window.google.maps.DistanceMatrixService();

            service.getDistanceMatrix({
                origins: [origin],
                destinations: [destination],
                travelMode: 'DRIVING',
            }, (response, status) => {
                if (status === 'OK' && response.rows[0]?.elements[0]?.status === 'OK') {
                    const distance = response.rows[0].elements[0].distance.value / 1000; // to KM
                    setDeliveryDistance(distance);
                    
                    // FREIGHT LOGIC
                    let fee = 0;
                    const freeRadius = parseFloat(googleConfig.shipping_free_radius || 5);
                    const fixedRadius = parseFloat(googleConfig.shipping_fixed_radius_max || 15);
                    const fixedRate = parseFloat(googleConfig.shipping_fixed_rate || 15);
                    const perKmRate = parseFloat(googleConfig.shipping_per_km_rate || 2.5);

                    if (distance <= freeRadius) {
                        fee = 0;
                    } else if (distance <= fixedRadius) {
                        fee = fixedRate;
                    } else {
                        const extraKm = distance - fixedRadius;
                        fee = fixedRate + (extraKm * perKmRate);
                    }
                    setDeliveryFee(fee);
                } else {
                    console.warn("Distance Matrix status not OK, using fixed fee fallback.");
                    setDeliveryFee(parseFloat(googleConfig.shipping_fixed_rate || 15));
                }
                setIsCalculatingDistance(false);
            });
        } catch (e) {
            console.error("Distance Matrix error:", e);
            setIsCalculatingDistance(false);
        }
    };

    React.useEffect(() => {
        if (user) {
            // Priority: Profile (DB) > Metadata (Auth)
            const nameToUse = profile?.full_name || user.name || user.user_metadata?.full_name || user.user_metadata?.name || '';
            const rawPhone = profile?.whatsapp || user.phone || user.user_metadata?.phone || '';

            if (nameToUse) setCustomerName(nameToUse);
            if (rawPhone) setCustomerPhone(formatPhone(rawPhone));

            // Set cashback balance from profile
            if (profile?.cashback_balance) {
                setCashbackAvailable(parseFloat(profile.cashback_balance));
            }

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
        } else {
            // Se não estiver logado, usa os dados compartilhados (digitados anteriormente ou em outro lugar)
            if (sharedCustomerData.full_name && !customerName) setCustomerName(sharedCustomerData.full_name);
            if (sharedCustomerData.whatsapp && !customerPhone) setCustomerPhone(formatPhone(sharedCustomerData.whatsapp));
        }
    }, [user, profile, sharedCustomerData]);

    const handlePhoneChange = (e) => {
        const val = e.target.value;
        const formatted = formatPhone(val);
        setCustomerPhone(formatted);
        setSharedCustomerData(prev => ({ ...prev, whatsapp: formatted.replace(/\D/g, '') }));
    };

    const handleNameChange = (e) => {
        const val = e.target.value;
        setCustomerName(val);
        setSharedCustomerData(prev => ({ ...prev, full_name: val }));
    };

    // Auto-sync function to save data in background
    const handleAutoSync = async (field, value) => {
        if (!user) return;
        
        const updates = {};
        if (field === 'name') {
            updates.full_name = value;
        } else if (field === 'phone') {
            updates.whatsapp = value;
        } else if (field.startsWith('addr_')) {
            const addrField = field.replace('addr_', 'address_');
            updates[addrField] = value;
        }

        if (Object.keys(updates).length > 0) {
            try {
                await updateProfile(updates);
            } catch (e) {
                console.warn("Background sync failed:", e);
            }
        }
    };

    // [NEW] Clear form data when user logs out
    React.useEffect(() => {
        if (!user) {
            setCustomerName('');
            setCustomerPhone('');
            setAddress({
                cep: '', street: '', neighborhood: '', city: '', state: '', number: '', complement: ''
            });
        }
    }, [user]);

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
            total: cartTotal + deliveryFee,
            subtotal: cartTotal,
            delivery_fee: deliveryFee,
            distance_km: deliveryDistance,
            user_id: user ? user.id : null,
            items: cartItems, // Sending array directly to backend function
            delivery_mode: deliveryMode,
            delivery_address: deliveryMode === 'delivery' ? address : null,
            cashback_applied: useCashback ? cashbackAvailable : 0,
            cashback_to_earn: (cartTotal * (parseFloat(googleConfig?.cashback_percentage) || 2)) / 100,
            status: 'Pendente' // Novo: Status inicial do rastreio
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
            `• ${item.quantity}x ${formatTitleCase(item.title)} - R$ ${(item.price * item.quantity).toFixed(2)}`
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

        let headerText = whatsappMessage || '*NOVO PEDIDO - BASE APP*';
        if (headerText.includes('{pedido}')) {
            headerText = headerText.replace('{pedido}', `#${orderNumDisplay}`);
        } else {
            headerText = `${headerText} #${orderNumDisplay}`;
        }

        const message = `${headerText}\n\n` +
            `*Itens do Pedido:*\n${itemsList}\n\n` +
            `Nome: ${customerName}\n` +
            `WhatsApp: ${customerPhone}\n\n` +
            `*Entrega/Retirada:*\n${addressText}\n` +
            (deliveryMode === 'delivery' ? `Distância: ${deliveryDistance?.toFixed(1)} km\nFrete: R$ ${deliveryFee.toFixed(2)}\n` : '') +
            `*TOTAL: R$ ${(cartTotal + deliveryFee).toFixed(2)}*`;

        const phoneNumber = String(whatsappNumber).replace(/\D/g, '');
        const whatsappUrl = `https://api.whatsapp.com/send?phone=${phoneNumber}&text=${encodeURIComponent(message)}`;

        // 4. Cleanup (Before Redirect)
        clearCart();
        toggleCart(); // Close cart sidebar
        setIsProcessing(false);

        // 5. Try Direct Send via API (if enabled)
        let didSendDirectly = false;
        try {
            didSendDirectly = await sendWhatsAppMessage(phoneNumber, message);
            if (didSendDirectly) {
                console.log("Order message sent directly via API!");
                // Optionally send a confirmation to the customer too
                const customerMsg = `Olá *${customerName}*! Recebemos seu pedido *#${orderNumDisplay}* com sucesso. Em breve entraremos em contato para finalizar os detalhes. Agradecemos a preferência! 🥩🔥`;
                await sendWhatsAppMessage(customerPhone, customerMsg);
            }
        } catch (apiErr) {
            console.warn("Direct Send failed, will use manual redirect:", apiErr);
        }

        // 6. Open WhatsApp redirect (Always redirect the customer for confirmation)
        if (isMobile) {
            window.location.href = whatsappUrl;
        } else {
            if (popupWindow) {
                popupWindow.location.href = whatsappUrl;
            } else {
                // Fallback if popup was blocked
                window.location.href = whatsappUrl;
            }
            
            if (didSendDirectly) {
                showAlert(`Pedido #${orderNumDisplay} enviado com sucesso! ✅`, 'success');
            }
        }
    };

    return (
        <>
            <div className={`cart-backdrop ${isCartOpen ? 'visible' : ''}`} onClick={toggleCart}></div>
            <div className={`cart-sidebar ${isCartOpen ? 'open' : ''}`}>
                <div className="cart-header">
                    <h2><ShoppingBag size={24} /> Meu Carrinho</h2>
                    <button className="close-cart" onClick={toggleCart}>
                        <X size={20} />
                    </button>
                </div>

                <div className="cart-scrollable-area">
                    {/* Itens do Carrinho */}
                    <div className="cart-section">
                        <span className="section-title"><Box size={14} /> Produtos Selecionados</span>
                        {cartItems.length === 0 ? (
                            <div className="empty-cart-state">
                                <ShoppingBag size={48} />
                                <p>Seu carrinho está vazio.</p>
                            </div>
                        ) : (
                            <div className="cart-items-list">
                                {cartItems.map(item => (
                                    <div key={item.id} className="cart-item">
                                        <img src={getImageUrl(item.image)} alt={formatTitleCase(item.title)} className="cart-item-img" />
                                        <div className="cart-item-info">
                                            <h4>{formatTitleCase(item.title)}</h4>
                                            <p className="cart-item-price">
                                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.price)}
                                            </p>
                                            <div className="cart-item-controls">
                                                <div className="qty-selector-mini">
                                                    <button onClick={() => updateQuantity(item.id, item.quantity - 1)}><Minus size={14} /></button>
                                                    <span>{item.quantity}</span>
                                                    <button onClick={() => updateQuantity(item.id, item.quantity + 1)}><Plus size={14} /></button>
                                                </div>
                                                <button className="remove-btn-mini" onClick={() => removeFromCart(item.id)}>
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {cartItems.length > 0 && (
                        <>
                            {/* Identificação */}
                            <div className="cart-section">
                                <span className="section-title"><User size={14} /> Seus Dados</span>
                                <div className="checkout-input-group">
                                    <input
                                        type="text"
                                        placeholder="Nome completo"
                                        value={customerName}
                                        onChange={handleNameChange}
                                        onBlur={(e) => handleAutoSync('name', e.target.value)}
                                        className="checkout-input"
                                    />
                                    <input
                                        type="tel"
                                        placeholder="WhatsApp (DDD + Número)"
                                        value={customerPhone}
                                        onChange={handlePhoneChange}
                                        onBlur={(e) => handleAutoSync('phone', e.target.value)}
                                        className="checkout-input"
                                        maxLength={15}
                                    />
                                </div>
                            </div>

                            {/* Entrega */}
                            <div className="cart-section">
                                <span className="section-title"><CreditCard size={14} /> Como deseja receber?</span>
                                <div className="delivery-toggle">
                                    <button
                                        className={`toggle-btn ${deliveryMode === 'pickup' ? 'active' : ''}`}
                                        onClick={() => setDeliveryMode('pickup')}
                                    >
                                        Retirar
                                    </button>
                                    <button
                                        className={`toggle-btn ${deliveryMode === 'delivery' ? 'active' : ''}`}
                                        onClick={() => setDeliveryMode('delivery')}
                                    >
                                        Entrega
                                    </button>
                                </div>

                                {deliveryMode === 'delivery' && (
                                    <div className="checkout-input-group" style={{ marginTop: '15px' }}>
                                        <input
                                            type="text"
                                            ref={autocompleteRef}
                                            placeholder="Comece a digitar seu endereço..."
                                            className="checkout-input"
                                            style={{ border: '1px solid #4285F4' }}
                                        />
                                        
                                        {address.lat && (
                                            <div style={{ marginTop: '10px', borderRadius: '12px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }}>
                                                <img 
                                                    src={`https://maps.googleapis.com/maps/api/staticmap?center=${address.lat},${address.lng}&zoom=15&size=400x150&markers=color:red%7C${address.lat},${address.lng}&key=${googleConfig?.google_api_key}`} 
                                                    alt="Entrega" 
                                                    style={{ width: '100%', height: 'auto', display: 'block' }} 
                                                />
                                            </div>
                                        )}

                                        <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                                            <input
                                                type="text"
                                                placeholder="Nº"
                                                value={address.number}
                                                onChange={(e) => setAddress({ ...address, number: e.target.value })}
                                                onBlur={(e) => handleAutoSync('addr_number', e.target.value)}
                                                className="checkout-input"
                                                style={{ flex: 1 }}
                                            />
                                            <input
                                                type="text"
                                                placeholder="Bairro"
                                                readOnly
                                                value={address.neighborhood}
                                                className="checkout-input"
                                                style={{ flex: 2, opacity: 0.7 }}
                                            />
                                        </div>
                                        <input
                                            type="text"
                                            placeholder="Complemento (Opcional)"
                                            value={address.complement}
                                            onChange={(e) => setAddress({ ...address, complement: e.target.value })}
                                            onBlur={(e) => handleAutoSync('addr_complement', e.target.value)}
                                            className="checkout-input"
                                        />
                                        
                                        {deliveryDistance && (
                                            <div style={{ background: 'rgba(66, 133, 244, 0.1)', padding: '12px', borderRadius: '12px', marginTop: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <span style={{ fontSize: '0.8rem', color: '#4285F4', fontWeight: 'bold' }}>Distância estimada: {deliveryDistance.toFixed(1)} km</span>
                                                <span style={{ fontSize: '0.9rem', color: '#fff', fontWeight: 900 }}>{deliveryFee === 0 ? 'FRETE GRÁTIS' : `Frete: R$ ${deliveryFee.toFixed(2)}`}</span>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Cashback / Fidelidade */}
                            {googleConfig?.cashback_enabled && user && (
                                <div className="cart-section cashback-section" style={{ background: 'rgba(212, 175, 55, 0.05)', borderRadius: '20px', padding: '15px', border: '1px solid rgba(212, 175, 55, 0.1)' }}>
                                    <span className="section-title" style={{ color: '#D4AF37' }}>💰 Fidelidade Wilson</span>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
                                        <div>
                                            <p style={{ margin: 0, fontSize: '0.8rem', opacity: 0.7 }}>Seu saldo disponível</p>
                                            <p style={{ margin: 0, fontSize: '1.2rem', fontWeight: 900, color: '#D4AF37' }}>
                                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(parseFloat(cashbackAvailable || 0))}
                                            </p>
                                        </div>
                                        {parseFloat(cashbackAvailable) > 0 && (
                                            <button 
                                                className={`toggle-btn ${useCashback ? 'active' : ''}`}
                                                onClick={() => setUseCashback(!useCashback)}
                                                style={{ fontSize: '0.7rem', padding: '8px 12px' }}
                                            >
                                                {useCashback ? 'REMOVER' : 'USAR SALDO'}
                                            </button>
                                        )}
                                    </div>
                                    <p style={{ margin: '10px 0 0', fontSize: '0.75rem', color: '#888' }}>
                                        Você ganhará <strong>R$ {((cartTotal * (parseFloat(googleConfig.cashback_percentage || 0) || 2)) / 100).toFixed(2)}</strong> em cashback nesta compra!
                                    </p>
                                </div>
                            )}
                        </>
                    )}
                </div>

                <div className="cart-footer">
                    {useCashback && cashbackAvailable > 0 && (
                        <div className="cart-summary-line" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px', color: '#4ade80' }}>
                            <span>Desconto (Cashback)</span>
                            <span>- {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cashbackAvailable)}</span>
                        </div>
                    )}
                    {deliveryFee > 0 && (
                        <div className="cart-summary-line" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px', opacity: 0.7 }}>
                            <span>Subtotal</span>
                            <span>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cartTotal)}</span>
                        </div>
                    )}
                    {deliveryFee > 0 && (
                        <div className="cart-summary-line" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', color: '#D4AF37' }}>
                            <span>Taxa de Entrega</span>
                            <span>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(deliveryFee)}</span>
                        </div>
                    )}
                    <div className="cart-summary-total">
                        <span className="total-label">Valor Total</span>
                        <span className="total-value">
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Math.max(0, cartTotal + deliveryFee - (useCashback ? cashbackAvailable : 0)))}
                        </span>
                    </div>
                    <button
                        className="finish-checkout-btn"
                        disabled={cartItems.length === 0 || isProcessing}
                        onClick={handleCheckout}
                    >
                        {isProcessing ? (
                            <Loader2 size={24} className="animate-spin" />
                        ) : (
                            <>
                                <span>ENVIAR PEDIDO</span>
                                <ChevronRight size={20} />
                            </>
                        )}
                    </button>
                </div>
            </div>
        </>
    );
};

export default CartSidebar;


