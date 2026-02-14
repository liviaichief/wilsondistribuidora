import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, ArrowLeft, LogOut, ShoppingBag } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import '../pages/Admin.css';

const AdminLayout = () => {
    const { signOut } = useAuth();
    const location = useLocation();

    return (
        <div className="admin-container">
            <header className="admin-header">
                <div className="logo" style={{ fontSize: '1.2rem', color: 'var(--primary-color)' }}>Boutique Admin</div>

                <nav className="admin-nav" style={{ flex: 1, marginLeft: '40px' }}>
                    <Link
                        to="/admin/dashboard"
                        className={`nav-link ${location.pathname === '/admin/dashboard' ? 'active' : ''}`}
                        style={{ color: location.pathname === '/admin/dashboard' ? '#fff' : 'var(--text-muted)' }}
                    >
                        <LayoutDashboard size={20} /> Dashboard
                    </Link>
                    <Link
                        to="/admin"
                        className={`nav-link ${location.pathname === '/admin' ? 'active' : ''}`}
                        style={{ color: location.pathname === '/admin' ? '#fff' : 'var(--text-muted)' }}
                    >
                        <ShoppingBag size={20} /> Produtos
                    </Link>
                    <Link
                        to="/admin/users"
                        className={`nav-link ${location.pathname.startsWith('/admin/users') ? 'active' : ''}`}
                        style={{ color: location.pathname.startsWith('/admin/users') ? '#fff' : 'var(--text-muted)' }}
                    >
                        <Users size={20} /> Usuários
                    </Link>
                </nav>

                <div className="admin-actions" style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                    <Link to="/" className="nav-link" title="Voltar para Loja">
                        <ArrowLeft size={18} /> Loja
                    </Link>
                    <button
                        onClick={async () => {
                            if (window.confirm('Tem certeza que deseja sair do sistema?')) {
                                await signOut();
                                alert("Sessão finalizada com sucesso! 👋");
                                window.location.href = '/login';
                            }
                        }}
                        className="icon-btn"
                        title="Sair"
                        style={{ background: 'transparent', border: 'none', color: '#ff4444', cursor: 'pointer' }}
                    >
                        <LogOut size={18} />
                    </button>
                </div>
            </header>

            <main className="admin-content">
                <Outlet />
            </main>
        </div>
    );
};

export default AdminLayout;
