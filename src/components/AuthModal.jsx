import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useAlert } from '../context/AlertContext';
import { X, Mail, Lock, User, Phone, Calendar, LogIn, ArrowRight } from 'lucide-react';
import './AuthModal.css';

const AuthModal = () => {
    const {
        isAuthModalOpen,
        closeAuthModal,
        authModalView,
        setAuthModalView,
        signIn,
        signUp,
        signInWithGoogle,
        continueAsGuest,
        resetPassword
    } = useAuth();

    const { showAlert } = useAlert();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [phone, setPhone] = useState('');
    const [birthDate, setBirthDate] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [successMsg, setSuccessMsg] = useState('');

    // Reset form when view changes
    useEffect(() => {
        setError('');
    }, [authModalView, isAuthModalOpen]);

    if (!isAuthModalOpen) return null;

    const handlePhoneChange = (e) => {
        let value = e.target.value.replace(/\D/g, '');
        if (value.length > 11) value = value.slice(0, 11);

        let formatted = value;
        if (value.length > 2) formatted = `(${value.slice(0, 2)}) ${value.slice(2)}`;
        if (value.length > 7) formatted = `(${value.slice(0, 2)}) ${value.slice(2, 7)}-${value.slice(7)}`;

        setPhone(formatted);
    };

    const handleDateChange = (e) => {
        let value = e.target.value.replace(/\D/g, '');
        if (value.length > 8) value = value.slice(0, 8);

        let formatted = value;
        if (value.length > 2) formatted = `${value.slice(0, 2)}/${value.slice(2)}`;
        if (value.length > 4) formatted = `${value.slice(0, 2)}/${value.slice(2, 4)}/${value.slice(4)}`;

        setBirthDate(formatted);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccessMsg('');

        // Validation - Campo Obrigatório Modals
        if (!email) { showAlert('O campo E-mail é obrigatório.', 'error', 'Campo Obrigatório'); return; }
        if (authModalView !== 'forgot' && !password) { showAlert('O campo Senha é obrigatório.', 'error', 'Campo Obrigatório'); return; }
        if (authModalView === 'register') {
            if (!fullName) { showAlert('O campo Nome Completo é obrigatório.', 'error', 'Campo Obrigatório'); return; }
            if (!phone) { showAlert('O campo Celular é obrigatório.', 'error', 'Campo Obrigatório'); return; }
        }

        setLoading(true);

        try {
            if (authModalView === 'login') {
                const { error } = await signIn(email, password);
                if (error) throw error;
                if (error) throw error;
                closeAuthModal();
            } else if (authModalView === 'register') {
                // Convert DD/MM/YYYY to YYYY-MM-DD for DB
                let isoDate = null;
                if (birthDate.length === 10) {
                    const [day, month, year] = birthDate.split('/');
                    isoDate = `${year}-${month}-${day}`;
                }

                const { data, error } = await signUp(email, password, {
                    full_name: fullName,
                    phone: phone,
                    birth_date: isoDate
                });

                if (error) throw error;
                if (data?.user?.identities?.length === 0) {
                    showAlert('Este e-mail já está cadastrado.', 'error', 'Erro no Cadastro');
                } else {
                    showAlert('Cadastro realizado! Faça login para continuar.', 'success', 'Cadastro com Sucesso');
                    setTimeout(() => setAuthModalView('login'), 1500);
                }
            } else if (authModalView === 'forgot') {
                const { error } = await resetPassword(email);
                if (error) throw error;
                showAlert('E-mail de recuperação enviado.', 'success', 'Recuperação de Senha');
            }
        } catch (err) {
            console.error(err);
            const msg = err.message === 'Invalid login credentials' ? 'E-mail ou senha incorretos.' : err.message;
            showAlert(msg, 'error', 'Erro');
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <div className="auth-backdrop" onClick={closeAuthModal}>
                <div className="auth-modal" onClick={e => e.stopPropagation()}>
                    <div className="auth-header">
                        <h2>
                            {authModalView === 'login' && <><LogIn size={24} /> Entrar</>}
                            {authModalView === 'register' && <><User size={24} /> Criar Conta</>}
                            {authModalView === 'forgot' && <><Lock size={24} /> Recuperar Senha</>}
                        </h2>
                        <button className="close-auth" onClick={closeAuthModal}>
                            <X size={24} />
                        </button>
                    </div>

                    {authModalView !== 'forgot' && (
                        <div className="auth-tabs">
                            <button
                                className={`auth-tab ${authModalView === 'login' ? 'active' : ''}`}
                                onClick={() => setAuthModalView('login')}
                            >
                                Login
                            </button>
                            <button
                                className={`auth-tab ${authModalView === 'register' ? 'active' : ''}`}
                                onClick={() => setAuthModalView('register')}
                            >
                                Cadastro
                            </button>
                        </div>
                    )}

                    <div className="auth-content">
                        <form className="auth-form" onSubmit={handleSubmit} noValidate>
                            {authModalView === 'register' && (
                                <div className="form-group">
                                    <label>Nome Completo</label>
                                    <div className="input-icon-wrapper">
                                        <input
                                            type="text"
                                            className="auth-input"
                                            placeholder="Seu nome"
                                            value={fullName}
                                            onChange={e => setFullName(e.target.value)}
                                            style={{ width: '100%' }}
                                        />
                                    </div>
                                </div>
                            )}

                            <div className="form-group">
                                <label>E-mail</label>
                                <input
                                    type="email"
                                    className="auth-input"
                                    placeholder="seu@email.com"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                />
                            </div>

                            {authModalView !== 'forgot' && (
                                <div className="form-group">
                                    <label>Senha</label>
                                    <input
                                        type="password"
                                        className="auth-input"
                                        placeholder="******"
                                        value={password}
                                        onChange={e => setPassword(e.target.value)}
                                    />
                                </div>
                            )}

                            {authModalView === 'register' && (
                                <>
                                    <div className="form-group">
                                        <label>Celular</label>
                                        <input
                                            type="tel"
                                            className="auth-input"
                                            placeholder="(11) 99999-9999"
                                            value={phone}
                                            onChange={handlePhoneChange}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Data de Nascimento</label>
                                        <input
                                            type="text"
                                            className="auth-input"
                                            placeholder="DD/MM/AAAA"
                                            value={birthDate}
                                            onChange={handleDateChange}
                                        />
                                    </div>
                                </>
                            )}

                            <button type="submit" className="auth-submit-btn" disabled={loading}>
                                {loading ? 'Processando...' : (
                                    authModalView === 'login' ? 'Entrar' :
                                        authModalView === 'register' ? 'Cadastrar' : 'Enviar Link'
                                )}
                            </button>
                        </form>

                        {authModalView === 'login' && (
                            <div className="auth-footer">
                                <button className="auth-link" onClick={() => setAuthModalView('forgot')}>
                                    Esqueci minha senha
                                </button>

                                <div className="or-divider">OU</div>

                                <button type="button" className="google-btn" onClick={signInWithGoogle}>
                                    <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4" fillRule="evenodd" />
                                        <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.716H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853" fillRule="evenodd" />
                                        <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957C.347 6.173 0 7.547 0 9c0 1.453.347 2.827.957 4.042l3.007-2.332z" fill="#FBBC05" fillRule="evenodd" />
                                        <path d="M9 3.58c1.321 0 2.508.455 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.158 6.656 3.58 9 3.58z" fill="#EA4335" fillRule="evenodd" />
                                    </svg>
                                    Entrar com Google
                                </button>

                                <div className="modal-guest-option">
                                    <button className="guest-btn" onClick={continueAsGuest}>
                                        Continuar sem cadastro
                                        <ArrowRight size={14} style={{ marginLeft: 5, verticalAlign: 'middle' }} />
                                    </button>
                                </div>
                            </div>
                        )}

                        {authModalView === 'register' && (
                            <div className="auth-footer">
                                <button type="button" className="google-btn" onClick={signInWithGoogle}>
                                    <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4" fillRule="evenodd" />
                                        <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.716H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853" fillRule="evenodd" />
                                        <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957C.347 6.173 0 7.547 0 9c0 1.453.347 2.827.957 4.042l3.007-2.332z" fill="#FBBC05" fillRule="evenodd" />
                                        <path d="M9 3.58c1.321 0 2.508.455 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.158 6.656 3.58 9 3.58z" fill="#EA4335" fillRule="evenodd" />
                                    </svg>
                                    Cadastrar com Google
                                </button>

                                <div className="or-divider">OU</div>

                                <p>Já tem uma conta? <button className="auth-link" onClick={() => setAuthModalView('login')}>Fazer Login</button></p>
                            </div>
                        )}

                        {authModalView === 'forgot' && (
                            <div className="auth-footer">
                                <button className="auth-link" onClick={() => setAuthModalView('login')}>Voltar para Login</button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
};

export default AuthModal;
