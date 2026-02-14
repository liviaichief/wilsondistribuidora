import React, { useEffect } from 'react';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';

const NotificationModal = ({ isOpen, onClose, type = 'success', title, message, autoClose = 3000 }) => {
    useEffect(() => {
        if (isOpen && autoClose) {
            const timer = setTimeout(() => {
                onClose();
            }, autoClose);
            return () => clearTimeout(timer);
        }
    }, [isOpen, autoClose, onClose]);

    if (!isOpen) return null;

    const styles = {
        overlay: {
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            backdropFilter: 'blur(4px)'
        },
        modal: {
            backgroundColor: '#1E1E1E', // Dark surface
            color: '#E0E0E0',
            padding: '2rem',
            borderRadius: '12px',
            border: `1px solid ${type === 'error' ? '#ef4444' : type === 'success' ? '#10b981' : '#3b82f6'}`,
            textAlign: 'center',
            maxWidth: '400px',
            width: '90%',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            position: 'relative',
            animation: 'scaleIn 0.2s ease-out'
        },
        iconContainer: {
            display: 'flex',
            justifyContent: 'center',
            marginBottom: '1rem',
            color: type === 'error' ? '#ef4444' : type === 'success' ? '#10b981' : '#3b82f6'
        },
        title: {
            fontSize: '1.25rem',
            fontWeight: 'bold',
            marginBottom: '0.5rem',
            color: type === 'error' ? '#ef4444' : type === 'success' ? '#10b981' : '#3b82f6'
        },
        message: {
            color: '#A0A0A0',
            marginBottom: '1.5rem',
            fontSize: '0.95rem'
        },
        button: {
            backgroundColor: 'transparent',
            border: `1px solid ${type === 'error' ? '#ef4444' : type === 'success' ? '#10b981' : '#3b82f6'}`,
            color: type === 'error' ? '#ef4444' : type === 'success' ? '#10b981' : '#3b82f6',
            padding: '0.5rem 1.5rem',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: '600',
            transition: 'all 0.2s',
            outline: 'none'
        },
        closeBtn: {
            position: 'absolute',
            top: '10px',
            right: '10px',
            background: 'transparent',
            border: 'none',
            color: '#666',
            cursor: 'pointer'
        }
    };

    const Icon = type === 'error' ? AlertCircle : type === 'success' ? CheckCircle : Info;

    return (
        <div style={styles.overlay} onClick={onClose}>
            <div style={styles.modal} onClick={e => e.stopPropagation()}>
                <button style={styles.closeBtn} onClick={onClose}><X size={18} /></button>

                <div style={styles.iconContainer}>
                    <Icon size={48} />
                </div>

                <h3 style={styles.title}>{title}</h3>
                <p style={styles.message}>{message}</p>

                <button
                    style={styles.button}
                    onClick={onClose}
                    onMouseOver={(e) => {
                        e.target.style.backgroundColor = type === 'error' ? 'rgba(239, 68, 68, 0.1)' : type === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(59, 130, 246, 0.1)';
                    }}
                    onMouseOut={(e) => {
                        e.target.style.backgroundColor = 'transparent';
                    }}
                >
                    OK
                </button>
            </div>
            <style>{`
                @keyframes scaleIn {
                    from { transform: scale(0.9); opacity: 0; }
                    to { transform: scale(1); opacity: 1; }
                }
            `}</style>
        </div>
    );
};

export default NotificationModal;
