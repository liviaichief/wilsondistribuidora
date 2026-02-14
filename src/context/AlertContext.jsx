
import React, { createContext, useContext, useState } from 'react';
import { AlertCircle, CheckCircle, Info, XCircle, HelpCircle } from 'lucide-react';
import '../components/CustomAlert.css';

const AlertContext = createContext();

export const useAlert = () => useContext(AlertContext);

export const AlertProvider = ({ children }) => {
    const [alertConfig, setAlertConfig] = useState(null);

    // alertConfig structure: { type: 'success'|'error'|'info'|'confirm', title, message, onConfirm, onCancel, confirmText, cancelText }

    const showAlert = (message, type = 'info', title = null) => {
        let msgTitle = title;
        if (!msgTitle) {
            switch (type) {
                case 'success': msgTitle = 'Sucesso'; break;
                case 'error': msgTitle = 'Erro'; break;
                case 'warning': msgTitle = 'Atenção'; break;
                default: msgTitle = 'Informação';
            }
        }
        setAlertConfig({ type, message, title: msgTitle });
    };

    const showConfirm = (message, onConfirm, title = 'Confirmação', confirmText = 'Sim', cancelText = 'Cancelar') => {
        setAlertConfig({
            type: 'confirm',
            message,
            title,
            onConfirm: () => {
                onConfirm();
                closeAlert();
            },
            onCancel: closeAlert,
            confirmText,
            cancelText
        });
    };

    const closeAlert = () => {
        setAlertConfig(null);
    };

    const getIcon = (type) => {
        switch (type) {
            case 'success': return <CheckCircle size={32} color="#4CAF50" />;
            case 'error': return <XCircle size={32} color="#f44336" />;
            case 'warning': return <AlertCircle size={32} color="#ff9800" />;
            case 'confirm': return <HelpCircle size={32} color="#D4AF37" />;
            default: return <Info size={32} color="#2196f3" />;
        }
    };

    return (
        <AlertContext.Provider value={{ showAlert, showConfirm, closeAlert }}>
            {children}
            {alertConfig && (
                <div className="custom-alert-overlay" onClick={alertConfig.type !== 'confirm' ? closeAlert : undefined}>
                    <div className="custom-alert-box" onClick={e => e.stopPropagation()}>
                        <div className="custom-alert-icon">
                            {getIcon(alertConfig.type)}
                        </div>
                        <h3 className="custom-alert-title">{alertConfig.title}</h3>
                        <p className="custom-alert-message">{alertConfig.message}</p>

                        <div className="custom-alert-actions">
                            {alertConfig.type === 'confirm' ? (
                                <>
                                    <button className="custom-alert-btn secondary" onClick={alertConfig.onCancel}>
                                        {alertConfig.cancelText}
                                    </button>
                                    <button className="custom-alert-btn primary" onClick={alertConfig.onConfirm}>
                                        {alertConfig.confirmText}
                                    </button>
                                </>
                            ) : (
                                <button className="custom-alert-btn primary" onClick={closeAlert}>
                                    OK
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </AlertContext.Provider>
    );
};
