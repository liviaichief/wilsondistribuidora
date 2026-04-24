import React, { useEffect, useState } from 'react';
import { getSettings, updateSettings } from '../services/dataService';
import { Save, Loader2, Settings2, Activity } from 'lucide-react';
import { useAlert } from '../context/AlertContext';
import AdminHealthDashboard from '../components/admin/AdminHealthDashboard';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';

import AdminCategories from './AdminCategories';
import AdminUOMs from './AdminUOMs';
import { generateGoogleMerchantFeed } from '../services/analytics';
import { getProducts } from '../services/dataService';

const AdminSettings = () => {
    const { isAdmin } = useAuth();
    const [settings, setSettings] = useState({
        whatsapp_number: '',
        whatsapp_message: '*NOVO PEDIDO {pedido} - BASE APP*',
        birthday_message: '',
        whatsapp_use_api: false,
        instagram_link: '',
        // Google Cloud & Reviews
        google_api_key: '',
        google_place_id: '',
        // Logistics & Maps
        shipping_free_radius: 5,
        shipping_fixed_rate: '',
        shipping_fixed_radius_max: 15,
        shipping_per_km_rate: '',
        store_latitude: '', // Exemplo SP
        store_longitude: '',
        // Marketing & Analytics
        google_gtm_id: '',
        google_merchant_id: '',
        // NOVO: Fidelidade & Cashback
        cashback_enabled: false,
        cashback_percentage: '2',
        cashback_min_order: '50',
        // NOVO: Automação Pós-Venda
        wa_bot_delay_hours: '2',
        wa_feedback_message: 'Olá {cliente}! Como foi sua experiência com nossos cortes hoje? 🥩🔥',
        wa_reminder_day: '4', // Quinta-feira
        // NOVO: Financeiro
        show_profit_dashboard: true
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const { showAlert } = useAlert();

    useEffect(() => { loadSettings(); }, []);

    const loadSettings = async () => {
        setLoading(true);
        try {
            const data = await getSettings();
            setSettings(prev => ({
                ...prev,
                ...data,
                whatsapp_message: data.whatsapp_message || '*NOVO PEDIDO {pedido} - BASE APP*'
            }));
        } catch (error) { showAlert("Erro ao carregar configurações", "error"); } finally { setLoading(false); }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const updates = [
                updateSettings('whatsapp_number', settings.whatsapp_number),
                updateSettings('whatsapp_message', settings.whatsapp_message),
                updateSettings('birthday_message', settings.birthday_message),
                updateSettings('whatsapp_use_api', settings.whatsapp_use_api),
                updateSettings('instagram_link', settings.instagram_link),
                // Google updates
                updateSettings('google_api_key', settings.google_api_key),
                updateSettings('google_place_id', settings.google_place_id),
                updateSettings('shipping_free_radius', settings.shipping_free_radius),
                updateSettings('shipping_fixed_rate', settings.shipping_fixed_rate),
                updateSettings('shipping_fixed_radius_max', settings.shipping_fixed_radius_max),
                updateSettings('shipping_per_km_rate', settings.shipping_per_km_rate),
                updateSettings('store_latitude', settings.store_latitude),
                updateSettings('store_longitude', settings.store_longitude),
                updateSettings('google_gtm_id', settings.google_gtm_id),
                updateSettings('google_merchant_id', settings.google_merchant_id),
                updateSettings('cashback_enabled', settings.cashback_enabled),
                updateSettings('cashback_percentage', settings.cashback_percentage),
                updateSettings('cashback_min_order', settings.cashback_min_order),
                updateSettings('wa_bot_delay_hours', settings.wa_bot_delay_hours),
                updateSettings('wa_feedback_message', settings.wa_feedback_message),
                updateSettings('wa_reminder_day', settings.wa_reminder_day),
                updateSettings('show_profit_dashboard', settings.show_profit_dashboard)
            ];
            await Promise.all(updates);
            showAlert("Configurações salvas!", "success", null, 3000);
        } catch (error) { showAlert("Erro ao salvar.", "error"); } finally { setSaving(false); }
    };

    if (loading) return <div style={{ textAlign: 'center', padding: '100px' }}><Loader2 className="animate-spin" size={40} color="#D4AF37" /></div>;

    return (
        <div style={{ padding: '0 20px 40px' }}>

            <div className="admin-grid-2col">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
                    <AdminCategories />
                    <AdminUOMs />
                </div>

                <div className="glass-card premium-shadow" style={{ padding: '40px', position: 'sticky', top: '20px' }}>
                    <h3 style={{ margin: '0 0 30px', fontSize: '1.5rem', fontWeight: 800 }}>Comunicação</h3>
                    <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            <label style={{ fontWeight: 800, fontSize: '0.75rem', color: '#555' }}>WHATSAPP PARA PEDIDOS</label>
                            <input value={settings.whatsapp_number} onChange={e => setSettings({...settings, whatsapp_number: e.target.value})} style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '14px', padding: '15px', color: '#fff' }} />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            <label style={{ fontWeight: 800, fontSize: '0.75rem', color: '#555' }}>LINK DO INSTAGRAM</label>
                            <input value={settings.instagram_link} onChange={e => setSettings({...settings, instagram_link: e.target.value})} style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '14px', padding: '15px', color: '#fff' }} />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            <label style={{ fontWeight: 800, fontSize: '0.75rem', color: '#555' }}>MENSAGEM INICIAL</label>
                            <textarea value={settings.whatsapp_message} onChange={e => setSettings({...settings, whatsapp_message: e.target.value})} style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '14px', padding: '15px', color: '#fff', minHeight: '100px', resize: 'none' }} />
                        </div>
                        <button type="submit" disabled={saving} style={{ background: '#D4AF37', color: '#000', border: 'none', borderRadius: '16px', padding: '18px', fontWeight: 900, cursor: 'pointer' }}>{saving ? 'SALVANDO...' : 'SALVAR ALTERAÇÕES'}</button>
                    </form>
                </div>

                {/* NOVO QUADRO: ECOSSISTEMA GOOGLE */}
                <div className="glass-card premium-shadow" style={{ padding: '40px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '30px' }}>
                        <div style={{ background: 'rgba(66, 133, 244, 0.1)', padding: '8px', borderRadius: '10px' }}>
                            <Settings2 size={24} color="#4285F4" />
                        </div>
                        <h3 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800 }}>Ecossistema Google</h3>
                    </div>
                    
                    <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
                        {/* API Keys */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                <label style={{ fontWeight: 800, fontSize: '0.75rem', color: '#555' }}>GOOGLE CLOUD API KEY</label>
                                <input type="password" value={settings.google_api_key} onChange={e => setSettings({...settings, google_api_key: e.target.value})} style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '14px', padding: '15px', color: '#fff' }} placeholder="AIza..." />
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                <label style={{ fontWeight: 800, fontSize: '0.75rem', color: '#555' }}>PLACE ID (BUSINESS PROFILE)</label>
                                <input value={settings.google_place_id} onChange={e => setSettings({...settings, google_place_id: e.target.value})} style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '14px', padding: '15px', color: '#fff' }} placeholder="ChI..." />
                            </div>
                        </div>

                        {/* Logistics */}
                        <div style={{ background: 'rgba(255,255,255,0.02)', padding: '20px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.05)' }}>
                            <h4 style={{ margin: '0 0 20px', fontSize: '0.9rem', color: '#888' }}>Logística e Frete Inteligente</h4>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                    <label style={{ fontWeight: 800, fontSize: '0.75rem', color: '#555' }}>FRETE GRÁTIS ATÉ (KM)</label>
                                    <input type="number" value={settings.shipping_free_radius} onChange={e => setSettings({...settings, shipping_free_radius: e.target.value})} style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '14px', padding: '15px', color: '#fff' }} />
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                    <label style={{ fontWeight: 800, fontSize: '0.75rem', color: '#555' }}>TAXA FIXA (R$)</label>
                                    <input type="number" value={settings.shipping_fixed_rate} onChange={e => setSettings({...settings, shipping_fixed_rate: e.target.value})} style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '14px', padding: '15px', color: '#fff' }} />
                                </div>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '20px' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                    <label style={{ fontWeight: 800, fontSize: '0.75rem', color: '#555' }}>RAIO TAXA FIXA ATÉ (KM)</label>
                                    <input type="number" value={settings.shipping_fixed_radius_max} onChange={e => setSettings({...settings, shipping_fixed_radius_max: e.target.value})} style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '14px', padding: '15px', color: '#fff' }} />
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                    <label style={{ fontWeight: 800, fontSize: '0.75rem', color: '#555' }}>TAXA EXTRA POR KM ADICIONAL (R$)</label>
                                    <input type="number" value={settings.shipping_per_km_rate} onChange={e => setSettings({...settings, shipping_per_km_rate: e.target.value})} style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '14px', padding: '15px', color: '#fff' }} />
                                </div>
                            </div>
                        </div>

                        {/* Tracking */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                <label style={{ fontWeight: 800, fontSize: '0.75rem', color: '#555' }}>GOOGLE TAG MANAGER (GTM-XXXX)</label>
                                <input value={settings.google_gtm_id} onChange={e => setSettings({...settings, google_gtm_id: e.target.value})} style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '14px', padding: '15px', color: '#fff' }} placeholder="GTM-XXXXXXX" />
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                <label style={{ fontWeight: 800, fontSize: '0.75rem', color: '#555' }}>MERCHANT CENTER ID</label>
                                <input value={settings.google_merchant_id} onChange={e => setSettings({...settings, google_merchant_id: e.target.value})} style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '14px', padding: '15px', color: '#fff' }} placeholder="123456789" />
                            </div>
                        </div>

                        <button type="submit" disabled={saving} style={{ background: '#4285F4', color: '#fff', border: 'none', borderRadius: '16px', padding: '18px', fontWeight: 900, cursor: 'pointer', transition: 'all 0.2s' }}>
                            {saving ? 'SALVANDO...' : 'SALVAR CONFIGURAÇÕES GOOGLE'}
                        </button>
                    </form>
                </div>

                {/* NOVO QUADRO: FIDELIDADE E CASHBACK */}
                <div className="glass-card premium-shadow" style={{ padding: '40px', marginTop: '40px' }}>
                    <h3 style={{ margin: '0 0 20px', fontSize: '1.5rem', fontWeight: 800 }}>Fidelização & Cashback</h3>
                    <div className="settings-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
                        <div className="setting-item">
                            <label>Ativar Cashback?</label>
                            <select 
                                value={settings.cashback_enabled} 
                                onChange={(e) => setSettings({...settings, cashback_enabled: e.target.value === 'true'})}
                                className="settings-input"
                                style={{ width: '100%', padding: '10px', borderRadius: '8px', background: 'rgba(0,0,0,0.2)' }}
                            >
                                <option value="false">Não</option>
                                <option value="true">Sim</option>
                            </select>
                        </div>
                        <div className="setting-item">
                            <label>% de Cashback</label>
                            <input 
                                type="number" 
                                value={settings.cashback_percentage} 
                                onChange={(e) => setSettings({...settings, cashback_percentage: e.target.value})}
                                className="settings-input"
                                style={{ width: '100%', padding: '10px', borderRadius: '8px', background: 'rgba(0,0,0,0.2)' }}
                            />
                        </div>
                        <div className="setting-item">
                            <label>Pedido Mínimo p/ Gerar</label>
                            <input 
                                type="number" 
                                value={settings.cashback_min_order} 
                                onChange={(e) => setSettings({...settings, cashback_min_order: e.target.value})}
                                className="settings-input"
                                style={{ width: '100%', padding: '10px', borderRadius: '8px', background: 'rgba(0,0,0,0.2)' }}
                            />
                        </div>
                    </div>
                </div>

                {/* NOVO QUADRO: AUTOMAÇÃO DE COMUNICAÇÃO */}
                <div className="glass-card premium-shadow" style={{ padding: '40px', marginTop: '40px' }}>
                    <h3 style={{ margin: '0 0 20px', fontSize: '1.5rem', fontWeight: 800 }}>Automação & Pós-Venda</h3>
                    <div className="settings-grid" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                            <div className="setting-item">
                                <label>Delay Pesquisa Satistação (Horas)</label>
                                <input 
                                    type="number" 
                                    value={settings.wa_bot_delay_hours} 
                                    onChange={(e) => setSettings({...settings, wa_bot_delay_hours: e.target.value})}
                                    className="settings-input"
                                    style={{ width: '100%', padding: '10px', borderRadius: '8px', background: 'rgba(0,0,0,0.2)' }}
                                />
                            </div>
                            <div className="setting-item">
                                <label>Dia do Lembrete Semanal (0=Dom, 4=Qui)</label>
                                <input 
                                    type="number" 
                                    value={settings.wa_reminder_day} 
                                    onChange={(e) => setSettings({...settings, wa_reminder_day: e.target.value})}
                                    className="settings-input"
                                    style={{ width: '100%', padding: '10px', borderRadius: '8px', background: 'rgba(0,0,0,0.2)' }}
                                />
                            </div>
                        </div>
                        <div className="setting-item">
                            <label>Mensagem de Feedback</label>
                            <textarea 
                                value={settings.wa_feedback_message} 
                                onChange={(e) => setSettings({...settings, wa_feedback_message: e.target.value})}
                                className="settings-input"
                                style={{ width: '100%', height: '80px', resize: 'none', padding: '10px', borderRadius: '8px', background: 'rgba(0,0,0,0.2)' }}
                            />
                            <small style={{ color: '#666' }}>Use &#123;cliente&#125; para o nome do cliente.</small>
                        </div>
                    </div>
                </div>

                {/* NOVO QUADRO: REGRAS FINANCEIRAS */}
                <div className="glass-card premium-shadow" style={{ padding: '40px', marginTop: '40px' }}>
                    <h3 style={{ margin: '0 0 20px', fontSize: '1.5rem', fontWeight: 800 }}>Gestão Financeira</h3>
                    <div className="setting-item">
                        <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                            <input 
                                type="checkbox" 
                                checked={settings.show_profit_dashboard} 
                                onChange={(e) => setSettings({...settings, show_profit_dashboard: e.target.checked})}
                            />
                            Exibir Cálculo de Lucro Real no Dashboard (Baseado no Preço de Custo)
                        </label>
                    </div>
                </div>
            </div>

            {isAdmin && (
                <div style={{ marginTop: '50px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '25px' }}>
                        <div style={{ padding: '8px', borderRadius: '10px', background: 'rgba(34, 197, 94, 0.1)', color: '#22c55e' }}><Activity size={24} /></div>
                        <h3 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800 }}>Saúde do Sistema</h3>
                    </div>
                    <AdminHealthDashboard />
                </div>
            )}
        </div>
    );
};

export default AdminSettings;
