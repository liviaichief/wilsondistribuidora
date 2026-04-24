import React, { useEffect, useState } from 'react';
import { getSettings, updateSettings } from '../services/dataService';
import { Save, Loader2, Settings2, Activity, MessageSquare, MapPin, TrendingUp, Gift, Bot, DollarSign, Tag } from 'lucide-react';
import { useAlert } from '../context/AlertContext';
import AdminHealthDashboard from '../components/admin/AdminHealthDashboard';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';

import AdminCategories from './AdminCategories';
import AdminUOMs from './AdminUOMs';
import { generateGoogleMerchantFeed } from '../services/analytics';
import { getProducts } from '../services/dataService';

/* ─── Helpers ─── */
const Card = ({ children, icon, color = '#D4AF37', title, style = {} }) => (
    <div style={{
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: '28px',
        padding: '35px',
        backdropFilter: 'blur(10px)',
        ...style
    }}>
        {title && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '28px' }}>
                <div style={{ background: `${color}18`, padding: '10px', borderRadius: '12px', color, display: 'flex' }}>
                    {icon}
                </div>
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.3px' }}>{title}</h3>
            </div>
        )}
        {children}
    </div>
);

const Field = ({ label, children }) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <label style={{ fontWeight: 800, fontSize: '0.7rem', color: '#666', textTransform: 'uppercase', letterSpacing: '1px' }}>{label}</label>
        {children}
    </div>
);

const inputStyle = {
    background: 'rgba(0,0,0,0.3)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '14px',
    padding: '14px 16px',
    color: '#fff',
    width: '100%',
    boxSizing: 'border-box',
    fontSize: '0.9rem',
    outline: 'none',
    transition: 'border-color 0.2s'
};

