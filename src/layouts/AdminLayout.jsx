import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, ArrowLeft, LogOut, ShoppingBag } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useAlert } from '../context/AlertContext';
import '../pages/Admin.css';

const AdminLayout = () => {
    const { signOut } = useAuth();
    const location = useLocation();
    const { showConfirm, showAlert } = useAlert();

    const handleHardRefresh = () => {
        // Limpa o cache do navegador via API (útil para PWA e Service Workers) e força reload
        if ('caches' in window) {
            caches.keys().then((names) => {
                for (let name of names) caches.delete(name);
            });
        }
        // Força o recarregamento descartando o cache local
        window.location.reload();
    };

    return (
        <div className="admin-container">
            <header className="admin-header">
                <div className="admin-brand-group" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div
                        onClick={handleHardRefresh}
                        style={{
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            transition: 'transform 0.3s ease'
                        }}
                        onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'}
                        onMouseLeave={e => e.currentTarget.style.transform = 'scale(1.0)'}
                        title="Limpar Cache e Recarregar"
                    >
                        <img
                            src="/logo-3r.jpeg"
                            alt="Logo 3R"
                            style={{
                                width: '40px',
                                height: '40px',
                                borderRadius: '50%',
                                border: '2px solid var(--primary-color)',
                                objectFit: 'cover'
                            }}
                        />
                    </div>
                    <div className="logo" style={{ fontSize: '1.4rem', color: 'var(--primary-color)', fontWeight: 'bold' }}>Boutique Admin</div>
                </div>

                <nav className="admin-nav">
                    <Link
                        to="/admin/dashboard"
                        className={`nav-link ${location.pathname === '/admin/dashboard' ? 'active' : ''}`}
                    >
                        <LayoutDashboard size={28} /> <span className="nav-text">Dashboard</span>
                    </Link>
                    <Link
                        to="/admin"
                        className={`nav-link ${location.pathname === '/admin' ? 'active' : ''}`}
                    >
                        <ShoppingBag size={28} /> <span className="nav-text">Produtos</span>
                    </Link>
                    <Link
                        to="/admin/users"
                        className={`nav-link ${location.pathname.startsWith('/admin/users') ? 'active' : ''}`}
                    >
                        <Users size={28} /> <span className="nav-text">Usuários</span>
                    </Link>
                </nav>

                <div className="admin-actions">
                    <Link to="/" className="nav-link" title="Voltar para Loja">
                        <ArrowLeft size={25} /> <span className="nav-text">Loja</span>
                    </Link>
                    <button
                        onClick={() => {
                            showConfirm(
                                'Tem certeza que deseja sair do sistema?',
                                async () => {
                                    await signOut();
                                    showAlert('Sessão finalizada com sucesso! 👋', 'success');
                                    // Use navigate or window.location - signOut might handle redirect, usually
                                    // But typically we want to redirect to login.
                                    // Let's use standard redirect
                                    setTimeout(() => window.location.href = '/login', 1500);
                                },
                                'Sair do Sistema',
                                'Sair',
                                'Cancelar'
                            );
                        }}
                        className="icon-btn"
                        title="Sair"
                        style={{ background: 'transparent', border: 'none', color: '#ff4444', cursor: 'pointer' }}
                    >
                        <LogOut size={25} />
                    </button>


                </div>
            </header>

            <main className="admin-content">
                <Outlet />
            </main>
        </div >
    );
};

export default AdminLayout;
