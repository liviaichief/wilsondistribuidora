import React, { useState, useEffect } from 'react';
import { databases, storage, DATABASE_ID, COLLECTIONS, BUCKET_ID } from '../lib/appwrite';
import { useAlert } from '../context/AlertContext';
import { Plus, Edit, Trash2, X, Image as ImageIcon, CheckCircle, XCircle, Clock, Upload, Loader2, Save, GripVertical, AlertCircle, ExternalLink, ImagePlus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ID, Query, Permission, Role } from 'appwrite';
import { getImageUrl } from '../lib/imageUtils';
import imageCompression from 'browser-image-compression';
import './Admin.css';

const AdminBanners = () => {
    const { showAlert, showConfirm } = useAlert();
    const [banners, setBanners] = useState([]);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);

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
    const [previewUrl, setPreviewUrl] = useState('');
    const [thumbPreviewUrl, setThumbPreviewUrl] = useState('');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [bannersResponse, productsResponse] = await Promise.all([
                databases.listDocuments(DATABASE_ID, COLLECTIONS.BANNERS, [Query.orderAsc('display_order')]),
                databases.listDocuments(DATABASE_ID, COLLECTIONS.PRODUCTS, [Query.orderAsc('title'), Query.limit(100)])
            ]);

            setBanners(bannersResponse.documents.map(doc => ({
                ...doc,
                id: doc.$id,
                product_id: doc.product ? (typeof doc.product === 'object' ? doc.product.$id : doc.product) : null
            })));
            setProducts(productsResponse.documents.map(doc => ({ id: doc.$id, title: doc.title })));
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
                active: banner.active ?? true,
                display_order: banner.display_order || 0,
                duration: banner.duration || 5,
                thumbnail_url: banner.thumbnail_url || ''
            });
            setPreviewUrl(getImageUrl(banner.image_url));
            if (banner.thumbnail_url) setThumbPreviewUrl(getImageUrl(banner.thumbnail_url));
        } else {
            setEditingBanner(null);
            setFormData({ title: '', image_url: '', product_id: '', active: true, display_order: banners.length + 1, duration: 5, thumbnail_url: '' });
        }
        setIsModalOpen(true);
    };

    const uploadFileToAppwrite = async (file, isVideo = false) => {
        let fileToUpload = file;
        if (!isVideo && file.type.startsWith('image/')) {
            const options = { maxSizeMB: 0.15, maxWidthOrHeight: 1280, useWebWorker: true };
            const compressedBlob = await imageCompression(file, options);
            fileToUpload = new File([compressedBlob], file.name, { type: file.type });
        }
        const result = await storage.createFile(BUCKET_ID, isVideo ? `v_${ID.unique()}` : ID.unique(), fileToUpload, [Permission.read(Role.any()), Permission.write(Role.users())]);
        return result.$id;
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

    return (
        <div style={{ padding: '0 20px 40px' }}>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '30px', marginTop: '20px' }}>
                <button 
                    onClick={() => handleOpenModal()} 
                    style={{ background: '#D4AF37', color: '#000', border: 'none', borderRadius: '16px', padding: '16px 28px', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', boxShadow: '0 10px 20px rgba(212, 175, 55, 0.2)', transition: 'all 0.3s' }}
                >
                    <Plus size={20} strokeWidth={3} /> NOVO BANNER
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
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: '30px' }}>
                    <AnimatePresence>
                        {banners.map((banner, index) => (
                            <motion.div 
                                key={banner.id}
                                layout
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: index * 0.05 }}
                                onDoubleClick={() => handleOpenModal(banner)}
                                style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '28px', border: '1px solid rgba(255,255,255,0.08)', overflow: 'hidden', cursor: 'pointer', position: 'relative' }}
                                className="banner-card-hover"
                            >
                                <div style={{ aspectRatio: '16/9', background: '#000', position: 'relative' }}>
                                    {(() => {
                                        const mediaUrl = getImageUrl(banner.image_url);
                                        const isVideo = banner.image_url?.startsWith('v_');
                                        if (isVideo) return <video src={mediaUrl} style={{ width: '100%', height: '100%', objectFit: 'contain', background: '#000' }} muted loop onMouseOver={e => e.target.play()} onMouseOut={e => e.target.pause()} />;
                                        return <img src={mediaUrl} alt={banner.title} style={{ width: '100%', height: '100%', objectFit: 'contain', background: '#000' }} onError={(e) => {
                                            e.target.onerror = null;
                                            e.target.src = 'https://placehold.co/600x400/1e1e1e/D4AF37?text=Erro+no+Carregamento';
                                        }} />;
                                    })()}
                                    <div style={{ position: 'absolute', top: 20, left: 20, background: banner.active ? '#22c55e' : '#444', color: '#fff', padding: '6px 14px', borderRadius: '10px', fontSize: '0.7rem', fontWeight: 900 }}>{banner.active ? 'ATIVO' : 'PAUSADO'}</div>
                                    <div style={{ position: 'absolute', bottom: 20, right: 20, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(10px)', color: '#fff', padding: '6px 12px', borderRadius: '10px', fontSize: '0.75rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <Clock size={14} /> {banner.duration}s
                                    </div>
                                </div>
                                <div style={{ padding: '25px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                                        <div>
                                            <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#fff' }}>{banner.title || `Banner #${banner.id.substring(0, 6)}`}</h3>
                                            <div style={{ color: '#555', fontSize: '0.85rem', marginTop: '4px', fontWeight: 700 }}>{products.find(p => p.id === banner.product_id)?.title || 'Sem link externo'}</div>
                                        </div>
                                        <div style={{ background: 'rgba(212, 175, 55, 0.1)', color: '#D4AF37', width: '32px', height: '32px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900 }}>{banner.display_order}</div>
                                    </div>
                                    <div style={{ display: 'flex', gap: '10px', paddingTop: '20px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                                        <button onClick={() => toggleActive(banner)} style={{ flex: 1, padding: '12px', borderRadius: '12px', border: 'none', background: banner.active ? 'rgba(239, 68, 68, 0.1)' : 'rgba(34, 197, 94, 0.1)', color: banner.active ? '#ef4444' : '#22c55e', cursor: 'pointer', fontWeight: 800 }}>{banner.active ? 'Pausar' : 'Ativar'}</button>
                                        <button onClick={() => handleOpenModal(banner)} style={{ padding: '12px', borderRadius: '12px', border: 'none', background: 'rgba(255,255,255,0.05)', color: '#fff', cursor: 'pointer' }}><Edit size={20} /></button>
                                        <button onClick={() => handleDelete(banner)} style={{ padding: '12px', borderRadius: '12px', border: 'none', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', cursor: 'pointer' }}><Trash2 size={20} /></button>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            )}

            <AnimatePresence>
                {isModalOpen && (
                    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)', padding: '20px' }}>
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} style={{ backgroundColor: '#141414', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '35px', padding: '40px', maxWidth: '600px', width: '100%', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 40px 100px rgba(0,0,0,0.8)', position: 'relative' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                                <h2 style={{ margin: 0, fontSize: '1.8rem', fontWeight: 900, color: '#fff' }}>{editingBanner ? 'Configurar Banner' : 'Novo Banner'}</h2>
                                <button onClick={() => setIsModalOpen(false)} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: '#666', cursor: 'pointer', padding: '10px', borderRadius: '12px' }}><X size={24} /></button>
                            </div>

                            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    <label style={{ fontSize: '0.75rem', fontWeight: 900, color: '#888', textTransform: 'uppercase' }}>Título Interno</label>
                                    <input required value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '14px', padding: '14px 18px', color: '#fff' }} />
                                </div>

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

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    <label style={{ fontSize: '0.75rem', fontWeight: 900, color: '#888', textTransform: 'uppercase' }}>Vincular a Produto</label>
                                    <select value={formData.product_id} onChange={e => setFormData({ ...formData, product_id: e.target.value })} style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '14px', padding: '14px 18px', color: '#fff' }}>
                                        <option value="">Sem vínculo (apenas destaque)</option>
                                        {products.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
                                    </select>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        <label style={{ fontSize: '0.75rem', fontWeight: 900, color: '#888', textTransform: 'uppercase' }}>Ordem</label>
                                        <input type="number" value={formData.display_order} onChange={e => setFormData({ ...formData, display_order: e.target.value })} style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '14px', padding: '14px 18px', color: '#fff', fontWeight: 900 }} />
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        <label style={{ fontSize: '0.75rem', fontWeight: 900, color: '#888', textTransform: 'uppercase' }}>Duração (s)</label>
                                        <input type="number" value={formData.duration} onChange={e => setFormData({ ...formData, duration: e.target.value })} style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '14px', padding: '14px 18px', color: '#fff', fontWeight: 900 }} />
                                    </div>
                                </div>

                                <div style={{ padding: '20px', background: 'rgba(255,255,255,0.02)', borderRadius: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ fontWeight: 800, fontSize: '0.9rem' }}>Ativar Banner</span>
                                    <label className="switch">
                                        <input type="checkbox" checked={formData.active} onChange={e => setFormData({ ...formData, active: e.target.checked })} />
                                        <span className="slider round"></span>
                                    </label>
                                </div>

                                <button type="submit" disabled={isSaving || isUploading} style={{ background: '#fff', color: '#000', border: 'none', borderRadius: '18px', padding: '20px', fontWeight: 900, fontSize: '1.1rem', cursor: 'pointer', marginTop: '10px' }}>
                                    {isSaving ? 'SALVANDO...' : 'SALVAR BANNER'}
                                </button>
                            </form>
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
