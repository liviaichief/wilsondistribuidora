import React, { useState, useEffect } from 'react';
import { getUOMs, saveUOMs } from '../services/dataService';
import { Plus, Edit2, Trash2, Save, X, Loader2, Ruler, Eye, EyeOff, GripVertical, AlertCircle } from 'lucide-react';
import { useAlert } from '../context/AlertContext';
import { motion, AnimatePresence } from 'framer-motion';

const AdminUOMs = () => {
    const [uoms, setUoms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(null); 
    const [editData, setEditData] = useState({ id: '', name: '' });
    const [newUom, setNewUom] = useState({ id: '', name: '' });
    const [isSaving, setIsSaving] = useState(false);
    
    const { showAlert, showConfirm } = useAlert();

    useEffect(() => { loadUOMs(); }, []);

    const loadUOMs = async () => {
        setLoading(true);
        try {
            const data = await getUOMs();
            setUoms(data);
        } catch (error) { showAlert("Erro ao carregar unidades", "error"); } finally { setLoading(false); }
    };

    const handleCreate = async () => {
        if (!newUom.name || newUom.name.trim().length < 1) return;
        setIsSaving(true);
        try {
            const maxId = uoms.reduce((max, u) => Math.max(max, parseInt(u.id) || 0), 0);
            const nextId = String(maxId + 1);
            const newEntry = { id: nextId, name: newUom.name, active: true };
            const updated = [...uoms, newEntry];
            await saveUOMs(updated);
            setUoms(updated);
            setNewUom({ id: '', name: '' });
            showAlert(`Unidade criada!`, "success");
        } catch (e) { showAlert("Erro ao criar", "error"); } finally { setIsSaving(false); }
    };

    const handleUpdate = async (id) => {
        if (!editData.name) return;
        setIsSaving(true);
        try {
            const newUoms = uoms.map(u => u.id === id ? { ...u, name: editData.name } : u);
            await saveUOMs(newUoms);
            showAlert("Atualizada!", "success");
            setIsEditing(null);
            setUoms(newUoms);
        } catch (e) { showAlert("Erro ao atualizar", "error"); } finally { setIsSaving(false); }
    };

    const handleDelete = async (id) => {
        showConfirm("Excluir esta unidade?", async () => {
            setIsSaving(true);
            try {
                const updated = uoms.filter(u => u.id !== id);
                await saveUOMs(updated);
                setUoms(updated);
                showAlert("Removida!", "success");
            } catch (e) { showAlert("Erro ao remover", "error"); } finally { setIsSaving(false); }
        });
    };

    if (loading) return null;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <AnimatePresence mode="popLayout">
                {uoms.map((u) => (
                    <motion.div key={u.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: isEditing === u.id ? 'rgba(212, 175, 55, 0.06)' : 'rgba(255,255,255,0.02)', borderRadius: '14px', border: '1px solid', borderColor: isEditing === u.id ? 'rgba(212,175,55,0.4)' : 'rgba(255,255,255,0.05)', transition: 'all 0.2s' }}
                    >
                        {isEditing === u.id ? (
                            <div style={{ display: 'flex', gap: '8px', flex: 1, alignItems: 'center' }}>
                                <input autoFocus value={editData.name} onChange={e => setEditData({...editData, name: e.target.value})} style={{ flex: 1, padding: '8px 12px', background: 'rgba(0,0,0,0.3)', border: '1px solid #D4AF37', color: '#fff', borderRadius: '10px', fontSize: '0.9rem' }} />
                                <button onClick={() => handleUpdate(u.id)} style={{ background: '#D4AF37', color: '#000', border: 'none', borderRadius: '10px', padding: '8px 14px', fontWeight: 700, cursor: 'pointer', fontSize: '0.8rem' }}>Salvar</button>
                                <button onClick={() => setIsEditing(null)} style={{ background: 'rgba(255,255,255,0.05)', color: '#fff', border: 'none', borderRadius: '10px', padding: '8px', cursor: 'pointer' }}><X size={16} /></button>
                            </div>
                        ) : (
                            <>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <div style={{ width: '32px', height: '32px', background: 'rgba(212,175,55,0.08)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <Ruler size={14} color="#D4AF37" />
                                    </div>
                                    <div style={{ color: '#fff', fontWeight: 700, fontSize: '0.95rem' }}>{u.name}</div>
                                </div>
                                <div style={{ display: 'flex', gap: '6px' }}>
                                    <button onClick={() => { setIsEditing(u.id); setEditData(u); }} style={{ padding: '7px', borderRadius: '9px', background: 'rgba(255,255,255,0.04)', border: 'none', color: '#888', cursor: 'pointer' }}><Edit2 size={15} /></button>
                                    <button onClick={() => handleDelete(u.id)} style={{ padding: '7px', borderRadius: '9px', background: 'rgba(239, 68, 68, 0.08)', border: 'none', color: '#ef4444', cursor: 'pointer' }}><Trash2 size={15} /></button>
                                </div>
                            </>
                        )}
                    </motion.div>
                ))}
            </AnimatePresence>

            {/* Adicionar nova */}
            <div style={{ display: 'flex', gap: '8px', marginTop: '8px', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                <input
                    value={newUom.name}
                    onChange={e => setNewUom({...newUom, name: e.target.value})}
                    onKeyDown={e => e.key === 'Enter' && handleCreate()}
                    placeholder="Nova unidade (Ex: KG)"
                    style={{ flex: 1, background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '11px 14px', color: '#fff', fontSize: '0.88rem' }}
                />
                <button
                    onClick={handleCreate}
                    disabled={isSaving}
                    style={{ background: '#D4AF37', color: '#000', border: 'none', borderRadius: '12px', padding: '0 18px', fontWeight: 900, cursor: 'pointer', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap' }}
                >
                    <Plus size={16} />{isSaving ? '...' : 'ADICIONAR'}
                </button>
            </div>
        </div>
    );
};

export default AdminUOMs;
