import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const ProtectedRoute = ({ children, allowedRoles }) => {
    const { user, loading, role } = useAuth();

    if (loading) {
        return (
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100vh',
                flexDirection: 'column',
                gap: '1.5rem',
                backgroundColor: '#121212',
                color: 'white'
            }}>
                <div className="loading-spinner"></div>
                <div style={{ textAlign: 'center' }}>
                    <p style={{ margin: 0, fontWeight: 'bold' }}>Verificando permissões...</p>
                    <small style={{ color: '#666' }}>Isso pode levar alguns segundos dependendo da sua conexão.</small>
                </div>
                <button 
                    onClick={() => window.location.href = '/'}
                    style={{
                        padding: '10px 20px',
                        background: 'transparent',
                        border: '1px solid #444',
                        color: '#888',
                        borderRadius: '6px',
                        cursor: 'pointer'
                    }}
                >
                    Voltar para o Catálogo
                </button>
            </div>
        );
    }

    // Se não estiver logado, chuta pra Home Raiz
    if (!user) {
        return <Navigate to="/" replace />;
    }

    // Role check - Se estiver logado mas o cargo não bater, chuta pra Home Raiz
    if (allowedRoles && Array.isArray(allowedRoles) && allowedRoles.length > 0) {
        const userRole = role || 'client';
        if (!allowedRoles.includes(userRole)) {
            return <Navigate to="/" replace />;
        }
    }

    return children;
};

export default ProtectedRoute;


