import React, { useState, useEffect } from 'react';
import { getCategories, saveCategories, deleteCategoryGlobal } from '../services/dataService';
import { Plus, Edit2, Trash2, Save, X, Loader2, Tag, Eye, EyeOff, GripVertical, AlertCircle } from 'lucide-react';
import { useAlert } from '../context/AlertContext';
import { motion, AnimatePresence } from 'framer-motion';

const AdminCategories = () => {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(null); 
    const [editData, setEditData] = useState({ id: '', name: '' });
    const [newCategory, setNewCategory] = useState({ id: '', name: '' });
    const [isSaving, setIsSaving] = useState(false);
    const [statusMessages, setStatusMessages] = useState({}); 
    const [hintMessage, setHintMessage] = useState(""); 
    const [draggedIndex, setDraggedIndex] = useState(null);
    
    const { showAlert, showConfirm } = useAlert();

    const showStepMessage = (id, msg) => {
        setStatusMessages(prev => ({ ...prev, [id]: msg }));
        setTimeout(() => {
            setStatusMessages(prev => {
                const updated = { ...prev };
                delete updated[id];
                return updated;
            });
        }, 2000);
    };

    useEffect(() => {
        loadCategories();
    }, []);

    const loadCategories = async () => {
        setLoading(true);
        try {
            const data = await getCategories();
            setCategories(data);
        } catch (error) {
            showAlert("Erro ao carregar categorias", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleDragStart = (index) => setDraggedIndex(index);
    const handleDragOver = (e) => e.preventDefault();

    const handleDrop = async (index) => {
        if (draggedIndex === null || draggedIndex === index) return;
        const newCategories = [...categories];
        const itemToMove = newCategories.splice(draggedIndex, 1)[0];
        newCategories.splice(index, 0, itemToMove);
        setCategories(newCategories);
        setDraggedIndex(null);
        try {
            await saveCategories(newCategories);
            showStepMessage(itemToMove.id, "Ordem salva!");
        } catch (e) {
            showAlert("Erro ao salvar ordem", "error");
            loadCategories();
        }
    };

    const handleCreate = async () => {
        if (!newCategory.name || newCategory.name.trim().length < 3) {
            setHintMessage("Nome muito curto (mín. 3 letras)");
            setTimeout(() => setHintMessage(""), 3000);
            return;
        }
        setIsSaving(true);
        try {
            const maxId = categories.reduce((max, cat) => Math.max(max, parseInt(cat.id) || 0), 0);
            const nextId = String(maxId + 1);
            const newCat = { id: nextId, name: newCategory.name, active: true };
            const updated = [...categories, newCat];
            await saveCategories(updated);
            setCategories(updated);
            setNewCategory({ id: '', name: '' });
            showAlert(`Categoria criada!`, "success");
        } catch (e) {
            showAlert("Erro ao criar categoria", "error");
        } finally {
            setIsSaving(false);
        }
    };

    const handleUpdate = async (id) => {
        if (!editData.name) return;
        setIsSaving(true);
        try {
            const currentCats = await getCategories();
            const newCats = currentCats.map(cat => cat.id === id ? { ...cat, name: editData.name } : cat);
            await saveCategories(newCats);
            showAlert("Atualizada!", "success");
            setIsEditing(null);
            loadCategories();
        } catch (e) { showAlert("Erro ao atualizar", "error"); } finally { setIsSaving(false); }
    };

    const toggleVisibility = async (cat) => {
        setIsSaving(true);
        try {
            const updated = categories.map(c => c.id === cat.id ? { ...c, active: !c.active } : c);
            await saveCategories(updated);
            setCategories(updated);
            showAlert(`${cat.active ? 'Oculta' : 'Visível'} na home!`, "success");
        } catch (e) { showAlert("Erro ao alterar visibilidade", "error"); } finally { setIsSaving(false); }
    };

    const handleDelete = async (id) => {
        showConfirm("Isso afetará os produtos vinculados. Confirmar?", async () => {
            setIsSaving(true);
            try {
                await deleteCategoryGlobal(id);
                showAlert("Removida!", "success");
                loadCategories();
            } catch (e) { showAlert("Erro ao remover", "error"); } finally { setIsSaving(false); }
        });
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {loading ? (
                <div style={{ padding: '30px', textAlign: 'center' }}><Loader2 className="animate-spin" color="#D4AF37" /></div>
            ) : (
                <AnimatePresence mode="popLayout">
                    {categories.map((cat, index) => (
                        <motion.div
                            key={cat.id} layout initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                            draggable={isEditing === null} onDragStart={() => handleDragStart(index)} onDragOver={handleDragOver} onDrop={() => handleDrop(index)}
                            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: isEditing === cat.id ? 'rgba(212, 175, 55, 0.06)' : 'rgba(255,255,255,0.02)', borderRadius: '14px', border: '1px solid', borderColor: isEditing === cat.id ? 'rgba(212,175,55,0.4)' : 'rgba(255,255,255,0.05)', cursor: isEditing === null ? 'grab' : 'default', transition: 'all 0.2s' }}
                        >
                            {isEditing === cat.id ? (
                                <div style={{ display: 'flex', gap: '8px', flex: 1, alignItems: 'center' }}>
                                    <input autoFocus value={editData.name} onChange={e => setEditData({...editData, name: e.target.value})} style={{ flex: 1, padding: '8px 12px', background: 'rgba(0,0,0,0.3)', border: '1px solid #D4AF37', color: '#fff', borderRadius: '10px', fontSize: '0.9rem' }} />
                                    <button onClick={() => handleUpdate(cat.id)} style={{ background: '#D4AF37', color: '#000', border: 'none', borderRadius: '10px', padding: '8px 14px', fontWeight: 700, cursor: 'pointer', fontSize: '0.8rem' }}>Salvar</button>
                                    <button onClick={() => setIsEditing(null)} style={{ background: 'rgba(255,255,255,0.05)', color: '#fff', border: 'none', borderRadius: '10px', padding: '8px', cursor: 'pointer' }}><X size={16} /></button>
                                </div>
                            ) : (
                                <>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <GripVertical size={16} style={{ opacity: 0.2, cursor: 'grab' }} />
                                        <div style={{ color: cat.active !== false ? '#fff' : '#555', fontWeight: 700, fontSize: '0.95rem' }}>{cat.name}</div>
                                        {cat.active === false && <span style={{ fontSize: '0.65rem', color: '#555', fontWeight: 700, background: 'rgba(255,255,255,0.04)', padding: '2px 8px', borderRadius: '6px' }}>OCULTA</span>}
                                    </div>
                                    <div style={{ display: 'flex', gap: '6px' }}>
                                        <button onClick={() => toggleVisibility(cat)} style={{ padding: '7px', borderRadius: '9px', background: cat.active !== false ? 'rgba(212, 175, 55, 0.08)' : 'rgba(255,255,255,0.04)', border: 'none', color: cat.active !== false ? '#D4AF37' : '#555', cursor: 'pointer' }}>
                                            {cat.active !== false ? <Eye size={15} /> : <EyeOff size={15} />}
                                        </button>
                                        <button onClick={() => { setIsEditing(cat.id); setEditData(cat); }} style={{ padding: '7px', borderRadius: '9px', background: 'rgba(255,255,255,0.04)', border: 'none', color: '#888', cursor: 'pointer' }}><Edit2 size={15} /></button>
                                        <button onClick={() => handleDelete(cat.id)} style={{ padding: '7px', borderRadius: '9px', background: 'rgba(239, 68, 68, 0.08)', border: 'none', color: '#ef4444', cursor: 'pointer' }}><Trash2 size={15} /></button>
                                    </div>
                                </>
                            )}
                        </motion.div>
                    ))}
                </AnimatePresence>
            )}

            {/* Adicionar nova */}
            <div style={{ display: 'flex', gap: '8px', marginTop: '8px', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                <input
                    value={newCategory.name}
                    onChange={e => setNewCategory({...newCategory, name: e.target.value})}
                    onKeyDown={e => e.key === 'Enter' && handleCreate()}
                    placeholder="Nova categoria..."
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
            {hintMessage && <p style={{ margin: '4px 0 0', fontSize: '0.75rem', color: '#f59e0b' }}>{hintMessage}</p>}
        </div>
    );
};

export default AdminCategories;