const SaveBtn = ({ saving, color = '#D4AF37', label = 'SALVAR ALTERAÇÕES' }) => (
    <button
        type="submit"
        disabled={saving}
        style={{
            background: color,
            color: color === '#D4AF37' ? '#000' : '#fff',
            border: 'none',
            borderRadius: '14px',
            padding: '15px',
            fontWeight: 900,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            transition: 'all 0.2s',
            fontSize: '0.85rem'
        }}
    >
        {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
        {saving ? 'SALVANDO...' : label}
    </button>
);

/* ─── Main Component ─── */
const AdminSettings = () => {
    const { isAdmin } = useAuth();
    const [settings, setSettings] = useState({
        whatsapp_number: '',
        whatsapp_message: '*NOVO PEDIDO {pedido} - BASE APP*',
        birthday_message: '',
        whatsapp_use_api: false,
        instagram_link: '',
        google_api_key: '',
        google_place_id: '',
        shipping_free_radius: 5,
        shipping_fixed_rate: '',
        shipping_fixed_radius_max: 15,
        shipping_per_km_rate: '',
        store_latitude: '',
        store_longitude: '',
        google_gtm_id: '',
        google_merchant_id: '',
        cashback_enabled: false,
        cashback_percentage: '2',
        cashback_min_order: '50',
        wa_bot_delay_hours: '2',
        wa_feedback_message: 'Olá {cliente}! Como foi sua experiência com nossos cortes hoje? 🥩🔥',
        wa_reminder_day: '4',
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
            setSettings(prev => ({ ...prev, ...data, whatsapp_message: data.whatsapp_message || '*NOVO PEDIDO {pedido} - BASE APP*' }));
        } catch (error) { showAlert("Erro ao carregar configurações", "error"); } finally { setLoading(false); }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            await Promise.all([
                updateSettings('whatsapp_number', settings.whatsapp_number),
                updateSettings('whatsapp_message', settings.whatsapp_message),
                updateSettings('birthday_message', settings.birthday_message),
                updateSettings('whatsapp_use_api', settings.whatsapp_use_api),
                updateSettings('instagram_link', settings.instagram_link),
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
                updateSettings('show_profit_dashboard', settings.show_profit_dashboard),
            ]);
            showAlert("Configurações salvas!", "success", null, 3000);
        } catch (error) { showAlert("Erro ao salvar.", "error"); } finally { setSaving(false); }
    };

    if (loading) return <div style={{ textAlign: 'center', padding: '100px' }}><Loader2 className="animate-spin" size={40} color="#D4AF37" /></div>;

    return (
        <div style={{ padding: '0 20px 60px' }}>
            <form onSubmit={handleSave}>

                {/* ══ ROW 1: Catálogo + Comunicação ══ */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', marginBottom: '30px', minWidth: 0 }}>

                    {/* Catálogo: Categorias */}
                    <Card icon={<Tag size={22} />} color="#D4AF37" title="Categorias de Produto">
                        <AdminCategories />
                    </Card>

                    {/* Catálogo: Unidades */}
                    <Card icon={<Settings2 size={22} />} color="#a78bfa" title="Unidades de Medida">
                        <AdminUOMs />
                    </Card>
                </div>

                {/* ══ ROW 2: Comunicação + Ecossistema Google ══ */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', marginBottom: '30px', minWidth: 0 }}>

                    {/* Comunicação */}
                    <Card icon={<MessageSquare size={22} />} color="#22c55e" title="Comunicação & Canal">
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            <Field label="WhatsApp para Pedidos">
                                <input value={settings.whatsapp_number} onChange={e => setSettings({...settings, whatsapp_number: e.target.value})} style={inputStyle} placeholder="5511999999999" />
                            </Field>
                            <Field label="Link do Instagram">
                                <input value={settings.instagram_link} onChange={e => setSettings({...settings, instagram_link: e.target.value})} style={inputStyle} placeholder="https://instagram.com/..." />
                            </Field>
                            <Field label="Mensagem de Pedido (WhatsApp)">
                                <textarea value={settings.whatsapp_message} onChange={e => setSettings({...settings, whatsapp_message: e.target.value})} style={{ ...inputStyle, minHeight: '90px', resize: 'none' }} />
                            </Field>
                            <Field label="Mensagem de Aniversário">
                                <textarea value={settings.birthday_message} onChange={e => setSettings({...settings, birthday_message: e.target.value})} style={{ ...inputStyle, minHeight: '80px', resize: 'none' }} placeholder="Parabéns {cliente}! 🎂 Presente especial te aguarda..." />
                            </Field>
                        </div>
                    </Card>

                    {/* Google */}
                    <Card icon={<Settings2 size={22} />} color="#4285F4" title="Ecossistema Google">
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            <Field label="Google Cloud API Key">
                                <input type="password" value={settings.google_api_key} onChange={e => setSettings({...settings, google_api_key: e.target.value})} style={inputStyle} placeholder="AIza..." />
                            </Field>
                            <Field label="Place ID (Business Profile)">
                                <input value={settings.google_place_id} onChange={e => setSettings({...settings, google_place_id: e.target.value})} style={inputStyle} placeholder="ChI..." />
                            </Field>
                            <Field label="Google Tag Manager ID">
                                <input value={settings.google_gtm_id} onChange={e => setSettings({...settings, google_gtm_id: e.target.value})} style={inputStyle} placeholder="GTM-XXXXXXX" />
                            </Field>
                            <Field label="Merchant Center ID">
                                <input value={settings.google_merchant_id} onChange={e => setSettings({...settings, google_merchant_id: e.target.value})} style={inputStyle} placeholder="123456789" />
                            </Field>
                        </div>
                    </Card>
                </div>

                {/* ══ ROW 3: Logística + Fidelidade ══ */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', marginBottom: '30px', minWidth: 0 }}>

                    {/* Logística */}
                    <Card icon={<MapPin size={22} />} color="#f59e0b" title="Logística & Frete Inteligente">
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                <Field label="Frete Grátis até (km)">
                                    <input type="number" value={settings.shipping_free_radius} onChange={e => setSettings({...settings, shipping_free_radius: e.target.value})} style={inputStyle} />
                                </Field>
                                <Field label="Taxa Fixa (R$)">
                                    <input type="number" value={settings.shipping_fixed_rate} onChange={e => setSettings({...settings, shipping_fixed_rate: e.target.value})} style={inputStyle} />
                                </Field>
                                <Field label="Raio Taxa Fixa até (km)">
                                    <input type="number" value={settings.shipping_fixed_radius_max} onChange={e => setSettings({...settings, shipping_fixed_radius_max: e.target.value})} style={inputStyle} />
                                </Field>
                                <Field label="Taxa Extra por km Adicional (R$)">
                                    <input type="number" value={settings.shipping_per_km_rate} onChange={e => setSettings({...settings, shipping_per_km_rate: e.target.value})} style={inputStyle} />
                                </Field>
                            </div>
                            <div style={{ background: 'rgba(245, 158, 11, 0.05)', border: '1px solid rgba(245, 158, 11, 0.15)', borderRadius: '16px', padding: '18px' }}>
                                <p style={{ margin: '0 0 12px', fontSize: '0.75rem', color: '#f59e0b', fontWeight: 800, textTransform: 'uppercase' }}>📍 Coordenadas da Loja</p>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                    <Field label="Latitude">
                                        <input value={settings.store_latitude} onChange={e => setSettings({...settings, store_latitude: e.target.value})} style={inputStyle} placeholder="-23.550520" />
                                    </Field>
                                    <Field label="Longitude">
                                        <input value={settings.store_longitude} onChange={e => setSettings({...settings, store_longitude: e.target.value})} style={inputStyle} placeholder="-46.633308" />
                                    </Field>
                                </div>
                            </div>
                        </div>
                    </Card>

                    {/* Fidelidade */}
                    <Card icon={<Gift size={22} />} color="#ec4899" title="Fidelização & Cashback">
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            <Field label="Ativar Programa de Cashback">
                                <select value={settings.cashback_enabled} onChange={e => setSettings({...settings, cashback_enabled: e.target.value === 'true'})} style={{ ...inputStyle, cursor: 'pointer' }}>
                                    <option value="false" style={{ background: '#111' }}>❌ Desativado</option>
                                    <option value="true" style={{ background: '#111' }}>✅ Ativado</option>
                                </select>
                            </Field>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                <Field label="% de Cashback por Compra">
                                    <input type="number" value={settings.cashback_percentage} onChange={e => setSettings({...settings, cashback_percentage: e.target.value})} style={inputStyle} />
                                </Field>
                                <Field label="Pedido Mínimo para Gerar (R$)">
                                    <input type="number" value={settings.cashback_min_order} onChange={e => setSettings({...settings, cashback_min_order: e.target.value})} style={inputStyle} />
                                </Field>
                            </div>
                            {/* Preview */}
                            <div style={{ background: 'rgba(236,72,153,0.06)', border: '1px solid rgba(236,72,153,0.15)', borderRadius: '16px', padding: '18px', textAlign: 'center' }}>
                                <p style={{ margin: 0, fontSize: '0.8rem', color: '#888' }}>Num pedido de <strong style={{ color: '#fff' }}>R$ 100,00</strong>, o cliente ganha</p>
                                <p style={{ margin: '8px 0 0', fontSize: '1.8rem', fontWeight: 900, color: '#ec4899' }}>
                                    R$ {((100 * parseFloat(settings.cashback_percentage || 0)) / 100).toFixed(2)}
                                </p>
                                <p style={{ margin: '4px 0 0', fontSize: '0.7rem', color: '#666' }}>em crédito para a próxima compra</p>
                            </div>
                        </div>
                    </Card>
                </div>

                {/* ══ ROW 4: Automação + Financeiro ══ */}
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '30px', marginBottom: '30px', minWidth: 0 }}>

                    {/* Automação */}
                    <Card icon={<Bot size={22} />} color="#8b5cf6" title="Automação & Pós-Venda (WhatsApp Bot)">
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                <Field label="Delay Pesquisa de Satisfação (Horas)">
                                    <input type="number" value={settings.wa_bot_delay_hours} onChange={e => setSettings({...settings, wa_bot_delay_hours: e.target.value})} style={inputStyle} />
                                </Field>
                                <Field label="Dia do Lembrete Semanal (0=Dom, 6=Sáb)">
                                    <select value={settings.wa_reminder_day} onChange={e => setSettings({...settings, wa_reminder_day: e.target.value})} style={{ ...inputStyle, cursor: 'pointer' }}>
                                        <option value="0" style={{ background: '#111' }}>Domingo</option>
                                        <option value="1" style={{ background: '#111' }}>Segunda-feira</option>
                                        <option value="2" style={{ background: '#111' }}>Terça-feira</option>
                                        <option value="3" style={{ background: '#111' }}>Quarta-feira</option>
                                        <option value="4" style={{ background: '#111' }}>Quinta-feira</option>
                                        <option value="5" style={{ background: '#111' }}>Sexta-feira</option>
                                        <option value="6" style={{ background: '#111' }}>Sábado</option>
                                    </select>
                                </Field>
                            </div>
                            <Field label="Mensagem de Feedback (use {cliente} para o nome)">
                                <textarea value={settings.wa_feedback_message} onChange={e => setSettings({...settings, wa_feedback_message: e.target.value})} style={{ ...inputStyle, minHeight: '90px', resize: 'none' }} />
                            </Field>
                        </div>
                    </Card>

                    {/* Financeiro */}
                    <Card icon={<DollarSign size={22} />} color="#22c55e" title="Gestão Financeira">
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            <label style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', cursor: 'pointer', padding: '18px', background: 'rgba(34,197,94,0.05)', border: '1px solid rgba(34,197,94,0.12)', borderRadius: '16px' }}>
                                <input
                                    type="checkbox"
                                    checked={settings.show_profit_dashboard}
                                    onChange={e => setSettings({...settings, show_profit_dashboard: e.target.checked})}
                                    style={{ marginTop: '3px', width: '18px', height: '18px', accentColor: '#22c55e', flexShrink: 0 }}
                                />
                                <div>
                                    <div style={{ fontWeight: 800, color: '#fff', fontSize: '0.9rem', marginBottom: '5px' }}>Exibir Lucro Real no Dashboard</div>
                                    <div style={{ fontSize: '0.75rem', color: '#666', lineHeight: 1.5 }}>Calcula margem de lucro com base no preço de custo cadastrado em cada produto.</div>
                                </div>
                            </label>
                        </div>
                    </Card>
                </div>

                {/* ══ Botão de Salvar Global ══ */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
                    <button
                        type="submit"
                        disabled={saving}
                        style={{
                            background: 'linear-gradient(135deg, #D4AF37, #b8962e)',
                            color: '#000',
                            border: 'none',
                            borderRadius: '18px',
                            padding: '18px 50px',
                            fontWeight: 900,
                            cursor: 'pointer',
                            fontSize: '1rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            boxShadow: '0 10px 30px rgba(212, 175, 55, 0.25)',
                            transition: 'all 0.3s',
                            letterSpacing: '0.5px'
                        }}
                    >
                        {saving ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />}
                        {saving ? 'SALVANDO TUDO...' : 'SALVAR TODAS AS CONFIGURAÇÕES'}
                    </button>
                </div>
            </form>

            {/* ══ Saúde do Sistema (Admin Only) ══ */}
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
