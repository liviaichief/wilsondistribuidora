import React, { useState, useEffect } from 'react';
import { databases, storage, DATABASE_ID, COLLECTIONS, BUCKET_ID } from '../lib/appwrite';
import { useAlert } from '../context/AlertContext';
import { Plus, Edit, Trash2, X, Image as ImageIcon, CheckCircle, XCircle, Clock, Upload, Loader2, Save, GripVertical, AlertCircle, ExternalLink, ImagePlus, Sparkles, Mic, MicOff, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ID, Query, Permission, Role } from 'appwrite';
import { getImageUrl } from '../lib/imageUtils';
import imageCompression from 'browser-image-compression';
import { generateBannerImage } from '../services/aiService';
import { getSettings, getCategories, getBrands, saveBrands, getBrandsList } from '../services/dataService';
import './Admin.css';

const AdminBanners = () => {
    const { showAlert, showConfirm } = useAlert();
    const [banners, setBanners] = useState([]);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [brands, setBrands] = useState([]);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 1024);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingBanner, setEditingBanner] = useState(null);
    const [formData, setFormData] = useState({
        title: '',
        image_url: '',
        product_id: '',
        active: true,
        display_order: 0,
        duration: 5,
        thumbnail_url: ''
    });
    const [imageFile, setImageFile] = useState(null);
    const [isSaving, setIsSaving] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [isGeneratingAI, setIsGeneratingAI] = useState(false);
    const [aiPrompt, setAiPrompt] = useState('');
    const [aiText, setAiText] = useState('');
    const [previewUrl, setPreviewUrl] = useState('');
    const [thumbPreviewUrl, setThumbPreviewUrl] = useState('');
    const [aiReferenceImage, setAiReferenceImage] = useState(null);
    const [aiReferencePreview, setAiReferencePreview] = useState('');
    const [isListening, setIsListening] = useState(false);
    const [aiBannerEnabled, setAiBannerEnabled] = useState(true);

    const [categories, setCategories] = useState([]);
    const [linkTab, setLinkTab] = useState('product'); // 'product' ou 'category'
    const [searchTerm, setSearchTerm] = useState('');
    const [showLinkPanel, setShowLinkPanel] = useState(false);

    const [brandOptions, setBrandOptions] = useState([]);

    useEffect(() => {
        loadData();
        loadBrands();
        loadBrandOptions();
    }, []);

    const loadBrandOptions = async () => {
        try {
            const data = await getBrandsList();
            setBrandOptions(data || []);
        } catch (e) {
            console.error("Erro ao carregar lista de marcas:", e);
        }
    };

    const loadBrands = async () => {
        try {
            const data = await getBrands();
            setBrands(data || []);
        } catch (e) {
            console.error("Erro ao carregar marcas:", e);
        }
    };

    const loadData = async () => {
        setLoading(true);
        try {
            const [bannersResponse, productsResponse, categoriesData, settingsData] = await Promise.all([
                databases.listDocuments(DATABASE_ID, COLLECTIONS.BANNERS, [Query.orderAsc('display_order')]),
                databases.listDocuments(DATABASE_ID, COLLECTIONS.PRODUCTS, [Query.orderAsc('title'), Query.limit(500)]),
                getCategories(),
                getSettings()
            ]);

            setBanners(bannersResponse.documents.map(doc => ({
                ...doc,
                id: doc.$id,
                product_id: doc.product ? (typeof doc.product === 'object' ? doc.product.$id : doc.product) : null,
                category_id: doc.category ? (typeof doc.category === 'object' ? doc.category.$id : doc.category) : null
            })));
            setProducts(productsResponse.documents.map(doc => ({ id: doc.$id, title: doc.title })));
            setCategories(categoriesData.map(c => ({ id: c.id, name: c.name })));
            setAiBannerEnabled(settingsData.ai_banner_enabled !== false);
        } catch (error) {
            showAlert('Erro ao carregar dados: ' + error.message, 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (banner = null) => {
        setImageFile(null);
        setPreviewUrl('');
        setThumbPreviewUrl('');
        if (banner) {
            setEditingBanner(banner);
            setFormData({
                title: banner.title || '',
                image_url: banner.image_url || '',
                product_id: banner.product_id || '',
                category_id: banner.category_id || '',
                active: banner.active ?? true,
                display_order: banner.display_order || 0,
                duration: banner.duration || 5,
                thumbnail_url: banner.thumbnail_url || ''
            });
            setPreviewUrl(getImageUrl(banner.image_url));
            if (banner.thumbnail_url) setThumbPreviewUrl(getImageUrl(banner.thumbnail_url));
        } else {
            setEditingBanner(null);
            setFormData({ title: '', image_url: '', product_id: '', category_id: '', active: true, display_order: banners.length + 1, duration: 5, thumbnail_url: '' });
        }
        setAiPrompt('');
        setAiText('');
        setAiReferenceImage(null);
        setAiReferencePreview('');
        setShowLinkPanel(false);
        setIsModalOpen(true);
    };

    const getSelectedDestinationName = () => {
        if (formData.product_id) {
            const p = products.find(p => p.id === formData.product_id);
            return p ? `PRODUTO: ${p.title}` : 'Produto não encontrado';
        }
        if (formData.category_id) {
            const c = categories.find(c => c.id === formData.category_id);
            return c ? `CATEGORIA: ${c.name}` : 'Categoria não encontrada';
        }
        return '';
    };

    const uploadFileToAppwrite = async (file, isVideo = false) => {
        let fileToUpload = file;
        if (!isVideo && file.type.startsWith('image/')) {
            const options = { maxSizeMB: 1.0, maxWidthOrHeight: 3840, useWebWorker: true, initialQuality: 0.95 };
            const compressedBlob = await imageCompression(file, options);
            fileToUpload = new File([compressedBlob], file.name, { type: file.type });
        }
        const result = await storage.createFile(BUCKET_ID, isVideo ? `v_${ID.unique()}` : ID.unique(), fileToUpload, [Permission.read(Role.any()), Permission.write(Role.users())]);
        return result.$id;
    };

    const handleReferenceImageChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setAiReferenceImage(file);
            setAiReferencePreview(URL.createObjectURL(file));
        }
    };

    const handleVoiceInput = () => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            showAlert('Seu navegador não suporta reconhecimento de voz.', 'error');
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.lang = 'pt-BR';
        recognition.interimResults = false;

        recognition.onstart = () => setIsListening(true);
        recognition.onend = () => setIsListening(false);
        recognition.onerror = (event) => {
            console.error('Erro no reconhecimento de voz:', event.error);
            setIsListening(false);
        };

        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            setAiPrompt(prev => prev ? `${prev} ${transcript}` : transcript);
        };

        recognition.start();
    };

    const handleGenerateAI = async () => {
        console.log('Iniciando geração de imagem IA...', { aiPrompt, aiText, hasReference: !!aiReferenceImage });
        
        if (!aiPrompt) {
            showAlert('Por favor, descreva o que deseja na imagem.', 'warning');
            return;
        }

        setIsGeneratingAI(true);
        try {
            const imageUrl = await generateBannerImage(`${aiPrompt}${aiText ? `. Adicione este texto ou inspiração: ${aiText}` : ''}`, aiReferenceImage);
            console.log('Imagem gerada pela OpenAI:', imageUrl);
            
            const proxyUrl = `/api/proxy-image?url=${encodeURIComponent(imageUrl)}`;
            const response = await fetch(proxyUrl);
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || 'Falha ao baixar imagem via proxy');
            }
            
            const blob = await response.blob();
            const file = new File([blob], `ai_banner_${Date.now()}.png`, { type: 'image/png' });
            
            setPreviewUrl(imageUrl);
            setIsUploading(true);
            
            const fileId = await uploadFileToAppwrite(file, false);
            setFormData(prev => ({ ...prev, image_url: fileId }));
            showAlert('Imagem gerada e aplicada!', 'success');
        } catch (error) {
            console.error('Erro detalhado na IA:', error);
            showAlert('Erro na IA: ' + (error.message || 'Erro desconhecido'), 'error');
        } finally {
            setIsGeneratingAI(false);
            setIsUploading(false);
        }
    };

    const handleImageChange = async (e) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setImageFile(file);
            setPreviewUrl(URL.createObjectURL(file));
            setIsUploading(true);
            try {
                const fileId = await uploadFileToAppwrite(file, file.type.startsWith('video/'));
                setFormData(prev => ({ ...prev, image_url: fileId }));
            } catch (err) { showAlert("Erro ao subir arquivo: " + err.message, "error"); } finally { setIsUploading(false); }
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (isUploading) return;
        setIsSaving(true);
        try {
            const payload = {
                title: formData.title,
                image_url: formData.image_url,
                thumbnail_url: formData.thumbnail_url,
                product: formData.product_id || null,
                active: formData.active,
                display_order: parseInt(formData.display_order),
                duration: parseInt(formData.duration)
            };
            if (editingBanner) {
                await databases.updateDocument(DATABASE_ID, COLLECTIONS.BANNERS, editingBanner.id, payload);
                showAlert('Banner atualizado!', 'success', null, 3000);
            } else {
                await databases.createDocument(DATABASE_ID, COLLECTIONS.BANNERS, ID.unique(), payload);
                showAlert('Banner criado!', 'success', null, 3000);
            }
            setIsModalOpen(false);
            loadData();
        } catch (error) { showAlert('Erro: ' + error.message, 'error'); } finally { setIsSaving(false); }
    };

    const isDirty = () => {
        if (!editingBanner) return true; // Novo banner sempre pode salvar
        if (formData.title !== (editingBanner.title || '')) return true;
        if (formData.image_url !== (editingBanner.image_url || '')) return true;
        if (formData.product_id !== (editingBanner.product_id || '')) return true;
        if (formData.active !== (editingBanner.active ?? true)) return true;
        if (parseInt(formData.display_order) !== parseInt(editingBanner.display_order || 0)) return true;
        if (parseInt(formData.duration) !== parseInt(editingBanner.duration || 5)) return true;
        if (formData.thumbnail_url !== (editingBanner.thumbnail_url || '')) return true;
        return false;
    };

    const handleDelete = (banner) => {
        showConfirm('Excluir este banner?', async () => {
            try {
                await databases.deleteDocument(DATABASE_ID, COLLECTIONS.BANNERS, banner.id);
                showAlert('Excluído!', 'success', null, 3000);
                loadData();
            } catch (error) { showAlert('Erro: ' + error.message, 'error'); }
        });
    };

    const toggleActive = async (banner) => {
        try {
            await databases.updateDocument(DATABASE_ID, COLLECTIONS.BANNERS, banner.id, { active: !banner.active });
            loadData();
        } catch (e) { showAlert('Erro: ' + e.message, 'error'); }
    };

    // --- BRANDS HANDLERS ---
    const [isBrandModalOpen, setIsBrandModalOpen] = useState(false);
    const [editingBrand, setEditingBrand] = useState(null);
    const [brandFormData, setBrandFormData] = useState({ image_url: '', display_order: 0, active: true, duration: 5, linked_brand: '' });
    const [brandPreview, setBrandPreview] = useState('');
    const [isUploadingBrand, setIsUploadingBrand] = useState(false);
    const [isSavingBrand, setIsSavingBrand] = useState(false);

    const handleOpenBrandModal = (brand = null) => {
        if (brand) {
            setEditingBrand(brand);
            setBrandFormData({ 
                image_url: brand.image_url, 
                display_order: brand.display_order, 
                active: brand.active,
                duration: brand.duration || 5,
                linked_brand: brand.linked_brand || ''
            });
            setBrandPreview(getImageUrl(brand.image_url));
        } else {
            setEditingBrand(null);
            setBrandFormData({ image_url: '', display_order: brands.length + 1, active: true, duration: 5, linked_brand: '' });
            setBrandPreview('');
        }
        setIsBrandModalOpen(true);
    };

    const handleBrandImageChange = async (e) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setBrandPreview(URL.createObjectURL(file));
            setIsUploadingBrand(true);
            try {
                const fileId = await uploadFileToAppwrite(file, false);
                setBrandFormData(prev => ({ ...prev, image_url: fileId }));
            } catch (err) { showAlert("Erro: " + err.message, "error"); } finally { setIsUploadingBrand(false); }
        }
    };

    const handleSaveBrand = async () => {
        setIsSavingBrand(true);
        try {
            let newBrands = [...brands];
            if (editingBrand) {
                newBrands = newBrands.map(b => b.id === editingBrand.id ? { ...b, ...brandFormData } : b);
            } else {
                newBrands.push({ ...brandFormData, id: ID.unique() });
            }
            await saveBrands(newBrands);
            setBrands(newBrands);
            setIsBrandModalOpen(false);
            showAlert('Marca salva!', 'success');
        } catch (e) { showAlert('Erro ao salvar marcas: ' + e.message, 'error'); } finally { setIsSavingBrand(false); }
    };

    const handleDeleteBrand = (brand) => {
        showConfirm('Excluir esta marca?', async () => {
            try {
                const newBrands = brands.filter(b => b.id !== brand.id);
                await saveBrands(newBrands);
                setBrands(newBrands);
                showAlert('Marca excluída!', 'success');
            } catch (e) { showAlert('Erro ao excluir: ' + e.message, 'error'); }
        });
    };

    return (
        <div style={{ padding: '0 20px 40px' }}>
            <div style={{ display: 'flex', justifyContent: isMobile ? 'center' : 'flex-end', marginBottom: isMobile ? '20px' : '30px', marginTop: isMobile ? '10px' : '20px', padding: isMobile ? '0 10px' : '0' }}>
                <button 
                    onClick={() => handleOpenModal()} 
                    style={{ 
                        background: '#D4AF37', 
                        color: '#000', 
                        border: 'none', 
                        borderRadius: isMobile ? '14px' : '16px', 
                        padding: isMobile ? '12px 24px' : '16px 28px', 
                        fontWeight: 900, 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '10px', 
                        cursor: 'pointer', 
                        boxShadow: '0 10px 20px rgba(212, 175, 55, 0.2)', 
                        transition: 'all 0.3s',
                        width: isMobile ? '100%' : 'auto',
                        justifyContent: 'center',
                        fontSize: isMobile ? '0.8rem' : '1rem'
                    }}
                >
                    <Plus size={isMobile ? 18 : 20} strokeWidth={3} /> NOVO BANNER
                </button>
            </div>

            {loading ? (
                <div style={{ padding: '100px', textAlign: 'center' }}>
                    <Loader2 className="animate-spin" size={48} color="#D4AF37" style={{ opacity: 0.2 }} />
                </div>
            ) : banners.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '100px', background: 'rgba(255,255,255,0.02)', borderRadius: '30px', border: '2px dashed rgba(255,255,255,0.05)' }}>
                    <ImageIcon size={64} style={{ opacity: 0.1, marginBottom: '20px' }} />
                    <h3 style={{ color: '#555' }}>Nenhum banner ativo.</h3>
                </div>
            ) : (
                <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(400px, 1fr))', 
                    gap: isMobile ? '20px' : '30px',
                    padding: isMobile ? '0 5px' : '0'
                }}>
                    <AnimatePresence>
                        {banners.map((banner, index) => (
                            <motion.div 
                                key={banner.id}
                                layout
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                                onDoubleClick={() => handleOpenModal(banner)}
                                style={{ 
                                    background: 'rgba(255,255,255,0.02)', 
                                    borderRadius: isMobile ? '24px' : '28px', 
                                    border: '1px solid rgba(255,255,255,0.05)', 
                                    overflow: 'hidden', 
                                    cursor: 'pointer', 
                                    position: 'relative',
                                    backdropFilter: 'blur(10px)'
                                }}
                                className="banner-card-hover"
                            >
                                <div style={{ aspectRatio: isMobile ? '16/10' : '16/9', background: '#000', position: 'relative' }}>
                                    {(() => {
                                        const mediaUrl = getImageUrl(banner.image_url, { t: new Date().getTime() });
                                        const isVideo = banner.image_url?.startsWith('v_');
                                        if (isVideo) return <video src={mediaUrl} style={{ width: '100%', height: '100%', objectFit: 'cover', background: '#000' }} muted loop onMouseOver={e => e.target.play()} onMouseOut={e => e.target.pause()} />;
                                        return <img src={mediaUrl} alt={banner.title} style={{ width: '100%', height: '100%', objectFit: 'cover', background: '#000' }} onError={(e) => {
                                            e.target.onerror = null;
                                            e.target.src = 'https://placehold.co/600x400/1e1e1e/D4AF37?text=Erro+no+Carregamento';
                                        }} />;
                                    })()}
                                    <div style={{ position: 'absolute', top: isMobile ? 15 : 20, left: isMobile ? 15 : 20, background: banner.active ? 'rgba(34, 197, 94, 0.9)' : 'rgba(255, 255, 255, 0.1)', backdropFilter: 'blur(5px)', color: '#fff', padding: '6px 14px', borderRadius: '10px', fontSize: '0.65rem', fontWeight: 900 }}>{banner.active ? 'ATIVO' : 'PAUSADO'}</div>
                                    <div style={{ position: 'absolute', bottom: isMobile ? 15 : 20, right: isMobile ? 15 : 20, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(10px)', color: '#fff', padding: '6px 12px', borderRadius: '10px', fontSize: '0.7rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <Clock size={12} /> {banner.duration}s
                                    </div>
                                </div>
                                <div style={{ padding: isMobile ? '18px' : '25px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: isMobile ? '15px' : '20px' }}>
                                        <div style={{ flex: 1, paddingRight: '10px' }}>
                                            <h3 style={{ margin: 0, fontSize: isMobile ? '1rem' : '1.2rem', fontWeight: 800, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{banner.title || `Banner #${banner.id.substring(0, 6)}`}</h3>
                                            <div style={{ color: '#555', fontSize: isMobile ? '0.75rem' : '0.85rem', marginTop: '4px', fontWeight: 700 }}>{products.find(p => p.id === banner.product_id)?.title || 'Sem link externo'}</div>
                                        </div>
                                        <div style={{ background: 'rgba(212, 175, 55, 0.1)', color: '#D4AF37', width: '28px', height: '28px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '0.8rem' }}>{banner.display_order}</div>
                                    </div>
                                    <div style={{ display: 'flex', gap: '8px', paddingTop: isMobile ? '15px' : '20px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                                        <button onClick={() => toggleActive(banner)} style={{ 
                                            flex: 2, 
                                            padding: isMobile ? '10px' : '12px', 
                                            borderRadius: '12px', 
                                            border: 'none', 
                                            background: banner.active ? 'rgba(239, 68, 68, 0.1)' : 'rgba(34, 197, 94, 0.1)', 
                                            color: banner.active ? '#ef4444' : '#22c55e', 
                                            cursor: 'pointer', 
                                            fontWeight: 800,
                                            fontSize: isMobile ? '0.75rem' : '0.85rem'
                                        }}>{banner.active ? 'Pausar' : 'Ativar'}</button>
                                        <button onClick={() => handleOpenModal(banner)} style={{ padding: isMobile ? '10px' : '12px', borderRadius: '12px', border: 'none', background: 'rgba(255,255,255,0.05)', color: '#fff', cursor: 'pointer' }}><Edit size={isMobile ? 18 : 20} /></button>
                                        <button onClick={() => handleDelete(banner)} style={{ padding: isMobile ? '10px' : '12px', borderRadius: '12px', border: 'none', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', cursor: 'pointer' }}><Trash2 size={isMobile ? 18 : 20} /></button>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            )}

            <AnimatePresence>
                {isModalOpen && (
                    <div style={{ position: 'fixed', inset: 0, zIndex: 3000, display: 'flex', alignItems: isMobile ? 'flex-end' : 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(20px)', padding: isMobile ? '0' : '20px' }}>
                        <motion.div initial={{ y: isMobile ? 100 : 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: isMobile ? 100 : 20, opacity: 0 }} style={{ backgroundColor: '#0d0d0d', border: '1px solid rgba(255,255,255,0.08)', borderRadius: isMobile ? '30px 30px 0 0' : '35px', padding: isMobile ? '25px 20px 40px' : '40px', maxWidth: '600px', width: '100%', maxHeight: isMobile ? '92vh' : '90vh', overflowY: 'auto', boxShadow: '0 -10px 40px rgba(0,0,0,0.5)', position: 'relative' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: isMobile ? '20px' : '30px' }}>
                                <h2 style={{ margin: 0, fontSize: isMobile ? '1.4rem' : '1.8rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.5px' }}>{editingBanner ? 'Configurar Banner' : 'Novo Banner'}</h2>
                                <button onClick={() => setIsModalOpen(false)} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: '#666', cursor: 'pointer', padding: isMobile ? '8px' : '10px', borderRadius: '12px' }}><X size={isMobile ? 20 : 24} /></button>
                            </div>

                            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    <label style={{ fontSize: '0.75rem', fontWeight: 900, color: '#888', textTransform: 'uppercase' }}>Título Interno (Opcional)</label>
                                    <input value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '14px', padding: '14px 18px', color: '#fff' }} placeholder="Ex: Promoção de Picanha" />
                                </div>

                                {/* Gerador de Banner com IA — só aparece se habilitado nas configs */}
                                {aiBannerEnabled && (
                                <div style={{ padding: isMobile ? '18px' : '25px', background: 'rgba(212, 175, 55, 0.02)', borderRadius: '24px', border: '1px solid rgba(212, 175, 55, 0.08)', display: 'flex', flexDirection: 'column', gap: isMobile ? '15px' : '20px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#D4AF37' }}>
                                            <Sparkles size={16} />
                                            <span style={{ fontWeight: 900, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Gerador de Banner com IA</span>
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                        <div style={{ display: 'flex', gap: '12px', flexDirection: isMobile ? 'column' : 'row' }}>
                                            {/* Imagem de Referência */}
                                            <div style={{ width: isMobile ? '100%' : '80px', height: isMobile ? '120px' : '80px', background: 'rgba(0,0,0,0.4)', borderRadius: '12px', border: '1px dashed rgba(212, 175, 55, 0.3)', position: 'relative', overflow: 'hidden', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                                                {aiReferencePreview ? (
                                                    <img src={aiReferencePreview} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Ref" />
                                                ) : (
                                                    <div style={{ textAlign: 'center', color: '#D4AF37', fontSize: '0.6rem' }}>
                                                        <ImagePlus size={isMobile ? 24 : 20} style={{ marginBottom: '4px' }} />
                                                        <div style={{ fontWeight: 800 }}>MODELO</div>
                                                    </div>
                                                )}
                                                <input type="file" accept="image/*" onChange={handleReferenceImageChange} style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }} />
                                                {aiReferencePreview && <button onClick={(e) => { e.stopPropagation(); setAiReferenceImage(null); setAiReferencePreview(''); }} style={{ position: 'absolute', top: 5, right: 5, background: 'rgba(0,0,0,0.7)', border: 'none', color: '#fff', borderRadius: '50%', width: '20px', height: '20px', fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>x</button>}
                                            </div>

                                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px', position: 'relative' }}>
                                                <textarea 
                                                    value={aiPrompt} 
                                                    onChange={e => setAiPrompt(e.target.value)}
                                                    placeholder="O que deve aparecer na imagem? (ex: Churrasco suculento na brasa)"
                                                    style={{ width: '100%', background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', padding: '12px', paddingRight: '45px', color: '#fff', fontSize: '0.8rem', resize: 'none', height: isMobile ? '80px' : '80px' }}
                                                />
                                                <button 
                                                    type="button"
                                                    onClick={handleVoiceInput}
                                                    style={{ position: 'absolute', top: '10px', right: '10px', background: isListening ? '#ef4444' : 'rgba(255,255,255,0.03)', border: 'none', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.3s', color: isListening ? '#fff' : '#666' }}
                                                    title="Gravar por voz"
                                                >
                                                    {isListening ? <Mic size={16} className="animate-pulse" /> : <Mic size={16} />}
                                                </button>
                                            </div>
                                        </div>

                                        <div style={{ display: 'flex', gap: '10px', flexDirection: isMobile ? 'column' : 'row' }}>
                                            <input 
                                                value={aiText} 
                                                onChange={e => setAiText(e.target.value)}
                                                placeholder="Texto opcional para o banner"
                                                style={{ flex: 1, background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', padding: '12px 14px', color: '#fff', fontSize: '0.85rem' }}
                                            />
                                            <button 
                                                type="button"
                                                onClick={handleGenerateAI}
                                                disabled={isGeneratingAI || isUploading}
                                                style={{ 
                                                    background: '#D4AF37', 
                                                    color: '#000', 
                                                    border: 'none', 
                                                    borderRadius: '12px', 
                                                    padding: isMobile ? '12px' : '0 25px', 
                                                    fontWeight: 900, 
                                                    cursor: 'pointer', 
                                                    display: 'flex', 
                                                    alignItems: 'center', 
                                                    gap: '10px', 
                                                    boxShadow: '0 5px 15px rgba(212, 175, 55, 0.2)',
                                                    justifyContent: 'center',
                                                    fontSize: isMobile ? '0.75rem' : '0.85rem'
                                                }}
                                            >
                                                {isGeneratingAI ? <Loader2 className="animate-spin" size={18} /> : <Sparkles size={18} />}
                                                {isGeneratingAI ? 'CRIANDO...' : 'GERAR IMAGEM'}
                                            </button>
                                        </div>
                                    </div>
                                    <p style={{ margin: 0, fontSize: '0.65rem', color: '#444', fontWeight: 600 }}>Dica: Se anexar um **modelo**, a IA tentará seguir o estilo visual dele.</p>
                                </div>
                                )}

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    <label style={{ fontSize: '0.75rem', fontWeight: 900, color: '#888', textTransform: 'uppercase' }}>Conteúdo Visual (16:9)</label>
                                    <div style={{ height: '200px', background: 'rgba(0,0,0,0.3)', border: '2px dashed rgba(255,255,255,0.1)', borderRadius: '20px', position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        {previewUrl ? (
                                            formData.image_url?.startsWith('v_') || (imageFile && imageFile.type.startsWith('video/')) ? (
                                                <video src={previewUrl} style={{ width: '100%', height: '100%', objectFit: 'contain' }} controls muted />
                                            ) : (
                                                <img 
                                                    src={previewUrl} 
                                                    style={{ width: '100%', height: '100%', objectFit: 'contain' }} 
                                                    alt="Preview" 
                                                    onError={(e) => {
                                                        e.target.onerror = null;
                                                        e.target.src = 'https://placehold.co/600x400/1e1e1e/D4AF37?text=Erro+no+Preview';
                                                    }}
                                                />
                                            )
                                        ) : (
                                            <div style={{ textAlign: 'center', color: '#444' }}><ImagePlus size={48} style={{ marginBottom: '10px' }} /><p style={{ fontSize: '0.8rem', fontWeight: 700 }}>Clique para selecionar arquivo</p></div>
                                        )}
                                        <input type="file" accept="image/*,video/*" onChange={handleImageChange} style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }} />
                                        {isUploading && <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Loader2 className="animate-spin" color="#D4AF37" /></div>}
                                    </div>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    <div 
                                        onClick={() => setShowLinkPanel(!showLinkPanel)}
                                        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', background: 'rgba(255,255,255,0.03)', padding: '12px 18px', borderRadius: '15px', border: '1px solid', borderColor: showLinkPanel ? '#D4AF37' : 'rgba(255,255,255,0.05)', transition: '0.3s' }}
                                    >
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                            <label style={{ fontSize: '0.65rem', fontWeight: 900, color: '#D4AF37', textTransform: 'uppercase', letterSpacing: '1px', cursor: 'pointer' }}>Vincular Destino</label>
                                            <div style={{ fontSize: '0.85rem', color: getSelectedDestinationName() ? '#fff' : '#444', fontWeight: 800 }}>
                                                {getSelectedDestinationName() || 'NENHUM DESTINO SELECIONADO'}
                                            </div>
                                        </div>
                                        <div style={{ transform: showLinkPanel ? 'rotate(180deg)' : 'rotate(0deg)', transition: '0.3s' }}>
                                            <Edit size={16} color={showLinkPanel ? '#D4AF37' : '#444'} />
                                        </div>
                                    </div>
                                    
                                    <AnimatePresence>
                                        {showLinkPanel && (
                                            <motion.div 
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: 'auto', opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                style={{ overflow: 'hidden' }}
                                            >
                                                <div style={{ background: 'rgba(255,255,255,0.02)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)', padding: '5px', display: 'flex', gap: '5px', marginBottom: '10px' }}>
                                                    <button type="button" onClick={() => setLinkTab('product')} style={{ flex: 1, padding: '10px', borderRadius: '12px', border: 'none', background: linkTab === 'product' ? 'rgba(255,255,255,0.05)' : 'transparent', color: linkTab === 'product' ? '#fff' : '#444', fontWeight: 900, cursor: 'pointer', fontSize: '0.7rem' }}>PRODUTOS</button>
                                                    <button type="button" onClick={() => setLinkTab('category')} style={{ flex: 1, padding: '10px', borderRadius: '12px', border: 'none', background: linkTab === 'category' ? 'rgba(255,255,255,0.05)' : 'transparent', color: linkTab === 'category' ? '#fff' : '#444', fontWeight: 900, cursor: 'pointer', fontSize: '0.7rem' }}>CATEGORIAS</button>
                                                </div>

                                                <div style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '20px', padding: '15px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                                    {linkTab === 'product' ? (
                                                        <>
                                                            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', padding: '0 15px' }}>
                                                                <Search size={16} color="#444" />
                                                                <input 
                                                                    placeholder="Buscar produto..." 
                                                                    value={searchTerm} 
                                                                    onChange={e => setSearchTerm(e.target.value)}
                                                                    style={{ background: 'none', border: 'none', color: '#fff', padding: '12px', width: '100%', outline: 'none', fontSize: '0.85rem' }} 
                                                                />
                                                            </div>
                                                            <div style={{ maxHeight: '180px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '5px' }} className="custom-scroll">
                                                                <div 
                                                                    onClick={() => { setFormData({ ...formData, product_id: '', category_id: '' }); setSearchTerm(''); setShowLinkPanel(false); }}
                                                                    style={{ padding: '10px 15px', borderRadius: '10px', cursor: 'pointer', background: !formData.product_id && !formData.category_id ? 'rgba(212, 175, 55, 0.1)' : 'transparent', color: !formData.product_id && !formData.category_id ? '#D4AF37' : '#555', fontSize: '0.8rem', fontWeight: 800 }}
                                                                >
                                                                    REMOVER VÍNCULO
                                                                </div>
                                                                {products.filter(p => p.title.toLowerCase().includes(searchTerm.toLowerCase())).map(p => (
                                                                    <div 
                                                                        key={p.id} 
                                                                        onClick={() => { setFormData({ ...formData, product_id: p.id, category_id: '' }); setSearchTerm(''); setShowLinkPanel(false); }}
                                                                        style={{ padding: '10px 15px', borderRadius: '10px', cursor: 'pointer', background: formData.product_id === p.id ? 'rgba(212, 175, 55, 0.1)' : 'transparent', color: formData.product_id === p.id ? '#D4AF37' : '#888', fontSize: '0.8rem', fontWeight: 800, transition: '0.2s' }}
                                                                        className="hover-link"
                                                                    >
                                                                        {p.title}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </>
                                                    ) : (
                                                        <div style={{ maxHeight: '180px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '5px' }} className="custom-scroll">
                                                            {categories.map(c => (
                                                                <div 
                                                                    key={c.id} 
                                                                    onClick={() => { setFormData({ ...formData, category_id: c.id, product_id: '' }); setShowLinkPanel(false); }}
                                                                    style={{ padding: '10px 15px', borderRadius: '10px', cursor: 'pointer', background: formData.category_id === c.id ? 'rgba(212, 175, 55, 0.1)' : 'transparent', color: formData.category_id === c.id ? '#D4AF37' : '#888', fontSize: '0.8rem', fontWeight: 800, transition: '0.2s' }}
                                                                    className="hover-link"
                                                                >
                                                                    {c.name}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>

                                <div style={{ display: 'flex', gap: isMobile ? '10px' : '20px' }}>
                                    <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        <label style={{ fontSize: '0.75rem', fontWeight: 900, color: '#888', textTransform: 'uppercase', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Ordem</label>
                                        <input type="number" value={formData.display_order} onChange={e => setFormData({ ...formData, display_order: e.target.value })} style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '14px', padding: isMobile ? '14px 10px' : '14px 18px', color: '#fff', fontWeight: 900, width: '100%', outline: 'none' }} />
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        <label style={{ fontSize: '0.75rem', fontWeight: 900, color: '#888', textTransform: 'uppercase', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Duração (s)</label>
                                        <input type="number" value={formData.duration} onChange={e => setFormData({ ...formData, duration: e.target.value })} style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '14px', padding: isMobile ? '14px 10px' : '14px 18px', color: '#fff', fontWeight: 900, width: '100%', outline: 'none' }} />
                                    </div>
                                </div>

                                <div style={{ padding: '20px', background: 'rgba(255,255,255,0.02)', borderRadius: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ fontWeight: 800, fontSize: '0.9rem' }}>Ativar Banner</span>
                                    <label className="switch">
                                        <input type="checkbox" checked={formData.active} onChange={e => setFormData({ ...formData, active: e.target.checked })} />
                                        <span className="slider round"></span>
                                    </label>
                                </div>

                                <button 
                                    type="submit" 
                                    disabled={isSaving || isUploading || !isDirty()} 
                                    style={{ 
                                        background: isDirty() ? '#fff' : 'rgba(255,255,255,0.05)', 
                                        color: isDirty() ? '#000' : '#444', 
                                        border: 'none', 
                                        borderRadius: '18px', 
                                        padding: isMobile ? '16px' : '20px', 
                                        fontWeight: 900, 
                                        fontSize: isMobile ? '0.95rem' : '1.1rem', 
                                        cursor: isDirty() ? 'pointer' : 'not-allowed', 
                                        marginTop: '10px',
                                        transition: 'all 0.3s'
                                    }}
                                >
                                    {isSaving ? 'SALVANDO...' : 'SALVAR BANNER'}
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* ─── SEÇÃO DE MARCAS (Logos do Header) ─── */}
            <div style={{ marginTop: '60px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '40px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
                    <div>
                        <h2 style={{ margin: 0, fontSize: isMobile ? '1.2rem' : '1.5rem', fontWeight: 900, color: '#fff' }}>Logos de Marcas (Header)</h2>
                        <p style={{ margin: '5px 0 0', fontSize: '0.8rem', color: '#555', fontWeight: 600 }}>Imagens que aparecem em carrossel no topo do site.</p>
                    </div>
                    <button 
                        onClick={() => handleOpenBrandModal()}
                        style={{ background: 'rgba(212, 175, 55, 0.1)', color: '#D4AF37', border: '1px solid rgba(212, 175, 55, 0.2)', borderRadius: '12px', padding: '10px 20px', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem' }}
                    >
                        <Plus size={16} /> ADICIONAR MARCA
                    </button>
                </div>

                {brands.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px', background: 'rgba(255,255,255,0.01)', borderRadius: '20px', border: '1px dashed rgba(255,255,255,0.05)' }}>
                        <span style={{ color: '#444', fontSize: '0.85rem' }}>Nenhuma marca cadastrada para o header.</span>
                    </div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(auto-fill, minmax(180px, 1fr))', gap: '15px' }}>
                        {brands.sort((a,b) => (a.display_order || 0) - (b.display_order || 0)).map((brand, idx) => (
                            <div key={brand.id || idx} style={{ background: 'rgba(255,255,255,0.02)', borderRadius: '18px', border: '1px solid rgba(255,255,255,0.05)', padding: '15px', position: 'relative', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                <div style={{ aspectRatio: '3/2', background: '#000', borderRadius: '10px', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '10px' }}>
                                    <img src={getImageUrl(brand.image_url)} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} alt="Brand" />
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ fontSize: '0.7rem', fontWeight: 900, color: '#333' }}>ORDEM: {brand.display_order}</span>
                                    <div style={{ display: 'flex', gap: '5px' }}>
                                        <button onClick={() => handleOpenBrandModal(brand)} style={{ background: 'none', border: 'none', color: '#555', cursor: 'pointer', padding: '5px' }}><Edit size={14} /></button>
                                        <button onClick={() => handleDeleteBrand(brand)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '5px' }}><Trash2 size={14} /></button>
                                    </div>
                                </div>
                                {!brand.active && <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)', borderRadius: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}><span style={{ background: '#000', color: '#fff', fontSize: '0.6rem', fontWeight: 900, padding: '4px 8px', borderRadius: '5px' }}>INATIVO</span></div>}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* ─── MODAL DE MARCAS ─── */}
            <AnimatePresence>
                {isBrandModalOpen && (
                    <div style={{ position: 'fixed', inset: 0, zIndex: 4000, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(10px)', padding: '20px' }}>
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} style={{ background: '#0d0d0d', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '25px', padding: '30px', maxWidth: '450px', width: '100%' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
                                <h3 style={{ margin: 0, color: '#fff', fontWeight: 900 }}>{editingBrand ? 'Editar Marca' : 'Nova Marca'}</h3>
                                <button onClick={() => setIsBrandModalOpen(false)} style={{ background: 'none', border: 'none', color: '#555', cursor: 'pointer' }}><X size={20} /></button>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    <label style={{ fontSize: '0.7rem', fontWeight: 900, color: '#444', textTransform: 'uppercase' }}>Logo da Marca (PNG Transparente)</label>
                                    <div style={{ height: '120px', background: 'rgba(0,0,0,0.3)', border: '2px dashed rgba(255,255,255,0.05)', borderRadius: '15px', position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        {brandPreview ? (
                                            <>
                                                <img src={brandPreview} style={{ maxWidth: '80%', maxHeight: '80%', objectFit: 'contain' }} alt="Preview" />
                                                <button 
                                                    type="button"
                                                    onClick={(e) => { 
                                                        e.preventDefault();
                                                        e.stopPropagation(); 
                                                        setBrandPreview(''); 
                                                        setBrandFormData(p => ({...p, image_url: ''})); 
                                                    }}
                                                    style={{ 
                                                        position: 'absolute', 
                                                        top: '10px', 
                                                        right: '10px', 
                                                        background: '#ef4444', 
                                                        color: '#fff', 
                                                        border: 'none', 
                                                        borderRadius: '50%', 
                                                        width: '28px', 
                                                        height: '28px', 
                                                        cursor: 'pointer', 
                                                        display: 'flex', 
                                                        alignItems: 'center', 
                                                        justifyContent: 'center',
                                                        zIndex: 50,
                                                        boxShadow: '0 4px 10px rgba(0,0,0,0.5)'
                                                    }}
                                                >
                                                    <X size={16} />
                                                </button>
                                            </>
                                        ) : (
                                            <div style={{ textAlign: 'center', color: '#333' }}><ImageIcon size={32} /><p style={{ fontSize: '0.7rem', fontWeight: 700 }}>Selecionar Logo</p></div>
                                        )}
                                        <input 
                                            type="file" 
                                            accept="image/*" 
                                            onChange={handleBrandImageChange} 
                                            style={{ 
                                                position: 'absolute', 
                                                inset: 0, 
                                                opacity: 0, 
                                                cursor: 'pointer', 
                                                zIndex: brandPreview ? 1 : 10 
                                            }} 
                                        />
                                        {isUploadingBrand && <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Loader2 className="animate-spin" color="#D4AF37" /></div>}
                                    </div>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    <label style={{ fontSize: '0.7rem', fontWeight: 900, color: '#444', textTransform: 'uppercase' }}>Vincular à Marca (Filtro)</label>
                                    <select 
                                        value={brandFormData.linked_brand} 
                                        onChange={e => setBrandFormData({...brandFormData, linked_brand: e.target.value})} 
                                        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', padding: '12px', color: '#fff', fontWeight: 700, width: '100%', outline: 'none' }}
                                    >
                                        <option value="" style={{ background: '#111' }}>Nenhuma (Apenas imagem)</option>
                                        {brandOptions.map(b => (
                                            <option key={b.id} value={b.name} style={{ background: '#111' }}>{b.name}</option>
                                        ))}
                                    </select>
                                    <p style={{ margin: 0, fontSize: '0.65rem', color: '#555' }}>Ao clicar nesta logo no site, o usuário verá apenas produtos desta marca.</p>
                                </div>

                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        <label style={{ fontSize: '0.7rem', fontWeight: 900, color: '#444', textTransform: 'uppercase' }}>Ordem</label>
                                        <input type="number" value={brandFormData.display_order} onChange={e => setBrandFormData({...brandFormData, display_order: e.target.value})} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', padding: '10px', color: '#fff', fontWeight: 900, width: '100%', boxSizing: 'border-box' }} />
                                    </div>
                                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        <label style={{ fontSize: '0.7rem', fontWeight: 900, color: '#444', textTransform: 'uppercase' }}>Tempo (s)</label>
                                        <input type="number" value={brandFormData.duration} onChange={e => setBrandFormData({...brandFormData, duration: e.target.value})} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', padding: '10px', color: '#fff', fontWeight: 900, width: '100%', boxSizing: 'border-box' }} />
                                    </div>
                                    <div style={{ width: '60px', display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center' }}>
                                        <label style={{ fontSize: '0.7rem', fontWeight: 900, color: '#444', textTransform: 'uppercase' }}>Ativo</label>
                                        <div style={{ display: 'flex', alignItems: 'center', height: '40px' }}>
                                            <label className="switch">
                                                <input type="checkbox" checked={brandFormData.active} onChange={e => setBrandFormData({...brandFormData, active: e.target.checked})} />
                                                <span className="slider round"></span>
                                            </label>
                                        </div>
                                    </div>
                                </div>

                                <button 
                                    onClick={handleSaveBrand}
                                    disabled={isSavingBrand || isUploadingBrand || !brandFormData.image_url}
                                    style={{ background: '#D4AF37', color: '#000', border: 'none', borderRadius: '15px', padding: '15px', fontWeight: 900, cursor: 'pointer', marginTop: '10px' }}
                                >
                                    {isSavingBrand ? 'SALVANDO...' : 'SALVAR MARCA'}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <style>{`
                .banner-card-hover:hover { transform: translateY(-5px); border-color: rgba(212, 175, 55, 0.4) !important; box-shadow: 0 30px 60px rgba(0,0,0,0.5); background: rgba(255,255,255,0.05) !important; }
            `}</style>
        </div>
    );
};

export default AdminBanners;
