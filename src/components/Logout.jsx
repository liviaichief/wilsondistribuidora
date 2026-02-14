
import React, { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const Logout = () => {
    const { signOut } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        const doLogout = async () => {
            console.log("Forcing logout...");
            await signOut();
            localStorage.removeItem('sb-ofpqtmiyuffmfgeoocml-auth-token'); // Clear Supabase token if known
            localStorage.clear(); // Nuclear option for stuck sessions
            console.log("Logout complete.");
            setTimeout(() => navigate('/login'), 1000);
        };
        doLogout();
    }, [signOut, navigate]);

    return (
        <div style={{ padding: '50px', textAlign: 'center', background: '#111', color: '#fff', height: '100vh' }}>
            <h1>Saindo...</h1>
            <p>Limpando dados da sessão...</p>
        </div>
    );
};

export default Logout;
