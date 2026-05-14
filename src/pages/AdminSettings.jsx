import React, { useEffect, useState } from 'react';
import { getSettings, updateSettings } from '../services/dataService';
import { Save, Loader2, Settings2, Activity, MessageSquare, MapPin, TrendingUp, Gift, Bot, DollarSign, Tag, Sparkles, Star } from 'lucide-react';
import { useAlert } from '../context/AlertContext';
import AdminHealthDashboard from '../components/admin/AdminHealthDashboard';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';

import AdminCategories from './AdminCategories';
import AdminUOMs from './AdminUOMs';
import AdminBrandsList from '../components/admin/AdminBrandsList';
import AdminUpsellManager from '../components/admin/AdminUpsellManager';
import AdminPlanManager from '../components/admin/AdminPlanManager';
import AdminOnboarding from './admin/AdminOnboarding';
import AdminBBQMaster from '../components/admin/AdminBBQMaster';
import GoogleSetupAssistant from '../components/admin/GoogleSetupAssistant';
import { generateGoogleMerchantFeed } from '../services/analytics';
import { getProducts } from '../services/dataService';
import { useTheme } from '../context/ThemeContext';

/* ─── Helpers ─── */
const Card = ({ children, icon, color = '#D4AF37', title, style = {}, onSave, saving, disabled }) => (
    <div style={{
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: '28px',
        padding: '25px',
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
                    <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.3px' }}>{title}</h3>
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
    const { isAdmin, isOwner, isMaster, role } = useAuth();
    const { reloadTheme } = useTheme();
    const [settings, setSettings] = useState({
        whatsapp_number: '',
        whatsapp_message: '*NOVO PEDIDO {pedido} - BASE APP*',
        birthday_message: '',
        whatsapp_use_api: false,
        instagram_link: '',
        google_api_key: '',
        google_place_id: '',
        show_google_reviews: true,
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
        ai_description_enabled: true,
        active_theme: 'none',
        world_cup_force_live: false,
        world_cup_live_score: '',
        bbq_master_enabled: true,
        bbq_master_name: '',
        bbq_master_system_prompt: '',
        bbq_master_quick_questions: '',
        bbq_active_sales: true,
        bbq_recipe_frequency: 'weekly',
        owner_info: ''
    });
    const [originalSettings, setOriginalSettings] = useState({});
    const [loading, setLoading] = useState(true);
    const [savingSection, setSavingSection] = useState(null);
    const [activeTab, setActiveTab] = useState('geral');
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
        <>
        <div style={{ padding: '0 20px 60px' }}>
            <div style={{ display: 'flex', gap: '15px', marginBottom: '40px', background: 'rgba(255,255,255,0.03)', padding: '8px', borderRadius: '20px', width: 'fit-content', border: '1px solid rgba(255,255,255,0.05)' }}>
                <button
                    onClick={() => setActiveTab('geral')}
                    style={{ padding: '12px 30px', borderRadius: '14px', border: 'none', background: activeTab === 'geral' ? '#D4AF37' : 'transparent', color: activeTab === 'geral' ? '#000' : '#888', fontWeight: 900, fontSize: '0.85rem', cursor: 'pointer', transition: '0.3s' }}
                >
                    GERAL
                </button>
                {role !== 'owner' && <>
                <button
                    onClick={() => setActiveTab('upsell')}
                    style={{ padding: '12px 30px', borderRadius: '14px', border: 'none', background: activeTab === 'upsell' ? '#D4AF37' : 'transparent', color: activeTab === 'upsell' ? '#000' : '#888', fontWeight: 900, fontSize: '0.85rem', cursor: 'pointer', transition: '0.3s' }}
                >
                    UPSELL INTELIGENTE
                </button>
                <button
                    onClick={() => setActiveTab('planos')}
                    style={{ padding: '12px 30px', borderRadius: '14px', border: 'none', background: activeTab === 'planos' ? '#D4AF37' : 'transparent', color: activeTab === 'planos' ? '#000' : '#888', fontWeight: 900, fontSize: '0.85rem', cursor: 'pointer', transition: '0.3s' }}
                >
                    PLANOS & IDENTIDADE
                </button>
                <button
                    onClick={() => setActiveTab('onboarding')}
                    style={{ padding: '12px 30px', borderRadius: '14px', border: 'none', background: activeTab === 'onboarding' ? '#D4AF37' : 'transparent', color: activeTab === 'onboarding' ? '#000' : '#888', fontWeight: 900, fontSize: '0.85rem', cursor: 'pointer', transition: '0.3s' }}
                >
                    ONBOARDING
                </button>
                </>}
                {isMaster && (
                <button
                    onClick={() => setActiveTab('bbqmaster')}
                    style={{ padding: '12px 30px', borderRadius: '14px', border: 'none', background: activeTab === 'bbqmaster' ? '#800020' : 'transparent', color: activeTab === 'bbqmaster' ? '#fff' : '#888', fontWeight: 900, fontSize: '0.85rem', cursor: 'pointer', transition: '0.3s', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                    🔥 MESTRE DO CHURRASCO
                </button>
                )}
            </div>

            {activeTab === 'geral' ? (
                <div>

                {/* ══ ROW 1: Catálogo ══ */}
                <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(3, 1fr)', 
                    gap: '20px', 
                    marginBottom: '30px',
                    width: '100%'
                }} className="admin-catalog-row">

                    {/* Catálogo: Categorias */}
                    <Card icon={<Tag size={22} />} color="#D4AF37" title="Categorias de Produto">
                        <AdminCategories />
                    </Card>

                    {/* Catálogo: Unidades */}
                    <Card icon={<Settings2 size={22} />} color="#a78bfa" title="Unidades de Medida">
                        <AdminUOMs />
                    </Card>

                    {/* Catálogo: Marcas */}
                    <Card icon={<Tag size={22} />} color="#fbbf24" title="Marcas de Produtos">
                        <AdminBrandsList />
                    </Card>
                </div>

                {/* ══ ROW 2: Comunicação + Ecossistema Google ══ */}
                <div className="admin-grid-2col" style={{ gap: '30px', marginBottom: '30px', minWidth: 0 }}>

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

                    {/* Google — visível apenas para master */}
                    {role !== 'owner' && <Card
                        icon={<Settings2 size={22} />}
                        color="#4285F4"
                        title="Ecossistema Google"
                        onSave={() => handleSaveSection('Google', ['google_api_key', 'google_place_id', 'google_gtm_id', 'google_merchant_id', 'show_google_reviews'])}
                        saving={savingSection === 'Google'}
                        disabled={!isDirty(['google_api_key', 'google_place_id', 'google_gtm_id', 'google_merchant_id', 'show_google_reviews'])}
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

                            {/* Toggle Avaliações Google no Rodapé */}
                            <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', padding: '18px 20px', background: settings.show_google_reviews ? 'rgba(66,133,244,0.06)' : 'rgba(255,255,255,0.02)', border: `1px solid ${settings.show_google_reviews ? 'rgba(66,133,244,0.25)' : 'rgba(255,255,255,0.06)'}`, borderRadius: '16px', transition: 'all 0.3s' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                                    <div style={{ background: settings.show_google_reviews ? 'rgba(66,133,244,0.15)' : 'rgba(255,255,255,0.05)', padding: '10px', borderRadius: '12px', color: settings.show_google_reviews ? '#4285F4' : '#555', transition: 'all 0.3s' }}>
                                        <Star size={18} />
                                    </div>
                                    <div>
                                        <div style={{ fontWeight: 800, color: '#fff', fontSize: '0.9rem', marginBottom: '3px' }}>Avaliações Google no Rodapé</div>
                                        <div style={{ fontSize: '0.73rem', color: '#555' }}>Exibe o carrossel de avaliações do Google na home da vitrine</div>
                                    </div>
                                </div>
                                <div style={{ position: 'relative', width: '52px', height: '28px', flexShrink: 0 }}>
                                    <input type="checkbox" checked={!!settings.show_google_reviews} onChange={e => setSettings({...settings, show_google_reviews: e.target.checked})} style={{ opacity: 0, width: 0, height: 0, position: 'absolute' }} />
                                    <div style={{ position: 'absolute', inset: 0, background: settings.show_google_reviews ? '#4285F4' : '#333', borderRadius: '28px', cursor: 'pointer', transition: 'all 0.3s', pointerEvents: 'none' }}>
                                        <div style={{ position: 'absolute', top: '4px', left: settings.show_google_reviews ? '28px' : '4px', width: '20px', height: '20px', background: '#fff', borderRadius: '50%', transition: 'left 0.3s', boxShadow: '0 2px 5px rgba(0,0,0,0.3)' }} />
                                    </div>
                                </div>
                            </label>
                        </div>
                    </Card>}
                </div>

                {/* ══ Temas Sazonais ══ */}
                <Card
                    icon={<Sparkles size={22} />}
                    color="#a855f7"
                    title="Temas Sazonais 🏆"
                    style={{ marginBottom: '30px' }}
                    onSave={async () => {
                        await handleSaveSection('Temas', ['active_theme', 'world_cup_force_live', 'world_cup_live_score']);
                        reloadTheme();
                    }}
                    saving={savingSection === 'Temas'}
                    disabled={!isDirty(['active_theme', 'world_cup_force_live'])}
                >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

                        {/* Card Copa do Mundo */}
                        <div style={{
                            background: settings.active_theme === 'world_cup'
                                ? 'linear-gradient(135deg, rgba(0,156,59,0.12) 0%, rgba(254,221,0,0.06) 50%, rgba(0,39,118,0.12) 100%)'
                                : 'rgba(255,255,255,0.02)',
                            border: `2px solid ${settings.active_theme === 'world_cup' ? '#009c3b' : 'rgba(255,255,255,0.07)'}`,
                            borderRadius: '20px',
                            padding: '20px',
                            transition: 'all 0.4s',
                            position: 'relative',
                            overflow: 'hidden'
                        }}>
                            {settings.active_theme === 'world_cup' && (
                                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: 'linear-gradient(90deg, #009c3b 33%, #FEDD00 33% 66%, #002776 66%)' }} />
                            )}

                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <span style={{ fontSize: '2rem' }}>⚽🏆</span>
                                    <div>
                                        <div style={{ fontWeight: 900, color: '#fff', fontSize: '1rem' }}>Copa do Mundo 2026</div>
                                        <div style={{ fontSize: '0.72rem', color: '#666' }}>Decora a home com as cores do Brasil</div>
                                    </div>
                                </div>
                                <label style={{ position: 'relative', width: '52px', height: '28px', cursor: 'pointer', flexShrink: 0 }}>
                                    <input
                                        type="checkbox"
                                        checked={settings.active_theme === 'world_cup'}
                                        onChange={e => setSettings({ ...settings, active_theme: e.target.checked ? 'world_cup' : 'none' })}
                                        style={{ opacity: 0, width: 0, height: 0, position: 'absolute' }}
                                    />
                                    <div style={{ position: 'absolute', inset: 0, background: settings.active_theme === 'world_cup' ? '#009c3b' : '#333', borderRadius: '28px', transition: 'all 0.3s', pointerEvents: 'none' }}>
                                        <div style={{ position: 'absolute', top: '4px', left: settings.active_theme === 'world_cup' ? '28px' : '4px', width: '20px', height: '20px', background: '#fff', borderRadius: '50%', transition: 'left 0.3s', boxShadow: '0 2px 5px rgba(0,0,0,0.3)' }} />
                                    </div>
                                </label>
                            </div>

                            {settings.active_theme === 'world_cup' && (
                                <div style={{ background: 'rgba(0,0,0,0.2)', borderRadius: '16px', padding: '20px', border: '1px solid rgba(254,221,0,0.1)', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '20px' }}>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontWeight: 800, color: '#FEDD00', fontSize: '0.85rem', marginBottom: '4px' }}>Sincronização de Cronograma</div>
                                            <div style={{ fontSize: '0.72rem', color: '#888', lineHeight: 1.4 }}>
                                                Clique no botão ao lado para atualizar os jogos da Copa 2026. O sistema atualizará automaticamente as bandeiras e adversários no site conforme as datas avançarem.
                                            </div>
                                        </div>
                                        <button
                                            onClick={async () => {
                                                const schedule = [
                                                    { "date": "2026-06-11", "time": "16:00", "team1": "México", "team2": "África do Sul" },
                                                    { "date": "2026-06-11", "time": "23:00", "team1": "Coreia do Sul", "team2": "República Tcheca" },
                                                    { "date": "2026-06-12", "time": "16:00", "team1": "Canadá", "team2": "Bósnia" },
                                                    { "date": "2026-06-13", "time": "16:00", "team1": "Catar", "team2": "Suíça" },
                                                    { "date": "2026-06-13", "time": "19:00", "team1": "Brasil", "team2": "Marrocos" },
                                                    { "date": "2026-06-13", "time": "22:00", "team1": "Haiti", "team2": "Escócia" },
                                                    { "date": "2026-06-19", "time": "19:00", "team1": "Escócia", "team2": "Marrocos" },
                                                    { "date": "2026-06-19", "time": "21:30", "team1": "Brasil", "team2": "Haiti" },
                                                    { "date": "2026-06-24", "time": "19:00", "team1": "Marrocos", "team2": "Haiti" },
                                                    { "date": "2026-06-24", "time": "19:00", "team1": "Escócia", "team2": "Brasil" }
                                                ];
                                                setSavingSection('Temas');
                                                try {
                                                    await updateSettings('world_cup_schedule', JSON.stringify(schedule));
                                                    showAlert("Tabela da Copa 2026 sincronizada com sucesso!", "success");
                                                    reloadTheme();
                                                } catch {
                                                    showAlert("Erro ao sincronizar tabela", "error");
                                                } finally {
                                                    setSavingSection(null);
                                                }
                                            }}
                                            style={{ background: '#009c3b', color: '#fff', border: 'none', borderRadius: '12px', padding: '12px 20px', fontWeight: 900, cursor: 'pointer', fontSize: '0.7rem', boxShadow: '0 4px 15px rgba(0,156,59,0.3)', display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}
                                        >
                                            MAPEAR TABELA ⚽
                                        </button>
                                    </div>

                                    <div style={{ height: '1px', background: 'rgba(255,255,255,0.05)' }} />

                                    {/* Force Live */}
                                    <div style={{ background: 'rgba(255,0,0,0.05)', border: '1px solid rgba(255,0,0,0.1)', borderRadius: '12px', padding: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                        <div>
                                            <div style={{ fontWeight: 800, color: '#ff4d4d', fontSize: '0.75rem' }}>🧪 TESTE: FORÇAR MODO AO VIVO</div>
                                            <div style={{ fontSize: '0.65rem', color: '#666' }}>Ignora o cronograma e ativa o badge piscante agora</div>
                                        </div>
                                        <label style={{ position: 'relative', width: '40px', height: '20px', cursor: 'pointer' }}>
                                            <input type="checkbox" checked={settings.world_cup_force_live} onChange={e => setSettings({ ...settings, world_cup_force_live: e.target.checked })} style={{ opacity: 0, width: 0, height: 0 }} />
                                            <div style={{ position: 'absolute', inset: 0, background: settings.world_cup_force_live ? '#ff4d4d' : '#333', borderRadius: '20px', transition: '0.3s' }}>
                                                <div style={{ position: 'absolute', top: '3px', left: settings.world_cup_force_live ? '23px' : '3px', width: '14px', height: '14px', background: '#fff', borderRadius: '50%', transition: '0.3s' }} />
                                            </div>
                                        </label>
                                    </div>

                                    {/* Placar ao vivo */}
                                    <div style={{ background: 'rgba(255,59,59,0.05)', border: '1px solid rgba(255,59,59,0.15)', borderRadius: '12px', padding: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontWeight: 800, color: '#ff4d4d', fontSize: '0.75rem', marginBottom: '4px' }}>⚽ PLACAR AO VIVO</div>
                                            <div style={{ fontSize: '0.65rem', color: '#666' }}>Exibido no widget durante o jogo. Ex: <strong style={{ color: '#aaa' }}>2-1</strong></div>
                                        </div>
                                        <input
                                            type="text"
                                            value={settings.world_cup_live_score || ''}
                                            onChange={e => setSettings({ ...settings, world_cup_live_score: e.target.value })}
                                            placeholder="0-0"
                                            maxLength={5}
                                            style={{
                                                width: '70px', background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,59,59,0.3)',
                                                borderRadius: '10px', color: '#fff', fontSize: '1.2rem', fontWeight: 900,
                                                textAlign: 'center', padding: '8px', letterSpacing: '2px',
                                            }}
                                        />
                                    </div>

                                    <div style={{ height: '1px', background: 'rgba(255,255,255,0.05)' }} />

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                        <div style={{ fontWeight: 800, color: '#fff', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>📍 Onde este tema se aplica?</div>
                                        <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '0.72rem', color: '#aaa', lineHeight: 1.6 }}>
                                            <li><strong>Banner Principal:</strong> Adiciona uma "tag" vertical inteligente com as bandeiras dos países do próximo jogo.</li>
                                            <li><strong>Menu Inferior:</strong> Borda superior verde e ícones ativos em amarelo canário.</li>
                                            <li><strong>Botões de Compra:</strong> Gradiente temático Brasil (Verde/Amarelo) com brilho dinâmico.</li>
                                            <li><strong>Categorias:</strong> Fundo azul marinho sutil com indicadores em verde.</li>
                                            <li><strong>Indicador "AO VIVO":</strong> Aparece automaticamente durante o horário dos jogos do Brasil.</li>
                                        </ul>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Tema Original */}
                        <div
                            onClick={() => setSettings({ ...settings, active_theme: 'none' })}
                            style={{ padding: '14px 20px', border: `2px solid ${settings.active_theme === 'none' ? '#D4AF37' : 'rgba(255,255,255,0.05)'}`, borderRadius: '14px', cursor: 'pointer', background: settings.active_theme === 'none' ? 'rgba(212,175,55,0.06)' : 'transparent', display: 'flex', alignItems: 'center', gap: '12px', transition: 'all 0.3s' }}
                        >
                            <span style={{ fontSize: '1.5rem' }}>✨</span>
                            <div>
                                <div style={{ fontWeight: 800, color: settings.active_theme === 'none' ? '#D4AF37' : '#fff', fontSize: '0.9rem' }}>Original (Padrão)</div>
                                <div style={{ fontSize: '0.72rem', color: '#555' }}>Tema dark premium padrão do sistema</div>
                            </div>
                            {settings.active_theme === 'none' && <span style={{ marginLeft: 'auto', color: '#D4AF37', fontSize: '0.7rem', fontWeight: 900 }}>✓ ATIVO</span>}
                        </div>
                    </div>
                </Card>

                {/* ══ ROW 3–4 + IA + Sistema: visíveis apenas para master ══ */}
                {role !== 'owner' && <><div className="admin-grid-2col" style={{ gap: '30px', marginBottom: '30px', minWidth: 0 }}>

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
                            <div className="admin-grid-2col" style={{ gap: '15px' }}>
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
                                <div className="admin-grid-2col" style={{ gap: '12px' }}>
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
                            <div className="admin-grid-2col" style={{ gap: '15px' }}>
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
                <div className="admin-grid-2col" style={{ gap: '30px', marginBottom: '30px', minWidth: 0 }}>

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
                            <div className="admin-grid-2col" style={{ gap: '15px' }}>
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

            {/* ══ Saúde do Sistema (master only) ══ */}
            {isAdmin && role !== 'owner' && (
                <div style={{ marginTop: '50px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '25px' }}>
                        <div style={{ padding: '8px', borderRadius: '10px', background: 'rgba(34, 197, 94, 0.1)', color: '#22c55e' }}><Activity size={24} /></div>
                        <h3 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800 }}>Saúde do Sistema</h3>
                    </div>
                    <AdminHealthDashboard />
                </div>
            )}
            </>}
            </div>
            ) : activeTab === 'upsell' ? (
                <AdminUpsellManager />
            ) : activeTab === 'onboarding' ? (
                <AdminOnboarding />
            ) : activeTab === 'bbqmaster' ? (
                <div style={{ maxWidth: '700px' }}>
                    <AdminBBQMaster
                        settings={settings}
                        setSettings={setSettings}
                        originalSettings={originalSettings}
                    />
                </div>
            ) : (
                /* Aba Planos & Identidade */
                <div style={{ maxWidth: '800px' }}>
                    <AdminPlanManager settings={settings} onSettingsChange={(updated) => setSettings(prev => ({ ...prev, ...updated }))} />
                </div>
            )}
        </div>

        {/* Google Setup Assistant — apenas para master */}
        {isMaster && <GoogleSetupAssistant />}
        </>
    );
};

export default AdminSettings;
