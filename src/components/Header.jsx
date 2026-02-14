import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useOrder } from '../context/OrderContext';

import { useAuth } from '../context/AuthContext';
import { ShoppingBag, Flame, Sparkles, User, LogOut, ClipboardList, CheckCircle, Shield } from 'lucide-react';
import './Header.css';

// Custom Icons - Doodle Style
const TomahawkIcon = ({ size = 20, className }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        {/* Doodle style Tomahawk: simplified, slightly irregular */}
        <path d="M9 11L4 21" /> {/* Bone handle */}
        <path d="M9 11C8 9 7 5 11 3C15 1 21 3 22 7C23 11 20 16 16 18C13 19 10 16 9 11Z" /> {/* Meat */}
        <path d="M12 7c0.5 0.5 1 0.5 1 0.5" strokeLinecap="round" opacity="0.6" /> {/* Texture dot/line */}
        <path d="M15 10c0.5 0.5 0.5 1 0.5 1" strokeLinecap="round" opacity="0.6" /> {/* Texture dot/line */}
    </svg>
);

const DrumstickIcon = ({ size = 20, className }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        {/* Matches the 'Doodle Icons' drumstick: bulbous top, boney bottom, dots for texture */}
        <path d="M14 12l4 6" /> {/* Bone */}
        <path d="M17 21l2-2" /> {/* Bone end */}
        <path d="M7 5C3 8 3 14 7 17C9 19 14 12 14 12C14 12 13 4 7 5Z" /> {/* Meat */}
        <circle cx="8" cy="10" r="0.5" fill="currentColor" opacity="0.6" /> {/* Texture dot */}
        <circle cx="10" cy="8" r="0.5" fill="currentColor" opacity="0.6" /> {/* Texture dot */}
        <circle cx="9" cy="13" r="0.5" fill="currentColor" opacity="0.6" /> {/* Texture dot */}
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


const Header = ({ activeCategory, onCategoryChange }) => {
    const location = useLocation();
    const isHome = location.pathname === '/';
    const navigate = useNavigate();
    const { toggleCart, cartCount, cartTotal } = useCart();
    const { toggleOrderSidebar } = useOrder();
    const { user, openAuthModal, signOut, isAdmin, isOwner, openProfileModal } = useAuth();
    const [isUserMenuOpen, setIsUserMenuOpen] = React.useState(false);
    // const [isProfileModalOpen, setIsProfileModalOpen] = React.useState(false); // Removed local state
    const [logoutMessage, setLogoutMessage] = React.useState(null);
    const userMenuRef = React.useRef(null);

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

    const categories = [
        { id: 'all', label: 'TODOS', icon: Sparkles },
        { id: 'carne', label: 'CARNE', icon: TomahawkIcon },
        { id: 'frango', label: 'FRANGO', icon: DrumstickIcon },
        { id: 'embutidos', label: 'EMBUTIDOS', icon: SausageIcon },
        { id: 'acompanhamentos', label: 'ACOMPANHAMENTOS', icon: GarlicBreadIcon },
        { id: 'acessorios', label: 'ACESSÓRIOS', icon: CharcoalIcon },
        { id: 'insumos', label: 'INSUMOS', icon: Flame },
    ];

    return (
        <header className={`site-header ${isHome ? 'home-header' : ''}`}>
            <div className="header-container">
                {/* 1. Logo Section */}
                <div className="header-logo-section">
                    <img src="/logo-3r.jpeg" alt="3R Grill Boutique de Carnes" className="header-logo" />
                </div>

                {/* 2. Category Nav Section (Independent) */}
                {isHome && (
                    <div className="header-nav-section">
                        <nav className="category-nav-inline">
                            <div className="category-list">
                                {categories.map((cat) => (
                                    <button
                                        key={cat.id}
                                        className={`category-item ${activeCategory === cat.id ? 'active' : ''}`}
                                        onClick={() => onCategoryChange(cat.id)}
                                    >
                                        <cat.icon size={18} className="category-icon" />
                                        <span>{cat.label}</span>
                                    </button>
                                ))}
                            </div>
                        </nav>
                    </div>
                )}

                {/* 3. User Actions Section (Independent) */}
                <div className="header-actions-section">
                    <div className="header-actions">
                        {user && (
                            <span className="admin-link" style={{ cursor: 'default', textDecoration: 'none', marginRight: '10px' }}>
                                Olá, {user.user_metadata?.full_name?.split(' ')[0] || 'Usuário'}
                            </span>
                        )}

                        <button className="cart-btn" onClick={toggleCart}>
                            <ShoppingBag size={22} />
                            {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
                        </button>

                        <div className="user-menu-container" ref={userMenuRef}>
                            <button
                                className="cart-btn"
                                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                                title="Minha Conta"
                            >
                                <User size={22} color={user ? "var(--primary-color)" : "white"} />
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
                                            <button className="user-menu-item" onClick={async () => {
                                                await signOut();
                                                setIsUserMenuOpen(false);
                                                setLogoutMessage("Sessão finalizada com sucesso! 👋");
                                                setTimeout(() => {
                                                    window.location.href = '/login';
                                                }, 2000);
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
            </div>
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
