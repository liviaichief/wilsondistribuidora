
import React, { useEffect, useState } from 'react';
import { getSettings, updateSettings } from '../services/dataService';
import { Save, Phone, Info, X, ShieldAlert, Loader2 } from 'lucide-react';
import { useAlert } from '../context/AlertContext';
import AdminHealthDashboard from '../components/admin/AdminHealthDashboard';
import { account } from '../lib/appwrite';
import { useAuth } from '../context/AuthContext';

const AdminSettings = () => {
    const { role, user } = useAuth();
    const [settings, setSettings] = useState({
        whatsapp_number: '',
        whatsapp_message: '*NOVO PEDIDO {pedido} - 3R GRILL*',
        birthday_message: ''
    });
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
            setSettings(prev => ({
                ...prev,
                ...data,
                whatsapp_message: data.whatsapp_message || '*NOVO PEDIDO {pedido} - 3R GRILL*'
            }));
        } catch (error) {
            showAlert("Erro ao carregar configurações", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            await updateSettings('whatsapp_number', settings.whatsapp_number);
            await updateSettings('whatsapp_message', settings.whatsapp_message);
            await updateSettings('birthday_message', settings.birthday_message);
            showAlert("Configurações salvas com sucesso!", "success", null, 2000);
        } catch (error) {
            console.error(error);
            showAlert("Erro ao salvar configurações.", "error");
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <p style={{ textAlign: 'center', padding: '40px' }}>Carregando configurações...</p>;

    return (
        <div className="admin-content-inner">
            <div className="admin-section-header">
                <h2>Configurações do Sistema</h2>
            </div>

            <div style={{ maxWidth: '100%', background: '#1a1a1a', padding: '30px', borderRadius: '12px', border: '1px solid #333' }}>
                <form onSubmit={handleSave} className="product-form">
                    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: '20px' }}>
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
                        <div className="form-group">
                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Info size={18} color="var(--primary-color)" /> Mensagem inicial do WhatsApp
                            </label>
                            <textarea
                                value={settings.whatsapp_message || ''}
                                onChange={(e) => setSettings({ ...settings, whatsapp_message: e.target.value })}
                                placeholder="Ex: *NOVO PEDIDO - 3R GRILL*"
                                style={{
                                    width: '100%',
                                    padding: '12px',
                                    background: '#121212',
                                    border: '1px solid #333',
                                    color: 'white',
                                    borderRadius: '8px',
                                    minHeight: '100px',
                                    resize: 'vertical',
                                    outline: 'none'
                                }}
                            />
                            <p style={{ fontSize: '0.8rem', color: '#888', marginTop: '8px' }}>
                                Usado como cabeçalho do pedido enviado ao lojista. Dica: use <strong>{'{pedido}'}</strong> para inserir o nº do pedido.
                            </p>
                        </div>
                    </div>

                    <div className="form-group" style={{ marginTop: '20px' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Info size={18} color="var(--primary-color)" /> Mensagem de Aniversário
                        </label>
                        <textarea
                            value={settings.birthday_message}
                            onChange={(e) => setSettings({ ...settings, birthday_message: e.target.value })}
                            placeholder="Ex: Parabéns {nome}! A Boutique de Carne 3R te deseja um dia incrível e um presente especial esperando por você na loja."
                            style={{
                                width: '100%',
                                padding: '12px',
                                background: '#121212',
                                border: '1px solid #333',
                                color: 'white',
                                borderRadius: '8px',
                                minHeight: '100px',
                                resize: 'vertical',
                                marginTop: '10px',
                                outline: 'none'
                            }}
                        />
                        <p style={{ fontSize: '0.8rem', color: '#888', marginTop: '8px' }}>
                            Dica: Use <strong>{'{nome}'}</strong> para inserir o nome do cliente automaticamente.
                        </p>
                    </div>

                    <button type="submit" className="save-btn" disabled={saving} style={{ marginTop: '20px', width: '100%', justifyContent: 'center' }}>
                        {saving ? (
                            <>
                                <Loader2 className="animate-spin" size={20} />
                                <span>Salvando...</span>
                            </>
                        ) : (
                            <>
                                <Save size={20} />
                                <span>Salvar Configurações</span>
                            </>
                        )}
                    </button>
                </form>
            </div>

            {role === 'admin' && <AdminHealthDashboard />}

        </div>
    );
};

export default AdminSettings;
