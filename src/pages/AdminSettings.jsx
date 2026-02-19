
import React, { useEffect, useState } from 'react';
import { getSettings, updateSettings } from '../services/dataService';
import { Save, Phone, Info } from 'lucide-react';
import { useAlert } from '../context/AlertContext';

const AdminSettings = () => {
    const [settings, setSettings] = useState({ whatsapp_number: '' });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
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

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            await updateSettings('whatsapp_number', settings.whatsapp_number);
            showAlert("Configurações salvas com sucesso!", "success");
        } catch (error) {
            showAlert("Erro ao salvar: " + error.message, "error");
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

            <div style={{ maxWidth: '600px', background: '#1a1a1a', padding: '30px', borderRadius: '12px', border: '1px solid #333' }}>
                <form onSubmit={handleSave} className="product-form">
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
        </div>
    );
};

export default AdminSettings;
