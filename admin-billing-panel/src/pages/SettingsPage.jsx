import React, { useState, useEffect } from 'react';
import { 
    Save, 
    Calendar, 
    ShieldCheck, 
    CreditCard, 
    Smartphone, 
    Banknote, 
    AlertTriangle,
    CheckCircle2,
    Loader2,
    ChevronDown
} from 'lucide-react';
import { databases, DATABASE_ID, COLLECTIONS } from '../lib/appwrite';
import { Query, ID } from 'appwrite';

const SettingsPage = ({ selectedProject }) => {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [settings, setSettings] = useState({
        billing_day: 5,
        grace_period: 5,
        late_fee_days: 0,
        payment_methods: ['pix'],
        gateway: 'stripe',
        system_id: selectedProject
    });

    useEffect(() => {
        fetchSettings();
    }, [selectedProject]);

    const fetchSettings = async () => {
        if (selectedProject === 'all') {
            setLoading(false);
            return;
        }
        
        console.log(`[Settings] Buscando configs para: ${selectedProject}`);
        setLoading(true);
        try {
            const response = await databases.listDocuments(
                DATABASE_ID,
                'system_settings',
                [Query.equal('system_id', selectedProject)]
            );

            if (response.total > 0) {
                setSettings(response.documents[0]);
            } else {
                console.log("[Settings] Nenhuma config encontrada, usando padrão.");
                setSettings({
                    billing_day: 5,
                    grace_period: 5,
                    late_fee_days: 0,
                    payment_methods: ['pix'],
                    gateway: 'mercadopago',
                    system_id: selectedProject
                });
            }
        } catch (error) {
            console.error("[Settings] Erro ao buscar configurações:", error.message);
            // Se a coleção não existe (404), usamos os padrões sem travar
            setSettings({
                billing_day: 5,
                grace_period: 5,
                late_fee_days: 0,
                payment_methods: ['pix'],
                gateway: 'mercadopago',
                system_id: selectedProject
            });
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            if (settings.$id) {
                await databases.updateDocument(DATABASE_ID, 'system_settings', settings.$id, {
                    billing_day: Number(settings.billing_day),
                    grace_period: Number(settings.grace_period),
                    late_fee_days: Number(settings.late_fee_days),
                    payment_methods: settings.payment_methods,
                    gateway: settings.gateway
                });
            } else {
                await databases.createDocument(DATABASE_ID, 'system_settings', ID.unique(), {
                    ...settings,
                    billing_day: Number(settings.billing_day),
                    grace_period: Number(settings.grace_period),
                    late_fee_days: Number(settings.late_fee_days),
                    system_id: selectedProject
                });
            }
            alert("Configurações salvas com sucesso!");
        } catch (error) {
            console.error("Save error:", error);
            alert("Erro ao salvar configurações.");
        } finally {
            setSaving(false);
        }
    };

    const togglePaymentMethod = (method) => {
        setSettings(prev => ({
            ...prev,
            payment_methods: prev.payment_methods.includes(method)
                ? prev.payment_methods.filter(m => m !== method)
                : [...prev.payment_methods, method]
        }));
    };

    if (loading) return (
        <div className="flex items-center justify-center p-20">
            <Loader2 className="animate-spin text-blue-500" size={32} />
        </div>
    );

    return (
        <div className="space-y-12 max-w-4xl">
            <header>
                <h2 className="text-4xl font-black text-white tracking-tighter">Configurações do SaaS</h2>
                <p className="text-gray-500 mt-2 font-medium">Configure as regras de cobrança e métodos de pagamento para {selectedProject === 'boutique' ? 'Boutique de Carne' : selectedProject}.</p>
            </header>

            <form onSubmit={handleSave} className="space-y-10">
                {/* Regras de Cobrança */}
                <section className="bg-[#141414] border border-[#222222] rounded-[2.5rem] p-10 space-y-8">
                    <div className="flex items-center gap-4 mb-2">
                        <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center text-purple-400">
                            <Calendar size={20} />
                        </div>
                        <h3 className="text-xl font-bold text-white">Ciclo de faturamento</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div>
                            <label className="text-[10px] uppercase tracking-widest text-gray-500 font-black mb-3 block">Dia do Vencimento</label>
                            <input 
                                type="number" 
                                min="1" max="28"
                                className="w-full bg-black border border-gray-800 rounded-xl p-4 text-white focus:border-blue-500 transition-all outline-none font-bold"
                                value={settings.billing_day}
                                onChange={e => setSettings({...settings, billing_day: e.target.value})}
                            />
                        </div>
                        <div>
                            <label className="text-[10px] uppercase tracking-widest text-gray-500 font-black mb-3 block">Dias de Carência (Grace)</label>
                            <input 
                                type="number" 
                                className="w-full bg-black border border-gray-800 rounded-xl p-4 text-white focus:border-blue-500 transition-all outline-none font-bold"
                                value={settings.grace_period}
                                onChange={e => setSettings({...settings, grace_period: e.target.value})}
                            />
                            <p className="text-[9px] text-gray-600 mt-2 font-bold uppercase tracking-tighter">Dias antes do bloqueio total</p>
                        </div>
                        <div>
                            <label className="text-[10px] uppercase tracking-widest text-gray-500 font-black mb-3 block">Tolerância de Atraso</label>
                            <input 
                                type="number" 
                                className="w-full bg-black border border-gray-800 rounded-xl p-4 text-white focus:border-blue-500 transition-all outline-none font-bold"
                                value={settings.late_fee_days}
                                onChange={e => setSettings({...settings, late_fee_days: e.target.value})}
                            />
                        </div>
                    </div>
                </section>

                {/* Formas de Pagamento */}
                <section className="bg-[#141414] border border-[#222222] rounded-[2.5rem] p-10 space-y-8">
                    <div className="flex items-center gap-4 mb-2">
                        <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-400">
                            <CreditCard size={20} />
                        </div>
                        <h3 className="text-xl font-bold text-white">Meios de Pagamento Disponíveis</h3>
                    </div>

                    <div className="grid grid-cols-3 gap-6">
                        {[
                            { id: 'pix', name: 'PIX Dinâmico', icon: Smartphone },
                            { id: 'credit_card', name: 'Cartão de Crédito', icon: CreditCard },
                            { id: 'bank_transfer', name: 'Transferência / TED', icon: Banknote }
                        ].map(method => (
                            <button
                                key={method.id}
                                type="button"
                                onClick={() => togglePaymentMethod(method.id)}
                                className={`p-6 rounded-[1.5rem] border flex flex-col items-center gap-4 transition-all duration-300 ${
                                    settings.payment_methods.includes(method.id) 
                                    ? 'bg-blue-500/10 border-blue-500 text-white' 
                                    : 'bg-black border-gray-800 text-gray-600 grayscale opacity-50'
                                }`}
                            >
                                <method.icon size={24} />
                                <span className="text-[10px] font-black uppercase tracking-widest">{method.name}</span>
                                {settings.payment_methods.includes(method.id) && (
                                    <CheckCircle2 size={16} className="text-blue-500" />
                                )}
                            </button>
                        ))}
                    </div>
                </section>

                {/* Meio de Recebimento */}
                <section className="bg-[#141414] border border-[#222222] rounded-[2.5rem] p-10 space-y-8">
                    <div className="flex items-center gap-4 mb-2">
                        <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center text-orange-400">
                            <ShieldCheck size={20} />
                        </div>
                        <h3 className="text-xl font-bold text-white">Gateway de Recebimento</h3>
                    </div>

                    <div className="relative group">
                        <select 
                            className="w-full bg-black text-white p-5 rounded-2xl border border-gray-800 outline-none appearance-none cursor-pointer focus:border-orange-500 transition-all font-bold text-sm"
                            value={settings.gateway}
                            onChange={(e) => setSettings({...settings, gateway: e.target.value})}
                        >
                            <option value="mercadopago">Mercado Pago (Recomendado - API Pix)</option>
                            <option value="stripe">Stripe (Cartão Internacional)</option>
                            <option value="paggue">Paggue (Whitelist)</option>
                            <option value="manual">Controle Manual / Banco</option>
                        </select>
                        <ChevronDown size={20} className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500" />
                    </div>
                    
                    <div className="bg-orange-500/10 border border-orange-500/30 rounded-2xl p-6 flex items-start gap-4">
                        <AlertTriangle size={24} className="text-orange-500 shrink-0" />
                        <div>
                            <p className="text-xs text-orange-200 font-bold leading-relaxed">
                                Certifique-se de configurar os Webhooks e as API Keys no ambiente de sandbox antes de tornar o projeto ativo.
                            </p>
                        </div>
                    </div>
                </section>

                <div className="flex justify-end pt-6">
                    <button 
                        type="submit"
                        disabled={saving}
                        className="bg-white text-black px-12 py-5 rounded-[1.5rem] font-black uppercase tracking-widest text-sm flex items-center gap-3 hover:scale-105 active:scale-95 transition-all shadow-2xl shadow-white/10"
                    >
                        {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                        {saving ? 'Gravando...' : 'Salvar Configurações'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default SettingsPage;
