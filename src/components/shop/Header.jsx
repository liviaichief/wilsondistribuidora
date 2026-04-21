import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useOrder } from '../../context/OrderContext';
import { useAuth } from '../../context/AuthContext';
import { ShoppingBag, User, LogOut, ClipboardList, Shield, Beer, Store, Box, Instagram, Bell, Sparkles, CheckCircle } from 'lucide-react';
import { getSettings } from '../../services/dataService';
import './Header.css';

// Custom Icons
const OssobucoIcon = ({ size = 20, className }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z" />
        <circle cx="12" cy="12" r="3" />
        <circle cx="12" cy="12" r="1" fill="currentColor" opacity="0.6" />
    </svg>
);

const DrumstickIcon = ({ size = 20, className }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M11 13c-2.5-2.5-3.5-7-1.5-9s6.5-1 9 1.5 1.5 6.5-1 8.5-6.5 1.5-6.5-1z" />
        <path d="M11.5 12.5L7 17" />
        <path d="M7 15.5c-1-1-2.5 0-1.5 1 .5.5 1 .5 1.5 0s1 .5 1.5 0c1-1-0.5-2-1.5-1z" />
    </svg>
);

const SausageIcon = ({ size = 20, className }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M18 8c1.5 1.5 2 4 0.5 5.5l-9 9c-1.5 1.5-4 1-5.5-0.5s-2-4-0.5-5.5l9-9c1.5-1.5 4-1 5.5 0.5Z" />
    </svg>
);

import { APP_VERSION, BUILD_DATE } from '../../version';

const Header = ({ activeCategory, onCategoryChange }) => {
    const location = useLocation();
    const isHome = location.pathname === '/';
    const navigate = useNavigate();
    const { toggleCart, cartCount } = useCart();
    const { user, openAuthModal, openProfileModal, isAdmin, isOwner } = useAuth();
    const [isUserMenuOpen, setIsUserMenuOpen] = React.useState(false);
    const [showVersion, setShowVersion] = React.useState(false);
    const [instagramLink, setInstagramLink] = React.useState('');
    const userMenuRef = React.useRef(null);
    const categoryListRef = React.useRef(null);

    const handleLogoClick = () => {
        if (window.caches) {
            caches.keys().then((names) => {
                for (let name of names) caches.delete(name);
            }).catch(err => console.log('Cache clear error:', err));
        }
        window.location.href = '/';
    };

    React.useEffect(() => {
        const fetchInsta = async () => {
            const setts = await getSettings();
            if (setts?.instagram_link) setInstagramLink(setts.instagram_link);
        };
        fetchInsta();
    }, []);

    React.useEffect(() => {
        const handleClickOutside = (e) => {
            if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
                setIsUserMenuOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const [categories, setCategories] = React.useState([
        { id: 'all', label: 'PROMOÇÕES', icon: Sparkles }
    ]);

    React.useEffect(() => {
        const loadCats = async () => {
            try {
                const { getCategories } = await import('../../services/dataService');
                const data = await getCategories();
                const getIconForCategory = (id) => {
                    switch (id) {
                        case '1': return OssobucoIcon;
                        case '2': return SausageIcon;
                        case '3': return DrumstickIcon;
                        case '4': return Beer;
                        case '5': return Store;
                        default: return Box;
                    }
                };
                const formatted = [
                    { id: 'all', label: 'PROMOÇÕES', icon: Sparkles },
                    ...data.filter(cat => cat.active !== false).map(cat => ({
                        id: cat.id,
                        label: cat.name.toUpperCase(),
                        icon: getIconForCategory(cat.id)
                    }))
                ];
                setCategories(formatted);
            } catch (e) {
                console.error("Error loading header categories:", e);
            }
        };
        loadCats();
    }, []);

    return (
        <header className={`site-header ${isHome ? 'home-header' : ''}`}>
            <div className="header-container">
                <div className="header-main-row is-home-layout">
                    {/* Logo Section */}
                    <div className="header-logo-section" onClick={handleLogoClick} title="Página Inicial">
                        <img src="/logo.png" alt="Wilson Distribuidora" className="header-logo" />
                    </div>

                    {/* User Actions Section */}
                    <div className="header-actions">
                        {instagramLink && (
                            <a href={instagramLink} target="_blank" rel="noopener noreferrer" className="cart-btn">
                                <Instagram size={31} color="white" />
                            </a>
                        )}
                        
                        {user && (
                            <span
                                className="admin-link"
                                onClick={() => { setShowVersion(true); setTimeout(() => setShowVersion(false), 5000); }}
                                style={{ cursor: 'pointer', color: 'white', marginRight: '10px' }}
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
                                                    <Shield size={16} /> <span>Área Restrita</span>
                                                </Link>
                                            )}
                                            <button className="user-menu-item" onClick={() => { setIsUserMenuOpen(false); openProfileModal(); }}>
                                                <User size={16} /> <span>Meus Dados</span>
                                            </button>
                                            <Link to="/orders" className="user-menu-item" onClick={() => setIsUserMenuOpen(false)}>
                                                <ClipboardList size={16} /> <span>Meus Pedidos</span>
                                            </Link>
                                            <button className="user-menu-item" onClick={() => { setIsUserMenuOpen(false); navigate('/logout'); }}>
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
                                <button className="nav-checkout-btn" onClick={toggleCart}>
                                    Finalizar
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Bottom Row: Navigation Tabs */}
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
            
            {showVersion && (
                <div className="logout-toast" style={{ flexDirection: 'column', alignItems: 'center', gap: '4px', backgroundColor: 'rgba(20,20,20,0.95)', border: '1px solid var(--primary-color)', userSelect: 'none' }}>
                    <span style={{ color: 'var(--primary-color)', fontSize: '1.2rem', fontWeight: 'bold' }}>{APP_VERSION}</span>
                    <span style={{ fontSize: '0.8rem', color: '#ccc', fontWeight: 'normal' }}>Publicado em: {BUILD_DATE}</span>
                </div>
            )}
        </header>
    );
};

export default Header;
