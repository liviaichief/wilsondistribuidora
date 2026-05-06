import React, { useState, useEffect, useRef } from 'react';
import { getProducts, getCategories } from '../services/dataService';
import { getImageUrl } from '../lib/imageUtils';
import { Image as ImageIcon, Check, Sparkles, X } from 'lucide-react';
import html2canvas from 'html2canvas';
import { motion, AnimatePresence } from 'framer-motion';

const AdminCatalog = () => {
    const [products, setProducts] = useState([]);
    const [availableCategories, setAvailableCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedCategories, setSelectedCategories] = useState([]);
    const [selectedProducts, setSelectedProducts] = useState([]);
    const [isGenerating, setIsGenerating] = useState(false);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
    const catalogPreviewRef = useRef(null);
    const chipsRef = useRef(null);
    const [isDragging, setIsDragging] = useState(false);
    const [dragStartX, setDragStartX] = useState(0);
    const [dragScrollLeft, setDragScrollLeft] = useState(0);

    const handleChipMouseDown = (e) => {
        setIsDragging(true);
        setDragStartX(e.pageX - chipsRef.current.offsetLeft);
        setDragScrollLeft(chipsRef.current.scrollLeft);
    };
    const handleChipMouseLeave = () => setIsDragging(false);
    const handleChipMouseUp = () => setIsDragging(false);
    const handleChipMouseMove = (e) => {
        if (!isDragging) return;
        e.preventDefault();
        const x = e.pageX - chipsRef.current.offsetLeft;
        chipsRef.current.scrollLeft = dragScrollLeft - (x - dragStartX) * 1.5;
    };

    useEffect(() => {
        loadData();
        const handleResize = () => setIsMobile(window.innerWidth < 1024);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [productsData, categoriesData] = await Promise.all([getProducts(), getCategories()]);
            if (productsData?.documents) setProducts(productsData.documents);
            if (categoriesData) setAvailableCategories(categoriesData.map(c => ({ id: c.id, label: c.name })));
        } catch (err) { console.error('Error:', err); } finally { setLoading(false); }
    };

    const toggleCategory = (id) => setSelectedCategories(prev =>
        prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    );

    const toggleProduct = (p) => setSelectedProducts(prev => {
        const exists = prev.find(item => item.$id === p.$id || item.id === p.id);
        return exists ? prev.filter(item => item.$id !== p.$id && item.id !== p.id) : [...prev, p];
    });

    const filteredProducts = products.filter(p =>
        selectedCategories.length === 0 || selectedCategories.includes(p.category)
    );

    const generateCatalog = async () => {
        if (selectedProducts.length === 0) return;
        setIsGenerating(true);
        try {
            const element = catalogPreviewRef.current;
            if (!element) return;
            const images = element.querySelectorAll('img');
            await Promise.all(Array.from(images).map(img => {
                if (img.src && !img.src.includes('?t=')) img.src = img.src + (img.src.includes('?') ? '&' : '?') + 't=' + Date.now();
                return img.complete ? Promise.resolve() : new Promise(res => { img.onload = res; img.onerror = res; });
            }));
            await new Promise(res => setTimeout(res, 800));
            const canvas = await html2canvas(element, { useCORS: true, scale: 2, backgroundColor: '#ffffff' });
            const link = document.createElement('a');
            link.download = `catalogo_${Date.now()}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
        } catch (err) { console.error('Error:', err); } finally {
            setIsGenerating(false);
            setSelectedProducts([]);
            setSelectedCategories([]);
        }
    };

    if (loading) return null;

    /* ─── MOBILE LAYOUT ─────────────────────────────────────── */
    if (isMobile) return (
        <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 145px)', overflow: 'hidden', background: '#080808' }}>

            {/* ── Filter chips ── */}
            <div style={{ padding: '0 16px 12px', flexShrink: 0 }}>
                <div
                    ref={chipsRef}
                    className="catalog-chips"
                    onMouseDown={handleChipMouseDown}
                    onMouseLeave={handleChipMouseLeave}
                    onMouseUp={handleChipMouseUp}
                    onMouseMove={handleChipMouseMove}
                    style={{ display: 'flex', gap: '8px', overflowX: 'auto', WebkitOverflowScrolling: 'touch', paddingBottom: '4px', cursor: isDragging ? 'grabbing' : 'grab' }}
                >
                    <button
                        onClick={() => setSelectedCategories([])}
                        style={{
                            flexShrink: 0, padding: '7px 16px', borderRadius: '100px',
                            border: `1px solid ${selectedCategories.length === 0 ? '#D4AF37' : 'rgba(255,255,255,0.1)'}`,
                            background: selectedCategories.length === 0 ? 'rgba(212,175,55,0.15)' : 'rgba(255,255,255,0.04)',
                            color: selectedCategories.length === 0 ? '#D4AF37' : '#666',
                            fontWeight: 700, fontSize: '0.75rem', cursor: 'pointer', whiteSpace: 'nowrap'
                        }}
                    >Todos</button>
                    {availableCategories.map(cat => {
                        const active = selectedCategories.includes(cat.id);
                        return (
                            <button key={cat.id} onClick={() => toggleCategory(cat.id)} style={{
                                flexShrink: 0, padding: '7px 16px', borderRadius: '100px',
                                border: `1px solid ${active ? '#D4AF37' : 'rgba(255,255,255,0.1)'}`,
                                background: active ? 'rgba(212,175,55,0.15)' : 'rgba(255,255,255,0.04)',
                                color: active ? '#D4AF37' : '#666',
                                fontWeight: 700, fontSize: '0.75rem', cursor: 'pointer', whiteSpace: 'nowrap',
                                display: 'flex', alignItems: 'center', gap: '6px'
                            }}>
                                {active && <Check size={11} />}
                                {cat.label}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* ── Toolbar ── */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 16px 12px', flexShrink: 0 }}>
                <span style={{ fontSize: '0.7rem', color: '#444', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>
                    {filteredProducts.length} produtos
                </span>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={() => { setSelectedProducts([]); setSelectedCategories([]); }} style={{
                        padding: '6px 14px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)',
                        background: 'rgba(255,255,255,0.04)', color: '#666', fontSize: '0.7rem', fontWeight: 800, cursor: 'pointer'
                    }}>Limpar</button>
                    <button onClick={() => setSelectedProducts([...filteredProducts])} style={{
                        padding: '6px 14px', borderRadius: '10px', border: '1px solid rgba(212,175,55,0.25)',
                        background: 'rgba(212,175,55,0.08)', color: '#D4AF37', fontSize: '0.7rem', fontWeight: 800, cursor: 'pointer'
                    }}>Todos</button>
                </div>
            </div>

            {/* ── Product grid ── */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '0 16px', paddingBottom: selectedProducts.length > 0 ? '100px' : '16px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                    {filteredProducts.map(p => {
                        const selected = selectedProducts.some(item => item.$id === p.$id || item.id === p.id);
                        return (
                            <motion.div
                                key={p.$id || p.id}
                                onClick={() => toggleProduct(p)}
                                whileTap={{ scale: 0.96 }}
                                style={{
                                    borderRadius: '16px',
                                    overflow: 'hidden',
                                    cursor: 'pointer',
                                    border: `1.5px solid ${selected ? '#D4AF37' : 'rgba(255,255,255,0.06)'}`,
                                    background: selected ? 'rgba(212,175,55,0.05)' : 'rgba(255,255,255,0.02)',
                                    transition: 'border-color 0.2s, box-shadow 0.2s',
                                    boxShadow: selected ? '0 0 0 1px rgba(212,175,55,0.2), 0 8px 24px rgba(212,175,55,0.08)' : 'none',
                                    position: 'relative'
                                }}
                            >
                                {/* Selection badge */}
                                <AnimatePresence>
                                    {selected && (
                                        <motion.div
                                            initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
                                            style={{
                                                position: 'absolute', top: '8px', right: '8px', zIndex: 2,
                                                width: '22px', height: '22px', borderRadius: '50%',
                                                background: '#D4AF37', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                boxShadow: '0 2px 8px rgba(212,175,55,0.4)'
                                            }}
                                        >
                                            <Check size={12} color="#000" strokeWidth={3} />
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                {/* Image */}
                                <div style={{ height: '120px', background: '#111', position: 'relative', overflow: 'hidden' }}>
                                    {p.image
                                        ? <img src={getImageUrl(p.image)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: selected ? 1 : 0.65, transition: 'opacity 0.2s' }} />
                                        : <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><ImageIcon size={28} color="#2a2a2a" /></div>
                                    }
                                    {/* shimmer overlay on unselected */}
                                    {!selected && <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, transparent 40%, rgba(0,0,0,0.4) 100%)' }} />}
                                </div>

                                {/* Info */}
                                <div style={{ padding: '10px 10px 12px' }}>
                                    <div style={{
                                        fontWeight: 700, fontSize: '0.72rem',
                                        color: selected ? '#e5e5e5' : '#777',
                                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                                        marginBottom: '5px', lineHeight: 1.3
                                    }}>{p.title}</div>
                                    <div style={{ color: '#D4AF37', fontWeight: 900, fontSize: '0.85rem', letterSpacing: '-0.3px' }}>
                                        R$ {parseFloat(p.price || 0).toFixed(2)}
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            </div>

            {/* ── Floating export bar ── */}
            <AnimatePresence>
                {selectedProducts.length > 0 && (
                    <motion.div
                        initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 100, opacity: 0 }}
                        transition={{ type: 'spring', damping: 22, stiffness: 260 }}
                        style={{
                            position: 'fixed', bottom: '84px', left: '12px', right: '12px', zIndex: 200,
                            background: 'rgba(12,12,12,0.92)', backdropFilter: 'blur(20px)',
                            border: '1px solid rgba(212,175,55,0.2)', borderRadius: '20px',
                            padding: '14px 18px', display: 'flex', alignItems: 'center', gap: '14px',
                            boxShadow: '0 8px 40px rgba(0,0,0,0.6), 0 0 0 1px rgba(212,175,55,0.08)'
                        }}
                    >
                        <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '1.3rem', fontWeight: 900, color: '#D4AF37', lineHeight: 1 }}>{selectedProducts.length}</div>
                            <div style={{ fontSize: '0.6rem', color: '#555', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', marginTop: '2px' }}>selecionados</div>
                        </div>
                        <button onClick={() => setSelectedProducts([])} style={{
                            background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
                            color: '#555', padding: '10px 14px', borderRadius: '12px', cursor: 'pointer', fontSize: '0.7rem', fontWeight: 800
                        }}><X size={15} /></button>
                        <button onClick={generateCatalog} disabled={isGenerating} style={{
                            flex: 2, background: 'linear-gradient(135deg, #D4AF37, #b8952e)',
                            color: '#000', border: 'none', borderRadius: '12px', padding: '12px',
                            fontWeight: 900, fontSize: '0.75rem', cursor: 'pointer', letterSpacing: '0.5px',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                            boxShadow: '0 4px 16px rgba(212,175,55,0.3)'
                        }}>
                            {isGenerating ? 'GERANDO...' : <><Sparkles size={14} /> GERAR CATÁLOGO</>}
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            <style>{`
                .catalog-chips::-webkit-scrollbar { display: none; }
                .catalog-chips { -ms-overflow-style: none; scrollbar-width: none; }
            `}</style>

            {/* Hidden export canvas */}
            <div style={{ position: 'absolute', left: '-9999px', top: 0 }}>
                <div ref={catalogPreviewRef} style={{ width: '850px', backgroundColor: '#ffffff', padding: '50px', fontFamily: "'Inter', sans-serif" }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '4px solid #D4AF37', paddingBottom: '30px', marginBottom: '40px' }}>
                        <div>
                            <h1 style={{ margin: 0, color: '#000', fontSize: '2.8rem', fontWeight: 900 }}>OFERTAS</h1>
                            <p style={{ margin: '8px 0 0', color: '#666', fontSize: '1.2rem' }}>Wilson Distribuidora</p>
                        </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '25px' }}>
                        {selectedProducts.map(p => (
                            <div key={`exp_${p.$id || p.id}`} style={{ border: '1px solid #eee', borderRadius: '16px', overflow: 'hidden', backgroundColor: '#fff' }}>
                                <div style={{ height: '220px', backgroundColor: '#f9f9f9' }}>
                                    {p.image && <img src={getImageUrl(p.image)} alt="" crossOrigin="anonymous" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                                </div>
                                <div style={{ padding: '20px', borderTop: '6px solid #D4AF37' }}>
                                    <div style={{ color: '#000', fontSize: '1.1rem', fontWeight: 800, marginBottom: '4px' }}>{p.title}</div>
                                    {p.external_code && <div style={{ color: '#999', fontSize: '0.7rem', fontWeight: 700, marginBottom: '8px' }}>Ref: {p.external_code}</div>}
                                    <div style={{ color: '#D4AF37', fontWeight: 900, fontSize: '1.8rem' }}>R$ {parseFloat(p.price || 0).toFixed(2)}<span style={{ fontSize: '1rem', color: '#999' }}>/{p.uom || 'UN'}</span></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );

    /* ─── DESKTOP LAYOUT ────────────────────────────────────── */
    return (
        <div style={{ padding: '0 20px 40px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 225px', gap: '40px', alignItems: 'start' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
                    <div className="glass-card" style={{ padding: '30px' }}>
                        <h3 style={{ margin: '0 0 20px', fontSize: '1.1rem', fontWeight: 800 }}>Filtrar por Categoria</h3>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                            {availableCategories.map(cat => {
                                const active = selectedCategories.includes(cat.id);
                                return (
                                    <button key={cat.id} onClick={() => toggleCategory(cat.id)} style={{
                                        padding: '10px 18px', borderRadius: '12px', border: '1px solid',
                                        borderColor: active ? '#D4AF37' : 'rgba(255,255,255,0.1)',
                                        background: active ? 'rgba(212,175,55,0.1)' : 'transparent',
                                        color: active ? '#D4AF37' : '#888', cursor: 'pointer',
                                        fontWeight: 700, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px'
                                    }}>
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
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <button onClick={() => setSelectedProducts([])} style={{ background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', padding: '8px 16px', borderRadius: '10px', fontSize: '0.75rem', fontWeight: 800, cursor: 'pointer' }}>Limpar</button>
                                <button onClick={() => setSelectedProducts([...filteredProducts])} style={{ background: 'rgba(212,175,55,0.1)', color: '#D4AF37', border: '1px solid rgba(212,175,55,0.3)', padding: '8px 16px', borderRadius: '10px', fontSize: '0.75rem', fontWeight: 800, cursor: 'pointer' }}>Todos</button>
                            </div>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '20px', maxHeight: '1000px', overflowY: 'auto' }}>
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
                        <div style={{ fontSize: '0.55rem', fontWeight: 800, color: '#555', textTransform: 'uppercase', letterSpacing: '1px' }}>Selecionados</div>
                    </div>
                    <button onClick={generateCatalog} disabled={isGenerating || selectedProducts.length === 0} style={{
                        width: '100%', background: selectedProducts.length === 0 ? 'rgba(255,255,255,0.05)' : '#D4AF37',
                        color: '#000', border: 'none', borderRadius: '12px', padding: '14px',
                        fontWeight: 900, cursor: 'pointer', fontSize: '0.75rem'
                    }}>
                        {isGenerating ? 'PROCESSANDO...' : 'GERAR CATÁLOGO'}
                    </button>
                </div>
            </div>

            {/* Hidden export canvas */}
            <div style={{ position: 'absolute', left: '-9999px', top: 0 }}>
                <div ref={catalogPreviewRef} style={{ width: '850px', backgroundColor: '#ffffff', padding: '50px', fontFamily: "'Inter', sans-serif" }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '4px solid #D4AF37', paddingBottom: '30px', marginBottom: '40px' }}>
                        <div>
                            <h1 style={{ margin: 0, color: '#000', fontSize: '2.8rem', fontWeight: 900 }}>OFERTAS</h1>
                            <p style={{ margin: '8px 0 0', color: '#666', fontSize: '1.2rem' }}>Wilson Distribuidora</p>
                        </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '25px' }}>
                        {selectedProducts.map(p => (
                            <div key={`exp_${p.$id || p.id}`} style={{ border: '1px solid #eee', borderRadius: '16px', overflow: 'hidden', backgroundColor: '#fff' }}>
                                <div style={{ height: '220px', backgroundColor: '#f9f9f9' }}>
                                    {p.image && <img src={getImageUrl(p.image)} alt="" crossOrigin="anonymous" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                                </div>
                                <div style={{ padding: '20px', borderTop: '6px solid #D4AF37' }}>
                                    <div style={{ color: '#000', fontSize: '1.1rem', fontWeight: 800, marginBottom: '4px' }}>{p.title}</div>
                                    {p.external_code && <div style={{ color: '#999', fontSize: '0.7rem', fontWeight: 700, marginBottom: '8px' }}>Ref: {p.external_code}</div>}
                                    <div style={{ color: '#D4AF37', fontWeight: 900, fontSize: '1.8rem' }}>R$ {parseFloat(p.price || 0).toFixed(2)}<span style={{ fontSize: '1rem', color: '#999' }}>/{p.uom || 'UN'}</span></div>
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
