import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, ArrowLeft, LogOut, ShoppingBag, Settings, Database, AlertTriangle, Bell, X, MessageSquare } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useAlert } from '../context/AlertContext';
import { databases, DATABASE_ID } from '../lib/appwrite';
import '../pages/Admin.css';

const AdminLayout = () => {
    const { signOut } = useAuth();
    const location = useLocation();
    const { showConfirm, showAlert } = useAlert();
    const navigate = useNavigate();

    const [isSystemBlocked, setIsSystemBlocked] = useState(false);
    const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
    const [hasUnread, setHasUnread] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [modalNotification, setModalNotification] = useState(null);

    useEffect(() => {
        // Simulando o recebimento de uma notificação do Billing Admin após 3 segundos
        const timer = setTimeout(() => {
            const mockNotif = {
                $id: 'notif-' + new Date().getFullYear(),
                title: 'Aviso de Vencimento',
                message: 'Olá! Lembramos que sua fatura vence em breve. Evite interrupções no serviço!',
                date: new Date().toISOString()
            };
            
            const shownModals = JSON.parse(localStorage.getItem('shown_billing_modals') || '[]');
            const viewedNotifs = JSON.parse(localStorage.getItem('viewed_notifications') || '[]');
            setNotifications([mockNotif]);
            
            if (!viewedNotifs.includes(mockNotif.$id)) {
                setHasUnread(true);
            }

            if (!shownModals.includes(mockNotif.$id)) {
                setModalNotification(mockNotif);
            }
        }, 3000);
        return () => clearTimeout(timer);
    }, []);

    const closeNotificationModal = () => {
        if (modalNotification) {
            const shownModals = JSON.parse(localStorage.getItem('shown_billing_modals') || '[]');
            localStorage.setItem('shown_billing_modals', JSON.stringify([...shownModals, modalNotification.$id]));
            setModalNotification(null);
        }
    };

    const toggleNotifications = () => {
        const newState = !isNotificationsOpen;
        setIsNotificationsOpen(newState);
        
        if (newState && notifications.length > 0) {
            setHasUnread(false);
            const viewedNotifs = JSON.parse(localStorage.getItem('viewed_notifications') || '[]');
            const newViewed = [...new Set([...viewedNotifs, ...notifications.map(n => n.$id)])];
            localStorage.setItem('viewed_notifications', JSON.stringify(newViewed));
        }
    };

    useEffect(() => {
        const checkBlock = async () => {
            try {
                const doc = await databases.getDocument(DATABASE_ID, 'settings', 'system_blocked');
                setIsSystemBlocked(doc.value === 'true');
            } catch (e) {
                // ignore
            }
        };
        checkBlock();
        // Check every 10 seconds just in case
        const interval = setInterval(checkBlock, 10000);
        return () => clearInterval(interval);
    }, []);

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
                    <Link
                        to="/admin/settings"
                        className={`nav-link ${location.pathname.startsWith('/admin/settings') ? 'active' : ''}`}
                    >
                        <Settings size={28} /> <span className="nav-text">Configurações</span>
                    </Link>
                    <Link
                        to="/admin/platform"
                        className={`nav-link ${location.pathname.startsWith('/admin/platform') ? 'active' : ''}`}
                    >
                        <Database size={28} /> <span className="nav-text">Plataforma</span>
                    </Link>
                </nav>

                <div className="admin-actions">
                    <Link to="/" className="nav-link" title="Voltar para Loja">
                        <ArrowLeft size={25} /> <span className="nav-text">Loja</span>
                    </Link>
                    <button
                        onClick={toggleNotifications}
                        className={`nav-link ${isNotificationsOpen ? 'active' : ''}`}
                        title="Notificações"
                        style={{ cursor: 'pointer', background: 'transparent', border: 'none', position: 'relative' }}
                    >
                        <Bell size={25} />
                        {hasUnread && (
                            <span style={{ position: 'absolute', top: '5px', right: '5px', width: '8px', height: '8px', backgroundColor: '#ef4444', borderRadius: '50%' }}></span>
                        )}
                    </button>
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

            <main className="admin-content" style={{ position: 'relative' }}>
                {isSystemBlocked && location.pathname !== '/admin/platform' && (
                    <div style={{ position: 'absolute', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', padding: '20px', borderRadius: '8px' }}>
                        <div style={{ backgroundColor: '#141414', border: '1px solid #ff4444', borderRadius: '30px', padding: '40px', maxWidth: '450px', width: '100%', textAlign: 'center', boxShadow: '0 25px 50px -12px rgba(255,0,0,0.2)' }}>
                            <div style={{ color: '#ff4444', marginBottom: '20px', display: 'flex', justifyContent: 'center', animation: 'pulse 2s infinite' }}>
                                <AlertTriangle size={64} />
                            </div>
                            <h2 style={{ fontSize: '1.8rem', fontWeight: 900, color: '#fff', marginBottom: '15px' }}>Painel Bloqueado</h2>
                            <p style={{ color: '#aaa', fontSize: '1rem', lineHeight: 1.6, marginBottom: '30px' }}>
                                A gestão da Boutique foi interrompida automaticamente devido a pendências financeiras em seu plano.
                            </p>
                            <button 
                                onClick={() => navigate('/admin/platform?highlight=true')}
                                style={{ width: '100%', padding: '15px', borderRadius: '15px', backgroundColor: '#ef4444', color: '#fff', fontWeight: 'bold', fontSize: '1.1rem', border: 'none', cursor: 'pointer', boxShadow: '0 4px 14px 0 rgba(239, 68, 68, 0.39)', transition: 'transform 0.2s', display: 'block' }}
                                onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                                onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                            >
                                Pagar Agora
                            </button>
                        </div>
                    </div>
                )}
                
                <Outlet />

                {/* Lateral Notifications Drawer */}
                {isNotificationsOpen && (
                    <>
                        {/* Overlay backdrop to close on click outside */}
                        <div 
                            onClick={() => setIsNotificationsOpen(false)}
                            style={{ position: 'fixed', inset: 0, zIndex: 85, backgroundColor: 'transparent', cursor: 'default' }}
                        />
                        <div style={{ position: 'absolute', top: 0, right: 0, width: '380px', height: '100%', backgroundColor: '#0a0a0a', borderLeft: '1px solid #222', zIndex: 90, display: 'flex', flexDirection: 'column', boxShadow: '-10px 0 25px rgba(0,0,0,0.5)', transition: 'transform 0.3s ease-in-out' }}>
                            <div style={{ padding: '20px', borderBottom: '1px solid #222', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <Bell size={20} color="#a855f7" />
                                    <h3 style={{ margin: 0, color: '#fff', fontSize: '1.2rem', fontWeight: 'bold' }}>Notificações do Sistema</h3>
                                </div>
                                <button onClick={() => setIsNotificationsOpen(false)} style={{ background: 'transparent', border: 'none', color: '#666', cursor: 'pointer' }}><X size={20} /></button>
                            </div>
                            <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                {notifications.length === 0 ? (
                                    <p style={{ color: '#666', textAlign: 'center', marginTop: '40px' }}>Nenhuma notificação no momento.</p>
                                ) : (
                                    notifications.map(notif => (
                                        <div key={notif.$id} style={{ backgroundColor: '#141414', border: '1px solid #222', borderRadius: '15px', padding: '15px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                                                <MessageSquare size={16} color="#a855f7" />
                                                <h4 style={{ margin: 0, color: '#fff', fontSize: '0.95rem', fontWeight: 'bold' }}>{notif.title}</h4>
                                            </div>
                                            <p style={{ margin: 0, color: '#aaa', fontSize: '0.85rem', lineHeight: '1.4' }}>{notif.message}</p>
                                            <div style={{ marginTop: '10px', fontSize: '0.75rem', color: '#555', textAlign: 'right' }}>
                                                {new Date(notif.date).toLocaleDateString('pt-BR')} - {new Date(notif.date).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </>
                )}

                {/* Modal for new notification */}
                {modalNotification && (
                    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(5px)' }}>
                        <div style={{ backgroundColor: '#141414', border: '1px solid #a855f7', borderRadius: '25px', padding: '30px', maxWidth: '400px', width: '90%', boxShadow: '0 25px 50px -12px rgba(168, 85, 247, 0.25)', position: 'relative' }}>
                            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
                                <div style={{ backgroundColor: 'rgba(168, 85, 247, 0.1)', padding: '15px', borderRadius: '50%' }}>
                                    <Bell size={32} color="#a855f7" />
                                </div>
                            </div>
                            <h2 style={{ textAlign: 'center', color: '#fff', fontSize: '1.4rem', fontWeight: 'bold', marginBottom: '15px' }}>
                                {modalNotification.title}
                            </h2>
                            <p style={{ color: '#ccc', textAlign: 'center', fontSize: '1rem', lineHeight: '1.5', marginBottom: '30px' }}>
                                {modalNotification.message}
                            </p>
                            <button 
                                onClick={closeNotificationModal}
                                style={{ width: '100%', padding: '14px', backgroundColor: '#a855f7', color: '#fff', border: 'none', borderRadius: '12px', fontSize: '1rem', fontWeight: 'bold', cursor: 'pointer', transition: 'background 0.2s' }}
                                onMouseEnter={e => e.currentTarget.style.backgroundColor = '#9333ea'}
                                onMouseLeave={e => e.currentTarget.style.backgroundColor = '#a855f7'}
                            >
                                Ciente, fechar aviso
                            </button>
                        </div>
                    </div>
                )}
            </main>
        </div >
    );
};

export default AdminLayout;
