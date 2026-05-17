import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, ArrowLeft, LogOut, ShoppingBag, Settings, Database, AlertTriangle, Bell, X, MessageSquare, Image as ImageIcon, ClipboardList, BookOpen, ChevronRight, Store, ExternalLink } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useAlert } from '../context/AlertContext';
import { databases, DATABASE_ID } from '../lib/appwrite';
import { Client as AppwriteClient, Databases as AppwriteDatabases, Query as AppwriteQuery } from 'appwrite';
import { APP_VERSION, BUILD_DATE } from '../version';
import { motion, AnimatePresence } from 'framer-motion';
import '../pages/Admin.css';

const orchestratorClient = new AppwriteClient()
    .setEndpoint(import.meta.env.VITE_APPWRITE_ENDPOINT || 'https://sfo.cloud.appwrite.io/v1')
    .setProject(import.meta.env.VITE_ORCHESTRATOR_PROJECT_ID || import.meta.env.VITE_APPWRITE_PROJECT_ID || '');
const orchestratorDb = new AppwriteDatabases(orchestratorClient);

const AdminLayout = () => {
    const { signOut, user, profile, role } = useAuth();
    const location = useLocation();
    const { showConfirm, showAlert } = useAlert();
    const navigate = useNavigate();

    const [isSystemBlocked, setIsSystemBlocked] = useState(false);
    const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const [notifications, setNotifications] = useState([]);
    const [modalNotification, setModalNotification] = useState(null);
    const [showVersionInfo, setShowVersionInfo] = useState(false);

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
                
                if (notifs.length > 0) {
                    const latest = notifs[0];
                    if (!shownModals.includes(latest.$id) && !modalNotification && !isNotificationsOpen) {
                        setModalNotification(latest);
                    }
                }
            } catch (e) {
                console.warn("Sync error:", e);
            }
        };

        fetchNotifs();
        const interval = setInterval(fetchNotifs, 60000);
        return () => clearInterval(interval);
    }, [isNotificationsOpen]);

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
            } catch (e) {}
        };
        checkBlock();
        // 5 min interval — system_blocked rarely changes; 10s was too aggressive for many concurrent admins
        const interval = setInterval(checkBlock, 5 * 60 * 1000);
        return () => clearInterval(interval);
    }, []);

    const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 1024);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const toggleVersionInfo = () => {
        setShowVersionInfo(true);
        setTimeout(() => setShowVersionInfo(false), 3000);
    };

    const allMenuItems = [
        { path: '/admin/dashboard',    icon: LayoutDashboard, label: 'Dashboard' },
        { path: '/admin',              icon: ShoppingBag,     label: 'Produtos' },
        { path: '/admin/catalogo',     icon: BookOpen,        label: 'Catálogo' },
        { path: '/admin/banners',      icon: ImageIcon,       label: 'Banners' },
        { path: '/admin/pedidos',      icon: ClipboardList,   label: 'Pedidos' },
        { path: '/admin/comunicacao',  icon: Bell,            label: 'Vitrini' },
        { path: '/admin/users',        icon: Users,           label: 'Usuários' },
        { path: '/admin/settings',     icon: Settings,        label: 'Configurações' },
        { path: '/admin/financeiro',   icon: Database,        label: 'Financeiro' },
    ];

    const adminOnlyPaths = ['/admin', '/admin/catalogo', '/admin/banners', '/admin/pedidos', '/admin/comunicacao', '/admin/users', '/admin/settings', '/admin/dashboard'];
    const menuItems = role === 'master'
        ? allMenuItems
        : allMenuItems.filter(item => adminOnlyPaths.includes(item.path));

    const sidebarWidth = isMobile ? '85px' : '320px';

    return (
        <div style={{ 
            display: 'flex', 
            flexDirection: isMobile ? 'column' : 'row',
            minHeight: '100vh', 
            backgroundColor: '#050505', 
            color: '#fff', 
            fontFamily: 'Inter, system-ui, sans-serif' 
        }}>
            {/* Sidebar - Hidden on Mobile */}
            {!isMobile && (
                <aside style={{ 
                    width: sidebarWidth, 
                    background: 'rgba(255, 255, 255, 0.02)', 
                    borderRight: '1px solid rgba(255, 255, 255, 0.05)', 
                    display: 'flex', 
                    flexDirection: 'column',
                    position: 'sticky',
                    top: 0,
                    height: '100vh',
                    zIndex: 100,
                    backdropFilter: 'blur(20px)',
                    transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                }}>
                    <div style={{ padding: '35px 30px 25px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            onClick={() => navigate('/')}
                            style={{
                                width: '140px',
                                height: '140px',
                                borderRadius: '50%',
                                overflow: 'hidden',
                                cursor: 'pointer',
                                flexShrink: 0,
                                filter: 'drop-shadow(0 8px 24px rgba(212,175,55,0.25))',
                                position: 'relative',
                                transition: 'all 0.3s'
                            }}
                        >
                            <img
                                src="/logo.png"
                                alt="Logo"
                                style={{
                                    width: '105%',
                                    height: '105%',
                                    objectFit: 'cover',
                                    objectPosition: 'center',
                                    position: 'absolute',
                                    top: '50%',
                                    left: '50%',
                                    transform: 'translate(-50%, -50%)'
                                }}
                            />
                        </motion.div>
                        <div style={{ fontSize: '0.65rem', color: '#333', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '2px' }}>Painel Admin</div>
                    </div>

                    <nav style={{ flex: 1, padding: '0 20px', overflowY: 'auto', overflowX: 'hidden' }}>
                        <div style={{ padding: '0 15px 15px', fontSize: '0.75rem', fontWeight: 900, color: '#444', textTransform: 'uppercase', letterSpacing: '2px' }}>Menu Principal</div>
                        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {menuItems.map((item) => {
                                const isActive = location.pathname === item.path || (item.path !== '/admin' && location.pathname.startsWith(item.path));
                                return (
                                    <li key={item.path}>
                                        <Link 
                                            to={item.path} 
                                            style={{ 
                                                display: 'flex', 
                                                alignItems: 'center', 
                                                justifyContent: 'flex-start',
                                                gap: '15px', 
                                                padding: '16px 20px', 
                                                borderRadius: '16px', 
                                                textDecoration: 'none', 
                                                color: isActive ? '#fff' : '#888',
                                                background: isActive ? 'linear-gradient(90deg, rgba(212, 175, 55, 0.15), rgba(212, 175, 55, 0.02))' : 'transparent',
                                                border: `1px solid ${isActive ? 'rgba(212, 175, 55, 0.2)' : 'transparent'}`,
                                                fontWeight: isActive ? 800 : 600,
                                                fontSize: '0.95rem',
                                                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                                            }}
                                            className="sidebar-link"
                                        >
                                            <item.icon size={22} color={isActive ? '#D4AF37' : 'currentColor'} strokeWidth={isActive ? 2.5 : 2} />
                                            <span style={{ flex: 1 }}>{item.label}</span>
                                            {isActive && <motion.div layoutId="activeDot" style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#D4AF37', boxShadow: '0 0 10px #D4AF37' }} />}
                                        </Link>
                                    </li>
                                );
                            })}
                        </ul>
                    </nav>

                    <div style={{ padding: '30px 30px 40px', borderTop: '1px solid rgba(255, 255, 255, 0.05)', background: 'rgba(5, 5, 5, 0.2)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <Link to="/" title="Ver Loja Pública" style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', gap: '12px', padding: '15px', borderRadius: '14px', background: 'rgba(212, 175, 55, 0.1)', color: '#D4AF37', textDecoration: 'none', fontWeight: 800, fontSize: '0.9rem', border: '1px solid rgba(212, 175, 55, 0.2)' }}>
                            <Store size={20} /> Ver Loja <ExternalLink size={14} />
                        </Link>
                        <button 
                            title="Sair do Sistema"
                            onClick={() => {
                                showConfirm('Deseja encerrar sua sessão?', async () => {
                                    await signOut();
                                    navigate('/login');
                                });
                            }}
                            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'flex-start', gap: '12px', padding: '15px', borderRadius: '14px', background: 'rgba(255,255,255,0.03)', color: '#aaa', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '0.9rem' }}
                        >
                            <LogOut size={20} /> Sair
                        </button>
                    </div>
                </aside>
            )}

            {/* Main Content Wrapper */}
            <main style={{ 
                flex: 1, 
                display: 'flex', 
                flexDirection: 'column', 
                height: isMobile ? 'calc(100vh - 75px)' : '100vh', 
                overflowY: 'auto', 
                position: 'relative',
                paddingBottom: isMobile ? '20px' : '0'
            }}>
                <header style={{ 
                    padding: isMobile ? '15px 20px' : '25px 40px', 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center', 
                    background: 'rgba(5, 5, 5, 0.8)', 
                    backdropFilter: 'blur(15px)', 
                    borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                    position: 'sticky',
                    top: 0,
                    zIndex: 90
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        {isMobile && (
                            <div 
                                onClick={() => navigate('/')}
                                style={{ width: '35px', height: '35px', borderRadius: '50%', overflow: 'hidden', border: '1px solid rgba(212,175,55,0.3)' }}
                            >
                                <img src="/logo.png" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            </div>
                        )}
                        <div 
                            onClick={() => { if (isMobile) toggleVersionInfo(); }}
                            style={{ 
                            fontWeight: 900, 
                            color: '#fff', 
                            fontSize: isMobile ? '1rem' : '1.4rem', 
                            textTransform: 'uppercase', 
                            letterSpacing: '-0.5px',
                            cursor: isMobile ? 'pointer' : 'default'
                        }}>
                            {isMobile ? 'Admin' : 'Painel Executivo'}
                        </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '12px' : '25px' }}>
                        <Link 
                            to="/"
                            title="Voltar a Área do Cliente"
                            style={{ 
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                background: 'rgba(212, 175, 55, 0.1)', 
                                border: '1px solid rgba(212, 175, 55, 0.3)',
                                color: '#D4AF37', 
                                padding: isMobile ? '8px 12px' : '10px 16px', 
                                borderRadius: '12px', 
                                cursor: 'pointer',
                                textDecoration: 'none',
                                fontSize: isMobile ? '0.75rem' : '0.9rem',
                                fontWeight: 800
                            }}
                        >
                            <Store size={isMobile ? 16 : 18} />
                            {!isMobile && <span>Ver Loja</span>}
                        </Link>

                        <button 
                            onClick={toggleNotifications}
                            style={{ 
                                position: 'relative', 
                                background: 'rgba(255,255,255,0.05)', 
                                border: 'none', 
                                color: '#fff', 
                                padding: isMobile ? '10px' : '12px', 
                                borderRadius: '12px', 
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}
                        >
                            <Bell size={isMobile ? 18 : 22} />
                            {unreadCount > 0 && (
                                <span style={{ position: 'absolute', top: '-5px', right: '-5px', background: '#ef4444', color: '#fff', fontSize: '0.6rem', fontWeight: 900, width: '18px', height: '18px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #050505' }}>
                                    {unreadCount}
                                </span>
                            )}
                        </button>

                        <div 
                            onClick={() => { if (!isMobile) toggleVersionInfo(); }}
                            style={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: isMobile ? '8px' : '15px', 
                                cursor: isMobile ? 'default' : 'pointer', 
                                padding: isMobile ? '4px 4px 4px 10px' : '8px 16px', 
                                background: 'rgba(255,255,255,0.03)', 
                                borderRadius: '16px', 
                                border: '1px solid rgba(255,255,255,0.05)' 
                            }}
                        >
                            {!isMobile && (
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ color: '#fff', fontWeight: 800, fontSize: '0.9rem' }}>{profile?.full_name || 'Administrador'}</div>
                                    <div style={{ color: '#22c55e', fontSize: '0.75rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#22c55e' }} /> Online
                                    </div>
                                </div>
                            )}
                            <div style={{ 
                                width: isMobile ? '32px' : '40px', 
                                height: isMobile ? '32px' : '40px', 
                                borderRadius: '10px', 
                                background: 'rgba(212, 175, 55, 0.15)', 
                                color: '#D4AF37', 
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'center', 
                                fontWeight: 900, 
                                fontSize: isMobile ? '0.9rem' : '1.2rem' 
                            }}>
                                {(profile?.full_name || 'A').charAt(0).toUpperCase()}
                            </div>
                        </div>
                    </div>
                </header>

                <div style={{ flex: 1, position: 'relative' }}>
                    {isSystemBlocked && location.pathname !== '/admin/financeiro' && (
                        <div style={{ position: 'absolute', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)', padding: '20px' }}>
                            <motion.div 
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                style={{ backgroundColor: '#141414', border: '1px solid #ff4444', borderRadius: '35px', padding: isMobile ? '30px' : '50px', maxWidth: '500px', width: '100%', textAlign: 'center', boxShadow: '0 40px 100px rgba(255,0,0,0.2)' }}
                            >
                                <div style={{ color: '#ff4444', marginBottom: '25px', display: 'flex', justifyContent: 'center' }}>
                                    <AlertTriangle size={isMobile ? 60 : 80} />
                                </div>
                                <h2 style={{ fontSize: isMobile ? '1.6rem' : '2.2rem', fontWeight: 900, color: '#fff', marginBottom: '20px', letterSpacing: '-1px' }}>Acesso Interrompido</h2>
                                <p style={{ color: '#888', fontSize: isMobile ? '0.95rem' : '1.1rem', lineHeight: 1.6, marginBottom: '40px' }}>
                                    O painel administrativo foi bloqueado devido a pendências no licenciamento do software.
                                </p>
                                <button 
                                    onClick={() => navigate('/admin/financeiro?highlight=true')}
                                    style={{ width: '100%', padding: '20px', borderRadius: '20px', backgroundColor: '#ef4444', color: '#fff', fontWeight: 900, fontSize: '1.2rem', border: 'none', cursor: 'pointer', boxShadow: '0 20px 40px rgba(239, 68, 68, 0.3)', transition: 'all 0.3s' }}
                                >
                                    REGULARIZAR AGORA
                                </button>
                            </motion.div>
                        </div>
                    )}
                    
                    <div style={{ padding: isMobile ? '16px 0' : '40px' }}>
                        <Outlet />
                    </div>
                </div>

                {/* Notifications Drawer */}
                <AnimatePresence>
                    {isNotificationsOpen && (
                        <>
                            <motion.div 
                                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                onClick={() => setIsNotificationsOpen(false)}
                                style={{ position: 'fixed', inset: 0, zIndex: 190, backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(5px)' }}
                            />
                            <motion.div 
                                initial={{ x: 400 }} animate={{ x: 0 }} exit={{ x: 400 }}
                                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                                style={{ 
                                    position: 'fixed', 
                                    top: 0, 
                                    right: 0, 
                                    width: isMobile ? '100%' : '400px', 
                                    height: '100vh', 
                                    backgroundColor: '#0a0a0a', 
                                    borderLeft: '1px solid rgba(255,255,255,0.05)', 
                                    zIndex: 200, 
                                    display: 'flex', 
                                    flexDirection: 'column', 
                                    boxShadow: '-20px 0 50px rgba(0,0,0,0.5)' 
                                }}
                            >
                                <div style={{ padding: '30px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <div style={{ padding: '8px', borderRadius: '10px', background: 'rgba(212, 175, 55, 0.1)', color: '#D4AF37' }}>
                                            <Bell size={24} />
                                        </div>
                                        <h3 style={{ margin: 0, color: '#fff', fontSize: '1.4rem', fontWeight: 800 }}>Notificações</h3>
                                    </div>
                                    <button onClick={() => setIsNotificationsOpen(false)} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: '#666', cursor: 'pointer', padding: '8px', borderRadius: '10px' }}><X size={20} /></button>
                                </div>
                                <div style={{ flex: 1, overflowY: 'auto', padding: '25px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                    {notifications.length === 0 ? (
                                        <div style={{ textAlign: 'center', marginTop: '100px', color: '#444' }}>
                                            <Bell size={48} style={{ opacity: 0.1, marginBottom: '15px' }} />
                                            <p style={{ fontWeight: 700 }}>Nenhuma novidade por aqui.</p>
                                        </div>
                                    ) : (
                                        notifications.map(notif => (
                                            <motion.div 
                                                key={notif.$id} 
                                                whileHover={{ x: -5 }}
                                                onClick={() => setModalNotification(notif)}
                                                style={{ backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '20px', padding: '20px', cursor: 'pointer' }}
                                            >
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                                                    <MessageSquare size={16} color="#D4AF37" />
                                                    <h4 style={{ margin: 0, color: '#fff', fontSize: '1rem', fontWeight: 800 }}>{notif.title}</h4>
                                                </div>
                                                <p style={{ margin: 0, color: '#888', fontSize: '0.9rem', lineHeight: '1.5' }}>{notif.message}</p>
                                                <div style={{ marginTop: '15px', fontSize: '0.7rem', color: '#444', fontWeight: 900, textAlign: 'right', textTransform: 'uppercase' }}>
                                                    {new Date(notif.date).toLocaleDateString('pt-BR')} - {new Date(notif.date).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}
                                                </div>
                                            </motion.div>
                                        ))
                                    )}
                                </div>
                            </motion.div>
                        </>
                    )}
                </AnimatePresence>

                {/* Modal for new notification */}
                <AnimatePresence>
                    {modalNotification && (
                        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)', padding: '20px' }}>
                            <motion.div 
                                initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
                                style={{ backgroundColor: '#141414', border: '1px solid rgba(212, 175, 55, 0.3)', borderRadius: '35px', padding: isMobile ? '30px' : '45px', maxWidth: '450px', width: '100%', boxShadow: '0 40px 100px rgba(0,0,0,0.8)', position: 'relative' }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '30px' }}>
                                    <div style={{ backgroundColor: 'rgba(212, 175, 55, 0.1)', padding: '20px', borderRadius: '50%' }}>
                                        <Bell size={40} color="#D4AF37" />
                                    </div>
                                </div>
                                <h2 style={{ textAlign: 'center', color: '#fff', fontSize: isMobile ? '1.5rem' : '1.8rem', fontWeight: 900, marginBottom: '20px', letterSpacing: '-1px' }}>
                                    {modalNotification.title}
                                </h2>
                                <p style={{ color: '#aaa', textAlign: 'center', fontSize: isMobile ? '1rem' : '1.1rem', lineHeight: '1.6', marginBottom: '40px' }}>
                                    {modalNotification.message}
                                </p>
                                <button 
                                    onClick={closeNotificationModal}
                                    style={{ width: '100%', padding: '20px', backgroundColor: '#fff', color: '#000', border: 'none', borderRadius: '18px', fontSize: '1.1rem', fontWeight: 900, cursor: 'pointer', transition: 'all 0.3s' }}
                                >
                                    ENTENDIDO
                                </button>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>

                {/* Version Info Modal */}
                <AnimatePresence>
                    {showVersionInfo && (
                        <div style={{ position: 'fixed', inset: 0, zIndex: 2000, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: '20px', pointerEvents: 'none' }}>
                            <motion.div 
                                initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -20, opacity: 0 }}
                                style={{ backgroundColor: 'rgba(20, 20, 20, 0.95)', backdropFilter: 'blur(20px)', border: '1px solid rgba(212, 175, 55, 0.4)', borderRadius: '12px', padding: '8px 18px', textAlign: 'center', boxShadow: '0 15px 40px rgba(0,0,0,0.8)', pointerEvents: 'auto' }}
                            >
                                <div style={{ color: '#fff', fontSize: '0.85rem', fontWeight: 900, marginBottom: '2px' }}>{APP_VERSION}</div>
                                <div style={{ color: '#666', fontSize: '0.55rem', fontWeight: 600 }}>Build: {BUILD_DATE}</div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>

                {isMobile && (
                    <nav className="admin-mobile-nav" style={{ 
                        position: 'fixed', 
                        bottom: 0, 
                        left: 0, 
                        right: 0, 
                        height: '75px', 
                        background: 'rgba(5, 5, 5, 0.9)', 
                        backdropFilter: 'blur(20px)', 
                        borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'flex-start',
                        gap: '20px',
                        padding: '0 20px',
                        zIndex: 100,
                        overflowX: 'auto',
                        WebkitOverflowScrolling: 'touch'
                    }}>
                        {menuItems.map((item) => {
                            const isActive = location.pathname === item.path || (item.path !== '/admin' && location.pathname.startsWith(item.path));
                            return (
                                <Link 
                                    key={item.path}
                                    to={item.path} 
                                    style={{ 
                                        display: 'flex', 
                                        flexDirection: 'column',
                                        alignItems: 'center', 
                                        gap: '6px', 
                                        textDecoration: 'none', 
                                        color: isActive ? '#D4AF37' : '#555',
                                        transition: 'all 0.3s',
                                        flexShrink: 0
                                    }}
                                >
                                    <div style={{ 
                                        padding: '8px 16px', 
                                        borderRadius: '12px',
                                        background: isActive ? 'rgba(212, 175, 55, 0.1)' : 'transparent',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}>
                                        <item.icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                                    </div>
                                    <span style={{ fontSize: '0.6rem', fontWeight: 800, textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{item.label}</span>
                                </Link>
                            );
                        })}
                    </nav>
                )}
                
                <style>{`
                    .sidebar-link:hover { background: rgba(255,255,255,0.05) !important; color: #fff !important; }
                    ::-webkit-scrollbar { width: 8px; }
                    ::-webkit-scrollbar-track { background: transparent; }
                    ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.05); borderRadius: 10px; }
                    ::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.1); }
                    .admin-mobile-nav::-webkit-scrollbar { display: none; }
                    .admin-mobile-nav { -ms-overflow-style: none; scrollbar-width: none; }
                `}</style>
            </main>
        </div >
    );
};

export default AdminLayout;
