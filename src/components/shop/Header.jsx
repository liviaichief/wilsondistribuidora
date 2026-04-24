import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { ShoppingBag, User, LogOut, ClipboardList, Shield, Beer, Store, Box, Instagram, Sparkles, X, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getSettings } from '../../services/dataService';
import { APP_VERSION, BUILD_DATE } from '../../version';
import './Header.css';

const Header = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { toggleCart, cartCount } = useCart();
    const { user, openAuthModal, openProfileModal, isAdmin, isOwner } = useAuth();
    const [isUserMenuOpen, setIsUserMenuOpen] = React.useState(false);
    const [showVersion, setShowVersion] = React.useState(false);
    const [instagramLink, setInstagramLink] = React.useState('');
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
        fetchInsta();
    }, []);

    React.useEffect(() => {
        const handleClickOutside = (e) => {
            if (userMenuRef.current && !userMenuRef.current.contains(e.target)) setIsUserMenuOpen(false);
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <>
            <header className="main-header glass-header">
                <div className="header-inner">
                    {/* Logo */}
                    <Link to="/" className="logo-container" onClick={() => window.location.href = '/'}>
                        <img src="/logo.png" alt="Wilson Distribuidora" />
                    </Link>


                    {/* Actions */}
                    <div className="header-actions">
                        <motion.div
                            initial={{ opacity: 0, x: 10 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="user-greeting-desktop"
                        >
                            <span 
                                onDoubleClick={() => {
                                    setShowVersion(true);
                                    setTimeout(() => setShowVersion(false), 5000);
                                }}
                                style={{ cursor: 'pointer', userSelect: 'none' }}
                            >
                                Olá, 
                            </span>
                            <strong>{user ? (user.user_metadata?.full_name?.split(' ')[0] || 'Cliente') : 'Visitante'}</strong>
                        </motion.div>

                        {instagramLink && (
                            <a href={instagramLink} target="_blank" rel="noopener noreferrer" className="action-btn">
                                <Instagram size={22} />
                            </a>
                        )}

                        <div 
                    className="user-dropdown-wrapper" 
                    ref={userMenuRef}
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
                                                <button className="menu-item" onClick={() => { setIsUserMenuOpen(false); openProfileModal(); }}>
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

                        <button className="action-btn cart-toggle" onClick={toggleCart}>
                            <ShoppingBag size={22} />
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
                                    className="header-finish-btn"
                                    onClick={toggleCart}
                                >
                                    <span>FINALIZAR PEDIDO</span>
                                    <ChevronRight size={18} />
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
