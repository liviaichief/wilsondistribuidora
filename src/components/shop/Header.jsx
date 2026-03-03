import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useOrder } from '../../context/OrderContext';

import { useAuth } from '../../context/AuthContext';
import { ShoppingBag, Flame, Sparkles, User, LogOut, ClipboardList, CheckCircle, Shield, Beer } from 'lucide-react';
import './Header.css';

// Custom Icons - Doodle Style
const OssobucoIcon = ({ size = 20, className }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        {/* Ossobuco: Round steak with central bone and marrow */}
        <path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z" /> {/* Outer Meat */}
        <circle cx="12" cy="12" r="3" /> {/* Central Bone */}
        <circle cx="12" cy="12" r="1" fill="currentColor" opacity="0.6" /> {/* Marrow */}
        <path d="M12 21v-3" opacity="0.5" /> {/* Texture/muscle line */}
        <path d="M12 3v3" opacity="0.5" /> {/* Texture/muscle line */}
        <path d="M3 12h3" opacity="0.5" /> {/* Texture/muscle line */}
        <path d="M21 12h-3" opacity="0.5" /> {/* Texture/muscle line */}
    </svg>
);

const DrumstickIcon = ({ size = 20, className }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        {/* Novo ícone de Coxa de Frango conforme imagem enviada */}
        <path d="M11 13c-2.5-2.5-3.5-7-1.5-9s6.5-1 9 1.5 1.5 6.5-1 8.5-6.5 1.5-6.5-1z" />
        <path d="M11.5 12.5L7 17" />
        <path d="M7 15.5c-1-1-2.5 0-1.5 1 .5.5 1 .5 1.5 0s1 .5 1.5 0c1-1-0.5-2-1.5-1z" />
        <circle cx="17.5" cy="6.5" r="0.8" fill="currentColor" stroke="none" />
        <path d="M19.5 9c0.5 1.5 0 3.5-2 5" />
    </svg>
);

const SausageIcon = ({ size = 20, className }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        {/* Doodle style sausage */}
        <path d="M18 8c1.5 1.5 2 4 0.5 5.5l-9 9c-1.5 1.5-4 1-5.5-0.5s-2-4-0.5-5.5l9-9c1.5-1.5 4-1 5.5 0.5Z" />
        <path d="M7 17l-1 1" /> {/* Knot/End detail */}
        <path d="M17 7l1-1" /> {/* Knot/End detail */}
        <path d="M10 12l4-4" opacity="0.5" /> {/* Shine */}
    </svg>
);

const GarlicBreadIcon = ({ size = 20, className }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        {/* Doodle style baguette/garlic bread */}
        <path d="M6 19C4 17 3 13 6 8C9 3 16 3 20 6C23 10 21 16 16 20C12 23 8 21 6 19Z" />
        <path d="M9 11l2 2" /> {/* Slice mark */}
        <path d="M12 8l2 2" /> {/* Slice mark */}
        <path d="M15 5l2 2" /> {/* Slice mark */}
        <path d="M8 15c1 1 2 1 2 1" strokeLinecap="round" /> {/* Cheese drip hint */}
    </svg>
);

const CharcoalIcon = ({ size = 20, className }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        {/* Doodle style charcoal pile with flame */}
        <path d="M4 17c0 0 2-2 4 0s4 0 4 0" /> {/* irregular bottom */}
        <path d="M12 17c0 0 2-2 4 0s4 0 4 0" />
        <path d="M6 14c0-2-1-3 1-4c1-1 3 1 3 4" /> {/* Lump */}
        <path d="M14 14c-1-2-2-3 0-5c2-1 4 1 3 5" /> {/* Lump */}
        <path d="M11 5c-1 2-2 3-2 5" /> {/* Flame L */}
        <path d="M13 5c1 2 2 3 2 5" /> {/* Flame R */}
        <path d="M12 3c-1 1 0 2 0 2" stroke="orange" /> {/* Flame Tip */}
    </svg>
);


