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
        <div style={{ marginTop: '20px' }}>
            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '40px', borderRadius: '30px', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(10px)', width: '50%' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        {loading ? (
                            <div style={{ padding: '50px', textAlign: 'center' }}><Loader2 className="animate-spin" color="#D4AF37" /></div>
                        ) : (
                            <AnimatePresence mode="popLayout">
                                {categories.map((cat, index) => (
                                    <motion.div 
                                        key={cat.id} layout initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                                        draggable={isEditing === null} onDragStart={() => handleDragStart(index)} onDragOver={handleDragOver} onDrop={() => handleDrop(index)}
                                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px', background: isEditing === cat.id ? 'rgba(212, 175, 55, 0.05)' : 'rgba(255,255,255,0.02)', borderRadius: '20px', border: '1px solid', borderColor: isEditing === cat.id ? '#D4AF37' : 'rgba(255,255,255,0.05)', cursor: isEditing === null ? 'grab' : 'default' }}
                                    >
                                        {isEditing === cat.id ? (
                                            <div style={{ display: 'flex', gap: '15px', flex: 1, alignItems: 'center' }}>
                                                <input autoFocus value={editData.name} onChange={e => setEditData({...editData, name: e.target.value})} style={{ flex: 1, padding: '12px', background: 'rgba(0,0,0,0.3)', border: '1px solid #D4AF37', color: '#fff', borderRadius: '12px' }} />
                                                <button onClick={() => handleUpdate(cat.id)} style={{ background: '#D4AF37', color: '#000', border: 'none', borderRadius: '12px', padding: '12px 20px', fontWeight: 700, cursor: 'pointer' }}>Salvar</button>
                                                <button onClick={() => setIsEditing(null)} style={{ background: 'rgba(255,255,255,0.05)', color: '#fff', border: 'none', borderRadius: '12px', padding: '12px', cursor: 'pointer' }}><X size={20} /></button>
                                            </div>
                                        ) : (
                                            <>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                                                    <GripVertical size={20} style={{ opacity: 0.2 }} />
                                                    <div style={{ color: cat.active !== false ? '#fff' : '#444', fontWeight: 800, fontSize: '1.1rem' }}>{cat.name}</div>
                                                </div>
                                                <div style={{ display: 'flex', gap: '8px' }}>
                                                    <button onClick={() => toggleVisibility(cat)} style={{ padding: '10px', borderRadius: '10px', background: cat.active !== false ? 'rgba(212, 175, 55, 0.1)' : 'rgba(255,255,255,0.05)', border: 'none', color: cat.active !== false ? '#D4AF37' : '#666', cursor: 'pointer' }}>
                                                        {cat.active !== false ? <Eye size={18} /> : <EyeOff size={18} />}
                                                    </button>
                                                    <button onClick={() => { setIsEditing(cat.id); setEditData(cat); }} style={{ padding: '10px', borderRadius: '10px', background: 'rgba(255,255,255,0.05)', border: 'none', color: '#fff', cursor: 'pointer' }}><Edit2 size={18} /></button>
                                                    <button onClick={() => handleDelete(cat.id)} style={{ padding: '10px', borderRadius: '10px', background: 'rgba(239, 68, 68, 0.1)', border: 'none', color: '#ef4444', cursor: 'pointer' }}><Trash2 size={18} /></button>
                                                </div>
                                            </>
                                        )}
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        )}
                    </div>

                    <div style={{ marginTop: '30px', padding: '30px', background: 'rgba(255,255,255,0.01)', borderRadius: '24px', border: '2px dashed rgba(255,255,255,0.05)' }}>
                        <h3 style={{ margin: '0 0 20px', fontSize: '1.1rem', fontWeight: 800, color: '#fff' }}>Nova Categoria</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                            <input 
                                value={newCategory.name} 
                                onChange={e => setNewCategory({...newCategory, name: e.target.value})} 
                                placeholder="Nome da categoria" 
                                style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '14px', padding: '14px 18px', color: '#fff' }} 
                            />
                            <button 
                                onClick={handleCreate} 
                                disabled={isSaving} 
                                style={{ width: '100%', background: '#D4AF37', color: '#000', border: 'none', borderRadius: '14px', padding: '14px', fontWeight: 900, cursor: 'pointer', transition: 'all 0.3s' }}
                            >
                                {isSaving ? 'ADICIONANDO...' : 'ADICIONAR CATEGORIA'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminCategories;
