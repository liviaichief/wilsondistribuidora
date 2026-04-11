import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, ArrowLeft, LogOut, ShoppingBag, Settings, Database, AlertTriangle, Bell, X, MessageSquare, Image as ImageIcon, ClipboardList, BookOpen } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useAlert } from '../context/AlertContext';
import { databases, DATABASE_ID } from '../lib/appwrite';
import { Client as AppwriteClient, Databases as AppwriteDatabases, Query as AppwriteQuery } from 'appwrite';
import '../pages/Admin.css';

const orchestratorClient = new AppwriteClient().setEndpoint('https://sfo.cloud.appwrite.io/v1').setProject('69c600d700288be4f750');
const orchestratorDb = new AppwriteDatabases(orchestratorClient);

const AdminLayout = () => {
    const { signOut, user, profile } = useAuth();
    const location = useLocation();
    const { showConfirm, showAlert } = useAlert();
    const navigate = useNavigate();

    const [isSystemBlocked, setIsSystemBlocked] = useState(false);
    const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const [notifications, setNotifications] = useState([]);
    const [modalNotification, setModalNotification] = useState(null);

    useEffect(() => {
        const fetchNotifs = async () => {
            try {
                const res = await orchestratorDb.listDocuments('admin_billing_db', 'notifications', [
                    AppwriteQuery.equal('system_id', 'boutique'),
                    AppwriteQuery.orderDesc('$createdAt'),
                    AppwriteQuery.limit(20)
                ]);
                const notifs = res.documents.map(n => ({
                    $id: n.$id,
                    title: n.title,
                    message: n.message,
                    date: n.$createdAt
                }));
                
                setNotifications(notifs);
                
                const viewedNotifs = JSON.parse(localStorage.getItem('viewed_notifications') || '[]');
                const shownModals = JSON.parse(localStorage.getItem('shown_billing_modals') || '[]');
                
                const unread = notifs.filter(n => !viewedNotifs.includes(n.$id));
                setUnreadCount(unread.length);
                
                // Só mostra o modal se a notificação MAIS RECENTE ainda não foi vista
                // Isso evita que o usuário tenha que fechar 10 modais seguidos se tiver muitas pendências
                if (notifs.length > 0) {
                    const latest = notifs[0];
                    if (!shownModals.includes(latest.$id) && !modalNotification && !isNotificationsOpen) {
                        setModalNotification(latest);
                    }
                }
            } catch (e) {
                console.warn("Nao foi possivel sincronizar as notificações in-app: ", e);
            }
        };

        fetchNotifs();
        const interval = setInterval(fetchNotifs, 60000); // Poll a cada 1 minuto (billing não muda tão rápido)
        return () => clearInterval(interval);
    }, [isNotificationsOpen]); // Removido modalNotification das dependências para evitar re-trigger ao fechar

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
            setUnreadCount(0);
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
            <aside className="admin-sidebar" style={{ zIndex: 100 }}>
                <div className="admin-brand-group" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%', padding: '20px 0' }}>
                    <div
                        onClick={() => navigate('/')}
                        style={{
                            cursor: 'pointer',
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            transition: 'transform 0.3s ease',
                            width: '100%'
                        }}
                        onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
                        onMouseLeave={e => e.currentTarget.style.transform = 'scale(1.0)'}
                        title="Voltar para a Loja"
                    >
                        <img src="/logo.png" alt="Wilson Distribuidora" style={{ height: '127px', maxWidth: '90%', objectFit: 'contain', filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.4))' }} />
                    </div>
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
                        to="/admin/catalogo"
                        className={`nav-link ${location.pathname.startsWith('/admin/catalogo') ? 'active' : ''}`}
                    >
                        <BookOpen size={28} /> <span className="nav-text">Catálogo</span>
                    </Link>
                    <Link
                        to="/admin/banners"
                        className={`nav-link ${location.pathname.startsWith('/admin/banners') ? 'active' : ''}`}
                    >
                        <ImageIcon size={28} /> <span className="nav-text">Banners</span>
                    </Link>
                    <Link
                        to="/admin/pedidos"
                        className={`nav-link ${location.pathname.startsWith('/admin/pedidos') ? 'active' : ''}`}
                    >
                        <ClipboardList size={28} /> <span className="nav-text">Pedidos</span>
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
                        to="/admin/financeiro"
                        className={`nav-link ${location.pathname.startsWith('/admin/financeiro') ? 'active' : ''}`}
                    >
                        <Database size={28} /> <span className="nav-text">Financeiro</span>
                    </Link>
                </nav>

                <div className="admin-actions">
                    <Link to="/" className="nav-link" title="Voltar para Loja">
                        <ArrowLeft size={25} /> <span className="nav-text">Loja</span>
                    </Link>


                </div>
            </aside>

            <main className="admin-content" style={{ position: 'relative' }}>
                <div style={{ 
                    position: 'absolute', 
                    top: '25px', 
                    right: '40px', 
                    zIndex: 150,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '20px'
                }}>
                    <button
                        onClick={toggleNotifications}
                        style={{ 
                            cursor: 'pointer', 
                            background: 'rgba(255, 255, 255, 0.05)', 
                            border: '1px solid rgba(255, 255, 255, 0.1)', 
                            borderRadius: '12px',
                            width: '45px',
                            height: '45px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: isNotificationsOpen ? '#a855f7' : '#fff',
                            position: 'relative',
                            transition: 'all 0.3s ease',
                            backdropFilter: 'blur(10px)'
                        }}
                        onMouseEnter={e => {
                            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                            e.currentTarget.style.borderColor = '#a855f7';
                        }}
                        onMouseLeave={e => {
                            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                        }}
                        title="Notificações"
                    >
                        <Bell size={22} />
                        {unreadCount > 0 && (
                            <span style={{ 
                                position: 'absolute', 
                                top: '-5px', 
                                right: '-5px', 
                                backgroundColor: '#ef4444', 
                                borderRadius: '10px', 
                                color: 'white', 
                                fontSize: '10px', 
                                fontWeight: 'bold', 
                                padding: '2px 6px', 
                                minWidth: '18px', 
                                textAlign: 'center',
                                boxShadow: '0 2px 4px rgba(0,0,0,0.3)'
                            }}>
                                {unreadCount}
                            </span>
                        )}
                    </button>

                    <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '15px',
                        background: 'rgba(255, 255, 255, 0.05)',
                        padding: '8px 15px',
                        borderRadius: '15px',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        backdropFilter: 'blur(10px)',
                        boxShadow: '0 4px 15px rgba(0,0,0,0.2)'
                    }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                            <span style={{ fontSize: '0.9rem', fontWeight: 800, color: '#fff', letterSpacing: '0.5px' }}>
                                {profile?.full_name || user?.full_name || 'Administrador'}
                            </span>
                            <span style={{ fontSize: '0.6rem', color: '#a855f7', textTransform: 'uppercase', fontWeight: 900, letterSpacing: '1.5px' }}>
                                Acesso Online
                            </span>
                        </div>
                        
                        <div style={{ width: '1px', height: '24px', background: 'rgba(255, 255, 255, 0.1)' }} />

                        <button
                            onClick={() => {
                                showConfirm(
                                    'Tem certeza que deseja sair do sistema agora?',
                                    async () => {
                                        await signOut();
                                        showAlert('Sessão finalizada com sucesso! 👋', 'success');
                                        setTimeout(() => window.location.href = '/login', 1500);
                                    },
                                    'Sair do Sistema',
                                    'Sim, Sair',
                                    'Cancelar'
                                );
                            }}
                            style={{ 
                                background: 'rgba(239, 68, 68, 0.1)', 
                                border: '1px solid rgba(239, 68, 68, 0.2)', 
                                color: '#ef4444', 
                                cursor: 'pointer',
                                width: '36px',
                                height: '36px',
                                borderRadius: '10px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                transition: 'all 0.3s ease'
                            }}
                            onMouseEnter={e => {
                                e.currentTarget.style.background = '#ef4444';
                                e.currentTarget.style.color = '#fff';
                                e.currentTarget.style.transform = 'scale(1.05)';
                            }}
                            onMouseLeave={e => {
                                e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
                                e.currentTarget.style.color = '#ef4444';
                                e.currentTarget.style.transform = 'scale(1.0)';
                            }}
                            title="Sair do Sistema"
                        >
                            <LogOut size={18} />
                        </button>
                    </div>
                </div>
                {isSystemBlocked && location.pathname !== '/admin/financeiro' && (
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
                                onClick={() => navigate('/admin/financeiro?highlight=true')}
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
                        <div style={{ position: 'fixed', top: 0, right: 0, width: '380px', height: '100vh', backgroundColor: '#0a0a0a', borderLeft: '1px solid #222', zIndex: 90, display: 'flex', flexDirection: 'column', boxShadow: '-10px 0 25px rgba(0,0,0,0.5)', transition: 'transform 0.3s ease-in-out' }}>
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
                                        <div 
                                            key={notif.$id} 
                                            onClick={() => setModalNotification(notif)}
                                            style={{ backgroundColor: '#141414', border: '1px solid #222', borderRadius: '15px', padding: '15px', cursor: 'pointer', transition: 'background-color 0.2s' }}
                                            onMouseEnter={e => e.currentTarget.style.backgroundColor = '#1f1f1f'}
                                            onMouseLeave={e => e.currentTarget.style.backgroundColor = '#141414'}
                                        >
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
