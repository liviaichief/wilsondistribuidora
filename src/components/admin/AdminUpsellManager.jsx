import React, { useState, useEffect } from 'react';
import { getProducts, getSettings, updateSettings } from '../../services/dataService';
import { getImageUrl } from '../../lib/imageUtils';
import { Plus, Trash2, Search, Check, Sparkles, Filter, ChevronRight, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAlert } from '../../context/AlertContext';

const AdminUpsellManager = () => {
    const [products, setProducts] = useState([]);
    const [groups, setGroups] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeGroupIndex, setActiveGroupIndex] = useState(null);
    const [selectionMode, setSelectionMode] = useState(null); // 'triggers' or 'recs'
    const { showAlert } = useAlert();

    useEffect(() => { loadData(); }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [prodRes, settings] = await Promise.all([
                getProducts(),
                getSettings()
            ]);
            if (prodRes.documents) setProducts(prodRes.documents);
            if (settings.upsell_rules) {
                setGroups(settings.upsell_rules);
            }
        } catch (err) {
            console.error(err);
            showAlert("Erro ao carregar dados", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await updateSettings('upsell_rules', groups);
            showAlert("Regras de Upsell atualizadas!", "success");
        } catch (err) {
            showAlert("Erro ao salvar", "error");
        } finally {
            setSaving(false);
        }
    };

    const addGroup = () => {
        const newGroup = {
            id: Date.now().toString(),
            name: 'Novo Grupo de Upsell',
            trigger_ids: [],
            recommended_ids: []
        };
        setGroups([...groups, newGroup]);
        setActiveGroupIndex(groups.length);
    };

    const removeGroup = (index) => {
        const newGroups = groups.filter((_, i) => i !== index);
        setGroups(newGroups);
        if (activeGroupIndex === index) setActiveGroupIndex(null);
    };

    const toggleProductInGroup = (productId) => {
        if (activeGroupIndex === null || !selectionMode) return;
        
        const newGroups = [...groups];
        const group = newGroups[activeGroupIndex];
        const listKey = selectionMode === 'triggers' ? 'trigger_ids' : 'recommended_ids';
        
        if (group[listKey].includes(productId)) {
            group[listKey] = group[listKey].filter(id => id !== productId);
        } else {
            group[listKey].push(productId);
        }
        setGroups(newGroups);
    };

    const filteredProducts = products.filter(p => 
        p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.category_name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) return <div style={{ padding: '50px', textAlign: 'center' }}>Carregando produtos...</div>;

    return (
        <div style={{ display: 'grid', gridTemplateColumns: '350px 1fr', gap: '30px' }}>
            {/* Sidebar: List of Groups */}
            <div className="glass-card" style={{ padding: '25px', display: 'flex', flexDirection: 'column', gap: '20px', height: 'fit-content' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>Grupos de Upsell</h3>
                    <button onClick={addGroup} style={{ background: '#D4AF37', border: 'none', borderRadius: '10px', padding: '8px', cursor: 'pointer' }}>
                        <Plus size={18} color="#000" />
                    </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '500px', overflowY: 'auto' }}>
                    {groups.map((group, idx) => (
                        <div 
                            key={group.id} 
                            onClick={() => setActiveGroupIndex(idx)}
                            style={{ 
                                padding: '15px', 
                                background: activeGroupIndex === idx ? 'rgba(212, 175, 55, 0.1)' : 'rgba(255,255,255,0.02)', 
                                border: '1px solid', 
                                borderColor: activeGroupIndex === idx ? '#D4AF37' : 'rgba(255,255,255,0.05)', 
                                borderRadius: '16px', 
                                cursor: 'pointer',
                                transition: '0.3s',
                                position: 'relative'
                            }}
                        >
                            <div style={{ fontWeight: 800, color: '#fff', fontSize: '0.85rem', marginBottom: '5px' }}>{group.name}</div>
                            <div style={{ fontSize: '0.7rem', color: '#666' }}>
                                {group.trigger_ids.length} gatilhos · {group.recommended_ids.length} sugestões
                            </div>
                            <button 
                                onClick={(e) => { e.stopPropagation(); removeGroup(idx); }}
                                style={{ position: 'absolute', right: '10px', top: '15px', background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', opacity: 0.5 }}
                            >
                                <Trash2 size={14} />
                            </button>
                        </div>
                    ))}
                    {groups.length === 0 && (
                        <div style={{ textAlign: 'center', padding: '40px 20px', color: '#444', border: '2px dashed rgba(255,255,255,0.05)', borderRadius: '20px' }}>
                            Nenhum grupo criado. Clique no + para começar.
                        </div>
                    )}
                </div>

                {groups.length > 0 && (
                    <button 
                        onClick={handleSave} 
                        disabled={saving}
                        style={{ background: '#D4AF37', color: '#000', border: 'none', borderRadius: '15px', padding: '15px', fontWeight: 900, fontSize: '0.8rem', cursor: 'pointer', marginTop: '10px' }}
                    >
                        {saving ? 'SALVANDO...' : 'SALVAR TODAS AS REGRAS'}
                    </button>
                )}
            </div>

            {/* Main Area: Selection */}
            <div>
                {activeGroupIndex !== null ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
                        {/* Group Editor */}
                        <div className="glass-card" style={{ padding: '30px' }}>
                            <div style={{ marginBottom: '25px' }}>
                                <label style={{ fontSize: '0.7rem', fontWeight: 900, color: '#666', textTransform: 'uppercase', marginBottom: '10px', display: 'block' }}>Nome do Grupo</label>
                                <input 
                                    value={groups[activeGroupIndex].name} 
                                    onChange={(e) => {
                                        const newGroups = [...groups];
                                        newGroups[activeGroupIndex].name = e.target.value;
                                        setGroups(newGroups);
                                    }}
                                    style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '15px', padding: '15px', color: '#fff', width: '100%', fontSize: '1rem', outline: 'none' }}
                                />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                <button 
                                    onClick={() => setSelectionMode('triggers')}
                                    style={{ 
                                        padding: '20px', 
                                        borderRadius: '20px', 
                                        border: '1px solid', 
                                        borderColor: selectionMode === 'triggers' ? '#D4AF37' : 'rgba(255,255,255,0.05)', 
                                        background: selectionMode === 'triggers' ? 'rgba(212, 175, 55, 0.05)' : 'rgba(255,255,255,0.02)', 
                                        cursor: 'pointer',
                                        textAlign: 'left'
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                                        <div style={{ padding: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '10px', color: '#D4AF37' }}><Search size={18} /></div>
                                        <div style={{ fontWeight: 800, color: '#fff', fontSize: '0.9rem' }}>Produtos Gatilhos</div>
                                    </div>
                                    <div style={{ fontSize: '0.75rem', color: '#666' }}>Se o cliente adicionar UM destes, o modal abre. ({groups[activeGroupIndex].trigger_ids.length} selecionados)</div>
                                </button>

                                <button 
                                    onClick={() => setSelectionMode('recs')}
                                    style={{ 
                                        padding: '20px', 
                                        borderRadius: '20px', 
                                        border: '1px solid', 
                                        borderColor: selectionMode === 'recs' ? '#D4AF37' : 'rgba(255,255,255,0.05)', 
                                        background: selectionMode === 'recs' ? 'rgba(212, 175, 55, 0.05)' : 'rgba(255,255,255,0.02)', 
                                        cursor: 'pointer',
                                        textAlign: 'left'
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                                        <div style={{ padding: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '10px', color: '#D4AF37' }}><Sparkles size={18} /></div>
                                        <div style={{ fontWeight: 800, color: '#fff', fontSize: '0.9rem' }}>Sugestões do Modal</div>
                                    </div>
                                    <div style={{ fontSize: '0.75rem', color: '#666' }}>Quais itens mostrar (máx 3). ({groups[activeGroupIndex].recommended_ids.length} selecionados)</div>
                                </button>
                            </div>
                        </div>

                        {/* Product Catalog Picker */}
                        <AnimatePresence mode="wait">
                            {selectionMode && (
                                <motion.div 
                                    key={selectionMode}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="glass-card" 
                                    style={{ padding: '30px' }}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <div style={{ padding: '8px', background: selectionMode === 'triggers' ? 'rgba(212,175,55,0.1)' : 'rgba(34,197,94,0.1)', borderRadius: '10px', color: selectionMode === 'triggers' ? '#D4AF37' : '#22c55e' }}>
                                                {selectionMode === 'triggers' ? <Search size={20} /> : <Sparkles size={20} />}
                                            </div>
                                            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>
                                                Selecionando {selectionMode === 'triggers' ? 'Gatilhos' : 'Sugestões'}
                                            </h3>
                                        </div>
                                        <div style={{ position: 'relative' }}>
                                            <Search size={16} color="#444" style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)' }} />
                                            <input 
                                                placeholder="Buscar produto..."
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                                style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', padding: '10px 15px 10px 40px', color: '#fff', width: '250px', outline: 'none' }}
                                            />
                                        </div>
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '15px', maxHeight: '500px', overflowY: 'auto', paddingRight: '10px' }}>
                                        {filteredProducts.map(p => {
                                            const isSelected = groups[activeGroupIndex][selectionMode === 'triggers' ? 'trigger_ids' : 'recommended_ids'].includes(p.id);
                                            return (
                                                <div 
                                                    key={p.id} 
                                                    onClick={() => toggleProductInGroup(p.id)}
                                                    style={{ 
                                                        background: 'rgba(255,255,255,0.02)', 
                                                        borderRadius: '20px', 
                                                        border: '2px solid', 
                                                        borderColor: isSelected ? '#D4AF37' : 'transparent', 
                                                        overflow: 'hidden', 
                                                        cursor: 'pointer', 
                                                        transition: '0.2s',
                                                        position: 'relative'
                                                    }}
                                                >
                                                    <div style={{ height: '120px', background: '#000' }}>
                                                        <img src={getImageUrl(p.image)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: isSelected ? 1 : 0.6 }} />
                                                    </div>
                                                    <div style={{ padding: '12px' }}>
                                                        <div style={{ fontWeight: 800, fontSize: '0.75rem', color: isSelected ? '#fff' : '#666', marginBottom: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.title}</div>
                                                        <div style={{ color: '#D4AF37', fontWeight: 900, fontSize: '0.85rem' }}>R$ {p.price.toFixed(2)}</div>
                                                    </div>
                                                    {isSelected && (
                                                        <div style={{ position: 'absolute', top: '8px', right: '8px', background: '#D4AF37', color: '#000', borderRadius: '50%', width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                            <Check size={12} strokeWidth={4} />
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                ) : (
                    <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', color: '#444' }}>
                        <Info size={40} style={{ marginBottom: '15px' }} />
                        <p style={{ fontWeight: 700 }}>Selecione ou crie um grupo à esquerda para começar a configurar</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminUpsellManager;
