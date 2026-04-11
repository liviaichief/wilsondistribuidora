import React, { useState, useEffect } from 'react';
import { getCategories, saveCategories, updateCategoryGlobal, deleteCategoryGlobal } from '../services/dataService';
import { Plus, Edit2, Trash2, Save, X, Loader2, Tag, AlertTriangle, Eye, EyeOff, GripVertical } from 'lucide-react';
import { useAlert } from '../context/AlertContext';

const AdminCategories = () => {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(null); // ID da categoria sendo editada
    const [editData, setEditData] = useState({ id: '', name: '' });
    const [newCategory, setNewCategory] = useState({ id: '', name: '' });
    const [isSaving, setIsSaving] = useState(false);
    const [statusMessages, setStatusMessages] = useState({}); // { id: message }
    const [hintMessage, setHintMessage] = useState(""); // Para o formulário de adição
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

    const handleDragStart = (index) => {
        setDraggedIndex(index);
    };

    const handleDragOver = (e) => {
        e.preventDefault();
    };

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
            setHintMessage("Preencha o nome da categoria (mín. 3 letras)");
            setTimeout(() => setHintMessage(""), 3000);
            return;
        }

        setIsSaving(true);
        try {
            // Gera próximo ID numérico
            const maxId = categories.reduce((max, cat) => Math.max(max, parseInt(cat.id) || 0), 0);
            const nextId = String(maxId + 1);

            const newCat = { 
                id: nextId, 
                name: newCategory.name, 
                active: true 
            };

            const updated = [...categories, newCat];
            await saveCategories(updated);
            setCategories(updated);
            setNewCategory({ id: '', name: '' });
            showAlert(`Categoria created com ID #${nextId}`, "success");
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
            // Agora apenas o nome é editado, não o ID
            const currentCats = await getCategories();
            const newCats = currentCats.map(cat => cat.id === id ? { ...cat, name: editData.name } : cat);
            await saveCategories(newCats);

            showAlert("Nome da categoria atualizado!", "success");
            setIsEditing(null);
            loadCategories();
        } catch (e) {
            showAlert("Erro ao atualizar categoria", "error");
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (id) => {
        showConfirm(
            "Isso desativará a exibição de todos os produtos vinculados a este ID. Tem certeza?",
            async () => {
                setIsSaving(true);
                try {
                    await deleteCategoryGlobal(id);
                    showAlert("Categoria removida!", "success");
                    loadCategories();
                } catch (e) {
                    showAlert("Erro ao remover categoria", "error");
                } finally {
                    setIsSaving(false);
                }
            },
            "Confirmar Exclusão"
        );
    };

    if (loading) return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px', color: '#888' }}>
            <Loader2 className="animate-spin" size={24} />
            <span style={{ marginLeft: '10px' }}>Carregando gestão...</span>
        </div>
    );

    return (
        <div style={{ background: '#1a1a1a', padding: '30px', borderRadius: '12px', border: '1px solid #333', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
            <h3 style={{ color: 'var(--primary-color)', marginBottom: '5px', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.2rem' }}>
                <Tag size={20} /> Gestão de Categorias
            </h3>
            <p style={{ fontSize: '0.85rem', color: '#666', marginBottom: '25px' }}>
                Edite o nome ou o status das categorias. O ID é numérico e fixo para segurança do banco.
            </p>
            
            <div className="category-list-admin" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {categories.map((cat, index) => (
                    <div 
                        key={cat.id} 
                        draggable={isEditing === null}
                        onDragStart={() => handleDragStart(index)}
                        onDragOver={handleDragOver}
                        onDrop={() => handleDrop(index)}
                        style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'space-between', 
                            padding: '12px 16px', 
                            background: isEditing === cat.id ? '#1e1e1e' : (draggedIndex === index ? '#222' : '#141414'), 
                            borderRadius: '8px', 
                            border: '1px solid',
                            borderColor: isEditing === cat.id ? 'var(--primary-color)' : (draggedIndex === index ? '#555' : '#333'),
                            transition: 'all 0.2s',
                            cursor: isEditing === null ? 'grab' : 'default',
                            opacity: draggedIndex === index ? 0.5 : 1
                        }}
                    >
                        {isEditing === cat.id ? (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', flex: 1 }}>
                                <div style={{ flex: 1, minWidth: '150px' }}>
                                    <label style={{ fontSize: '0.7rem', color: '#888', display: 'block', marginBottom: '4px' }}>NOME DA CATEGORIA</label>
                                    <input 
                                        value={editData.name} 
                                        onChange={e => setEditData({...editData, name: e.target.value})}
                                        style={{ width: '100%', padding: '8px', background: '#000', border: '1px solid #444', color: '#fff', borderRadius: '4px' }}
                                    />
                                </div>
                                <div style={{ width: '80px' }}>
                                    <label style={{ fontSize: '0.7rem', color: '#888', display: 'block', marginBottom: '4px' }}>ID FIXO</label>
                                    <div style={{ padding: '8px', background: 'rgba(255,255,255,0.05)', color: '#888', borderRadius: '4px', border: '1px solid #333', textAlign: 'center' }}>
                                        #{cat.id}
                                    </div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px' }}>
                                    <button 
                                        onClick={() => handleUpdate(cat.id)} 
                                        disabled={isSaving} 
                                        title="Salvar globalmente"
                                        style={{ background: 'var(--primary-color)', color: '#000', border: 'none', borderRadius: '4px', cursor: 'pointer', height: '36px', width: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                    >
                                        {isSaving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                                    </button>
                                    <button 
                                        onClick={() => setIsEditing(null)} 
                                        style={{ background: '#333', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', height: '36px', width: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                    >
                                        <X size={18} />
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                    <div style={{ color: '#444', cursor: 'grab' }}>
                                        <GripVertical size={20} />
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <button 
                                            onClick={() => {
                                                const isActive = cat.active !== false;
                                                const updated = categories.map(c => c.id === cat.id ? {...c, active: !isActive} : c);
                                                saveCategories(updated).then(() => {
                                                    setCategories(updated);
                                                    showStepMessage(cat.id, !isActive ? "Ativado" : "Desativado");
                                                });
                                            }}
                                            style={{ 
                                                background: 'transparent', 
                                                border: 'none', 
                                                cursor: 'pointer', 
                                                color: cat.active !== false ? '#D4AF37' : '#ff4444', 
                                                display: 'flex', 
                                                alignItems: 'center', 
                                                justifyContent: 'center', 
                                                padding: '5px' 
                                            }}
                                            title={cat.active !== false ? 'Ocultar no site' : 'Mostrar no site'}
                                        >
                                            {cat.active !== false ? <Eye size={20} /> : <EyeOff size={20} />}
                                        </button>
                                        {statusMessages[cat.id] && (
                                            <span style={{ fontSize: '0.65rem', color: '#4CAF50', fontWeight: 'bold', animation: 'fadeIn 0.3s' }}>
                                                {statusMessages[cat.id]}
                                            </span>
                                        )}
                                    </div>
                                    <div>
                                        <div style={{ color: cat.active !== false ? '#fff' : '#666', fontWeight: 'bold' }}>{cat.name}</div>
                                        <div style={{ color: '#666', fontSize: '0.75rem', fontFamily: 'monospace' }}>ref: {cat.id}</div>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '5px' }}>
                                    <button 
                                        onClick={() => { setIsEditing(cat.id); setEditData(cat); }} 
                                        className="icon-btn"
                                        style={{ border: 'none', background: 'transparent' }}
                                        title="Editar"
                                    >
                                        <Edit2 size={16} />
                                    </button>
                                    <button 
                                        onClick={() => handleDelete(cat.id)} 
                                        className="icon-btn"
                                        style={{ border: 'none', background: 'transparent', color: '#ff4444' }}
                                        title="Excluir"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                ))}

                <div style={{ marginTop: '15px', padding: '20px', background: 'rgba(255,255,255,0.03)', borderRadius: '10px', border: '1px dashed #333' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                        <h4 style={{ color: '#fff', fontSize: '0.9rem', fontWeight: 'bold', margin: 0 }}>ADICIONAR NOVA <span style={{ fontSize: '0.7rem', color: '#666', fontWeight: 'normal' }}>(mín. 3 letras)</span></h4>
                        {hintMessage && (
                            <span style={{ fontSize: '0.7rem', color: '#ff4444', animation: 'fadeIn 0.3s' }}>{hintMessage}</span>
                        )}
                    </div>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <div style={{ flex: 1 }}>
                            <input 
                                value={newCategory.name} 
                                onChange={e => {
                                    setNewCategory({...newCategory, name: e.target.value});
                                    if (hintMessage) setHintMessage("");
                                }}
                                placeholder="Nome para o site (ex: Bovinos, Bebidas...)"
                                style={{ width: '100%', padding: '12px', background: '#000', border: '1px solid #333', color: '#fff', borderRadius: '6px' }}
                            />
                        </div>
                        <button 
                            onClick={handleCreate} 
                            disabled={isSaving} 
                            style={{ 
                                background: 'white', 
                                color: 'black', 
                                border: 'none', 
                                borderRadius: '6px', 
                                cursor: 'pointer', 
                                padding: '0 25px', 
                                fontWeight: '900',
                                fontSize: '0.8rem',
                                letterSpacing: '1px',
                                opacity: (newCategory.name.trim().length >= 3) ? 1 : 0.4,
                                transition: 'all 0.3s'
                            }}
                        >
                            {isSaving ? <Loader2 className="animate-spin" size={20} /> : 'ADICIONAR'}
                        </button>
                    </div>
                </div>
            </div>
            
            <div style={{ marginTop: '20px', display: 'flex', gap: '10px', padding: '15px', background: 'rgba(212, 175, 55, 0.05)', borderRadius: '8px', border: '1px solid rgba(212, 175, 55, 0.2)' }}>
                <AlertTriangle size={18} color="var(--primary-color)" style={{ flexShrink: 0 }} />
                <p style={{ fontSize: '0.75rem', color: '#bbb', margin: 0, lineHeight: 1.4 }}>
                    <strong>Atenção:</strong> Ao renomear o ID de uma categoria, o sistema atualizará todos os produtos existentes para o novo ID. Este processo é irreversível e ocorre em tempo real.
                </p>
            </div>
        </div>
    );
};

export default AdminCategories;
