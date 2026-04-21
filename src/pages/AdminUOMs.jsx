import React, { useState, useEffect } from 'react';
import { getUOMs, saveUOMs } from '../services/dataService';
import { Plus, Edit2, Trash2, Save, X, Loader2, Ruler, Eye, EyeOff, GripVertical } from 'lucide-react';
import { useAlert } from '../context/AlertContext';

const AdminUOMs = () => {
    const [uoms, setUoms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(null); 
    const [editData, setEditData] = useState({ id: '', name: '' });
    const [newUom, setNewUom] = useState({ id: '', name: '' });
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
        loadUOMs();
    }, []);

    const loadUOMs = async () => {
        setLoading(true);
        try {
            const data = await getUOMs();
            setUoms(data);
        } catch (error) {
            showAlert("Erro ao carregar unidades", "error");
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

        const newUoms = [...uoms];
        const itemToMove = newUoms.splice(draggedIndex, 1)[0];
        newUoms.splice(index, 0, itemToMove);
        
        setUoms(newUoms);
        setDraggedIndex(null);
        
        try {
            await saveUOMs(newUoms);
            showStepMessage(itemToMove.id, "Ordem salva!");
        } catch (e) {
            showAlert("Erro ao salvar ordem", "error");
            loadUOMs();
        }
    };

    const handleCreate = async () => {
        if (!newUom.name || newUom.name.trim().length < 1) {
            setHintMessage("Preencha o nome da unidade");
            setTimeout(() => setHintMessage(""), 3000);
            return;
        }

        setIsSaving(true);
        try {
            const maxId = uoms.reduce((max, u) => Math.max(max, parseInt(u.id) || 0), 0);
            const nextId = String(maxId + 1);

            const newEntry = { 
                id: nextId, 
                name: newUom.name, 
                active: true 
            };

            const updated = [...uoms, newEntry];
            await saveUOMs(updated);
            setUoms(updated);
            setNewUom({ id: '', name: '' });
            showAlert(`Unidade criada: ${newEntry.name}`, "success");
        } catch (e) {
            showAlert("Erro ao criar unidade", "error");
        } finally {
            setIsSaving(false);
        }
    };

    const handleUpdate = async (id) => {
        if (!editData.name) return;
        
        setIsSaving(true);
        try {
            const newUoms = uoms.map(u => u.id === id ? { ...u, name: editData.name } : u);
            await saveUOMs(newUoms);

            showAlert("Unidade atualizada!", "success");
            setIsEditing(null);
            setUoms(newUoms);
        } catch (e) {
            showAlert("Erro ao atualizar unidade", "error");
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (id) => {
        showConfirm(
            "Tem certeza que deseja excluir esta unidade de medida?",
            async () => {
                setIsSaving(true);
                try {
                    const updated = uoms.filter(u => u.id !== id);
                    await saveUOMs(updated);
                    setUoms(updated);
                    showAlert("Unidade removida!", "success");
                } catch (e) {
                    showAlert("Erro ao remover unidade", "error");
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
        <div style={{ background: '#1a1a1a', padding: '30px', borderRadius: '12px', border: '1px solid #333', boxShadow: '0 10px 30px rgba(0,0,0,0.5)', marginTop: '30px' }}>
            <h3 style={{ color: 'var(--primary-color)', marginBottom: '5px', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.2rem' }}>
                <Ruler size={20} /> Gestão de Unidades de Medida
            </h3>
            <p style={{ fontSize: '0.85rem', color: '#666', marginBottom: '25px' }}>
                Cadastre as unidades (KG, Unidade, Fardo, etc) que aparecerão no cadastro de produtos.
            </p>
            
            <div className="category-list-admin" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {uoms.map((u, index) => (
                    <div 
                        key={u.id} 
                        draggable={isEditing === null}
                        onDragStart={() => handleDragStart(index)}
                        onDragOver={handleDragOver}
                        onDrop={() => handleDrop(index)}
                        style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'space-between', 
                            padding: '12px 16px', 
                            background: isEditing === u.id ? '#1e1e1e' : (draggedIndex === index ? '#222' : '#141414'), 
                            borderRadius: '8px', 
                            border: '1px solid',
                            borderColor: isEditing === u.id ? 'var(--primary-color)' : (draggedIndex === index ? '#555' : '#333'),
                            transition: 'all 0.2s',
                            cursor: isEditing === null ? 'grab' : 'default',
                            opacity: draggedIndex === index ? 0.5 : 1
                        }}
                    >
                        {isEditing === u.id ? (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', flex: 1 }}>
                                <div style={{ flex: 1, minWidth: '150px' }}>
                                    <label style={{ fontSize: '0.7rem', color: '#888', display: 'block', marginBottom: '4px' }}>NOME DA UNIDADE</label>
                                    <input 
                                        value={editData.name} 
                                        onChange={e => setEditData({...editData, name: e.target.value})}
                                        style={{ width: '100%', padding: '8px', background: '#000', border: '1px solid #444', color: '#fff', borderRadius: '4px' }}
                                    />
                                </div>
                                <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px' }}>
                                    <button 
                                        onClick={() => handleUpdate(u.id)} 
                                        disabled={isSaving} 
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
                                                const isActive = u.active !== false;
                                                const updated = uoms.map(item => item.id === u.id ? {...item, active: !isActive} : item);
                                                saveUOMs(updated).then(() => {
                                                    setUoms(updated);
                                                    showStepMessage(u.id, !isActive ? "Ativado" : "Desativado");
                                                });
                                            }}
                                            style={{ 
                                                background: 'transparent', 
                                                border: 'none', 
                                                cursor: 'pointer', 
                                                color: u.active !== false ? '#D4AF37' : '#ff4444', 
                                                display: 'flex', 
                                                alignItems: 'center', 
                                                justifyContent: 'center', 
                                                padding: '5px' 
                                            }}
                                            title={u.active !== false ? 'Desativar' : 'Ativar'}
                                        >
                                            {u.active !== false ? <Eye size={20} /> : <EyeOff size={20} />}
                                        </button>
                                        {statusMessages[u.id] && (
                                            <span style={{ fontSize: '0.65rem', color: '#4CAF50', fontWeight: 'bold', animation: 'fadeIn 0.3s' }}>
                                                {statusMessages[u.id]}
                                            </span>
                                        )}
                                    </div>
                                    <div>
                                        <div style={{ color: u.active !== false ? '#fff' : '#666', fontWeight: 'bold' }}>{u.name}</div>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '5px' }}>
                                    <button 
                                        onClick={() => { setIsEditing(u.id); setEditData(u); }} 
                                        className="icon-btn"
                                        style={{ border: 'none', background: 'transparent' }}
                                        title="Editar"
                                    >
                                        <Edit2 size={16} />
                                    </button>
                                    <button 
                                        onClick={() => handleDelete(u.id)} 
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
                        <h4 style={{ color: '#fff', fontSize: '0.9rem', fontWeight: 'bold', margin: 0 }}>ADICIONAR NOVA UNIDADE</h4>
                        {hintMessage && (
                            <span style={{ fontSize: '0.7rem', color: '#ff4444', animation: 'fadeIn 0.3s' }}>{hintMessage}</span>
                        )}
                    </div>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <div style={{ flex: 1 }}>
                            <input 
                                value={newUom.name} 
                                onChange={e => {
                                    setNewUom({...newUom, name: e.target.value});
                                    if (hintMessage) setHintMessage("");
                                }}
                                placeholder="Ex: KG, Unidade, Fardo, Caixa..."
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
                                opacity: (newUom.name.trim().length >= 1) ? 1 : 0.4,
                                transition: 'all 0.3s'
                            }}
                        >
                            {isSaving ? <Loader2 className="animate-spin" size={20} /> : 'ADICIONAR'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminUOMs;
