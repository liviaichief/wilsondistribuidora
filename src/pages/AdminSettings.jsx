
import React, { useEffect, useState } from 'react';
import { getSettings, updateSettings } from '../services/dataService';
import { Save, Phone, Info, X, ShieldAlert, Loader2 } from 'lucide-react';
import { useAlert } from '../context/AlertContext';
import AdminHealthDashboard from '../components/admin/AdminHealthDashboard';
import { account } from '../lib/appwrite';
import { useAuth } from '../context/AuthContext';

import AdminCategories from './AdminCategories';

const AdminSettings = () => {
    const { role, user } = useAuth();
    const [settings, setSettings] = useState({
        whatsapp_number: '',
        whatsapp_message: '*NOVO PEDIDO {pedido} - BASE APP*',
        birthday_message: '',
        whatsapp_use_api: false,
        whatsapp_api_provider: 'evolution', // 'evolution' | 'zapi'
        whatsapp_api_url: '',
        whatsapp_api_key: '',
        whatsapp_instance: '',
        whatsapp_client_token: ''
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
                whatsapp_message: data.whatsapp_message || '*NOVO PEDIDO {pedido} - BASE APP*'
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
            await updateSettings('whatsapp_use_api', settings.whatsapp_use_api);
            await updateSettings('whatsapp_api_provider', settings.whatsapp_api_provider);
            await updateSettings('whatsapp_api_url', settings.whatsapp_api_url);
            await updateSettings('whatsapp_api_key', settings.whatsapp_api_key);
            await updateSettings('whatsapp_instance', settings.whatsapp_instance);
            await updateSettings('whatsapp_client_token', settings.whatsapp_client_token);
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

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', alignItems: 'start' }}>
                {/* Lado Esquerdo: Gestão de Categorias */}
                <AdminCategories />

                {/* Lado Direito: Quadro de Configurações (Original) */}
                <div style={{ background: '#1a1a1a', padding: '30px', borderRadius: '12px', border: '1px solid #333' }}>
                    <form onSubmit={handleSave} className="product-form">
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px' }}>
                            <div className="form-group">
                                <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <Phone size={18} color="var(--primary-color)" /> Número do WhatsApp para Pedidos
                                </label>
                                <input
                                    type="text"
                                    value={settings.whatsapp_number}
                                    onChange={(e) => setSettings({ ...settings, whatsapp_number: e.target.value })}
                                    placeholder="Ex: 5511900000000"
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
                                    placeholder="Ex: *NOVO PEDIDO - BASE APP*"
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
                                placeholder="Ex: Parabéns {nome}! A Base App te deseja um dia incrível e um presente especial esperando por você na loja."
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

                        <div style={{ marginTop: '30px', paddingTop: '20px', borderTop: '1px solid #333' }}>
                            <h3 style={{ fontSize: '1rem', color: 'var(--primary-color)', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <ShieldAlert size={18} /> Integração Direta (Opcional)
                            </h3>
                            
                            <div className="form-group" style={{ marginBottom: '15px' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                                    <input 
                                        type="checkbox" 
                                        checked={settings.whatsapp_use_api} 
                                        onChange={(e) => setSettings({ ...settings, whatsapp_use_api: e.target.checked })}
                                        style={{ width: '18px', height: '18px' }}
                                    />
                                    Ativar Envio Direto via API (Evolution API / Outros)
                                </label>
                            </div>

                            {settings.whatsapp_use_api && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', padding: '15px', background: 'rgba(0,0,0,0.2)', borderRadius: '8px' }}>
                                    <div className="form-group">
                                        <label>Provedor de API</label>
                                        <select 
                                            value={settings.whatsapp_api_provider}
                                            onChange={(e) => setSettings({ ...settings, whatsapp_api_provider: e.target.value })}
                                            className="filter-select-main"
                                            style={{ width: '100%', background: '#121212', color: 'white' }}
                                        >
                                            <option value="evolution">Evolution API (Grátis / Open Source)</option>
                                            <option value="zapi">Z-API (Pago / Estável)</option>
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label>{settings.whatsapp_api_provider === 'zapi' ? 'URL Base (Ex: https://api.z-api.io)' : 'URL da API'}</label>
                                        <input
                                            type="text"
                                            value={settings.whatsapp_api_url}
                                            onChange={(e) => setSettings({ ...settings, whatsapp_api_url: e.target.value })}
                                            placeholder={settings.whatsapp_api_provider === 'zapi' ? "https://api.z-api.io" : "https://sua-api.com"}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>{settings.whatsapp_api_provider === 'zapi' ? 'Instance ID' : 'Nome da Instância'}</label>
                                        <input
                                            type="text"
                                            value={settings.whatsapp_instance}
                                            onChange={(e) => setSettings({ ...settings, whatsapp_instance: e.target.value })}
                                            placeholder="Ex: 3B..."
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>{settings.whatsapp_api_provider === 'zapi' ? 'Instance Token' : 'API Key / Token Global'}</label>
                                        <input
                                            type="password"
                                            value={settings.whatsapp_api_key}
                                            onChange={(e) => setSettings({ ...settings, whatsapp_api_key: e.target.value })}
                                            placeholder="Token de segurança"
                                        />
                                    </div>
                                    {settings.whatsapp_api_provider === 'zapi' && (
                                        <div className="form-group">
                                            <label>Client Token (Opcional)</label>
                                            <input
                                                type="password"
                                                value={settings.whatsapp_client_token}
                                                onChange={(e) => setSettings({ ...settings, whatsapp_client_token: e.target.value })}
                                                placeholder="Para segurança adicional no Z-API"
                                            />
                                        </div>
                                    )}
                                    <p style={{ fontSize: '0.75rem', color: '#888' }}>
                                        {settings.whatsapp_api_provider === 'zapi' 
                                            ? 'Z-API configurado. O sistema usará o endpoint oficial do Z-API para disparos.'
                                            : 'Evolution API configurado. Certifique-se de que a instância esteja conectada no seu servidor.'}
                                    </p>
                                </div>
                            )}
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
            </div>

            {role === 'admin' && <AdminHealthDashboard />}

        </div>
    );
};

export default AdminSettings;
