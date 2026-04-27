import React, { useEffect, useState } from 'react';
import { getSettings, updateSettings } from '../services/dataService';
import { Save, Loader2, Settings2, Activity, MessageSquare, MapPin, TrendingUp, Gift, Bot, DollarSign, Tag, Sparkles } from 'lucide-react';
import { useAlert } from '../context/AlertContext';
import AdminHealthDashboard from '../components/admin/AdminHealthDashboard';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';

import AdminCategories from './AdminCategories';
import AdminUOMs from './AdminUOMs';
import { generateGoogleMerchantFeed } from '../services/analytics';
import { getProducts } from '../services/dataService';

/* ─── Helpers ─── */
const Card = ({ children, icon, color = '#D4AF37', title, style = {}, onSave, saving, disabled }) => (
    <div style={{
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: '28px',
        padding: '35px',
        backdropFilter: 'blur(10px)',
        position: 'relative',
        ...style
    }}>
        {title && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ background: `${color}18`, padding: '10px', borderRadius: '12px', color, display: 'flex' }}>
                        {icon}
                    </div>
                    <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.3px' }}>{title}</h3>
                </div>
                {onSave && (
                    <button
                        onClick={onSave}
                        disabled={saving || disabled}
                        style={{
                            background: disabled ? 'rgba(255,255,255,0.05)' : color,
                            color: disabled ? '#444' : (color === '#D4AF37' ? '#000' : '#fff'),
                            border: 'none',
                            borderRadius: '12px',
                            padding: '8px 16px',
                            fontWeight: 900,
                            cursor: disabled ? 'not-allowed' : 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            transition: 'all 0.2s',
                            fontSize: '0.75rem',
                            opacity: disabled ? 0.5 : 1
                        }}
                    >
                        {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                        {saving ? 'SALVANDO...' : 'SALVAR'}
                    </button>
                )}
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
        show_profit_dashboard: true,
        ai_banner_enabled: true,
        ai_description_enabled: true
    });
    const [originalSettings, setOriginalSettings] = useState({});
    const [loading, setLoading] = useState(true);
    const [savingSection, setSavingSection] = useState(null);
    const { showAlert } = useAlert();

    useEffect(() => { loadSettings(); }, []);

    const loadSettings = async () => {
        setLoading(true);
        try {
            const data = await getSettings();
            const mergedSettings = { 
                ...settings, 
                ...data, 
                whatsapp_message: data.whatsapp_message || '*NOVO PEDIDO {pedido} - BASE APP*' 
            };
            setSettings(mergedSettings);
            setOriginalSettings(mergedSettings);
        } catch (error) { 
            showAlert("Erro ao carregar configurações", "error"); 
        } finally { 
            setLoading(false); 
        }
    };

    const isDirty = (keys) => {
        return keys.some(key => {
            const current = settings[key];
            const original = originalSettings[key];
            return String(current) !== String(original);
        });
    };

    const handleSaveSection = async (sectionName, keys) => {
        setSavingSection(sectionName);
        try {
            await Promise.all(keys.map(key => updateSettings(key, settings[key])));
            setOriginalSettings(prev => ({
                ...prev,
                ...Object.fromEntries(keys.map(k => [k, settings[k]]))
            }));
            showAlert(`Configurações de ${sectionName} salvas!`, "success", null, 3000);
        } catch (error) { 
            showAlert(`Erro ao salvar ${sectionName}.`, "error"); 
        } finally { 
            setSavingSection(null); 
        }
    };

    if (loading) return <div style={{ textAlign: 'center', padding: '100px' }}><Loader2 className="animate-spin" size={40} color="#D4AF37" /></div>;

    return (
        <div style={{ padding: '0 20px 60px' }}>
            <div>

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
                    <Card 
                        icon={<MessageSquare size={22} />} 
                        color="#22c55e" 
                        title="Comunicação & Canal"
                        onSave={() => handleSaveSection('Comunicação', ['whatsapp_number', 'instagram_link', 'whatsapp_message', 'birthday_message'])}
                        saving={savingSection === 'Comunicação'}
                        disabled={!isDirty(['whatsapp_number', 'instagram_link', 'whatsapp_message', 'birthday_message'])}
                    >
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
                    <Card 
                        icon={<Settings2 size={22} />} 
                        color="#4285F4" 
                        title="Ecossistema Google"
                        onSave={() => handleSaveSection('Google', ['google_api_key', 'google_place_id', 'google_gtm_id', 'google_merchant_id'])}
                        saving={savingSection === 'Google'}
                        disabled={!isDirty(['google_api_key', 'google_place_id', 'google_gtm_id', 'google_merchant_id'])}
                    >
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
                    <Card 
                        icon={<MapPin size={22} />} 
                        color="#f59e0b" 
                        title="Logística & Frete Inteligente"
                        onSave={() => handleSaveSection('Logística', ['shipping_free_radius', 'shipping_fixed_rate', 'shipping_fixed_radius_max', 'shipping_per_km_rate', 'store_latitude', 'store_longitude'])}
                        saving={savingSection === 'Logística'}
                        disabled={!isDirty(['shipping_free_radius', 'shipping_fixed_rate', 'shipping_fixed_radius_max', 'shipping_per_km_rate', 'store_latitude', 'store_longitude'])}
                    >
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
                    <Card 
                        icon={<Gift size={22} />} 
                        color="#ec4899" 
                        title="Fidelização & Cashback"
                        onSave={() => handleSaveSection('Fidelidade', ['cashback_enabled', 'cashback_percentage', 'cashback_min_order'])}
                        saving={savingSection === 'Fidelidade'}
                        disabled={!isDirty(['cashback_enabled', 'cashback_percentage', 'cashback_min_order'])}
                    >
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

                {/* ══ ROW IA: Inteligência Artificial ══ */}
                <Card 
                    icon={<Sparkles size={22} />} 
                    color="#D4AF37" 
                    title="Inteligência Artificial" 
                    style={{ marginBottom: '30px' }}
                    onSave={() => handleSaveSection('IA', ['ai_banner_enabled', 'ai_description_enabled'])}
                    saving={savingSection === 'IA'}
                    disabled={!isDirty(['ai_banner_enabled', 'ai_description_enabled'])}
                >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <p style={{ margin: '0 0 8px', fontSize: '0.8rem', color: '#666', lineHeight: 1.6 }}>Controle quais funcionalidades de IA ficam disponíveis no painel administrativo. Desativando uma função, o botão some da tela correspondente.</p>

                        {/* Toggle Banner */}
                        <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', padding: '18px 20px', background: settings.ai_banner_enabled ? 'rgba(212, 175, 55, 0.06)' : 'rgba(255,255,255,0.02)', border: `1px solid ${settings.ai_banner_enabled ? 'rgba(212,175,55,0.2)' : 'rgba(255,255,255,0.06)'}`, borderRadius: '16px', transition: 'all 0.3s' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                                <div style={{ background: settings.ai_banner_enabled ? 'rgba(212,175,55,0.15)' : 'rgba(255,255,255,0.05)', padding: '10px', borderRadius: '12px', color: settings.ai_banner_enabled ? '#D4AF37' : '#555', transition: 'all 0.3s' }}>
                                    <Sparkles size={18} />
                                </div>
                                <div>
                                    <div style={{ fontWeight: 800, color: '#fff', fontSize: '0.9rem', marginBottom: '3px' }}>Gerador de Banner com IA</div>
                                    <div style={{ fontSize: '0.73rem', color: '#555' }}>DALL-E 3 + GPT-4o Vision · Cria imagens profissionais para banners</div>
                                </div>
                            </div>
                            <div style={{ position: 'relative', width: '52px', height: '28px', flexShrink: 0 }}>
                                <input type="checkbox" checked={settings.ai_banner_enabled} onChange={e => setSettings({...settings, ai_banner_enabled: e.target.checked})} style={{ opacity: 0, width: 0, height: 0, position: 'absolute' }} />
                                <div style={{ position: 'absolute', inset: 0, background: settings.ai_banner_enabled ? '#D4AF37' : '#333', borderRadius: '28px', cursor: 'pointer', transition: 'all 0.3s', pointerEvents: 'none' }}>
                                    <div style={{ position: 'absolute', top: '4px', left: settings.ai_banner_enabled ? '28px' : '4px', width: '20px', height: '20px', background: '#fff', borderRadius: '50%', transition: 'left 0.3s', boxShadow: '0 2px 5px rgba(0,0,0,0.3)' }} />
                                </div>
                            </div>
                        </label>

                        {/* Toggle Descrição */}
                        <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', padding: '18px 20px', background: settings.ai_description_enabled ? 'rgba(212, 175, 55, 0.06)' : 'rgba(255,255,255,0.02)', border: `1px solid ${settings.ai_description_enabled ? 'rgba(212,175,55,0.2)' : 'rgba(255,255,255,0.06)'}`, borderRadius: '16px', transition: 'all 0.3s' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                                <div style={{ background: settings.ai_description_enabled ? 'rgba(212,175,55,0.15)' : 'rgba(255,255,255,0.05)', padding: '10px', borderRadius: '12px', color: settings.ai_description_enabled ? '#D4AF37' : '#555', transition: 'all 0.3s' }}>
                                    <Sparkles size={18} />
                                </div>
                                <div>
                                    <div style={{ fontWeight: 800, color: '#fff', fontSize: '0.9rem', marginBottom: '3px' }}>Gerador de Descrição de Produto</div>
                                    <div style={{ fontSize: '0.73rem', color: '#555' }}>GPT-4o-mini · Cria textos persuasivos para seus produtos</div>
                                </div>
                            </div>
                            <div style={{ position: 'relative', width: '52px', height: '28px', flexShrink: 0 }}>
                                <input type="checkbox" checked={settings.ai_description_enabled} onChange={e => setSettings({...settings, ai_description_enabled: e.target.checked})} style={{ opacity: 0, width: 0, height: 0, position: 'absolute' }} />
                                <div style={{ position: 'absolute', inset: 0, background: settings.ai_description_enabled ? '#D4AF37' : '#333', borderRadius: '28px', cursor: 'pointer', transition: 'all 0.3s', pointerEvents: 'none' }}>
                                    <div style={{ position: 'absolute', top: '4px', left: settings.ai_description_enabled ? '28px' : '4px', width: '20px', height: '20px', background: '#fff', borderRadius: '50%', transition: 'left 0.3s', boxShadow: '0 2px 5px rgba(0,0,0,0.3)' }} />
                                </div>
                            </div>
                        </label>
                    </div>
                </Card>

                {/* ══ ROW 4: Automação + Financeiro ══ */}
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '30px', marginBottom: '30px', minWidth: 0 }}>

                    {/* Automação */}
                    <Card 
                        icon={<Bot size={22} />} 
                        color="#8b5cf6" 
                        title="Automação & Pós-Venda (WhatsApp Bot)"
                        onSave={() => handleSaveSection('Automação', ['wa_bot_delay_hours', 'wa_reminder_day', 'wa_feedback_message'])}
                        saving={savingSection === 'Automação'}
                        disabled={!isDirty(['wa_bot_delay_hours', 'wa_reminder_day', 'wa_feedback_message'])}
                    >
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
                    <Card 
                        icon={<DollarSign size={22} />} 
                        color="#22c55e" 
                        title="Gestão Financeira"
                        onSave={() => handleSaveSection('Financeiro', ['show_profit_dashboard'])}
                        saving={savingSection === 'Financeiro'}
                        disabled={!isDirty(['show_profit_dashboard'])}
                    >
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

            </div>

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
