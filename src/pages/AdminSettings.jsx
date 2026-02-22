
import React, { useEffect, useState } from 'react';
import { getSettings, updateSettings } from '../services/dataService';
import { Save, Phone, Info, X, ShieldAlert } from 'lucide-react';
import { useAlert } from '../context/AlertContext';
import AdminHealthDashboard from '../components/admin/AdminHealthDashboard';
import { account } from '../lib/appwrite';
import { useAuth } from '../context/AuthContext';

const AdminSettings = () => {
    const { role, user } = useAuth();
    const [settings, setSettings] = useState({ whatsapp_number: '' });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Security modal state
    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isCheckingPassword, setIsCheckingPassword] = useState(false);

    const { showAlert } = useAlert();

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        setLoading(true);
        try {
            const data = await getSettings();
            setSettings(data);
        } catch (error) {
            showAlert("Erro ao carregar configurações", "error");
        } finally {
            setLoading(false);
        }
    };

    const requestSave = (e) => {
        e.preventDefault();
        setConfirmPassword('');
        setIsPasswordModalOpen(true);
    };

    const handleConfirmSave = async (e) => {
        e.preventDefault();

        if (!confirmPassword) {
            showAlert('Digite sua senha para confirmar.', 'error');
            return;
        }

        setIsCheckingPassword(true);
        try {
            // Verify password by creating a temporary session
            const testSession = await account.createEmailPasswordSession(user.email, confirmPassword);

            // If successful, clean up the testing session (we are already logged in via main session)
            try {
                await account.deleteSession(testSession.$id);
            } catch (e) { /* ignore cleanup error */ }

            setIsPasswordModalOpen(false);
            setSaving(true);
            await updateSettings('whatsapp_number', settings.whatsapp_number);
            showAlert("Configurações salvas com sucesso!", "success");
        } catch (error) {
            console.error(error);
            showAlert("Senha incorreta. Não foi possível salvar.", "error");
        } finally {
            setIsCheckingPassword(false);
            setSaving(false);
        }
    };

    if (loading) return <p style={{ textAlign: 'center', padding: '40px' }}>Carregando configurações...</p>;

    return (
        <div className="admin-content-inner">
            <div className="admin-section-header">
                <h2>Configurações do Sistema</h2>
            </div>

            <div style={{ maxWidth: '600px', background: '#1a1a1a', padding: '30px', borderRadius: '12px', border: '1px solid #333' }}>
                <form onSubmit={requestSave} className="product-form">
                    <div className="form-group">
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Phone size={18} color="var(--primary-color)" /> Número do WhatsApp para Pedidos
                        </label>
                        <input
                            type="text"
                            value={settings.whatsapp_number}
                            onChange={(e) => setSettings({ ...settings, whatsapp_number: e.target.value })}
                            placeholder="Ex: 5511944835865"
                            required
                        />
                        <p style={{ fontSize: '0.8rem', color: '#888', marginTop: '8px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <Info size={14} /> Use apenas números, com código do país (55) e DDD.
                        </p>
                    </div>

                    <button type="submit" className="save-btn" disabled={saving} style={{ marginTop: '20px', width: '100%', justifyContent: 'center' }}>
                        <Save size={20} /> {saving ? 'Salvando...' : 'Salvar Configurações'}
                    </button>
                </form>
            </div>

            {role === 'admin' && <AdminHealthDashboard />}

            {/* Password Verification Modal */}
            {isPasswordModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ maxWidth: '400px' }}>
                        <div className="modal-header">
                            <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <ShieldAlert color="#d4af37" size={24} /> Autenticação Necessária
                            </h2>
                            <button className="close-btn" onClick={() => setIsPasswordModalOpen(false)}>
                                <X size={24} />
                            </button>
                        </div>
                        <form onSubmit={handleConfirmSave} className="product-form" style={{ marginTop: '10px' }}>
                            <p style={{ color: '#aaa', fontSize: '0.9rem', marginBottom: '15px' }}>
                                Para alterar o número de suporte do WhatsApp, por favor, insira sua senha de administrador ou proprietário.
                            </p>
                            <div className="form-group">
                                <label>Senha de Confirmação</label>
                                <input
                                    type="password"
                                    required
                                    value={confirmPassword}
                                    onChange={e => setConfirmPassword(e.target.value)}
                                    placeholder="Digite sua senha..."
                                    autoFocus
                                />
                            </div>
                            <button type="submit" className="save-btn" disabled={isCheckingPassword} style={{ justifyContent: 'center', width: '100%', marginTop: '10px' }}>
                                {isCheckingPassword ? 'Verificando...' : 'Confirmar e Salvar'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminSettings;
