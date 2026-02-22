import React, { useState, useEffect } from 'react';
import { Download, X, Share } from 'lucide-react';
import './PWAInstallPrompt.css';

const PWAInstallPrompt = () => {
    const [deferredPrompt, setDeferredPrompt] = useState(null);
    const [isVisible, setIsVisible] = useState(false);
    const [isIOS, setIsIOS] = useState(false);

    useEffect(() => {
        // Detecta se é um dispositivo Apple (iOS)
        const userAgent = window.navigator.userAgent.toLowerCase();
        const isIosDevice = /iphone|ipad|ipod/.test(userAgent);

        // Verifica se já está rodando como App instalado (Standalone Mode)
        const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;

        if (isIosDevice && !isStandalone) {
            // Em iPhones, mostramos a nossa tela de instruções (Pois a Apple bloqueia botão automático)
            setIsIOS(true);
            setIsVisible(true);
        }

        // Escuta o evento automático do Android/Chrome
        const handler = (e) => {
            e.preventDefault();
            setDeferredPrompt(e);
            setIsVisible(true);
        };

        window.addEventListener('beforeinstallprompt', handler);

        window.addEventListener('appinstalled', () => {
            setIsVisible(false);
            setDeferredPrompt(null);
            console.log('Aplicativo foi instalado com sucesso!');
        });

        return () => window.removeEventListener('beforeinstallprompt', handler);
    }, []);

    const handleInstallClick = async () => {
        if (!deferredPrompt) return;

        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;

        if (outcome === 'accepted') {
            setIsVisible(false);
        }
        setDeferredPrompt(null);
    };

    if (!isVisible) return null;

    return (
        <div className="pwa-install-prompt">
            <div className="pwa-content">
                <div className="pwa-text">
                    <strong>Boutique de Carnes</strong>
                    {isIOS ? (
                        <p>No <strong>Safari</strong>, toque em <Share size={14} style={{ display: 'inline', verticalAlign: 'middle', margin: '0 2px' }} /> Compartilhar e "Adicionar à Tela de Início".</p>
                    ) : (
                        <p>Instale nosso App para acessar o cardápio mais rápido!</p>
                    )}
                </div>

                <div className="pwa-actions">
                    {!isIOS && (
                        <button onClick={handleInstallClick} className="pwa-btn-install">
                            <Download size={16} /> Instalar
                        </button>
                    )}
                    <button onClick={() => setIsVisible(false)} className="pwa-btn-close">
                        <X size={20} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PWAInstallPrompt;

