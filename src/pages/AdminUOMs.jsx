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
        <div style={{ marginTop: '20px' }}>
            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '40px', borderRadius: '30px', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(10px)', width: '50%' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <AnimatePresence mode="popLayout">
                        {uoms.map((u) => (
                            <motion.div key={u.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px', background: isEditing === u.id ? 'rgba(212, 175, 55, 0.05)' : 'rgba(255,255,255,0.02)', borderRadius: '18px', border: '1px solid', borderColor: isEditing === u.id ? '#D4AF37' : 'rgba(255,255,255,0.05)' }}>
                                {isEditing === u.id ? (
                                    <div style={{ display: 'flex', gap: '15px', flex: 1, alignItems: 'center' }}>
                                        <input autoFocus value={editData.name} onChange={e => setEditData({...editData, name: e.target.value})} style={{ flex: 1, padding: '12px', background: 'rgba(0,0,0,0.3)', border: '1px solid #D4AF37', color: '#fff', borderRadius: '12px' }} />
                                        <button onClick={() => handleUpdate(u.id)} style={{ background: '#D4AF37', color: '#000', border: 'none', borderRadius: '12px', padding: '12px 20px', fontWeight: 700 }}>Salvar</button>
                                        <button onClick={() => setIsEditing(null)} style={{ background: 'rgba(255,255,255,0.05)', color: '#fff', border: 'none', borderRadius: '12px', padding: '12px' }}><X size={20} /></button>
                                    </div>
                                ) : (
                                    <>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                                            <GripVertical size={20} style={{ opacity: 0.1 }} />
                                            <div style={{ color: '#fff', fontWeight: 700, fontSize: '1.1rem' }}>{u.name}</div>
                                        </div>
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            <button onClick={() => { setIsEditing(u.id); setEditData(u); }} style={{ padding: '10px', borderRadius: '10px', background: 'rgba(255,255,255,0.05)', border: 'none', color: '#fff' }}><Edit2 size={18} /></button>
                                            <button onClick={() => handleDelete(u.id)} style={{ padding: '10px', borderRadius: '10px', background: 'rgba(239, 68, 68, 0.1)', border: 'none', color: '#ef4444' }}><Trash2 size={18} /></button>
                                        </div>
                                    </>
                                )}
                            </motion.div>
                        ))}
                    </AnimatePresence>

                    <div style={{ marginTop: '30px', padding: '30px', background: 'rgba(255,255,255,0.01)', borderRadius: '24px', border: '2px dashed rgba(255,255,255,0.05)' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                            <input 
                                value={newUom.name} 
                                onChange={e => setNewUom({...newUom, name: e.target.value})} 
                                placeholder="Nova unidade (Ex: KG)" 
                                style={{ width: '100%', padding: '14px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '14px' }} 
                            />
                            <button 
                                onClick={handleCreate} 
                                disabled={isSaving} 
                                style={{ width: '100%', background: '#D4AF37', color: '#000', border: 'none', borderRadius: '14px', padding: '14px', fontWeight: 900, cursor: 'pointer' }}
                            >
                                ADICIONAR UNIDADE
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminUOMs;
