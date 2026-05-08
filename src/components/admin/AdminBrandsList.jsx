import React, { useState, useEffect } from 'react';
import { getBrandsList, saveBrandsList } from '../../services/dataService';
import { Plus, Edit2, Trash2, X, Tag } from 'lucide-react';
import { useAlert } from '../../context/AlertContext';
import { motion, AnimatePresence } from 'framer-motion';

const AdminBrandsList = () => {
    const [brands, setBrands] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(null); 
    const [editData, setEditData] = useState({ id: '', name: '' });
    const [newBrand, setNewBrand] = useState({ id: '', name: '' });
    const [isSaving, setIsSaving] = useState(false);
    
    const { showAlert, showConfirm } = useAlert();

    useEffect(() => { loadBrands(); }, []);

    const loadBrands = async () => {
        setLoading(true);
        try {
            const data = await getBrandsList();
            setBrands(data);
        } catch (error) { showAlert("Erro ao carregar marcas", "error"); } finally { setLoading(false); }
    };

    const handleCreate = async () => {
        if (!newBrand.name || newBrand.name.trim().length < 1) return;
        setIsSaving(true);
        try {
            const maxId = brands.reduce((max, b) => Math.max(max, parseInt(b.id) || 0), 0);
            const nextId = String(maxId + 1);
            const newEntry = { id: nextId, name: newBrand.name, active: true };
            const updated = [...brands, newEntry];
            await saveBrandsList(updated);
            setBrands(updated);
            setNewBrand({ id: '', name: '' });
            showAlert(`Marca criada!`, "success");
        } catch (e) { showAlert("Erro ao criar", "error"); } finally { setIsSaving(false); }
    };

    const handleUpdate = async (id) => {
        if (!editData.name) return;
        setIsSaving(true);
        try {
            const newBrands = brands.map(b => b.id === id ? { ...b, name: editData.name } : b);
            await saveBrandsList(newBrands);
            showAlert("Atualizada!", "success");
            setIsEditing(null);
            setBrands(newBrands);
        } catch (e) { showAlert("Erro ao atualizar", "error"); } finally { setIsSaving(false); }
    };

    const handleDelete = async (id) => {
        showConfirm("Excluir esta marca?", async () => {
            setIsSaving(true);
            try {
                const updated = brands.filter(b => b.id !== id);
                await saveBrandsList(updated);
                setBrands(updated);
                showAlert("Removida!", "success");
            } catch (e) { showAlert("Erro ao remover", "error"); } finally { setIsSaving(false); }
        });
    };

    if (loading) return null;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <AnimatePresence mode="popLayout">
                {brands.map((b) => (
                    <motion.div key={b.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: isEditing === b.id ? 'rgba(212, 175, 55, 0.06)' : 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid', borderColor: isEditing === b.id ? 'rgba(212,175,55,0.4)' : 'rgba(255,255,255,0.05)', transition: 'all 0.2s' }}
                    >
                        {isEditing === b.id ? (
                            <div style={{ display: 'flex', gap: '8px', flex: 1, alignItems: 'center' }}>
                                <input autoFocus value={editData.name} onChange={e => setEditData({...editData, name: e.target.value})} style={{ flex: 1, padding: '8px 12px', background: 'rgba(0,0,0,0.3)', border: '1px solid #D4AF37', color: '#fff', borderRadius: '10px', fontSize: '0.9rem' }} />
                                <button onClick={() => handleUpdate(b.id)} style={{ background: '#D4AF37', color: '#000', border: 'none', borderRadius: '10px', padding: '8px 14px', fontWeight: 700, cursor: 'pointer', fontSize: '0.8rem' }}>Salvar</button>
                                <button onClick={() => setIsEditing(null)} style={{ background: 'rgba(255,255,255,0.05)', color: '#fff', border: 'none', borderRadius: '10px', padding: '8px', cursor: 'pointer' }}><X size={16} /></button>
                            </div>
                        ) : (
                            <>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <div style={{ width: '32px', height: '32px', background: 'rgba(212,175,55,0.08)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <Tag size={14} color="#D4AF37" />
                                    </div>
                                    <div style={{ color: '#fff', fontWeight: 700, fontSize: '0.85rem' }}>{b.name}</div>
                                </div>
                                <div style={{ display: 'flex', gap: '6px' }}>
                                    <button onClick={() => { setIsEditing(b.id); setEditData(b); }} style={{ padding: '7px', borderRadius: '9px', background: 'rgba(255,255,255,0.04)', border: 'none', color: '#888', cursor: 'pointer' }}><Edit2 size={15} /></button>
                                    <button onClick={() => handleDelete(b.id)} style={{ padding: '7px', borderRadius: '9px', background: 'rgba(239, 68, 68, 0.08)', border: 'none', color: '#ef4444', cursor: 'pointer' }}><Trash2 size={15} /></button>
                                </div>
                            </>
                        )}
                    </motion.div>
                ))}
            </AnimatePresence>

            {/* Adicionar nova */}
            <div style={{ display: 'flex', gap: '8px', marginTop: '8px', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                <input
                    value={newBrand.name}
                    onChange={e => setNewBrand({...newBrand, name: e.target.value})}
                    onKeyDown={e => e.key === 'Enter' && handleCreate()}
                    placeholder="Nova marca (Ex: Swift)"
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

export default AdminBrandsList;
