import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { account } from '../lib/appwrite';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { useAlert } from '../context/AlertContext';

const VerifyEmail = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { showAlert } = useAlert();
    const [status, setStatus] = useState('loading'); // loading, success, error

    const userId = searchParams.get('userId');
    const secret = searchParams.get('secret');

    useEffect(() => {
        if (!userId || !secret) {
            setStatus('error');
            return;
        }

        const verify = async () => {
            try {
                await account.updateVerification(userId, secret);
                setStatus('success');
                showAlert('E-mail verificado com sucesso! Obrigado por confirmar.', 'success', null, 5000);
                setTimeout(() => {
                    navigate('/');
                }, 3000);
            } catch (error) {
                console.error('Verification error:', error);
                setStatus('error');
                showAlert('O link de verificação é inválido ou expirou. Tente solicitar novamente no seu perfil.', 'error');
            }
        };

        verify();
    }, [userId, secret, navigate, showAlert]);

    return (
        <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            minHeight: '60vh', padding: '20px', textAlign: 'center', color: '#fff'
        }}>
            {status === 'loading' && (
                <>
                    <Loader2 className="animate-spin" size={60} color="var(--primary-color)" style={{ marginBottom: '20px' }} />
                    <h2 style={{ color: "var(--primary-color)" }}>Verificando seu e-mail...</h2>
                    <p style={{ color: '#aaa', marginTop: '10px' }}>Por favor, aguarde um momento enquanto processamos sua validação.</p>
                </>
            )}

            {status === 'success' && (
                <>
                    <CheckCircle size={60} color="#4ade80" style={{ marginBottom: '20px' }} />
                    <h2 style={{ color: "#4ade80" }}>E-mail Verificado!</h2>
                    <p style={{ color: '#aaa', marginTop: '10px' }}>Seu e-mail foi validado com sucesso. Redirecionando para a loja...</p>
                </>
            )}

            {status === 'error' && (
                <>
                    <XCircle size={60} color="#f87171" style={{ marginBottom: '20px' }} />
                    <h2 style={{ color: "#f87171" }}>Falha na Verificação</h2>
                    <p style={{ color: '#aaa', marginTop: '10px' }}>O link que você utilizou é inválido ou já expirou.</p>
                    <button
                        onClick={() => navigate('/')}
                        style={{
                            marginTop: '20px', padding: '10px 20px',
                            backgroundColor: 'var(--primary-color)', color: '#000',
                            border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold'
                        }}
                    >
                        Voltar para a Loja
                    </button>
                </>
            )}
        </div>
    );
};

export default VerifyEmail;
