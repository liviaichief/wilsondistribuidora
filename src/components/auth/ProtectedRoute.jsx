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
                gap: '1rem'
            }}>
                <div className="loading-spinner"></div>
                <p>Verificando permissões...</p>
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


