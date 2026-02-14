import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import './Login.css';

const Login = () => {
    const { signIn, user, loading: authLoading } = useAuth();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    // Redirect if already logged in
    React.useEffect(() => {
        if (!authLoading && user) {
            navigate('/admin');
        }
    }, [user, authLoading, navigate]);

    const handleLogin = async (e) => {
        e.preventDefault();
        if (!username || !password) {
            setError('Preencha e-mail e senha.');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const { error } = await signIn(username, password);
            if (error) throw error;

            // Note: AuthContext now sets the user state, 
            // the redirect will be handled by the useEffect above
            // as soon as the session is detected.
        } catch (error) {
            console.error("Login Error:", error);
            setError(error.message === 'Invalid login credentials'
                ? 'E-mail ou senha incorretos.'
                : error.message || 'Erro ao realizar login.');
            setLoading(false);
        }
    };



    return (
        <div className="login-container">
            <div className="login-box relative">
                {/* Close Button */}
                <button
                    onClick={() => navigate('/')}
                    className="absolute top-4 right-4 text-zinc-400 hover:text-white transition-colors"
                >
                    <span className="material-symbols-outlined">close</span>
                </button>

                <div className="login-header">
                    <Link to="/" title="Ir para o Site">
                        <img
                            src="/logo-3r.jpeg"
                            alt="3R Grill"
                            style={{
                                width: '100px',
                                height: '100px',
                                borderRadius: '50%',
                                border: '3px solid var(--primary-color)',
                                marginBottom: '1rem',
                                objectFit: 'cover',
                                transition: 'transform 0.2s'
                            }}
                            onMouseOver={e => e.target.style.transform = 'scale(1.05)'}
                            onMouseOut={e => e.target.style.transform = 'scale(1)'}
                        />
                    </Link>
                    <h2>Acesso Restrito</h2>
                </div>
                <form onSubmit={handleLogin}>
                    <div className="input-group">
                        <input
                            type="email"
                            placeholder="Email"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            disabled={loading}
                        />
                    </div>
                    <div className="input-group">
                        <input
                            type="password"
                            placeholder="Senha"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            disabled={loading}
                        />
                    </div>
                    {error && <p className="error-msg">{error}</p>}
                    <button
                        type="submit"
                        className={`login-btn ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                        disabled={loading}
                    >
                        {loading ? (
                            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                <span className="spinner-small"></span> Entrando...
                            </span>
                        ) : 'Entrar'}
                    </button>
                </form>
            </div>
            <style>{`
                .spinner-small {
                    width: 16px;
                    height: 16px;
                    border: 2px solid rgba(255,255,255,0.3);
                    border-radius: 50%;
                    border-top-color: #fff;
                    animation: spin 1s ease-in-out infinite;
                    display: inline-block;
                }
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
};

export default Login;
