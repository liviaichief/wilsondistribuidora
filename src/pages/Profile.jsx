import React from 'react';
import { useAuth } from '../context/AuthContext';
import Header from '../components/shop/Header';
import { User, Mail, MapPin, Phone, LogOut, Shield, Beer } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import './Profile.css';

const Profile = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = React.useState('geral');

    if (!user) {
        return (
            <div className="profile-page-container">
                <Header activeCategory="none" onCategoryChange={() => { }} />
                <main className="profile-content" style={{ textAlign: 'center', padding: '100px 20px' }}>
                    <h2 style={{ color: '#fff' }}>Acesse sua conta para ver o perfil</h2>
                    <button 
                        onClick={() => navigate('/')}
                        className="btn-profile-primary"
                        style={{ marginTop: '20px', width: 'auto', padding: '12px 30px' }}
                    >
                        VOLTAR PARA A LOJA
                    </button>
                </main>
            </div>
        );
    }

    return (
        <div className="profile-page-container">
            <Header activeCategory="none" onCategoryChange={() => { }} />
            
            <main className="profile-content">
                <div className="profile-tabs">
                    <button 
                        className={`tab-btn ${activeTab === 'geral' ? 'active' : ''}`}
                        onClick={() => setActiveTab('geral')}
                    >
                        <User size={18} /> Geral
                    </button>
                    <button 
                        className={`tab-btn ${activeTab === 'dados' ? 'active' : ''}`}
                        onClick={() => setActiveTab('dados')}
                    >
                        <MapPin size={18} /> Meus Dados
                    </button>
                </div>

                <div className="admin-access-container">
                    <button 
                        onClick={() => navigate('/admin')} 
                        className="btn-admin-access"
                    >
                        <Shield size={16} /> ÁREA DE ADMIN
                    </button>
                </div>

                <div className="tab-content">
                    <div className="profile-card">
                        {activeTab === 'geral' ? (
                            <motion.div 
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                key="geral"
                            >
                                <div className="profile-name-header">
                                    <h2>{user.name}</h2>
                                </div>
                            </motion.div>
                        ) : (
                            <motion.div 
                                initial={{ opacity: 0, x: 10 }}
                                animate={{ opacity: 1, x: 0 }}
                                key="dados"
                            >
                                <div className="meus-dados-container">
                                    <div className="form-row">
                                        <div className="form-group">
                                            <label>Nome</label>
                                            <div className="input-mock">{user.user_metadata?.full_name?.split(' ')[0] || '---'}</div>
                                        </div>
                                        <div className="form-group">
                                            <label>Sobrenome</label>
                                            <div className="input-mock">{user.user_metadata?.full_name?.split(' ').slice(1).join(' ') || '---'}</div>
                                        </div>
                                    </div>

                                    <div className="form-row">
                                        <div className="form-group">
                                            <label>WhatsApp</label>
                                            <div className="input-mock has-icon">
                                                <Phone size={16} /> <span>{user.phone || '(00) 00000-0000'}</span>
                                            </div>
                                        </div>
                                        <div className="form-group">
                                            <label>Data de Aniversário</label>
                                            <div className="input-mock has-icon">
                                                <Beer size={16} /> <span>{user.prefs?.birth_date || 'DD/MM/AAAA'}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <h3 className="section-title-red">Endereço Padrão (Opcional)</h3>

                                    <div className="form-row address-row-1">
                                        <div className="form-group cep-group">
                                            <label>CEP</label>
                                            <div className="input-mock">{user.prefs?.cep || '00000-000'}</div>
                                        </div>
                                        <div className="form-group rua-group">
                                            <label>Rua/Logradouro</label>
                                            <div className="input-mock">{user.prefs?.address || '---'}</div>
                                        </div>
                                    </div>

                                    <div className="form-row">
                                        <div className="form-group">
                                            <label>Número</label>
                                            <div className="input-mock">{user.prefs?.number || '---'}</div>
                                        </div>
                                        <div className="form-group">
                                            <label>Bairro</label>
                                            <div className="input-mock">{user.prefs?.neighborhood || '---'}</div>
                                        </div>
                                    </div>

                                    <div className="form-group full-width">
                                        <label>Complemento/Ponto de Referência</label>
                                        <div className="input-mock">{user.prefs?.complement || 'Apto, Bloco, etc.'}</div>
                                    </div>

                                    <div className="form-group full-width email-readonly">
                                        <label>Email (Somente Leitura)</label>
                                        <div className="input-mock readonly">{user.email}</div>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </div>
                </div>

                <div className="profile-footer-fixed">
                    <button onClick={() => { logout(); navigate('/'); }} className="btn-profile-logout">
                        <LogOut size={20} /> SAIR DA CONTA
                    </button>
                </div>
            </main>
        </div>
    );
};

export default Profile;
