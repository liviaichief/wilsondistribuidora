import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Store, List, ShoppingBag, User, History } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import './BottomNav.css';

const BottomNav = () => {
    const { cartCount, toggleCart, cartItems, triggerUpsell } = useCart();
    const { user, openAuthModal, openProfileModal } = useAuth();
    const [upsellAlreadyShown, setUpsellAlreadyShown] = React.useState(false);
    const location = useLocation();

    // Reset upsell when cart changes
    React.useEffect(() => {
        setUpsellAlreadyShown(false);
    }, [cartCount]);

    const handleCartClick = () => {
        if (cartCount > 0 && !upsellAlreadyShown) {
            const showed = triggerUpsell(cartItems);
            if (showed) {
                setUpsellAlreadyShown(true);
                return;
            }
        }
        toggleCart();
    };

    // Only show on mobile
    if (window.innerWidth > 768) return null;

    const handleProfileClick = () => {
        if (user) {
            openProfileModal();
        } else {
            openAuthModal('login');
        }
    };

    return (
        <nav className="bottom-nav">
            <NavLink to="/" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                <Store size={24} />
                <span>Loja</span>
            </NavLink>
            
            <NavLink to="/orders" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                <History size={24} />
                <span>Pedidos</span>
            </NavLink>

            <div className="nav-item cart-item-central" onClick={handleCartClick}>
                <div className="cart-icon-wrapper">
                    <ShoppingBag size={28} />
                    {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
                </div>
                <span>Carrinho</span>
            </div>

            <div className={`nav-item ${location.pathname === '/profile' ? 'active' : ''}`} onClick={handleProfileClick}>
                <User size={24} />
                <span>Perfil</span>
            </div>
        </nav>
    );
};

export default BottomNav;
