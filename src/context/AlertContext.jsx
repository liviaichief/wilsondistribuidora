import React, { createContext, useContext, useState } from 'react';
import { AlertCircle, CheckCircle, Info, XCircle, HelpCircle } from 'lucide-react';

const AlertContext = createContext();

export const useAlert = () => useContext(AlertContext);

export const AlertProvider = ({ children }) => {
    const [alertConfig, setAlertConfig] = useState(null);

    const [timer, setTimer] = useState(null);

    // alertConfig: { type: 'success'|'error'|'info'|'confirm', title, message, onConfirm, onCancel, confirmText, cancelText, duration }

    const showAlert = (message, type = 'info', title = null, duration = null) => {
        // Clear existing timer if any
        if (timer) {
            clearTimeout(timer);
            setTimer(null);
        }

        let msgTitle = title;
        if (!msgTitle) {
            switch (type) {
                case 'success': msgTitle = 'Sucesso'; break;
                case 'error': msgTitle = 'Erro'; break;
                case 'warning': msgTitle = 'Atenção'; break;
                default: msgTitle = 'Informação';
            }
        }
        setAlertConfig({ type, message, title: msgTitle, duration });

        // If duration is set, auto close
        if (duration) {
            const newTimer = setTimeout(() => {
                closeAlert();
            }, duration);
            setTimer(newTimer);
        }
    };

    const showConfirm = (message, onConfirm, title = 'Confirmação', confirmText = 'Sim', cancelText = 'Cancelar') => {
        // Clear existing timer
        if (timer) {
            clearTimeout(timer);
            setTimer(null);
        }

        setAlertConfig({
            type: 'confirm',
            message,
            title,
            onConfirm: () => {
                if (onConfirm) onConfirm();
                closeAlert();
            },
            onCancel: closeAlert,
            confirmText,
            cancelText
        });
    };

    const closeAlert = () => {
        setAlertConfig(null);
        if (timer) {
            clearTimeout(timer);
            setTimer(null);
        }
    };

    const getIcon = (type) => {
        switch (type) {
            case 'success': return <CheckCircle className="text-emerald-500" size={64} />;
            case 'error': return <XCircle className="text-red-500" size={64} />;
            case 'warning': return <AlertCircle className="text-amber-500" size={64} />;
            case 'confirm': return <HelpCircle className="text-amber-500" size={64} />;
            default: return <Info className="text-blue-500" size={64} />;
        }
    };

    const getTitleColor = (type) => {
        switch (type) {
            case 'success': return 'text-emerald-500';
            case 'error': return 'text-red-500';
            case 'warning': return 'text-amber-500';
            case 'confirm': return 'text-amber-500';
            default: return 'text-blue-500';
        }
    };

    return (
        <AlertContext.Provider value={{ showAlert, showConfirm, closeAlert }}>
            {children}
            {alertConfig && (
                <div className="fixed inset-0 z-[999999] flex items-center justify-center bg-black/80 backdrop-blur-sm">
                    <div className="bg-neutral-800 rounded-lg shadow-xl border border-neutral-700 max-w-sm w-full mx-4 p-8 text-center animate-fade-in-up relative">
                        <div className="flex justify-center mb-6">
                            {getIcon(alertConfig.type)}
                        </div>
                        <h2 className={`text-2xl font-bold mb-3 ${getTitleColor(alertConfig.type)}`}>
                            {alertConfig.title}
                        </h2>
                        <p className="text-gray-300 mb-8">
                            {alertConfig.message}
                        </p>

                        {!alertConfig.duration && (
                            <div className="flex justify-center gap-4">
                                {alertConfig.type === 'confirm' ? (
                                    <>
                                        <button
                                            onClick={alertConfig.onCancel}
                                            className="px-6 py-2 rounded bg-transparent border border-gray-600 text-gray-300 hover:bg-gray-700 transition-colors font-medium"
                                        >
                                            {alertConfig.cancelText}
                                        </button>
                                        <button
                                            onClick={alertConfig.onConfirm}
                                            className="px-6 py-2 rounded bg-emerald-600 text-white hover:bg-emerald-700 transition-colors font-medium shadow-lg hover:shadow-emerald-500/20"
                                        >
                                            {alertConfig.confirmText}
                                        </button>
                                    </>
                                ) : (
                                    <button
                                        onClick={closeAlert}
                                        style={alertConfig.type === 'success' ? { transform: 'scale(1.4)', margin: '10px' } : {}}
                                        className={`px-8 py-2 rounded text-white font-medium transition-colors shadow-lg ${alertConfig.type === 'error' ? 'bg-red-600 hover:bg-red-700 hover:shadow-red-500/20' :
                                            alertConfig.type === 'warning' ? 'bg-amber-600 hover:bg-amber-700 hover:shadow-amber-500/20' :
                                                'bg-emerald-600 hover:bg-emerald-700 hover:shadow-emerald-500/20'
                                            }`}
                                    >
                                        OK
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                    <style>{`
                        @keyframes fadeInUp {
                            from { opacity: 0; transform: translateY(20px); }
                            to { opacity: 1; transform: translateY(0); }
                        }
                        .animate-fade-in-up {
                            animation: fadeInUp 0.3s ease-out forwards;
                        }
                    `}</style>
                </div>
            )}
        </AlertContext.Provider>
    );
};
