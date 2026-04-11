import React, { useState, useEffect, useRef } from 'react';
import { getProducts, getCategories } from '../services/dataService';
import { getImageUrl } from '../lib/imageUtils';
import { BookOpen, CheckSquare, Square, Download, Loader2 } from 'lucide-react';
import html2canvas from 'html2canvas';

const AdminCatalog = () => {
    const [products, setProducts] = useState([]);
    const [availableCategories, setAvailableCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedCategories, setSelectedCategories] = useState([]);
    const [quickFilter, setQuickFilter] = useState(null);
    const [selectedProducts, setSelectedProducts] = useState([]);
    const [isGenerating, setIsGenerating] = useState(false);
    
    const catalogPreviewRef = useRef(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [productsData, categoriesData] = await Promise.all([
                getProducts(),
                getCategories()
            ]);
            
            if (productsData && productsData.documents) {
                setProducts(productsData.documents);
            }
            
            if (categoriesData) {
                setAvailableCategories(categoriesData.map(c => ({ id: c.id, label: c.name })));
            }
        } catch (err) {
            console.error('Failed to load data for catalog:', err);
        } finally {
            setLoading(false);
        }
    };

    const toggleCategory = (categoryId) => {
        setQuickFilter(null);
        setSelectedCategories(prev => 
            prev.includes(categoryId)
                ? prev.filter(c => c !== categoryId)
                : [...prev, categoryId]
        );
    };

    const toggleQuickFilter = (categoryId) => {
        if (quickFilter === categoryId) {
            setQuickFilter(null);
        } else {
            setQuickFilter(categoryId);
            setSelectedCategories([]);
        }
    };

    const toggleProduct = (product) => {
        setSelectedProducts(prev => {
            const exists = prev.find(p => p.$id === product.$id || p.id === product.id);
            if (exists) {
                return prev.filter(p => (p.$id !== product.$id && p.id !== product.id));
            } else {
                return [...prev, product];
            }
        });
    };

    const isProductSelected = (product) => {
        return selectedProducts.some(p => p.$id === product.$id || p.id === product.id);
    };

    // Filter products based on selected categories
    const filteredProducts = products.filter(product => {
        const productCat = (product.category || '').toLowerCase();
        
        // If there's a quick filter, it takes precedence and is exclusive
        if (quickFilter) {
            return productCat === quickFilter.toLowerCase();
        }

        // Otherwise use selectedCategories
        if (selectedCategories.length === 0) return true; // Show all if none selected
        return selectedCategories.includes(productCat);
    });

    const generateCatalog = async () => {
        if (selectedProducts.length === 0) {
            alert('Selecione pelo menos um produto para gerar o catálogo.');
            return;
        }

        setIsGenerating(true);
        try {
            const element = catalogPreviewRef.current;
            if (!element) return;

            // 1. Garantir que todas as imagens no preview estejam carregadas com CORS
            const images = element.querySelectorAll('img');
            const imagePromises = Array.from(images).map(img => {
                // Adicionar timestamp para evitar cache
                if (img.src && !img.src.includes('?t=')) {
                    img.src = img.src + (img.src.includes('?') ? '&' : '?') + 't=' + new Date().getTime();
                }
                
                if (img.complete) return Promise.resolve();
                return new Promise((resolve) => {
                    img.onload = resolve;
                    img.onerror = resolve;
                });
            });

            await Promise.all(imagePromises);
            // Pequena pausa adicional para estabilidade
            await new Promise(res => setTimeout(res, 500));

            const canvas = await html2canvas(element, {
                useCORS: true,
                scale: 2, 
                backgroundColor: '#ffffff',
                logging: true, // Útil para depurar se houver falha
                allowTaint: false,
                imageTimeout: 15000, // 15 segundos de timeout
            });

            // Convert and download
            const dataUrl = canvas.toDataURL('image/png');
            const link = document.createElement('a');
            link.download = `catalogo_wilsondistribuidora_${new Date().getTime()}.png`;
            link.href = dataUrl;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
        } catch (err) {
            console.error('Error generating catalog image:', err);
            alert('Falha ao gerar a imagem do catálogo. Verifique o console.');
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div style={{ display: 'flex', gap: '20px', height: '100%', alignItems: 'flex-start' }}>
            
            {/* MAIN AREA - Filter and Products */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '20px' }}>
                
                {/* Category Filters Top Bar */}
                <div style={{ backgroundColor: '#1a1a1a', padding: '20px', borderRadius: '12px', border: '1px solid #333' }}>
                    <h3 style={{ marginTop: 0, marginBottom: '15px', fontSize: '1.1rem', color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ color: '#fff' }}>1.</span> Filtrar por Categoria
                    </h3>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                        {availableCategories.map(cat => {
                            const isChecked = selectedCategories.includes(cat.id);
                            const isQuickActive = quickFilter === cat.id;
                            
                            return (
                                <div
                                    key={cat.id}
                                    onClick={() => toggleQuickFilter(cat.id)}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        padding: '8px 16px',
                                        borderRadius: '8px',
                                        border: `1px solid ${isQuickActive ? 'var(--primary-color)' : (isChecked ? 'var(--primary-color)' : '#444')}`,
                                        backgroundColor: isQuickActive ? 'rgba(212, 175, 55, 0.2)' : (isChecked ? 'rgba(212, 175, 55, 0.1)' : '#252525'),
                                        color: (isQuickActive || isChecked) ? 'var(--primary-color)' : '#aaa',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s',
                                        fontWeight: (isQuickActive || isChecked) ? 'bold' : 'normal',
                                        userSelect: 'none'
                                    }}
                                >
                                    <div 
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            toggleCategory(cat.id);
                                        }}
                                        style={{ display: 'flex', alignItems: 'center', color: isChecked ? 'var(--primary-color)' : '#666' }}
                                    >
                                        {isChecked ? <CheckSquare size={18} /> : <Square size={18} />}
                                    </div>
                                    {cat.label}
                                </div>
                            );
                        })}
                    </div>
                    {(selectedCategories.length > 0 || quickFilter) && (
                        <button 
                            onClick={() => {
                                setSelectedCategories([]);
                                setQuickFilter(null);
                            }}
                            style={{ marginTop: '15px', background: 'none', border: 'none', color: '#ff4444', cursor: 'pointer', fontSize: '0.9rem', textDecoration: 'underline' }}
                        >
                            Limpar Filtros
                        </button>
                    )}
                </div>

                {/* Product Grid */}
                <div style={{ backgroundColor: '#1a1a1a', padding: '20px', borderRadius: '12px', border: '1px solid #333' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                        <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ color: '#fff' }}>2.</span> Selecione os produtos
                        </h3>
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <button 
                                onClick={() => setSelectedProducts([...filteredProducts])}
                                style={{ background: '#333', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem' }}
                            >
                                Selecionar Tudo (Exibidos)
                            </button>
                            <button 
                                onClick={() => setSelectedProducts([])}
                                style={{ background: 'transparent', border: '1px solid #333', color: '#ccc', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem' }}
                            >
                                Desmarcar Tudo
                            </button>
                        </div>
                    </div>

                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>Carregando produtos...</div>
                    ) : filteredProducts.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>Nenhum produto encontrado.</div>
                    ) : (
                        <div style={{ 
                            display: 'grid', 
                            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', 
                            gap: '15px',
                            maxHeight: '600px',
                            overflowY: 'auto',
                            paddingRight: '10px'
                        }}>
                            {filteredProducts.map(product => {
                                const selected = isProductSelected(product);
                                return (
                                    <div 
                                        key={product.$id || product.id}
                                        onClick={() => toggleProduct(product)}
                                        style={{
                                            position: 'relative',
                                            backgroundColor: '#252525',
                                            borderRadius: '10px',
                                            border: `2px solid ${selected ? 'var(--primary-color)' : '#333'}`,
                                            overflow: 'hidden',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s',
                                            display: 'flex',
                                            flexDirection: 'column'
                                        }}
                                    >
                                        <div style={{ 
                                            position: 'absolute', 
                                            top: '10px', 
                                            right: '10px', 
                                            backgroundColor: selected ? 'var(--primary-color)' : 'rgba(0,0,0,0.5)',
                                            color: '#fff',
                                            borderRadius: '4px',
                                            width: '24px',
                                            height: '24px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            zIndex: 2
                                        }}>
                                            {selected && <CheckSquare size={16} color="#000" />}
                                            {!selected && <Square size={16} />}
                                        </div>
                                        
                                        <div style={{ height: '140px', backgroundColor: '#111', position: 'relative' }}>
                                            {product.image ? (
                                                <img 
                                                    src={getImageUrl(product.image)} 
                                                    alt={product.title} 
                                                    style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: selected ? 1 : 0.7 }}
                                                />
                                            ) : (
                                                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#555' }}>
                                                    Sem Imagem
                                                </div>
                                            )}
                                        </div>
                                        <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'space-between' }}>
                                            <div style={{ fontWeight: 'bold', color: '#fff', fontSize: '0.9rem', marginBottom: '5px' }}>{product.title}</div>
                                            <div style={{ color: 'var(--primary-color)', fontWeight: 'bold', fontSize: '1.1rem' }}>
                                                R$ {parseFloat(product.price || 0).toFixed(2)}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* SIDEBAR FOR ACTIONS */}
            <div style={{ width: '300px', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ backgroundColor: '#1a1a1a', padding: '20px', borderRadius: '12px', border: '1px solid #333', position: 'sticky', top: '20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', color: '#fff' }}>
                        <BookOpen size={24} color="var(--primary-color)" />
                        <h2 style={{ margin: 0, fontSize: '1.2rem' }}>Ações</h2>
                    </div>

                    <div style={{ marginBottom: '20px', backgroundColor: '#252525', padding: '15px', borderRadius: '8px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                            <span style={{ color: '#aaa', fontSize: '0.9rem' }}>Itens Selecionados</span>
                            <span style={{ color: '#fff', fontWeight: 'bold', fontSize: '1.2rem' }}>{selectedProducts.length}</span>
                        </div>
                    </div>

                    <p style={{ color: '#888', fontSize: '0.85rem', marginBottom: '20px', lineHeight: '1.4' }}>
                        Clique no botão abaixo para gerar uma imagem em alta resolução contendo todos os produtos selecionados e pronta para divulgação.
                    </p>

                    <button 
                        onClick={generateCatalog}
                        disabled={isGenerating || selectedProducts.length === 0}
                        style={{
                            width: '100%',
                            padding: '16px',
                            backgroundColor: selectedProducts.length === 0 ? '#333' : 'var(--primary-color)',
                            color: selectedProducts.length === 0 ? '#666' : '#fff',
                            border: 'none',
                            borderRadius: '8px',
                            fontWeight: 'bold',
                            fontSize: '1rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '10px',
                            cursor: (isGenerating || selectedProducts.length === 0) ? 'not-allowed' : 'pointer',
                            transition: 'all 0.2s'
                        }}
                    >
                        {isGenerating ? (
                            <>
                                <Loader2 size={20} className="animate-spin" />
                                Montando Catálogo...
                            </>
                        ) : (
                            <>
                                <Download size={20} />
                                Gerar Catálogo
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* HIDDEN RENDER AREA FOR CATALOG IMAGE (HTML2CANVAS) */}
            <div style={{ position: 'absolute', left: '-9999px', top: 0 }}>
                <div 
                    ref={catalogPreviewRef} 
                    style={{ 
                        width: '800px', 
                        backgroundColor: '#ffffff', 
                        padding: '40px',
                        fontFamily: 'Arial, sans-serif'
                    }}
                >
                    {/* Catalog Header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '3px solid #7E22CE', paddingBottom: '20px', marginBottom: '30px' }}>
                        <div>
                            <h1 style={{ margin: 0, color: '#000', fontSize: '2.5rem', fontWeight: '900', textTransform: 'uppercase' }}>OFERTAS IMPERDÍVEIS</h1>
                            <p style={{ margin: '5px 0 0 0', color: '#666', fontSize: '1.1rem' }}>Sua distribuidora de confiança com os melhores cortes!</p>
                        </div>
                        {/* Assuming public/logo.png exists, we can use it, but for canvas it might be safer to use base64 or absolute if issues arise. Relative usually works if served from root */}
                        <img src="/logo.png" alt="Logo" style={{ height: '137px', objectFit: 'contain' }} crossOrigin="anonymous" />
                    </div>

                    {/* Clean Catalog grid */}
                    <div style={{ 
                        display: 'grid', 
                        gridTemplateColumns: 'repeat(3, 1fr)', 
                        gap: '20px' 
                    }}>
                        {selectedProducts.map(product => (
                            <div key={`render_${product.$id}`} style={{ 
                                border: '1px solid #eee', 
                                borderRadius: '12px',
                                overflow: 'hidden',
                                display: 'flex',
                                flexDirection: 'column',
                                backgroundColor: '#fff',
                                boxShadow: '0 4px 6px rgba(0,0,0,0.05)'
                            }}>
                                <div style={{ height: '220px', backgroundColor: '#f9f9f9', position: 'relative' }}>
                                    {product.image && (
                                        <img 
                                            src={getImageUrl(product.image)} 
                                            alt={product.title} 
                                            crossOrigin="anonymous"
                                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                        />
                                    )}
                                    {product.is_promotion && (
                                        <div style={{
                                            position: 'absolute',
                                            top: '10px',
                                            right: '-30px',
                                            backgroundColor: '#ef4444',
                                            color: '#fff',
                                            padding: '5px 30px',
                                            transform: 'rotate(45deg)',
                                            fontWeight: 'bold',
                                            fontSize: '0.8rem',
                                            boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                                        }}>
                                            OFERTA
                                        </div>
                                    )}
                                </div>
                                <div style={{ padding: '15px', display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'space-between', borderTop: '4px solid #7E22CE' }}>
                                    <div style={{ color: '#333', fontSize: '1.1rem', fontWeight: 'bold', lineHeight: '1.2', marginBottom: '5px' }}>
                                        {product.title}
                                    </div>
                                    <div style={{ color: '#888', fontSize: '0.8rem', marginBottom: '10px', fontFamily: 'monospace' }}>
                                        SKU: {product.sku || (product.$id && product.$id.startsWith('WD') ? product.$id : '-')}
                                    </div>
                                    
                                    <div style={{ marginTop: 'auto' }}>
                                        {product.is_promotion && product.promo_price ? (
                                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                <span style={{ textDecoration: 'line-through', color: '#999', fontSize: '0.9rem' }}>
                                                    De: R$ {parseFloat(product.price || 0).toFixed(2)}
                                                </span>
                                                <span style={{ color: '#ef4444', fontWeight: '900', fontSize: '1.6rem' }}>
                                                    Por: R$ {parseFloat(product.promo_price).toFixed(2)}
                                                    <span style={{ fontSize: '0.9rem', fontWeight: 'bold', color: '#777' }}> /{product.uom || 'KG'}</span>
                                                </span>
                                            </div>
                                        ) : (
                                            <div style={{ color: '#000', fontWeight: '900', fontSize: '1.6rem' }}>
                                                R$ {parseFloat(product.price || 0).toFixed(2)}
                                                <span style={{ fontSize: '0.9rem', fontWeight: 'bold', color: '#777' }}> /{product.uom || 'KG'}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Catalog Footer */}
                    <div style={{ marginTop: '40px', padding: '20px', backgroundColor: '#f5f5f5', borderRadius: '12px', textAlign: 'center', border: '1px solid #ddd' }}>
                        <h3 style={{ margin: '0 0 10px 0', color: '#333', fontSize: '1.2rem' }}>Peça agora pelo nosso WhatsApp!</h3>
                        <p style={{ margin: 0, color: '#666' }}>Garantimos a melhor qualidade e entrega rápida na sua casa ou evento.</p>
                    </div>
                </div>
            </div>

        </div>
    );
};

export default AdminCatalog;
