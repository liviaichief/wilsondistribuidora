import React, { useState, useEffect, useRef } from 'react';
import { getProducts, getCategories, getSettings } from '../services/dataService';
import { getImageUrl } from '../lib/imageUtils';
import { Image as ImageIcon, Check, Sparkles, X, FileImage, FileText } from 'lucide-react';
import html2canvas from 'html2canvas';
import { motion, AnimatePresence } from 'framer-motion';

/* ─── Catalog export template ──────────────────────────────────── */
const CatalogTemplate = React.forwardRef(({ products, storeSettings, catalogTitle, sectionLabel }, ref) => {
    const promos  = products.filter(p => p.is_promotion && p.promo_price);
    const regular = products.filter(p => !(p.is_promotion && p.promo_price));

    const ProductCard = ({ p }) => {
        const hasPromo   = p.is_promotion && p.promo_price;
        const discount   = hasPromo ? Math.round((1 - parseFloat(p.promo_price) / parseFloat(p.price)) * 100) : 0;
        const finalPrice = hasPromo ? p.promo_price : p.price;

        return (
            <div style={{
                background: '#1a1a1a',
                border: '1px solid #2a2a2a',
                borderRadius: '12px',
                overflow: 'hidden',
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
            }}>
                {hasPromo && (
                    <div style={{
                        position: 'absolute', top: '10px', left: '10px', zIndex: 2,
                        background: '#D4AF37', color: '#000',
                        fontSize: '0.7rem', fontWeight: 900, padding: '4px 9px', borderRadius: '6px',
                        letterSpacing: '0.5px',
                    }}>
                        {discount}% OFF
                    </div>
                )}

                {/* Image */}
                <div style={{ height: '170px', background: '#111', overflow: 'hidden', flexShrink: 0 }}>
                    {p.image
                        ? <img src={getImageUrl(p.image)} alt="" crossOrigin="anonymous" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        : <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#333' }}><ImageIcon size={36} /></div>
                    }
                </div>

                {/* Info */}
                <div style={{ padding: '14px', flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div style={{ color: '#fff', fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', lineHeight: 1.3, minHeight: '36px' }}>
                        {p.title}
                    </div>
                    {p.external_code && (
                        <div style={{ color: '#555', fontSize: '0.6rem', fontWeight: 700 }}>Ref: {p.external_code}</div>
                    )}

                    {hasPromo && (
                        <div style={{ color: '#666', fontSize: '0.68rem', textDecoration: 'line-through' }}>
                            R$ {parseFloat(p.price).toFixed(2)}
                        </div>
                    )}
                    <div style={{ color: '#D4AF37', fontWeight: 900, fontSize: '1.25rem', lineHeight: 1 }}>
                        R$ {parseFloat(finalPrice || 0).toFixed(2)}
                        <span style={{ fontSize: '0.65rem', color: '#666', fontWeight: 700, marginLeft: '4px' }}>/{p.uom || 'UN'}</span>
                    </div>

                    <div style={{
                        marginTop: 'auto', paddingTop: '10px',
                        background: '#25D366', borderRadius: '8px',
                        padding: '7px', textAlign: 'center',
                        color: '#fff', fontWeight: 900, fontSize: '0.65rem', letterSpacing: '0.5px',
                    }}>
                        COMPRAR NO WHATSAPP
                    </div>
                </div>
            </div>
        );
    };

    const SectionHeader = ({ emoji, title, action }) => (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '1.3rem' }}>{emoji}</span>
                <h2 style={{ margin: 0, color: '#fff', fontWeight: 900, fontSize: '1.3rem', letterSpacing: '-0.3px' }}>{title}</h2>
            </div>
            {action && (
                <div style={{ color: '#D4AF37', fontSize: '0.7rem', fontWeight: 800, letterSpacing: '1px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    VER TODOS ›
                </div>
            )}
        </div>
    );

    const Grid5 = ({ items }) => (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '16px' }}>
            {items.map(p => <ProductCard key={p.$id || p.id} p={p} />)}
        </div>
    );

    const whatsapp = storeSettings?.whatsapp_number || '';
    const storeName = storeSettings?.store_name || 'WD CARNES DISTRIBUIDORA';

    return (
        <div ref={ref} style={{
            width: '1200px',
            background: '#0a0a0a',
            fontFamily: "'Arial', 'Helvetica Neue', sans-serif",
            color: '#fff',
        }}>
            {/* ── HEADER ── */}
            <div style={{
                background: '#111',
                borderBottom: '2px solid #1a1a1a',
                padding: '18px 40px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
            }}>
                {/* Logo + Nome */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
                    <div style={{ width: '56px', height: '56px', borderRadius: '50%', overflow: 'hidden', background: '#000', border: '2px solid rgba(212,175,55,0.3)', flexShrink: 0 }}>
                        <img src="/logo.png" alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { e.target.style.display = 'none'; }} />
                    </div>
                    <div>
                        <div style={{ color: '#D4AF37', fontWeight: 900, fontSize: '1.2rem', letterSpacing: '-0.3px' }}>{storeName}</div>
                        <div style={{ color: '#555', fontSize: '0.62rem', fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase' }}>Distribuição Premium</div>
                    </div>
                </div>

                {/* Nav links (decorativo) */}
                <div style={{ display: 'flex', gap: '28px' }}>
                    {['INÍCIO', 'PRODUTOS', 'CATEGORIAS', 'OFERTAS', 'CONTATO'].map(l => (
                        <span key={l} style={{ color: '#666', fontSize: '0.72rem', fontWeight: 800, letterSpacing: '0.5px' }}>{l}</span>
                    ))}
                </div>

                {/* Contato */}
                {whatsapp && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ textAlign: 'right' }}>
                            <div style={{ color: '#888', fontSize: '0.55rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1.5px' }}>FALE CONOSCO</div>
                            <div style={{ color: '#fff', fontWeight: 900, fontSize: '0.9rem' }}>{whatsapp}</div>
                        </div>
                        <div style={{ background: '#25D366', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                                <path d="M20.52 3.48A11.93 11.93 0 0 0 12 0C5.37 0 0 5.37 0 12c0 2.11.55 4.16 1.6 5.97L0 24l6.18-1.57A11.94 11.94 0 0 0 12 24c6.63 0 12-5.37 12-12 0-3.21-1.25-6.22-3.48-8.52zM12 22c-1.85 0-3.66-.5-5.24-1.44l-.37-.22-3.87.98.99-3.77-.24-.38A9.93 9.93 0 0 1 2 12C2 6.48 6.48 2 12 2c2.67 0 5.17 1.04 7.06 2.94A9.93 9.93 0 0 1 22 12c0 5.52-4.48 10-10 10z" fill="#fff"/>
                            </svg>
                        </div>
                    </div>
                )}
            </div>

            {/* ── HERO BANNER ── */}
            <div style={{
                background: 'linear-gradient(135deg, #1a0505 0%, #0d0d0d 50%, #050505 100%)',
                padding: '48px 40px',
                position: 'relative',
                overflow: 'hidden',
                borderBottom: '1px solid #1a1a1a',
            }}>
                {/* Glow */}
                <div style={{ position: 'absolute', top: 0, right: 0, width: '400px', height: '100%', background: 'radial-gradient(ellipse at right, rgba(180,40,20,0.18) 0%, transparent 70%)', pointerEvents: 'none' }} />

                <div style={{ position: 'relative', zIndex: 1, maxWidth: '600px' }}>
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '18px' }}>
                        {['QUALIDADE', 'CONFIANÇA', 'SABOR'].map((t, i) => (
                            <span key={i} style={{ background: 'rgba(212,175,55,0.12)', border: '1px solid rgba(212,175,55,0.25)', color: '#D4AF37', fontSize: '0.6rem', fontWeight: 900, padding: '4px 10px', borderRadius: '100px', letterSpacing: '1.5px' }}>
                                {t}
                            </span>
                        ))}
                    </div>

                    <h1 style={{ margin: '0 0 6px', color: '#fff', fontSize: '3.2rem', fontWeight: 900, lineHeight: 1.05, letterSpacing: '-1.5px' }}>
                        {catalogTitle || 'PRODUTOS\nSELECIONADOS'}
                    </h1>
                    <div style={{ color: '#D4AF37', fontSize: '1.1rem', fontWeight: 900, letterSpacing: '1px', marginBottom: '14px' }}>
                        PARA QUEM EXIGE QUALIDADE
                    </div>
                    <p style={{ color: '#888', fontSize: '0.85rem', margin: 0, lineHeight: 1.6 }}>
                        Distribuição premium para açougues, mercados e churrasqueiros.
                    </p>
                </div>

                {/* Stamp */}
                <div style={{
                    position: 'absolute', right: '60px', top: '50%', transform: 'translateY(-50%)',
                    width: '120px', height: '120px', borderRadius: '50%',
                    border: '3px solid #D4AF37', display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center', textAlign: 'center',
                    background: 'rgba(10,10,10,0.85)',
                }}>
                    <div style={{ color: '#D4AF37', fontSize: '0.5rem', fontWeight: 900, letterSpacing: '2px' }}>QUALIDADE</div>
                    <div style={{ color: '#fff', fontSize: '1.1rem', fontWeight: 900, letterSpacing: '-0.5px', margin: '2px 0' }}>PREMIUM</div>
                    <div style={{ width: '60px', height: '1px', background: '#D4AF37', margin: '2px 0' }} />
                    <div style={{ color: '#D4AF37', fontSize: '0.5rem', fontWeight: 900, letterSpacing: '2px' }}>SELECIONADA</div>
                </div>
            </div>

            {/* ── OFERTAS DA SEMANA ── */}
            {promos.length > 0 && (
                <div style={{ padding: '36px 40px', borderBottom: '1px solid #1a1a1a' }}>
                    <SectionHeader emoji="🔥" title={sectionLabel || 'OFERTAS DA SEMANA'} action />
                    <Grid5 items={promos} />
                </div>
            )}

            {/* ── BRAND BANNER ── */}
            <div style={{
                margin: '0',
                background: 'linear-gradient(135deg, #0d0d0d 0%, #1a0a00 50%, #0d0d0d 100%)',
                padding: '36px 40px',
                display: 'flex',
                alignItems: 'center',
                gap: '40px',
                borderTop: '1px solid #1a1a1a',
                borderBottom: '1px solid #1a1a1a',
            }}>
                <div style={{ flex: 1 }}>
                    <div style={{ color: '#888', fontSize: '0.85rem', fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '8px' }}>A TRADIÇÃO DA</div>
                    <div style={{ color: '#D4AF37', fontSize: '3rem', fontWeight: 900, lineHeight: 1, letterSpacing: '-2px', marginBottom: '14px' }}>BRASA</div>
                    <p style={{ color: '#666', fontSize: '0.82rem', lineHeight: 1.7, margin: 0 }}>
                        Selecionamos produtos de qualidade para transformar cada churrasco em uma experiência única.
                    </p>
                </div>
                <div style={{ display: 'flex', gap: '32px', flexShrink: 0 }}>
                    {[['🛡️', 'QUALIDADE', 'GARANTIDA'], ['⭐', 'PRODUTOS', 'SELECIONADOS'], ['🚚', 'ENTREGA', 'RÁPIDA'], ['💬', 'ATENDIMENTO', 'ESPECIALIZADO']].map(([icon, l1, l2]) => (
                        <div key={l1} style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '1.6rem', marginBottom: '6px' }}>{icon}</div>
                            <div style={{ color: '#fff', fontSize: '0.6rem', fontWeight: 900, letterSpacing: '0.5px' }}>{l1}</div>
                            <div style={{ color: '#666', fontSize: '0.6rem', fontWeight: 700 }}>{l2}</div>
                        </div>
                    ))}
                </div>
            </div>

            {/* ── MAIS VENDIDOS / REGULARES ── */}
            {regular.length > 0 && (
                <div style={{ padding: '36px 40px', borderBottom: '1px solid #1a1a1a' }}>
                    <SectionHeader emoji="⭐" title="MAIS VENDIDOS" action />
                    <Grid5 items={regular} />
                </div>
            )}

            {/* ── CTA WHATSAPP ── */}
            {whatsapp && (
                <div style={{
                    background: '#800020',
                    padding: '32px 40px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                        <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: '50%', width: '56px', height: '56px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                                <path d="M20.52 3.48A11.93 11.93 0 0 0 12 0C5.37 0 0 5.37 0 12c0 2.11.55 4.16 1.6 5.97L0 24l6.18-1.57A11.94 11.94 0 0 0 12 24c6.63 0 12-5.37 12-12 0-3.21-1.25-6.22-3.48-8.52zM12 22c-1.85 0-3.66-.5-5.24-1.44l-.37-.22-3.87.98.99-3.77-.24-.38A9.93 9.93 0 0 1 2 12C2 6.48 6.48 2 12 2c2.67 0 5.17 1.04 7.06 2.94A9.93 9.93 0 0 1 22 12c0 5.52-4.48 10-10 10z" fill="#fff"/>
                            </svg>
                        </div>
                        <div>
                            <div style={{ color: '#fff', fontWeight: 900, fontSize: '1.2rem', marginBottom: '4px' }}>PRECISA DE AJUDA PARA ESCOLHER?</div>
                            <div style={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.8rem' }}>Fale com nosso time no WhatsApp e receba atendimento rápido!</div>
                        </div>
                    </div>
                    <div style={{ background: '#fff', borderRadius: '12px', padding: '14px 28px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ color: '#800020', fontWeight: 900, fontSize: '0.9rem' }}>FALE AGORA</span>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                            <path d="M20.52 3.48A11.93 11.93 0 0 0 12 0C5.37 0 0 5.37 0 12c0 2.11.55 4.16 1.6 5.97L0 24l6.18-1.57A11.94 11.94 0 0 0 12 24c6.63 0 12-5.37 12-12 0-3.21-1.25-6.22-3.48-8.52z" fill="#800020"/>
                        </svg>
                    </div>
                </div>
            )}

            {/* ── FOOTER ── */}
            <div style={{
                background: '#080808',
                borderTop: '1px solid #1a1a1a',
                padding: '28px 40px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', overflow: 'hidden', background: '#111', flexShrink: 0 }}>
                        <img src="/logo.png" alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { e.target.style.display = 'none'; }} />
                    </div>
                    <div>
                        <div style={{ color: '#D4AF37', fontWeight: 900, fontSize: '0.8rem' }}>{storeName}</div>
                        <div style={{ color: '#444', fontSize: '0.6rem', fontWeight: 700 }}>Distribuição premium de carnes</div>
                    </div>
                </div>

                <div style={{ color: '#333', fontSize: '0.65rem', fontWeight: 700 }}>
                    © 2026 {storeName} · Todos os direitos reservados
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ color: '#555', fontSize: '0.65rem', fontWeight: 700 }}>Aceitamos:</span>
                    {['VISA', 'MASTER', 'ELO', 'PIX'].map(b => (
                        <span key={b} style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', color: '#888', fontSize: '0.6rem', fontWeight: 900, padding: '3px 8px', borderRadius: '5px', letterSpacing: '0.5px' }}>{b}</span>
                    ))}
                </div>
            </div>
        </div>
    );
});
CatalogTemplate.displayName = 'CatalogTemplate';

/* ─── Main component ──────────────────────────────────────────── */
const AdminCatalog = () => {
    const [products,            setProducts]            = useState([]);
    const [availableCategories, setAvailableCategories] = useState([]);
    const [storeSettings,       setStoreSettings]       = useState({});
    const [loading,             setLoading]             = useState(true);
    const [selectedCategories,  setSelectedCategories]  = useState([]);
    const [selectedProducts,    setSelectedProducts]    = useState([]);
    const [isGenerating,        setIsGenerating]        = useState(false);
    const [catalogTitle,        setCatalogTitle]        = useState('');
    const [sectionLabel,        setSectionLabel]        = useState('');
    const [isMobile,            setIsMobile]            = useState(window.innerWidth < 1024);
    const catalogPreviewRef = useRef(null);
    const chipsRef          = useRef(null);
    const [isDragging,      setIsDragging]   = useState(false);
    const [dragStartX,      setDragStartX]   = useState(0);
    const [dragScrollLeft,  setDragScrollLeft] = useState(0);

    const handleChipMouseDown = (e) => { setIsDragging(true); setDragStartX(e.pageX - chipsRef.current.offsetLeft); setDragScrollLeft(chipsRef.current.scrollLeft); };
    const handleChipMouseLeave = () => setIsDragging(false);
    const handleChipMouseUp   = () => setIsDragging(false);
    const handleChipMouseMove = (e) => { if (!isDragging) return; e.preventDefault(); const x = e.pageX - chipsRef.current.offsetLeft; chipsRef.current.scrollLeft = dragScrollLeft - (x - dragStartX) * 1.5; };

    useEffect(() => {
        loadData();
        const handleResize = () => setIsMobile(window.innerWidth < 1024);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [productsData, categoriesData, settings] = await Promise.all([getProducts(), getCategories(), getSettings()]);
            if (productsData?.documents) setProducts(productsData.documents);
            if (categoriesData) setAvailableCategories(categoriesData.map(c => ({ id: c.id, label: c.name })));
            if (settings) setStoreSettings(settings);
        } catch (err) { console.error('Error:', err); } finally { setLoading(false); }
    };

    const toggleCategory = (id) => setSelectedCategories(prev => prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]);
    const toggleProduct  = (p)  => setSelectedProducts(prev => {
        const exists = prev.find(item => item.$id === p.$id || item.id === p.id);
        return exists ? prev.filter(item => item.$id !== p.$id && item.id !== p.id) : [...prev, p];
    });

    const filteredProducts = products.filter(p =>
        selectedCategories.length === 0 || selectedCategories.includes(p.category)
    );

    /* ── Converter URL de imagem para base64 via fetch (resolve CORS) ── */
    const imgToBase64 = (url) => new Promise((resolve) => {
        if (!url || url.startsWith('data:')) { resolve(null); return; }
        // Tenta via fetch com credenciais (sessão Appwrite)
        fetch(url, { credentials: 'include', mode: 'cors' })
            .then(r => r.blob())
            .then(blob => {
                const reader = new FileReader();
                reader.onload  = () => resolve(reader.result);
                reader.onerror = () => resolve(null);
                reader.readAsDataURL(blob);
            })
            .catch(() => {
                // Fallback: canvas com crossOrigin
                const img = new Image();
                img.crossOrigin = 'anonymous';
                img.onload = () => {
                    try {
                        const c = document.createElement('canvas');
                        c.width  = img.naturalWidth  || 400;
                        c.height = img.naturalHeight || 300;
                        c.getContext('2d').drawImage(img, 0, 0);
                        resolve(c.toDataURL('image/jpeg', 0.9));
                    } catch { resolve(null); }
                };
                img.onerror = () => resolve(null);
                img.src = url + (url.includes('?') ? '&' : '?') + '_cb=' + Date.now();
            });
    });

    /* ── Substitui todos os src por base64 antes de capturar ── */
    const waitForImages = async (element) => {
        const imgs = Array.from(element.querySelectorAll('img'));
        await Promise.all(imgs.map(async (img) => {
            const src = img.getAttribute('src');
            if (!src || src.startsWith('data:') || src.includes('placehold.co')) return;
            const b64 = await imgToBase64(src);
            if (b64) img.src = b64;
        }));
        // Pequeno delay para o DOM refletir as trocas
        await new Promise(res => setTimeout(res, 400));
    };

    /* ── PNG ── */
    const generatePng = async () => {
        if (!selectedProducts.length) return;
        setIsGenerating(true);
        try {
            const el = catalogPreviewRef.current;
            if (!el) return;
            await waitForImages(el);
            const canvas = await html2canvas(el, { scale: 2, backgroundColor: '#0a0a0a', useCORS: false, allowTaint: true, logging: false });
            const link = document.createElement('a');
            link.download = `catalogo_${Date.now()}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
        } catch (err) { console.error('PNG Error:', err); } finally { setIsGenerating(false); }
    };

    /* ── PDF ── */
    const generatePdf = async () => {
        if (!selectedProducts.length) return;
        setIsGenerating(true);
        try {
            const el = catalogPreviewRef.current;
            if (!el) return;
            await waitForImages(el);
            const html2pdf = (await import('html2pdf.js')).default;
            const opt = {
                margin:     0,
                filename:   `catalogo_${Date.now()}.pdf`,
                image:      { type: 'jpeg', quality: 0.96 },
                html2canvas: { scale: 2, useCORS: false, allowTaint: true, backgroundColor: '#0a0a0a', logging: false },
                jsPDF:      { unit: 'px', format: [1200, el.scrollHeight], orientation: 'portrait', compress: true },
            };
            await html2pdf().set(opt).from(el).save();
        } catch (err) { console.error('PDF Error:', err); } finally { setIsGenerating(false); }
    };

    if (loading) return null;

    /* ── Shared export action bar ── */
    const ExportActions = ({ floating = false }) => (
        <div style={{
            display: 'flex', gap: '10px', alignItems: 'center',
            ...(floating ? {} : { marginTop: '16px' })
        }}>
            <button
                onClick={generatePng}
                disabled={isGenerating || !selectedProducts.length}
                style={{
                    flex: 1,
                    background: selectedProducts.length ? 'linear-gradient(135deg, #D4AF37, #b8952e)' : 'rgba(255,255,255,0.05)',
                    color: selectedProducts.length ? '#000' : '#444',
                    border: 'none', borderRadius: '12px', padding: '12px',
                    fontWeight: 900, fontSize: '0.72rem', cursor: selectedProducts.length ? 'pointer' : 'not-allowed',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px',
                    transition: 'all 0.2s',
                }}
            >
                <FileImage size={14} />
                {isGenerating ? 'GERANDO...' : 'EXPORTAR PNG'}
            </button>
            <button
                onClick={generatePdf}
                disabled={isGenerating || !selectedProducts.length}
                style={{
                    flex: 1,
                    background: selectedProducts.length ? 'rgba(212,175,55,0.12)' : 'rgba(255,255,255,0.03)',
                    color: selectedProducts.length ? '#D4AF37' : '#444',
                    border: `1px solid ${selectedProducts.length ? 'rgba(212,175,55,0.3)' : 'rgba(255,255,255,0.06)'}`,
                    borderRadius: '12px', padding: '12px',
                    fontWeight: 900, fontSize: '0.72rem', cursor: selectedProducts.length ? 'pointer' : 'not-allowed',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px',
                    transition: 'all 0.2s',
                }}
            >
                <FileText size={14} />
                {isGenerating ? 'GERANDO...' : 'EXPORTAR PDF'}
            </button>
        </div>
    );

    /* ─── MOBILE LAYOUT ─────────────────────────────── */
    if (isMobile) return (
        <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 145px)', overflow: 'hidden', background: '#080808' }}>

            {/* Filter chips */}
            <div style={{ padding: '0 16px 12px', flexShrink: 0 }}>
                <div ref={chipsRef} className="catalog-chips"
                    onMouseDown={handleChipMouseDown} onMouseLeave={handleChipMouseLeave}
                    onMouseUp={handleChipMouseUp} onMouseMove={handleChipMouseMove}
                    style={{ display: 'flex', gap: '8px', overflowX: 'auto', WebkitOverflowScrolling: 'touch', paddingBottom: '4px', cursor: isDragging ? 'grabbing' : 'grab' }}
                >
                    <button onClick={() => setSelectedCategories([])} style={{ flexShrink: 0, padding: '7px 16px', borderRadius: '100px', border: `1px solid ${selectedCategories.length === 0 ? '#D4AF37' : 'rgba(255,255,255,0.1)'}`, background: selectedCategories.length === 0 ? 'rgba(212,175,55,0.15)' : 'rgba(255,255,255,0.04)', color: selectedCategories.length === 0 ? '#D4AF37' : '#666', fontWeight: 700, fontSize: '0.75rem', cursor: 'pointer', whiteSpace: 'nowrap' }}>Todos</button>
                    {availableCategories.map(cat => {
                        const active = selectedCategories.includes(cat.id);
                        return <button key={cat.id} onClick={() => toggleCategory(cat.id)} style={{ flexShrink: 0, padding: '7px 16px', borderRadius: '100px', border: `1px solid ${active ? '#D4AF37' : 'rgba(255,255,255,0.1)'}`, background: active ? 'rgba(212,175,55,0.15)' : 'rgba(255,255,255,0.04)', color: active ? '#D4AF37' : '#666', fontWeight: 700, fontSize: '0.75rem', cursor: 'pointer', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '6px' }}>{active && <Check size={11} />}{cat.label}</button>;
                    })}
                </div>
            </div>

            {/* Toolbar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 16px 12px', flexShrink: 0 }}>
                <span style={{ fontSize: '0.7rem', color: '#444', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>{filteredProducts.length} produtos</span>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={() => { setSelectedProducts([]); setSelectedCategories([]); }} style={{ padding: '6px 14px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.04)', color: '#666', fontSize: '0.7rem', fontWeight: 800, cursor: 'pointer' }}>Limpar</button>
                    <button onClick={() => setSelectedProducts([...filteredProducts])} style={{ padding: '6px 14px', borderRadius: '10px', border: '1px solid rgba(212,175,55,0.25)', background: 'rgba(212,175,55,0.08)', color: '#D4AF37', fontSize: '0.7rem', fontWeight: 800, cursor: 'pointer' }}>Todos</button>
                </div>
            </div>

            {/* Product grid */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '0 16px', paddingBottom: selectedProducts.length > 0 ? '110px' : '16px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                    {filteredProducts.map(p => {
                        const selected = selectedProducts.some(item => item.$id === p.$id || item.id === p.id);
                        return (
                            <motion.div key={p.$id || p.id} onClick={() => toggleProduct(p)} whileTap={{ scale: 0.96 }}
                                style={{ borderRadius: '16px', overflow: 'hidden', cursor: 'pointer', border: `1.5px solid ${selected ? '#D4AF37' : 'rgba(255,255,255,0.06)'}`, background: selected ? 'rgba(212,175,55,0.05)' : 'rgba(255,255,255,0.02)', transition: 'border-color 0.2s', position: 'relative' }}
                            >
                                <AnimatePresence>
                                    {selected && (
                                        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
                                            style={{ position: 'absolute', top: '8px', right: '8px', zIndex: 2, width: '22px', height: '22px', borderRadius: '50%', background: '#D4AF37', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                        ><Check size={12} color="#000" strokeWidth={3} /></motion.div>
                                    )}
                                </AnimatePresence>
                                <div style={{ height: '120px', background: '#111', position: 'relative', overflow: 'hidden' }}>
                                    {p.image ? <img src={getImageUrl(p.image)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: selected ? 1 : 0.65, transition: 'opacity 0.2s' }} /> : <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><ImageIcon size={28} color="#2a2a2a" /></div>}
                                </div>
                                <div style={{ padding: '10px 10px 12px' }}>
                                    <div style={{ fontWeight: 700, fontSize: '0.72rem', color: selected ? '#e5e5e5' : '#777', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: '5px' }}>{p.title}</div>
                                    <div style={{ color: '#D4AF37', fontWeight: 900, fontSize: '0.85rem' }}>R$ {parseFloat(p.price || 0).toFixed(2)}</div>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            </div>

            {/* Floating export bar */}
            <AnimatePresence>
                {selectedProducts.length > 0 && (
                    <motion.div initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 100, opacity: 0 }} transition={{ type: 'spring', damping: 22, stiffness: 260 }}
                        style={{ position: 'fixed', bottom: '84px', left: '12px', right: '12px', zIndex: 200, background: 'rgba(12,12,12,0.95)', backdropFilter: 'blur(20px)', border: '1px solid rgba(212,175,55,0.2)', borderRadius: '20px', padding: '14px 18px', boxShadow: '0 8px 40px rgba(0,0,0,0.6)' }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '12px' }}>
                            <div style={{ flex: 1 }}>
                                <div style={{ fontSize: '1.3rem', fontWeight: 900, color: '#D4AF37', lineHeight: 1 }}>{selectedProducts.length}</div>
                                <div style={{ fontSize: '0.6rem', color: '#555', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', marginTop: '2px' }}>selecionados</div>
                            </div>
                            <button onClick={() => setSelectedProducts([])} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: '#555', padding: '10px', borderRadius: '10px', cursor: 'pointer' }}>
                                <X size={15} />
                            </button>
                        </div>
                        <ExportActions floating />
                    </motion.div>
                )}
            </AnimatePresence>

            <style>{`.catalog-chips::-webkit-scrollbar{display:none}.catalog-chips{-ms-overflow-style:none;scrollbar-width:none}`}</style>

            {/* Hidden export canvas */}
            <div style={{ position: 'fixed', left: '-9999px', top: 0, zIndex: -1 }}>
                <CatalogTemplate ref={catalogPreviewRef} products={selectedProducts} storeSettings={storeSettings} catalogTitle={catalogTitle} sectionLabel={sectionLabel} />
            </div>
        </div>
    );

    /* ─── DESKTOP LAYOUT ──────────────────────────────── */
    return (
        <div style={{ padding: '0 20px 40px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 260px', gap: '32px', alignItems: 'start' }}>

                {/* Left: filters + products */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

                    {/* Category filter */}
                    <div className="glass-card" style={{ padding: '28px' }}>
                        <h3 style={{ margin: '0 0 18px', fontSize: '1rem', fontWeight: 800 }}>Filtrar por Categoria</h3>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                            {availableCategories.map(cat => {
                                const active = selectedCategories.includes(cat.id);
                                return (
                                    <button key={cat.id} onClick={() => toggleCategory(cat.id)} style={{ padding: '9px 16px', borderRadius: '10px', border: '1px solid', borderColor: active ? '#D4AF37' : 'rgba(255,255,255,0.1)', background: active ? 'rgba(212,175,55,0.1)' : 'transparent', color: active ? '#D4AF37' : '#888', cursor: 'pointer', fontWeight: 700, fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '7px' }}>
                                        <div style={{ width: '13px', height: '13px', border: '2px solid', borderColor: active ? '#D4AF37' : '#555', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: active ? '#D4AF37' : 'transparent' }}>
                                            {active && <Check size={9} color="#000" />}
                                        </div>
                                        {cat.label}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Product grid */}
                    <div className="glass-card" style={{ padding: '28px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>Produtos <span style={{ color: '#555', fontWeight: 600, fontSize: '0.8rem' }}>({filteredProducts.length})</span></h3>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <button onClick={() => setSelectedProducts([])} style={{ background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', padding: '8px 16px', borderRadius: '10px', fontSize: '0.75rem', fontWeight: 800, cursor: 'pointer' }}>Limpar</button>
                                <button onClick={() => setSelectedProducts([...filteredProducts])} style={{ background: 'rgba(212,175,55,0.1)', color: '#D4AF37', border: '1px solid rgba(212,175,55,0.3)', padding: '8px 16px', borderRadius: '10px', fontSize: '0.75rem', fontWeight: 800, cursor: 'pointer' }}>Todos</button>
                            </div>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap: '16px', maxHeight: '900px', overflowY: 'auto' }}>
                            {filteredProducts.map(p => {
                                const selected = selectedProducts.some(item => item.$id === p.$id || item.id === p.id);
                                return (
                                    <div key={p.$id || p.id} onClick={() => toggleProduct(p)} style={{ background: 'rgba(255,255,255,0.02)', borderRadius: '18px', border: '2px solid', borderColor: selected ? '#D4AF37' : 'transparent', overflow: 'hidden', cursor: 'pointer', transition: 'all 0.2s', position: 'relative' }}>
                                        {selected && (
                                            <div style={{ position: 'absolute', top: '8px', right: '8px', zIndex: 2, width: '22px', height: '22px', borderRadius: '50%', background: '#D4AF37', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                <Check size={12} color="#000" strokeWidth={3} />
                                            </div>
                                        )}
                                        <div style={{ height: '130px', background: '#000' }}>
                                            {p.image ? <img src={getImageUrl(p.image)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: selected ? 1 : 0.55 }} /> : <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><ImageIcon size={30} color="#333" /></div>}
                                        </div>
                                        <div style={{ padding: '12px' }}>
                                            <div style={{ fontWeight: 800, fontSize: '0.82rem', color: selected ? '#fff' : '#666', marginBottom: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.title}</div>
                                            <div style={{ color: '#D4AF37', fontWeight: 900, fontSize: '0.9rem' }}>R$ {parseFloat(p.price || 0).toFixed(2)}</div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Right: export panel */}
                <div className="glass-card premium-shadow" style={{ padding: '24px', position: 'sticky', top: '20px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
                    <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800 }}>Exportar Catálogo</h3>

                    {/* Counter */}
                    <div style={{ background: 'rgba(0,0,0,0.3)', padding: '16px', borderRadius: '14px', textAlign: 'center' }}>
                        <div style={{ fontSize: '2rem', fontWeight: 900, color: '#D4AF37', lineHeight: 1 }}>{selectedProducts.length}</div>
                        <div style={{ fontSize: '0.55rem', fontWeight: 800, color: '#555', textTransform: 'uppercase', letterSpacing: '1px', marginTop: '4px' }}>Produtos Selecionados</div>
                    </div>

                    {/* Catalog title */}
                    <div>
                        <label style={{ display: 'block', fontSize: '0.65rem', fontWeight: 800, color: '#555', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>Título do Catálogo</label>
                        <input
                            value={catalogTitle}
                            onChange={e => setCatalogTitle(e.target.value)}
                            placeholder="Ex: OFERTAS DA SEMANA"
                            style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '10px 12px', color: '#fff', fontSize: '0.82rem', outline: 'none', boxSizing: 'border-box' }}
                        />
                    </div>

                    {/* Section label */}
                    <div>
                        <label style={{ display: 'block', fontSize: '0.65rem', fontWeight: 800, color: '#555', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>Label da Seção de Promoções</label>
                        <input
                            value={sectionLabel}
                            onChange={e => setSectionLabel(e.target.value)}
                            placeholder="Ex: OFERTAS DA SEMANA 🔥"
                            style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '10px 12px', color: '#fff', fontSize: '0.82rem', outline: 'none', boxSizing: 'border-box' }}
                        />
                    </div>

                    {/* Export buttons */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <button
                            onClick={generatePng}
                            disabled={isGenerating || !selectedProducts.length}
                            style={{
                                width: '100%',
                                background: selectedProducts.length ? 'linear-gradient(135deg, #D4AF37, #b8952e)' : 'rgba(255,255,255,0.05)',
                                color: selectedProducts.length ? '#000' : '#444',
                                border: 'none', borderRadius: '12px', padding: '14px',
                                fontWeight: 900, cursor: selectedProducts.length ? 'pointer' : 'not-allowed', fontSize: '0.78rem',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                                boxShadow: selectedProducts.length ? '0 4px 16px rgba(212,175,55,0.25)' : 'none',
                                transition: 'all 0.2s',
                            }}
                        >
                            <FileImage size={15} />
                            {isGenerating ? 'PROCESSANDO...' : 'BAIXAR PNG'}
                        </button>

                        <button
                            onClick={generatePdf}
                            disabled={isGenerating || !selectedProducts.length}
                            style={{
                                width: '100%',
                                background: selectedProducts.length ? 'rgba(212,175,55,0.1)' : 'rgba(255,255,255,0.03)',
                                color: selectedProducts.length ? '#D4AF37' : '#444',
                                border: `1px solid ${selectedProducts.length ? 'rgba(212,175,55,0.35)' : 'rgba(255,255,255,0.06)'}`,
                                borderRadius: '12px', padding: '14px',
                                fontWeight: 900, cursor: selectedProducts.length ? 'pointer' : 'not-allowed', fontSize: '0.78rem',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                                transition: 'all 0.2s',
                            }}
                        >
                            <FileText size={15} />
                            {isGenerating ? 'PROCESSANDO...' : 'BAIXAR PDF'}
                        </button>
                    </div>

                    {selectedProducts.length === 0 && (
                        <p style={{ margin: 0, fontSize: '0.7rem', color: '#444', textAlign: 'center', lineHeight: 1.5 }}>
                            Selecione ao menos um produto para gerar o catálogo
                        </p>
                    )}
                </div>
            </div>

            {/* Hidden export canvas */}
            <div style={{ position: 'fixed', left: '-9999px', top: 0, zIndex: -1 }}>
                <CatalogTemplate ref={catalogPreviewRef} products={selectedProducts} storeSettings={storeSettings} catalogTitle={catalogTitle} sectionLabel={sectionLabel} />
            </div>
        </div>
    );
};

export default AdminCatalog;
