import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, allowedRoles }) => {
    const { user, loading, role } = useAuth();

    // Accept allowedRoles as prop
    // allowedRoles can be an array of strings, e.g., ['admin', 'owner']
    // If not provided, it just checks for authentication (existing behavior)

    if (loading) {
        return (
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100vh',
                flexDirection: 'column',
                gap: '1rem'
            }}>
                <div className="loading-spinner"></div>
                <p>Verificando permissões...</p>
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/login" replace />;
        /* 
        return (
            <div style={{ padding: '20px', color: 'white', backgroundColor: '#111', height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                <h2 style={{ color: '#ff4444' }}>Debug: Acesso Negado (Não autenticado)</h2>
                <p>O sistema não detectou um usuário logado.</p>
                <div style={{ textAlign: 'left', background: '#222', padding: '10px', borderRadius: '5px' }}>
                    <pre>Loading status: {String(loading)}</pre>
                </div>
                <a href="/login" style={{ color: '#D4AF37', textDecoration: 'underline' }}>Ir para Login Manualmente</a>
            </div>
        ); 
        */
    }

    // Role check
    if (allowedRoles && Array.isArray(allowedRoles) && allowedRoles.length > 0) {
        const userRole = role || 'client'; // Default to client if undefined
        if (!allowedRoles.includes(userRole)) {
            // User is logged in but doesn't have permission
            return (
                <div style={{ padding: '20px', color: 'white', backgroundColor: '#111', height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                    <h2 style={{ color: '#ffaa00' }}>Acesso Restrito</h2>
                    <p>Esta área é exclusiva para Administradores.</p>
                    <div style={{ textAlign: 'left', background: '#222', padding: '20px', borderRadius: '5px', minWidth: '300px' }}>
                        <p><strong>Usuário:</strong> <span style={{ color: '#fff' }}>{user.email}</span></p>
                        <p><strong>Permissão:</strong> <span style={{ color: userRole === 'admin' ? '#4CAF50' : '#ff4444' }}>{userRole}</span></p>
                        <div style={{ marginTop: '10px', fontSize: '0.8rem', color: '#666' }}>
                            ID: {user.id}
                        </div>
                    </div>

                    <button
                        onClick={() => window.location.reload()}
                        style={{ background: 'transparent', border: '1px solid #444', color: '#888', padding: '5px 10px', marginTop: '10px', cursor: 'pointer' }}
                    >
                        Forçar Atualização da Página
                    </button>
                    <p style={{ fontSize: '0.9rem', color: '#888' }}>Se você deveria ter acesso, contate o suporte ou entre com uma conta administrativa.</p>

                    <a href="/" style={{ color: '#D4AF37', marginTop: '20px', textDecoration: 'none', border: '1px solid #D4AF37', padding: '10px 20px', borderRadius: '5px' }}>Voltar para Home</a>
                </div>
            );
        }
    }

    return children;
};

export default ProtectedRoute;
