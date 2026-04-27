import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useAlert } from '../../context/AlertContext';
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
        resetPassword,
        sharedCustomerData
    } = useAuth();

    const { showAlert } = useAlert();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [whatsapp, setWhatsapp] = useState('');
    const [birthDate, setBirthDate] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [successMsg, setSuccessMsg] = useState('');

    // Reset form when view changes
    useEffect(() => {
        setError('');
        // Auto-fill from shared data if available and we are registering
        if (isAuthModalOpen && authModalView === 'register') {
            if (sharedCustomerData.full_name && !fullName) setFullName(sharedCustomerData.full_name);
            if (sharedCustomerData.whatsapp && !whatsapp) {
                // Formata o whatsapp vindo do contexto
                let value = sharedCustomerData.whatsapp.replace(/\D/g, '');
                let formatted = value;
                if (value.length > 2) formatted = `(${value.slice(0, 2)}) ${value.slice(2)}`;
                if (value.length > 7) formatted = `(${value.slice(0, 2)}) ${value.slice(2, 7)}-${value.slice(7)}`;
                setWhatsapp(formatted);
            }
        }
    }, [authModalView, isAuthModalOpen, sharedCustomerData]);

    if (!isAuthModalOpen) return null;

    const handleWhatsAppChange = (e) => {
        let value = e.target.value.replace(/\D/g, '');
        if (value.length > 11) value = value.slice(0, 11);

        let formatted = value;
        if (value.length > 2) formatted = `(${value.slice(0, 2)}) ${value.slice(2)}`;
        if (value.length > 7) formatted = `(${value.slice(0, 2)}) ${value.slice(2, 7)}-${value.slice(7)}`;

        setWhatsapp(formatted);
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
            if (!whatsapp) { showAlert('O campo WhatsApp é obrigatório.', 'error', 'Campo Obrigatório'); return; }
            if (!birthDate) { showAlert('Churrasqueiro(a), sua data de aniversário é obrigatória para garantirmos seu presente! 🎂', 'error', 'Campo Obrigatório'); return; }
        }

        setLoading(true);

        try {
            if (authModalView === 'login') {
                if (password.length < 8) {
                    showAlert('A senha informada contém menos de 8 caracteres. Verifique e tente novamente.', 'error', 'Senha Inválida');
                    setLoading(false);
                    return;
                }
                const { error } = await signIn(email, password);
                if (error) throw error;
                closeAuthModal();
            } else if (authModalView === 'register') {
                // Client-side validation for password to avoid unnecessary server calls
                if (password.length < 8) {
                    showAlert('Churrasqueiro(a) A senha deve conter mais de 8 caracteres.', 'error', 'Senha Fraca');
                    setLoading(false);
                    return;
                }

                // Convert DD/MM/YYYY to YYYY-MM-DD for DB
                let isoDate = null;
                if (birthDate.length >= 10) {
                    const [day, month, year] = birthDate.split('/');
                    if (day && month && year && year.length === 4) {
                        isoDate = `${year}-${month}-${day}`;
                    }
                }

                // Prepare additional payload, omitting nulls to prevent 'Document payload is invalid' string matching errors from passing null
                const additionalPayload = {
                    full_name: fullName ? fullName.trim() : 'Perfil Cliente',
                    whatsapp: whatsapp ? whatsapp.trim() : ''
                };
                
                if (isoDate) {
                    additionalPayload.birthday = isoDate;
                }

                const { data, error } = await signUp(email.trim(), password, additionalPayload);

                if (error) throw error;

                if (data?.user?.identities?.length === 0) {
                    showAlert('Este e-mail já está cadastrado.', 'error', 'Erro no Cadastro');
                } else {
                    showAlert('Cadastro realizado! Faça login para continuar.', 'success', 'Cadastro com Sucesso', 1500);
                    setTimeout(() => setAuthModalView('login'), 1500);
                }
            } else if (authModalView === 'forgot') {
                const { error } = await resetPassword(email);
                if (error) throw error;
                showAlert('E-mail de recuperação enviado.', 'success', 'Recuperação de Senha', 1500);
            }
        } catch (err) {
            console.error('Auth Error Details:', err);

            let errorMsg = err.message || 'Houve um erro ao processar sua solicitação.';
            
            // Helpful translations for Appwrite errors
            if (errorMsg.includes('Invalid login credentials') || errorMsg.includes('Invalid credentials')) {
                errorMsg = 'E-mail ou senha incorretos.';
            } else if (errorMsg.includes('commonly used password')) {
                errorMsg = 'Esta senha é muito comum e fácil de descobrir. Por favor, tente uma senha mais forte.';
            } else if (errorMsg.includes('Password must be between 8')) {
                errorMsg = 'A senha deve conter no mínimo 8 caracteres.';
            } else if (errorMsg.includes('A user with the same email already exists')) {
                errorMsg = 'Já existe uma conta com este e-mail.';
            } else if (errorMsg.includes('Invalid `email` param') || errorMsg.includes('email is invalid')) {
                errorMsg = 'O endereço de e-mail informado não é válido.';
            } else if (errorMsg.includes('Rate limit exceeded')) {
                errorMsg = 'Muitas tentativas seguidas. Por favor, aguarde alguns minutos.';
            } else if (errorMsg.includes('Network Error') || errorMsg.includes('Failed to fetch')) {
                errorMsg = 'Erro de conexão. Verifique sua internet.';
            } else if (errorMsg.includes('There was an error processing your request')) {
                // Let's add the raw stringified error object to see which argument fails
                errorMsg = errorMsg + ' RAW: ' + JSON.stringify(err);
            }

            showAlert(errorMsg, 'error', 'Erro');
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <div className="auth-backdrop" onClick={closeAuthModal}>
                <div className="auth-modal" onClick={e => e.stopPropagation()}>
                    <div className="auth-header" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <div style={{ textAlign: 'center', width: '100%', marginBottom: '0.2rem' }}>
                            <div style={{ fontFamily: 'var(--font-heading)', fontSize: '1.8rem', color: 'var(--accent-color)', fontWeight: 'bold', lineHeight: 1 }}>WILSON</div>
                            <div style={{ fontFamily: 'var(--font-heading)', fontSize: '0.7rem', color: '#888', letterSpacing: '4px', textTransform: 'uppercase' }}>Distribuidora</div>
                        </div>
                        <button className="close-auth" onClick={closeAuthModal} style={{ position: 'absolute', right: '1rem', top: '1.5rem' }}>
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
                                        <label>WhatsApp</label>
                                        <input
                                            type="tel"
                                            className="auth-input"
                                            placeholder="(11) 99999-9999"
                                            value={whatsapp}
                                            onChange={handleWhatsAppChange}
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
                                {loading ? (
                                    <div className="btn-loading-wrapper">
                                        <div className="btn-spinner"></div>
                                        <span>Processando...</span>
                                    </div>
                                ) : (
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

                                <button type="button" className="google-btn" onClick={() => signInWithGoogle('login')}>
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
                                <button type="button" className="google-btn" onClick={() => signInWithGoogle('register')}>
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


