import React, { useState, useEffect, useRef } from 'react';
import { getProducts, getCategories } from '../services/dataService';
import { getImageUrl } from '../lib/imageUtils';
import { BookOpen, Download, Loader2, Filter, Image as ImageIcon, Check } from 'lucide-react';
import html2canvas from 'html2canvas';
import { motion } from 'framer-motion';

const AdminCatalog = () => {
    const [products, setProducts] = useState([]);
    const [availableCategories, setAvailableCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedCategories, setSelectedCategories] = useState([]);
    const [selectedProducts, setSelectedProducts] = useState([]);
    const [isGenerating, setIsGenerating] = useState(false);
    const catalogPreviewRef = useRef(null);

    useEffect(() => { loadData(); }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [productsData, categoriesData] = await Promise.all([getProducts(), getCategories()]);
            if (productsData && productsData.documents) setProducts(productsData.documents);
            if (categoriesData) setAvailableCategories(categoriesData.map(c => ({ id: c.id, label: c.name })));
        } catch (err) { console.error('Error:', err); } finally { setLoading(false); }
    };

    const toggleCategory = (id) => {
        setSelectedCategories(prev => {
            if (prev.includes(id)) return prev.filter(c => c !== id);
            return [...prev, id];
        });
    };

    const toggleProduct = (p) => {
        setSelectedProducts(prev => {
            const exists = prev.find(item => item.$id === p.$id || item.id === p.id);
            return exists ? prev.filter(item => (item.$id !== p.$id && item.id !== p.id)) : [...prev, p];
        });
    };

    const filteredProducts = products.filter(p => {
        if (selectedCategories.length === 0) return true;
        const catId = p.category;
        return selectedCategories.includes(catId);
    });

    const generateCatalog = async () => {
        if (selectedProducts.length === 0) return;
        setIsGenerating(true);
        try {
            const element = catalogPreviewRef.current;
            if (!element) return;
            const images = element.querySelectorAll('img');
            await Promise.all(Array.from(images).map(img => {
                if (img.src && !img.src.includes('?t=')) img.src = img.src + (img.src.includes('?') ? '&' : '?') + 't=' + new Date().getTime();
                return img.complete ? Promise.resolve() : new Promise(res => { img.onload = res; img.onerror = res; });
            }));
            await new Promise(res => setTimeout(res, 800));
            const canvas = await html2canvas(element, { useCORS: true, scale: 2, backgroundColor: '#ffffff' });
            const link = document.createElement('a');
            link.download = `catalogo_${new Date().getTime()}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
        } catch (err) { console.error('Error:', err); } finally { 
            setIsGenerating(false); 
            setSelectedProducts([]);
            setSelectedCategories([]);
        }
    };

    if (loading) return null;

    return (
        <div style={{ padding: '0 20px 40px' }}>

            <div className="admin-grid-2col" style={{ gridTemplateColumns: '1fr 225px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
                    <div className="glass-card" style={{ padding: '30px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                            <Filter size={20} color="#D4AF37" />
                            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>Filtrar</h3>
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                            {availableCategories.map(cat => {
                                const active = selectedCategories.includes(cat.id);
                                return (
                                    <button 
                                        key={cat.id} 
                                        onClick={() => toggleCategory(cat.id)} 
                                        style={{ 
                                            padding: '10px 18px', 
                                            borderRadius: '12px', 
                                            border: '1px solid', 
                                            borderColor: active ? '#D4AF37' : 'rgba(255,255,255,0.1)', 
                                            background: active ? 'rgba(212, 175, 55, 0.1)' : 'transparent', 
                                            color: active ? '#D4AF37' : '#888', 
                                            cursor: 'pointer', 
                                            fontWeight: 700, 
                                            fontSize: '0.85rem',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '8px'
                                        }}
                                    >
                                        <div style={{ width: '14px', height: '14px', border: '2px solid', borderColor: active ? '#D4AF37' : '#555', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: active ? '#D4AF37' : 'transparent' }}>
                                            {active && <Check size={10} color="#000" />}
                                        </div>
                                        {cat.label}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div className="glass-card" style={{ padding: '30px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                            <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800 }}>Produtos</h3>
                            <button onClick={() => setSelectedProducts([...filteredProducts])} style={{ background: 'rgba(255,255,255,0.05)', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '10px', fontSize: '0.75rem', fontWeight: 800, cursor: 'pointer' }}>Selecionar Tudo</button>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '20px', maxHeight: '1000px', overflowY: 'auto', paddingRight: '10px' }}>
                            {filteredProducts.map(p => {
                                const selected = selectedProducts.some(item => item.$id === p.$id || item.id === p.id);
                                return (
                                    <div key={p.$id || p.id} onClick={() => toggleProduct(p)} style={{ background: 'rgba(255,255,255,0.02)', borderRadius: '20px', border: '2px solid', borderColor: selected ? '#D4AF37' : 'transparent', overflow: 'hidden', cursor: 'pointer', transition: 'all 0.2s' }}>
                                        <div style={{ height: '140px', background: '#000' }}>
                                            {p.image ? <img src={getImageUrl(p.image)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: selected ? 1 : 0.5 }} /> : <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><ImageIcon size={30} color="#333" /></div>}
                                        </div>
                                        <div style={{ padding: '12px' }}>
                                            <div style={{ fontWeight: 800, fontSize: '0.85rem', color: selected ? '#fff' : '#666', marginBottom: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.title}</div>
                                            <div style={{ color: '#D4AF37', fontWeight: 900 }}>R$ {parseFloat(p.price || 0).toFixed(2)}</div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                <div className="glass-card premium-shadow" style={{ padding: '20px', position: 'sticky', top: '20px' }}>
                    <h3 style={{ margin: '0 0 15px', fontSize: '1.1rem', fontWeight: 800 }}>Exportação</h3>
                    <div style={{ background: 'rgba(0,0,0,0.3)', padding: '15px', borderRadius: '15px', marginBottom: '20px', textAlign: 'center' }}>
                        <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#D4AF37' }}>{selectedProducts.length}</div>
                        <div style={{ fontSize: '0.55rem', fontWeight: 800, color: '#555', textTransform: 'uppercase', letterSpacing: '1px' }}>Produtos Selecionados</div>
                    </div>
                    <button 
                        onClick={generateCatalog} 
                        disabled={isGenerating || selectedProducts.length === 0} 
                        style={{ 
                            width: '100%', 
                            background: selectedProducts.length === 0 ? 'rgba(255,255,255,0.05)' : '#D4AF37', 
                            color: '#000', 
                            border: 'none', 
                            borderRadius: '12px', 
                            padding: '14px', 
                            fontWeight: 900, 
                            cursor: 'pointer',
                            fontSize: '0.75rem'
                        }}
                    >
                        {isGenerating ? 'PROCESSANDO...' : 'GERAR CATÁLOGO'}
                    </button>
                </div>
            </div>

            <div style={{ position: 'absolute', left: '-9999px', top: 0 }}>
                <div ref={catalogPreviewRef} style={{ width: '850px', backgroundColor: '#ffffff', padding: '50px', fontFamily: "'Inter', sans-serif" }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '4px solid #D4AF37', paddingBottom: '30px', marginBottom: '40px' }}>
                        <div>
                            <h1 style={{ margin: 0, color: '#000', fontSize: '2.8rem', fontWeight: '900' }}>OFERTAS</h1>
                            <p style={{ margin: '8px 0 0 0', color: '#666', fontSize: '1.2rem' }}>Wilson Distribuidora</p>
                        </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '25px' }}>
                        {selectedProducts.map(p => (
                            <div key={`exp_${p.$id || p.id}`} style={{ border: '1px solid #eee', borderRadius: '16px', overflow: 'hidden', display: 'flex', flexDirection: 'column', backgroundColor: '#fff' }}>
                                <div style={{ height: '220px', backgroundColor: '#f9f9f9' }}>
                                    {p.image && <img src={getImageUrl(p.image)} alt="" crossOrigin="anonymous" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                                </div>
                                <div style={{ padding: '20px', borderTop: '6px solid #D4AF37' }}>
                                    <div style={{ color: '#000', fontSize: '1.1rem', fontWeight: '800', marginBottom: '10px' }}>{p.title}</div>
                                    <div style={{ color: '#D4AF37', fontWeight: '900', fontSize: '1.8rem' }}>R$ {parseFloat(p.price || 0).toFixed(2)}<span style={{ fontSize: '1rem', color: '#999' }}>/{p.uom || 'UN'}</span></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminCatalog;