import { APP_VERSION, BUILD_DATE } from '../../version';

const Header = ({ activeCategory, onCategoryChange }) => {
    const location = useLocation();
    const isHome = location.pathname === '/';
    const navigate = useNavigate();
    const { toggleCart, cartCount, cartTotal } = useCart();
    const { toggleOrderSidebar } = useOrder();
    const { user, openAuthModal, signOut, isAdmin, isOwner, openProfileModal } = useAuth();
    const [isUserMenuOpen, setIsUserMenuOpen] = React.useState(false);
    const [showVersion, setShowVersion] = React.useState(false); // Version display state
    // const [isProfileModalOpen, setIsProfileModalOpen] = React.useState(false); // Removed local state
    const [logoutMessage, setLogoutMessage] = React.useState(null);
    const userMenuRef = React.useRef(null);
    const logoClicksRef = React.useRef(0);
    const logoClickTimerRef = React.useRef(null);

    const handleLogoClick = () => {
        // Refresh with cache clear (hard reload)
        window.location.reload(true);
    };

    React.useEffect(() => {
        const handleClickOutside = (event) => {
            if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
                setIsUserMenuOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    // Auto-scroll logic
    const categoryListRef = React.useRef(null);
    const scrollDirection = React.useRef(null);

    React.useEffect(() => {
        // Prevent auto-scroll logic from running on mobile/touch devices
        if (window.innerWidth <= 768 || window.matchMedia('(hover: none)').matches) {
            return;
        }

        const handleMouseMove = (e) => {
            const { clientX } = e;
            const windowWidth = window.innerWidth;
            const threshold = 150; // Trigger area size

            if (clientX > windowWidth - threshold) {
                scrollDirection.current = 'right';
            } else if (clientX < threshold) {
                scrollDirection.current = 'left';
            } else {
                scrollDirection.current = null;
            }
        };

        let animationFrameId;
        const scrollLoop = () => {
            if (scrollDirection.current && categoryListRef.current) {
                const speed = 4;
                if (scrollDirection.current === 'right') {
                    categoryListRef.current.scrollLeft += speed;
                } else {
                    categoryListRef.current.scrollLeft -= speed;
                }
            }
            animationFrameId = requestAnimationFrame(scrollLoop);
        };

        window.addEventListener('mousemove', handleMouseMove);
        scrollLoop();

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            cancelAnimationFrame(animationFrameId);
        };
    }, []);

    const categories = [
        { id: 'all', label: 'PROMOÇÕES', icon: Sparkles },
        { id: 'carne', label: 'CARNE', icon: OssobucoIcon },
        { id: 'suinos', label: 'SUÍNOS', icon: SausageIcon },
        { id: 'frango', label: 'FRANGO', icon: DrumstickIcon },
        { id: 'acompanhamentos', label: 'ACOMPANHAMENTOS', icon: GarlicBreadIcon },
        { id: 'acessorios', label: 'ACESSÓRIOS', icon: CharcoalIcon },
        { id: 'insumos', label: 'INSUMOS', icon: Flame },
        { id: 'bebidas', label: 'BEBIDAS', icon: Beer },
    ];

    return (
        <header className={`site-header ${isHome ? 'home-header' : ''}`}>
            <div className="header-container">
                {/* Top Row: Logo and Actions */}
                <div className="header-main-row">
                    {/* 1. Logo Section */}
                    <div className="header-logo-section" onClick={handleLogoClick} style={{ cursor: 'pointer', userSelect: 'none' }}>
                        <img src="/logo-3r.jpeg" alt="3R Grill Boutique de Carnes" className="header-logo" />
                    </div>

                    {/* 2. User Actions Section */}
                    <div className="header-actions">
                        {user && (
                            <span
                                className="admin-link"
                                onClick={() => { setShowVersion(true); setTimeout(() => setShowVersion(false), 5000); }}
                                style={{ cursor: 'pointer' }}
                            >
                                {`Olá, ${user.user_metadata?.full_name?.split(' ')[0] || 'Usuário'}`}
                            </span>
                        )}

                        <button className="cart-btn" onClick={toggleCart}>
                            <ShoppingBag size={31} />
                            {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
                        </button>

                        <div className="user-menu-container" ref={userMenuRef}>
                            <button
                                className="cart-btn"
                                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                                title="Minha Conta"
                            >
                                <User size={31} color={user ? "var(--primary-color)" : "white"} />
                            </button>

                            {isUserMenuOpen && (
                                <div className="user-menu-dropdown">
                                    {user ? (
                                        <>

                                            {(isAdmin || isOwner) && (
                                                <Link to="/admin" className="user-menu-item" onClick={() => setIsUserMenuOpen(false)}>
                                                    <Shield size={16} />
                                                    <span>Área Restrita</span>
                                                </Link>
                                            )}
                                            <button
                                                className="user-menu-item"
                                                onClick={() => {
                                                    setIsUserMenuOpen(false);
                                                    openProfileModal();
                                                }}
                                            >
                                                <User size={16} />
                                                <span>Meus Dados</span>
                                            </button>
                                            <Link to="/orders" className="user-menu-item" onClick={() => setIsUserMenuOpen(false)}>
                                                <ClipboardList size={16} /> <span>Meus Pedidos</span>
                                            </Link>
                                            <button className="user-menu-item" onClick={() => {
                                                setIsUserMenuOpen(false);
                                                navigate('/logout');
                                            }}>
                                                <LogOut size={16} /> Sair
                                            </button>
                                        </>
                                    ) : (
                                        <>
                                            <div className="user-menu-header">
                                                <small>Bem-vindo!</small>
                                                <span>Acesse sua conta</span>
                                            </div>
                                            <button className="user-menu-item" onClick={() => { openAuthModal('login'); setIsUserMenuOpen(false); }}>
                                                <User size={16} /> Login
                                            </button>
                                            <button className="user-menu-item" onClick={() => { openAuthModal('register'); setIsUserMenuOpen(false); }}>
                                                <User size={16} /> Cadastrar
                                            </button>
                                        </>
                                    )}
                                </div>
                            )}
                        </div>

                        {cartCount > 0 && (
                            <div className="cart-summary-inline">
                                <div className="cart-totalizer">
                                    <span className="cart-total-value" style={{ fontSize: '0.9rem' }}>{cartCount} {cartCount === 1 ? 'item' : 'itens'}</span>
                                </div>
                                <button className="nav-checkout-btn" onClick={toggleCart}>
                                    Finalizar
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Bottom Row: Navigation Tabs (Only on Home) */}
                {isHome && (
                    <div className="header-nav-section">
                        <nav className="category-nav-inline">
                            <div className="category-list" ref={categoryListRef}>
                                {categories.map((cat) => (
                                    <button
                                        key={cat.id}
                                        className={`category-item ${activeCategory === cat.id ? 'active' : ''}`}
                                        onClick={() => onCategoryChange(cat.id)}
                                    >
                                        {cat.id === 'all' && <cat.icon size={25} className="category-icon" />}
                                        <span>{cat.label}</span>
                                    </button>
                                ))}
                            </div>
                        </nav>
                    </div>
                )}
            </div>
            {
                showVersion && (
                    <div className="logout-toast" style={{ flexDirection: 'column', alignItems: 'center', gap: '4px', backgroundColor: 'rgba(20,20,20,0.95)', border: '1px solid var(--primary-color)', userSelect: 'none' }}>
                        <span style={{ color: 'var(--primary-color)', fontSize: '1.2rem', fontWeight: 'bold' }}>{APP_VERSION}</span>
                        <span style={{ fontSize: '0.8rem', color: '#ccc', fontWeight: 'normal' }}>Publicado em: {BUILD_DATE}</span>
                    </div>
                )
            }
            {
                logoutMessage && (
                    <div className="logout-toast">
                        <CheckCircle size={20} />
                        {logoutMessage}
                    </div>
                )
            }


        </header >
    );
};

export default Header;


