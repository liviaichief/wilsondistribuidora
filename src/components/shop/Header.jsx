import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { ShoppingBag, ShoppingCart, User, LogOut, ClipboardList, Shield, Beer, Store, Box, Instagram, Sparkles, X, ChevronRight, Bell } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getSettings, getBrands } from '../../services/dataService';
import { getImageUrl } from '../../lib/imageUtils';
import { APP_VERSION, BUILD_DATE } from '../../version';
import { useNotificacoes } from '../../hooks/useNotificacoes';
import NotificacoesPanel from './NotificacoesPanel';
import './Header.css';

const Header = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { toggleCart, cartCount, cartItems, triggerUpsell } = useCart();
    const { user, openAuthModal, openProfileModal, isAdmin, isOwner } = useAuth();
    const [isUserMenuOpen,   setIsUserMenuOpen]   = React.useState(false);
    const [isNotifOpen,      setIsNotifOpen]       = React.useState(false);
    const { notificacoes, loading: notifLoading, unreadCount, marcarLidas } = useNotificacoes();
    const [upsellAlreadyShown, setUpsellAlreadyShown] = React.useState(false);
    const [showVersion, setShowVersion] = React.useState(false);
    const [instagramLink, setInstagramLink] = React.useState('');
    const [whatsappNumber, setWhatsappNumber] = React.useState('');
    const [brands, setBrands] = React.useState([]);
    const [isMobileView, setIsMobileView] = React.useState(window.innerWidth < 768);
    const [isPwa, setIsPwa] = React.useState(
        window.matchMedia('(display-mode: standalone)').matches ||
        window.navigator.standalone === true ||
        document.referrer.includes('android-app://')
    );
    const [currentBrandIndex, setCurrentBrandIndex] = React.useState(0);
    const userMenuRef = React.useRef(null);
    const closeTimerRef = React.useRef(null);

    const handleMouseEnter = () => {
        if (closeTimerRef.current) {
            clearTimeout(closeTimerRef.current);
            closeTimerRef.current = null;
        }
    };

    const handleMouseLeave = () => {
        if (isUserMenuOpen) {
            closeTimerRef.current = setTimeout(() => {
                setIsUserMenuOpen(false);
            }, 1000);
        }
    };

    // Clear timer on unmount
    React.useEffect(() => {
        return () => {
            if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
        };
    }, []);

    React.useEffect(() => {
        const fetchInsta = async () => {
            const setts = await getSettings();
            if (setts?.instagram_link) setInstagramLink(setts.instagram_link);
            if (setts?.whatsapp_number) setWhatsappNumber(setts.whatsapp_number);
        };
        const fetchBrandsData = async () => {
            try {
                const data = await getBrands();
                setBrands(data.filter(b => b.active) || []);
            } catch (e) {
                console.error("Erro marcas header:", e);
            }
        };
        fetchInsta();
        fetchBrandsData();

        const handleResize = () => setIsMobileView(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);

        const mq = window.matchMedia('(display-mode: standalone)');
        const checkPwa = () => setIsPwa(
            mq.matches ||
            window.navigator.standalone === true ||
            document.referrer.includes('android-app://')
        );
        mq.addEventListener('change', checkPwa);

        return () => {
            window.removeEventListener('resize', handleResize);
            mq.removeEventListener('change', checkPwa);
        };
    }, []);

    React.useEffect(() => {
        if (!isMobileView || brands.length === 0) return;

        const currentBrand = brands[currentBrandIndex] || brands[0];
        const duration = (parseInt(currentBrand.duration) || 5) * 1000;

        const timer = setTimeout(() => {
            // PWA: avança 1 marca por vez; mobile normal: avança 2
            const increment = isPwa ? 1 : (brands.length > 1 ? 2 : 1);
            setCurrentBrandIndex((prev) => (prev + increment) % brands.length);
        }, duration);

        return () => clearTimeout(timer);
    }, [brands, currentBrandIndex, isMobileView, isPwa]);


    React.useEffect(() => {
        const handleClickOutside = (e) => {
            if (userMenuRef.current && !userMenuRef.current.contains(e.target)) setIsUserMenuOpen(false);
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleFinalizeClick = () => {
        if (!upsellAlreadyShown) {
            const showed = triggerUpsell(cartItems);
            if (showed) {
                setUpsellAlreadyShown(true);
                return;
            }
        }
        toggleCart();
    };

    // Reset upsell when cart changes
    React.useEffect(() => {
        setUpsellAlreadyShown(false);
    }, [cartCount]);

    const getInstagramHref = () => {
        if (!instagramLink) return '#';
        
        let url = instagramLink.trim();
        
        // Se for um email e não contiver instagram.com, trata como mailto
        if (url.includes('@') && !url.toLowerCase().includes('instagram.com')) {
            return `mailto:${url}`;
        }

        // Se for apenas um username (sem pontos ou barras)
        if (!url.includes('.') && !url.includes('/') && !url.startsWith('http')) {
            url = `https://www.instagram.com/${url}`;
        }
        
        // Garante que tenha protocolo
        if (!url.startsWith('http') && !url.startsWith('instagram://') && !url.startsWith('intent://') && !url.startsWith('mailto:')) {
            url = `https://${url}`;
        }

        try {
            const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
            if (isMobile && url.includes('instagram.com')) {
                // Tenta extrair o username de forma mais segura usando URL
                const tempUrl = url.startsWith('http') ? url : `https://${url}`;
                const urlObj = new URL(tempUrl);
                const pathParts = urlObj.pathname.split('/').filter(Boolean);
                const username = pathParts[0]; // O primeiro segmento costuma ser o username
                
                if (username && !['p', 'reels', 'stories', 'explore'].includes(username)) {
                    if (/Android/i.test(navigator.userAgent)) {
                        return `intent://instagram.com/_u/${username}/#Intent;package=com.instagram.android;scheme=https;end`;
                    } else {
                        return `instagram://user?username=${username}`;
                    }
                }
            }
        } catch (e) {
            console.error("Erro ao gerar link do Instagram:", e);
        }
        return url;
    };

    const handleInstagramClick = (e) => {
        const href = getInstagramHref();
        // Para deep links ou mailto, evitamos o target="_blank" que pode abrir abas em branco
        if (href.startsWith('instagram://') || href.startsWith('intent://') || href.startsWith('mailto:')) {
            e.preventDefault();
            window.location.href = href;
        }
    };

    return (
        <>
            <header className="main-header glass-header">
                <div className="header-inner">
                    {/* Logo */}
                    <a href="/" className="logo-container">
                        <img src="/logo.png" alt="Wilson Distribuidora" />
                    </a>

                    {/* Brand Carousel (Centralizado) */}
                    {brands.length > 0 && (() => {
                        if (isMobileView) {
                            // Mobile: PWA mostra 1 marca por vez, browser mostra 2
                            const brand1 = brands[currentBrandIndex % brands.length];
                            const brand2 = brands[(currentBrandIndex + 1) % brands.length];

                            const brandsToShow = isPwa || brands.length === 1 ? [brand1] : [brand1, brand2];

                            return (
                                <div className="header-brands-carousel" style={{ justifyContent: 'center' }}>
                                    <AnimatePresence mode="wait">
                                        <motion.div
                                            key={currentBrandIndex}
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            transition={{ duration: 0.5 }}
                                            style={{ display: 'flex', gap: isPwa ? '0' : '15px', margin: '0 auto', justifyContent: 'center', alignItems: 'center' }}
                                        >
                                            {brandsToShow.map((brand, idx) => (
                                                <div
                                                    key={idx}
                                                    className="brand-item"
                                                    onClick={() => {
                                                        if (brand && brand.linked_brand) navigate(`/?brand=${encodeURIComponent(brand.linked_brand)}`);
                                                    }}
                                                    style={{ cursor: brand && brand.linked_brand ? 'pointer' : 'default' }}
                                                >
                                                    {brand && <img src={getImageUrl(brand.image_url)} alt="Brand Logo" />}
                                                </div>
                                            ))}
                                        </motion.div>
                                    </AnimatePresence>
                                </div>
                            );
                        } else {
                            // Desktop: Scrolling carousel
                            const shouldScroll = brands.length > 4;
                            const displayBrands = shouldScroll ? [...brands, ...brands, ...brands] : brands;
                            const totalDuration = brands.reduce((acc, b) => acc + (parseInt(b.duration) || 5), 0);
                            
                            return (
                                <div className="header-brands-carousel">
                                    <div 
                                        className={`brands-track ${shouldScroll ? 'is-scrolling' : ''}`}
                                        style={shouldScroll ? { animationDuration: `${totalDuration}s` } : {}}
                                    >
                                        {displayBrands.map((brand, i) => (
                                            <div 
                                                key={i} 
                                                className="brand-item"
                                                onClick={() => {
                                                    if (brand.linked_brand) navigate(`/?brand=${encodeURIComponent(brand.linked_brand)}`);
                                                }}
                                                style={{ cursor: brand.linked_brand ? 'pointer' : 'default' }}
                                            >
                                                <img src={getImageUrl(brand.image_url)} alt="Brand Logo" />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        }
                    })()}

                    {/* Saudação Mobile (Centralizada) - Oculta se houver marcas para não sobrepor */}
                    {brands.length === 0 && (
                        <div className="user-greeting-mobile mobile-only">
                            <span>Olá,&nbsp;</span>
                            <strong>{user ? (user.user_metadata?.full_name?.split(' ')[0] || 'Cliente') : 'Visitante'}</strong>
                        </div>
                    )}


                    {/* Actions */}
                    <div className="header-actions">
                        <motion.div
                            initial={{ opacity: 0, x: 10 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="user-greeting-desktop"
                            onClick={() => {
                                setShowVersion(true);
                                setTimeout(() => setShowVersion(false), 5000);
                            }}
                            style={{ cursor: 'pointer', userSelect: 'none' }}
                        >
                            <strong>{user ? (user.user_metadata?.full_name?.split(' ')[0] || 'Cliente') : 'Visitante'}</strong>
                        </motion.div>

                        {whatsappNumber && (
                            <a
                                href={`https://wa.me/${whatsappNumber.replace(/\D/g, '')}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="action-btn"
                                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                title="Fale conosco no WhatsApp"
                            >
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                                    <path d="M20.52 3.48A11.93 11.93 0 0 0 12 0C5.37 0 0 5.37 0 12c0 2.11.55 4.16 1.6 5.97L0 24l6.18-1.57A11.94 11.94 0 0 0 12 24c6.63 0 12-5.37 12-12 0-3.21-1.25-6.22-3.48-8.52zM12 22c-1.85 0-3.66-.5-5.24-1.44l-.37-.22-3.87.98.99-3.77-.24-.38A9.93 9.93 0 0 1 2 12C2 6.48 6.48 2 12 2c2.67 0 5.17 1.04 7.06 2.94A9.93 9.93 0 0 1 22 12c0 5.52-4.48 10-10 10zm5.47-7.28c-.3-.15-1.77-.87-2.04-.97-.28-.1-.48-.15-.68.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.47-.89-.79-1.49-1.76-1.66-2.06-.17-.3-.02-.46.13-.61.13-.13.3-.35.44-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.07-.15-.68-1.63-.93-2.23-.24-.58-.49-.5-.68-.51h-.58c-.2 0-.52.07-.79.37-.28.3-1.05 1.02-1.05 2.5s1.08 2.9 1.23 3.1c.15.2 2.12 3.24 5.14 4.54.72.31 1.28.5 1.72.64.72.23 1.38.2 1.9.12.58-.09 1.77-.72 2.02-1.42.25-.7.25-1.3.17-1.42-.07-.13-.27-.2-.57-.35z" fill="#25D366"/>
                                </svg>
                            </a>
                        )}

                        {instagramLink && (
                            <a
                                href={getInstagramHref()}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="action-btn insta-btn"
                                onClick={handleInstagramClick}
                            >
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ filter: 'drop-shadow(0 0 1px rgba(0,0,0,0.2))' }}>
                                    <defs>
                                        <linearGradient id="insta-grad" x1="0%" y1="100%" x2="100%" y2="0%">
                                            <stop offset="0%" stopColor="#f09433" />
                                            <stop offset="25%" stopColor="#e6683c" />
                                            <stop offset="50%" stopColor="#dc2743" />
                                            <stop offset="75%" stopColor="#cc2366" />
                                            <stop offset="100%" stopColor="#bc1888" />
                                        </linearGradient>
                                    </defs>
                                    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" stroke="url(#insta-grad)"></rect>
                                    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" stroke="url(#insta-grad)"></path>
                                    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" stroke="url(#insta-grad)"></line>
                                </svg>
                            </a>
                        )}

                        <div className="user-dropdown-wrapper desktop-only" ref={userMenuRef}
                    onMouseEnter={handleMouseEnter}
                    onMouseLeave={handleMouseLeave}
                >
                            <button className={`action-btn ${user ? 'active-user' : ''}`} onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}>
                                <User size={22} />
                                {user && <div className="user-dot" />}
                                {user && unreadCount > 0 && (
                                    <span style={{
                                        position: 'absolute', top: '-4px', left: '-4px',
                                        background: '#D4AF37', color: '#000',
                                        fontSize: '0.5rem', fontWeight: 900,
                                        minWidth: '15px', height: '15px',
                                        borderRadius: '50%',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        border: '2px solid #0a0a0a',
                                        pointerEvents: 'none',
                                    }}>
                                        {unreadCount > 9 ? '9+' : unreadCount}
                                    </span>
                                )}
                            </button>

                            <AnimatePresence>
                                {isUserMenuOpen && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                        className="user-menu-dropdown glass-card"
                                    >
                                        {user ? (
                                            <div className="menu-inner">
                                                <div className="menu-header">
                                                    <div className="user-avatar">{(user.user_metadata?.full_name || 'U').charAt(0).toUpperCase()}</div>
                                                    <div className="user-info">
                                                        <span className="user-name">{user.user_metadata?.full_name?.split(' ')[0]}</span>
                                                        <span className="user-email">{user.email}</span>
                                                    </div>
                                                </div>
                                                <div className="menu-divider" />
                                                {(isAdmin || isOwner) && (
                                                    <Link to="/admin" className="menu-item" onClick={() => setIsUserMenuOpen(false)}>
                                                        <Shield size={16} /> <span>Painel Admin</span>
                                                    </Link>
                                                )}
                                                <button className="menu-item" onClick={() => { setIsUserMenuOpen(false); navigate('/profile'); }}>
                                                    <User size={16} /> <span>Meus Dados</span>
                                                </button>
                                                <Link to="/orders" className="menu-item" onClick={() => setIsUserMenuOpen(false)}>
                                                    <ClipboardList size={16} /> <span>Meus Pedidos</span>
                                                </Link>
                                                <button className="menu-item" onClick={() => { setIsUserMenuOpen(false); setIsNotifOpen(true); }}>
                                                    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                                                        <Bell size={16} />
                                                        {unreadCount > 0 && (
                                                            <span style={{
                                                                position: 'absolute', top: '-6px', right: '-8px',
                                                                background: '#D4AF37', color: '#000',
                                                                fontSize: '0.55rem', fontWeight: 900,
                                                                minWidth: '16px', height: '16px',
                                                                borderRadius: '50%',
                                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                                padding: '0 3px',
                                                                border: '2px solid #0a0a0a',
                                                            }}>
                                                                {unreadCount > 9 ? '9+' : unreadCount}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <span>Notificações</span>
                                                    {unreadCount > 0 && (
                                                        <span style={{
                                                            marginLeft: 'auto',
                                                            background: 'rgba(212,175,55,0.15)',
                                                            border: '1px solid rgba(212,175,55,0.3)',
                                                            color: '#D4AF37',
                                                            fontSize: '0.6rem', fontWeight: 900,
                                                            padding: '2px 7px', borderRadius: '100px',
                                                        }}>
                                                            {unreadCount} nova{unreadCount > 1 ? 's' : ''}
                                                        </span>
                                                    )}
                                                </button>
                                                <div className="menu-divider" />
                                                <button className="menu-item logout" onClick={() => { setIsUserMenuOpen(false); navigate('/logout'); }}>
                                                    <LogOut size={16} /> <span>Sair</span>
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="menu-inner">
                                                <div className="menu-header">
                                                    <span className="welcome-text">Bem-vindo à Wilson!</span>
                                                </div>
                                                <button className="login-btn-primary" onClick={() => { openAuthModal('login'); setIsUserMenuOpen(false); }}>Entrar</button>
                                                <button className="register-btn-secondary" onClick={() => { openAuthModal('register'); setIsUserMenuOpen(false); }}>Criar Conta</button>
                                            </div>
                                        )}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        <button className="action-btn cart-toggle desktop-only" onClick={handleFinalizeClick}>
                            <ShoppingCart size={22} />
                            {cartCount > 0 && (
                                <motion.span
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    className="cart-badge-count"
                                >
                                    {cartCount}
                                </motion.span>
                            )}
                        </button>

                        <AnimatePresence>
                            {cartCount > 0 && (
                                <motion.button
                                    initial={{ opacity: 0, x: -20, scale: 0.8 }}
                                    animate={{ opacity: 1, x: 0, scale: 1 }}
                                    exit={{ opacity: 0, x: -20, scale: 0.8 }}
                                    whileTap={{ scale: 0.95 }}
                                    className="header-finish-btn desktop-only"
                                    onClick={handleFinalizeClick}
                                >
                                    <span>FINALIZAR PEDIDO</span>
                                </motion.button>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

            </header>

            {/* Painel de Notificações */}
            <NotificacoesPanel
                isOpen={isNotifOpen}
                onClose={() => setIsNotifOpen(false)}
                notificacoes={notificacoes}
                loading={notifLoading}
                unreadCount={unreadCount}
                marcarLidas={marcarLidas}
            />

            {/* Version Display */}
            <AnimatePresence>
                {showVersion && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 20 }} exit={{ opacity: 0, y: -20 }}
                        className="version-tag"
                    >
                        <span className="v-num">{APP_VERSION}</span>
                        <span className="v-date">Build: {BUILD_DATE}</span>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};

export default Header;
