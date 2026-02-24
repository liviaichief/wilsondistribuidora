import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useAlert } from '../context/AlertContext';
import { Lock, Loader2, X } from 'lucide-react';

const ResetPassword = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { confirmPasswordReset, openAuthModal } = useAuth();
    const { showAlert } = useAlert();

    const [userId, setUserId] = useState('');
    const [secret, setSecret] = useState('');

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const id = searchParams.get('userId');
        const sec = searchParams.get('secret');

        if (!id || !sec) {
            showAlert('Link de redefinição inválido ou expirado.', 'error');
            navigate('/');
        } else {
            setUserId(id);
            setSecret(sec);

            // Validação instantânea (probe): Tentativa de envio com senhas propositalmente diferentes.
            // Se o token estiver vencido/usado, o Appwrite vai retornar erro "Invalid token" antes do erro de "senhas não conferem".
            (async () => {
                const { error } = await confirmPasswordReset(id, sec, 'ProbePass123@', 'ProbeMismatch456#');
                if (error && error.message && error.message.includes('Invalid token')) {
                    showAlert('Este link de recuperação já foi utilizado ou está expirado. Por favor, solicite um novo na página de login.', 'error');
                    navigate('/');
                }
            })();
        }
    }, [searchParams, navigate, showAlert]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (password.length < 8) {
            showAlert('A nova senha deve ter pelo menos 8 caracteres.', 'warning');
            return;
        }

        if (password !== confirmPassword) {
            showAlert('As senhas não coincidem.', 'error');
            return;
        }

        setLoading(true);

        try {
            const { error } = await confirmPasswordReset(userId, secret, password, confirmPassword);

            if (error) {
                let msg = 'Erro ao redefinir a senha. O link pode ter expirado ou já foi utilizado.';
                if (error.message) {
                    if (error.message.includes('Invalid token')) {
                        msg = 'Este link de recuperação já foi utilizado ou está expirado. Por favor, solicite um novo na página de login.';
                    } else if (error.message.includes('Password must be between 8')) {
                        msg = 'A senha deve conter no mínimo 8 caracteres.';
                    } else if (error.message.includes('commonly used password')) {
                        msg = 'Esta senha é muito comum e fácil de descobrir. Por favor, tente uma senha mais forte.';
                    } else {
                        msg = error.message;
                    }
                }
                showAlert(msg, 'error');
            } else {
                showAlert('Senha redefinida com sucesso! Faça login com a sua nova senha.', 'success', 'Tudo certo!', 2000);
                navigate('/');
                setTimeout(() => {
                    openAuthModal('login');
                }, 500); // Give navigate a slight moment to transition
            }
        } catch (err) {
            console.error('Reset Password Exception:', err);
            showAlert('Erro inesperado ao redefinir a senha.', 'error');
        } finally {
            setLoading(false);
        }
    };

    if (!userId || !secret) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '100px 20px', minHeight: '60vh' }}>
                <Loader2 className="animate-spin" size={32} color="var(--primary-color)" />
            </div>
        );
    }

    return (
        <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '80vh',
            padding: '20px',
            backgroundColor: 'var(--bg-primary)'
        }}>
            <div style={{
                backgroundColor: 'var(--bg-secondary)',
                padding: '40px',
                borderRadius: '12px',
                boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
                width: '100%',
                maxWidth: '400px',
                border: '1px solid rgba(212, 175, 55, 0.2)',
                position: 'relative'
            }}>
                <button
                    onClick={() => navigate('/')}
                    style={{
                        position: 'absolute',
                        top: '15px',
                        right: '15px',
                        background: 'none',
                        border: 'none',
                        color: 'var(--text-muted)',
                        cursor: 'pointer',
                        padding: '5px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: '50%',
                        transition: 'background-color 0.2s',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    title="Fechar"
                >
                    <X size={24} />
                </button>

                <div style={{ textAlign: 'center', marginBottom: '30px', marginTop: '10px' }}>
                    <div style={{
                        backgroundColor: 'rgba(212, 175, 55, 0.1)',
                        width: '64px',
                        height: '64px',
                        borderRadius: '50%',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        margin: '0 auto 15px',
                        color: 'var(--primary-color)'
                    }}>
                        <Lock size={32} />
                    </div>
                    <h2 style={{ color: 'var(--text-primary)', margin: 0, fontSize: '1.5rem' }}>Redefinir Senha</h2>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '10px' }}>
                        Crie uma nova senha para acessar sua conta.
                    </p>
                </div>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <label style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: '500' }}>
                            Nova Senha
                        </label>
                        <input
                            type="password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Mínimo 8 caracteres"
                            style={{
                                padding: '12px 15px',
                                borderRadius: '8px',
                                border: '1px solid #444',
                                backgroundColor: '#121212',
                                color: 'var(--text-primary)',
                                outline: 'none',
                                fontSize: '1rem'
                            }}
                            onFocus={(e) => e.target.style.borderColor = 'var(--primary-color)'}
                            onBlur={(e) => e.target.style.borderColor = '#444'}
                        />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <label style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: '500' }}>
                            Confirmar Nova Senha
                        </label>
                        <input
                            type="password"
                            required
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Repita a nova senha"
                            style={{
                                padding: '12px 15px',
                                borderRadius: '8px',
                                border: '1px solid #444',
                                backgroundColor: '#121212',
                                color: 'var(--text-primary)',
                                outline: 'none',
                                fontSize: '1rem'
                            }}
                            onFocus={(e) => e.target.style.borderColor = 'var(--primary-color)'}
                            onBlur={(e) => e.target.style.borderColor = '#444'}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        style={{
                            marginTop: '10px',
                            backgroundColor: 'var(--primary-color)',
                            color: '#000',
                            fontWeight: 'bold',
                            border: 'none',
                            padding: '14px',
                            borderRadius: '8px',
                            fontSize: '1rem',
                            cursor: loading ? 'not-allowed' : 'pointer',
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            gap: '10px',
                            transition: 'opacity 0.2s',
                            opacity: loading ? 0.7 : 1
                        }}
                    >
                        {loading && <Loader2 size={18} className="animate-spin" />}
                        {loading ? 'Salvando...' : 'Atualizar Senha'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ResetPassword;
