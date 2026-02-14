import React, { useState } from 'react';

import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import './Login.css';

const Login = () => {
    const { signIn, signInWithGoogle, user, loading: authLoading } = useAuth();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const navigate = useNavigate();

    // Redirect if already logged in
    React.useEffect(() => {
        if (!authLoading && user && !loginSuccess && !loading) {
            navigate('/');
        }
    }, [user, authLoading, navigate, loginSuccess, loading]);

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

            console.log("Login successful, redirecting...");
            navigate('/');

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

                    <div className="or-divider">ou</div>

                    <button
                        type="button"
                        className="google-btn"
                        onClick={() => signInWithGoogle()}
                        disabled={loading}
                    >
                        <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
                            <path d="M17.64 9.2045c0-.6381-.0573-1.2518-.1636-1.8409H9v3.4814h4.8436c-.2086 1.125-.8427 2.0782-1.7959 2.7164v2.2581h2.9087c1.7018-1.5668 2.6836-3.874 2.6836-6.615z" fill="#4285F4" />
                            <path d="M9 18c2.43 0 4.4673-.806 5.9564-2.18l-2.9087-2.2582c-.8059.54-1.8368.859-3.0477.859-2.344 0-4.3282-1.5831-5.036-3.7104H.9574v2.3318C2.4382 15.9832 5.4818 18 9 18z" fill="#34A853" />
                            <path d="M3.964 10.7105c-.18-.54-.2823-1.1168-.2823-1.7105s.1023-1.1705.2823-1.7105V4.9577H.9573C.3477 6.1705 0 7.5477 0 9s.3477 2.8295.9573 4.0423l3.0067-2.3318z" fill="#FBBC05" />
                            <path d="M9 3.5795c1.3214 0 2.5077.4541 3.4405 1.346l2.5813-2.5814C13.4632.8918 11.426 0 9 0 5.4818 0 2.4382 2.0168.9573 4.9577L3.964 7.2896c.7078-2.1273 2.692-3.7101 5.036-3.7101z" fill="#EA4335" />
                        </svg>
                        Entrar com Google
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
