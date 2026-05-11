import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { ShoppingBag, ShoppingCart, User, LogOut, ClipboardList, Shield, Beer, Store, Box, Instagram, Sparkles, X, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getSettings, getBrands } from '../../services/dataService';
import { getImageUrl } from '../../lib/imageUtils';
import { APP_VERSION, BUILD_DATE } from '../../version';
import './Header.css';

const Header = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { toggleCart, cartCount, cartItems, triggerUpsell } = useCart();
    const { user, openAuthModal, openProfileModal, isAdmin, isOwner } = useAuth();
    const [isUserMenuOpen, setIsUserMenuOpen] = React.useState(false);
    const [upsellAlreadyShown, setUpsellAlreadyShown] = React.useState(false);
    const [showVersion, setShowVersion] = React.useState(false);
    const [instagramLink, setInstagramLink] = React.useState('');
    const [brands, setBrands] = React.useState([]);
    const [isMobileView, setIsMobileView] = React.useState(window.innerWidth < 768);
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
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    React.useEffect(() => {
        if (!isMobileView || brands.length === 0) return;
        
        const currentBrand = brands[currentBrandIndex] || brands[0];
        const duration = (parseInt(currentBrand.duration) || 5) * 1000;
        
        const timer = setTimeout(() => {
            const increment = brands.length > 1 ? 2 : 1;
            setCurrentBrandIndex((prev) => (prev + increment) % brands.length);
        }, duration);
        
        return () => clearTimeout(timer);
    }, [brands, currentBrandIndex, isMobileView]);


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
                            // Mobile: 2 static brands, switching on a timer
                            const brand1 = brands[currentBrandIndex % brands.length];
                            const brand2 = brands[(currentBrandIndex + 1) % brands.length];
                            
                            // Prevent duplicating if there's only 1 brand total
                            const brandsToShow = brands.length > 1 ? [brand1, brand2] : [brand1];

                            return (
                                <div className="header-brands-carousel" style={{ justifyContent: 'center' }}>
                                    <AnimatePresence mode="wait">
                                        <motion.div
                                            key={currentBrandIndex}
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            transition={{ duration: 0.5 }}
                                            style={{ display: 'flex', gap: '15px', margin: '0 auto' }}
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
