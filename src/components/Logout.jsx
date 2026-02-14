import React, { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { CheckCircle } from 'lucide-react';

const Logout = () => {
    const { signOut } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        const doLogout = async () => {
            console.log("Forcing logout...");
            await signOut();
            // Clear known potential stale tokens
            localStorage.removeItem('sb-ofpqtmiyuffmfgeoocml-auth-token');
            localStorage.clear(); // Nuclear option for stuck sessions
            console.log("Logout complete.");

            // Wait slightly longer so the user sees the message
            setTimeout(() => navigate('/'), 1500);
        };
        doLogout();
    }, [signOut, navigate]);

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-neutral-900 text-white">
            <div className="text-center p-8 bg-neutral-800 rounded-lg shadow-xl border border-neutral-700 max-w-sm w-full mx-4 animate-fade-in-up">
                <div className="flex justify-center mb-6">
                    <CheckCircle className="text-emerald-500" size={64} />
                </div>
                <h1 className="text-2xl font-bold mb-3 text-emerald-500">Desconectado</h1>
                <p className="text-gray-400 mb-6">Você saiu com sucesso do sistema.</p>
                <p className="text-sm text-gray-500">Redirecionando para a página inicial...</p>
            </div>
            <style>{`
                @keyframes fadeInUp {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in-up {
                    animation: fadeInUp 0.5s ease-out forwards;
                }
            `}</style>
        </div>
    );
};

export default Logout;
