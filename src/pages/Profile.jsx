import React from 'react';
import { useAuth } from '../context/AuthContext';
import Header from '../components/shop/Header';
import { User, Mail, MapPin, Phone, LogOut, Shield, Beer, Star, CreditCard, Calendar, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import './Profile.css';

const Profile = () => {
    const { user, profile, signOut, isAdmin, isOwner, role } = useAuth();
    const navigate = useNavigate();

    const getInitials = (name) => {
        if (!name) return 'W';
        return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
    };

    const firstName = user?.user_metadata?.full_name?.split(' ')[0] || 'Cliente';
    const lastName = user?.user_metadata?.full_name?.split(' ').slice(1).join(' ') || '';

    if (!user) {
        return (
            <div className="profile-page-container">
                <Header activeCategory="none" onCategoryChange={() => { }} />
                <main className="profile-content" style={{ textAlign: 'center', padding: '150px 24px' }}>
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        <h2 style={{ fontSize: '1.5rem', fontWeight: 900, marginBottom: '24px' }}>Identidade Wilson</h2>
                        <p style={{ color: '#666', marginBottom: '32px' }}>Acesse sua conta para visualizar seu perfil exclusivo e histórico de pedidos.</p>
                        <button 
                            onClick={() => navigate('/')}
                            className="btn-premium-action btn-admin-luxury"
                        >
                            ENTRAR NA CONTA
                        </button>
                    </motion.div>
                </main>
            </div>
        );
    }

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 }
    };

    return (
        <div className="profile-page-container">
            <Header activeCategory="none" onCategoryChange={() => { }} />
            
            <main className="profile-content">
                {/* Hero Section */}
                <section className="profile-hero">
                    <div className="avatar-wrapper">
                        <div className="avatar-ring"></div>
                        <div className="avatar-main">
                            {getInitials(user.user_metadata?.full_name)}
                        </div>
                        <div className="user-badge">
                            <Star size={14} fill="currentColor" />
                        </div>
                    </div>
                    <div className="hero-info">
                        <motion.h1 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                        >
                            Olá, {firstName}
                        </motion.h1>
                        <div className="membership-status">
                            {isAdmin || isOwner ? 'Membro Platinum' : 'Cliente Select'}
                        </div>
                    </div>
                </section>

                {/* Stats Grid */}
                <section className="profile-stats-grid">
                    <motion.div className="stat-card" whileHover={{ scale: 1.02 }}>
                        <span className="stat-value">0</span>
                        <span className="stat-label">Pedidos Realizados</span>
                    </motion.div>
                    <motion.div className="stat-card" whileHover={{ scale: 1.02 }}>
                        <span className="stat-value" style={{ color: '#22c55e' }}>R$ 0,00</span>
                        <span className="stat-label">Cashback Acumulado</span>
                    </motion.div>
                </section>

                {/* Info Sections */}
                <motion.div 
                    className="profile-sections"
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                >
                    {/* Personal Info */}
                    <motion.section className="section-group" variants={itemVariants}>
                        <div className="section-header">
                            <div className="section-icon"><User size={20} /></div>
                            <h3>Informações Pessoais</h3>
                        </div>
                        <div className="data-grid">
                            <div className="form-row">
                                <div className="data-item">
                                    <span className="data-label">Nome</span>
                                    <div className="data-value">{firstName}</div>
                                </div>
                                <div className="data-item">
                                    <span className="data-label">Sobrenome</span>
                                    <div className="data-value">{lastName || '---'}</div>
                                </div>
                            </div>
                            <div className="data-item">
                                <span className="data-label">Email</span>
                                <div className="data-value premium">
                                    <Mail size={16} />
                                    <span>{user.email}</span>
                                </div>
                            </div>
                            <div className="form-row">
                                <div className="data-item">
                                    <span className="data-label">WhatsApp</span>
                                    <div className="data-value">
                                        <Phone size={16} />
                                        <span>{profile?.whatsapp || '(00) 00000-0000'}</span>
                                    </div>
                                </div>
                                <div className="data-item">
                                    <span className="data-label">Aniversário</span>
                                    <div className="data-value">
                                        <Beer size={16} />
                                        <span>{profile?.birthday || '---'}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.section>

                    {/* Address Info */}
                    <motion.section className="section-group" variants={itemVariants}>
                        <div className="section-header">
                            <div className="section-icon"><MapPin size={20} /></div>
                            <h3>Endereço de Entrega</h3>
                        </div>
                        <div className="data-grid">
                            <div className="data-item">
                                <span className="data-label">Endereço Principal</span>
                                <div className="data-value">
                                    <MapPin size={16} />
                                    <span>{profile?.address || 'Nenhum endereço cadastrado'}</span>
                                </div>
                            </div>
                            {profile?.cep && (
                                <div className="form-row">
                                    <div className="data-item">
                                        <span className="data-label">CEP</span>
                                        <div className="data-value">{profile.cep}</div>
                                    </div>
                                    <div className="data-item">
                                        <span className="data-label">Bairro</span>
                                        <div className="data-value">{profile.neighborhood || '---'}</div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </motion.section>

                    {/* Preferences & Security */}
                    <motion.section className="section-group" variants={itemVariants}>
                        <div className="section-header">
                            <div className="section-icon"><Shield size={20} /></div>
                            <h3>Segurança & Acesso</h3>
                        </div>
                        <div className="data-grid">
                            <div className="data-item" onClick={() => navigate('/orders')} style={{ cursor: 'pointer' }}>
                                <div className="data-value" style={{ justifyContent: 'space-between' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <CreditCard size={16} />
                                        <span>Meus Pedidos</span>
                                    </div>
                                    <ChevronRight size={18} opacity={0.3} />
                                </div>
                            </div>
                        </div>
                    </motion.section>
                </motion.div>

                {/* Footer Actions */}
                <section className="profile-actions-bottom">
                    {(isAdmin || isOwner || role === 'owner' || role === 'master' || profile?.role === 'owner' || profile?.role === 'master' || profile?.role === 'admin') && (
                        <motion.button
                            whileTap={{ scale: 0.98 }}
                            onClick={() => navigate('/admin')}
                            className="btn-premium-action btn-admin-luxury"
                        >
                            <Shield size={20} /> ACESSAR PAINEL ADMIN
                        </motion.button>
                    )}
                    
                    <motion.button 
                        whileTap={{ scale: 0.98 }}
                        onClick={() => { signOut(); navigate('/'); }}
                        className="btn-premium-action btn-logout-luxury"
                    >
                        <LogOut size={20} /> ENCERRAR SESSÃO
                    </motion.button>

                    <div style={{ textAlign: 'center', marginTop: '20px' }}>
                        <span style={{ fontSize: '0.65rem', color: '#333', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '2px' }}>
                            Wilson Distribuidora · Est. 1994
                        </span>
                    </div>
                </section>
            </main>
        </div>
    );
};

export default Profile;
