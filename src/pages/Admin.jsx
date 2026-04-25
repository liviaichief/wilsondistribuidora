import React, { useState, useEffect } from 'react';
import { getProducts, saveProduct, deleteProduct, getCategories, getUOMs } from '../services/dataService';
import { storage, BUCKET_ID, account } from '../lib/appwrite';
import { ID, Permission, Role } from 'appwrite';
import { Plus, Edit2, Trash2, X, Image as ImageIcon, Search, Save, Loader2, Package, Eye, EyeOff, TrendingUp, Check } from 'lucide-react';
import { getImageUrl } from '../lib/imageUtils';
import { useAlert } from '../context/AlertContext';
import { maskCurrency, parseCurrency } from '../lib/utils';
import imageCompression from 'browser-image-compression';
import { motion, AnimatePresence } from 'framer-motion';
import GenerateDescriptionButton from '../components/admin/GenerateDescriptionButton';
import './Admin.css';

const Admin = () => {
    const [loading, setLoading] = useState(true);
    const [products, setProducts] = useState([]);
    const [isSaving, setIsSaving] = useState(false);
    const [isUploadingImage, setIsUploadingImage] = useState(false);
    const [isUploadingImage2, setIsUploadingImage2] = useState(false);
    const [previewUrl, setPreviewUrl] = useState('');
    const [previewUrl2, setPreviewUrl2] = useState('');
    const { showAlert, showConfirm } = useAlert();
    const [categories, setCategories] = useState([]);
    const [uoms, setUoms] = useState([]);
    const [originalProduct, setOriginalProduct] = useState(null);

    const [categoryFilter, setCategoryFilter] = useState('all');
    const [titleFilter, setTitleFilter] = useState('');

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentProduct, setCurrentProduct] = useState({
        title: '', description: '', price: '', category: '', image: '', image_2: '', is_promotion: false, promo_price: '', active: true, cost_price: 0, video_url: ''
    });

    useEffect(() => {
        loadProducts();
        loadCategories();
        loadUOMs();
    }, []);

    const loadUOMs = async () => { try { const data = await getUOMs(); setUoms(data); } catch (e) { console.error(e); } };
    const loadCategories = async () => { try { const data = await getCategories(); setCategories(data); } catch (e) { console.error(e); } };
    const loadProducts = async () => {
        setLoading(true);
        try {
            const data = await getProducts();
            if (data && data.documents) setProducts(data.documents);
        } catch (err) { showAlert('Erro ao carregar produtos.', 'error'); } finally { setLoading(false); }
    };

    const handleEdit = (product) => {
        setCurrentProduct(product);
        setOriginalProduct(product);
        setPreviewUrl(getImageUrl(product.image));
        setPreviewUrl2(getImageUrl(product.image_2));
        setIsModalOpen(true);
    };

    const handleDelete = (product) => {
        showConfirm('Excluir este produto?', async () => {
            try {
                if (product.image) { try { await storage.deleteFile(BUCKET_ID, product.image); } catch (e) { } }
                if (product.image_2) { try { await storage.deleteFile(BUCKET_ID, product.image_2); } catch (e) { } }
                await deleteProduct(product.id || product.$id);
                loadProducts();
                showAlert('Produto removido.', 'success', null, 3000);
            } catch (err) { showAlert(err.message, 'error'); }
        });
    };

    const handleSave = async (e) => {
        e.preventDefault();
        if (isSaving) return;
        setIsSaving(true);
        try {
            await saveProduct(currentProduct);
            setIsModalOpen(false);
            loadProducts();
            showAlert('Produto salvo!', 'success', null, 3000);
        } catch (err) { showAlert(err.message, 'error'); } finally { setIsSaving(false); }
    };

    const openNewModal = () => {
        const empty = {
            title: '', description: '', price: '', category: categories.length > 0 ? categories[0].id : '', image: '', image_2: '', uom: 'KG', is_promotion: false, promo_price: '', active: true, manage_stock: false, stock_quantity: 0, cost_price: 0, video_url: ''
        };
        setCurrentProduct(empty);
        setOriginalProduct(empty);
        setPreviewUrl('');
        setPreviewUrl2('');
        setIsModalOpen(true);
    };

    const checkChanges = () => {
        if (!originalProduct) return false;
        // Deep comparison of relevant fields
        return (
            currentProduct.title !== originalProduct.title ||
            currentProduct.description !== originalProduct.description ||
            currentProduct.price !== originalProduct.price ||
            currentProduct.category !== originalProduct.category ||
            currentProduct.image !== originalProduct.image ||
            currentProduct.image_2 !== originalProduct.image_2 ||
            currentProduct.uom !== originalProduct.uom ||
            currentProduct.is_promotion !== originalProduct.is_promotion ||
            currentProduct.promo_price !== originalProduct.promo_price ||
            currentProduct.active !== originalProduct.active ||
            currentProduct.manage_stock !== originalProduct.manage_stock ||
            currentProduct.stock_quantity !== originalProduct.stock_quantity ||
            currentProduct.allow_backorder !== originalProduct.allow_backorder ||
            currentProduct.disable_on_zero_stock !== originalProduct.disable_on_zero_stock
        );
    };

    const filteredProducts = products.filter(p => {
        const matchTitle = (p.title || '').toLowerCase().includes(titleFilter.toLowerCase());
        const matchCategory = categoryFilter === 'all' || (p.category || '').toLowerCase() === categoryFilter.toLowerCase();
        return matchTitle && matchCategory;
    });

    return (
        <div style={{ padding: '0 20px 40px' }}>
            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '30px', borderRadius: '30px', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(10px)', marginTop: '20px' }}>
                <div style={{ marginBottom: '30px', display: 'flex', gap: '15px', alignItems: 'center' }}>
                    <div style={{ flex: 1, background: 'rgba(0,0,0,0.2)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', padding: '0 15px' }}>
                        <Search size={20} color="#555" />
                        <input placeholder="Buscar produtos..." value={titleFilter} onChange={e => setTitleFilter(e.target.value)} style={{ background: 'none', border: 'none', color: '#fff', padding: '15px 12px', width: '100%', outline: 'none' }} />
                    </div>
                    <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} style={{ background: 'rgba(0,0,0,0.5)', color: '#fff', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '16px', padding: '16px 20px', cursor: 'pointer', fontWeight: 700 }}>
                        <option value="all">Todas as Categorias</option>
                        {categories.map(cat => <option key={cat.id} value={cat.id} style={{ background: '#111' }}>{cat.name}</option>)}
                    </select>
                    <button onClick={openNewModal} style={{ background: '#D4AF37', color: '#000', border: 'none', borderRadius: '16px', padding: '16px 28px', fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', whiteSpace: 'nowrap' }}>
                        <Plus size={20} strokeWidth={3} /> NOVO PRODUTO
                    </button>
                </div>

                {loading ? (
                    <div style={{ padding: '60px', textAlign: 'center' }}><Loader2 className="animate-spin" size={40} color="#D4AF37" /></div>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 10px' }}>
                            <thead>
                                <tr style={{ color: '#555', fontSize: '0.75rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '1px' }}>
                                    <th style={{ textAlign: 'left', padding: '0 20px' }}>PRODUTO</th>
                                    <th style={{ textAlign: 'left', padding: '0 20px' }}>ID PRODUTO</th>
                                    <th style={{ textAlign: 'left', padding: '0 20px' }}>CATEGORIA</th>
                                    <th style={{ textAlign: 'left', padding: '0 20px' }}>PREÇO</th>
                                    <th style={{ textAlign: 'center', padding: '0 20px' }}>ESTOQUE</th>
                                    <th style={{ textAlign: 'center', padding: '0 20px' }}>STATUS</th>
                                    <th style={{ textAlign: 'right', padding: '0 20px' }}>AÇÕES</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredProducts.map((p) => (
                                    <tr key={p.id || p.$id} style={{ background: 'rgba(255,255,255,0.02)', cursor: 'pointer' }} onClick={() => handleEdit(p)}>
                                        <td style={{ padding: '15px 20px', borderRadius: '18px 0 0 18px', border: '1px solid rgba(255,255,255,0.05)', borderRight: 'none' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                                {p.image ? <img src={getImageUrl(p.image)} alt="" style={{ width: '50px', height: '50px', borderRadius: '12px', objectFit: 'cover' }} /> : <div style={{ width: '50px', height: '50px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><ImageIcon size={20} color="#333" /></div>}
                                                <div style={{ fontWeight: 800, color: '#fff' }}>{p.title}</div>
                                            </div>
                                        </td>
                                        <td style={{ padding: '15px 20px', borderTop: '1px solid rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                            <code style={{ fontSize: '0.75rem', color: '#D4AF37', background: 'rgba(212, 175, 55, 0.05)', padding: '4px 8px', borderRadius: '6px', border: '1px solid rgba(212, 175, 55, 0.1)', fontFamily: 'monospace' }}>
                                                {p.sku || (p.$id ? p.$id.substring(0, 6).toUpperCase() : '---')}
                                            </code>
                                        </td>
                                        <td style={{ padding: '15px 20px', borderTop: '1px solid rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#a855f7', background: 'rgba(168, 85, 247, 0.1)', padding: '4px 10px', borderRadius: '8px' }}>
                                                {categories.find(c => c.id === p.category)?.name?.toUpperCase() || p.category?.toUpperCase()}
                                            </span>
                                        </td>
                                        <td style={{ padding: '15px 20px', borderTop: '1px solid rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                            <div style={{ fontWeight: 900, color: '#fff' }}>R$ {maskCurrency(p.price)}</div>
                                            {p.is_promotion && <div style={{ fontSize: '0.75rem', color: '#22c55e', fontWeight: 800 }}>PROMO: R$ {maskCurrency(p.promo_price)}</div>}
                                        </td>
                                        <td style={{ padding: '15px 20px', textAlign: 'center', borderTop: '1px solid rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                            <div style={{ fontWeight: 900, color: (p.stock_quantity || 0) > 0 ? '#22c55e' : (p.manage_stock && !p.allow_backorder ? '#ef4444' : '#555') }}>
                                                {p.manage_stock ? p.stock_quantity : '∞'}
                                            </div>
                                            {p.manage_stock && (
                                                <div style={{ fontSize: '0.6rem', marginTop: '4px', fontWeight: 900, textTransform: 'uppercase' }}>
                                                    {p.allow_backorder ? (
                                                        <span style={{ color: '#22c55e', background: 'rgba(34, 197, 94, 0.1)', padding: '2px 6px', borderRadius: '4px' }}>VENDER SEM ESTOQUE</span>
                                                    ) : p.disable_on_zero_stock ? (
                                                        <span style={{ color: '#f97316', background: 'rgba(249, 115, 22, 0.1)', padding: '2px 6px', borderRadius: '4px' }}>AUTO-OCULTAR</span>
                                                    ) : (
                                                        <span style={{ color: '#555' }}>LIMITADO</span>
                                                    )}
                                                </div>
                                            )}
                                        </td>
                                        <td style={{ padding: '15px 20px', textAlign: 'center', borderTop: '1px solid rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                            {p.active !== false ? (
                                                p.manage_stock && p.stock_quantity <= 0 && p.disable_on_zero_stock ? (
                                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                                                        <EyeOff size={16} color="#f97316" />
                                                        <span style={{ fontSize: '0.55rem', color: '#f97316', fontWeight: 900 }}>SEM ESTOQUE</span>
                                                    </div>
                                                ) : (
                                                    <Eye size={18} color="#22c55e" />
                                                )
                                            ) : (
                                                <EyeOff size={18} color="#ef4444" />
                                            )}
                                        </td>
                                        <td style={{ padding: '15px 20px', borderRadius: '0 18px 18px 0', border: '1px solid rgba(255,255,255,0.05)', borderLeft: 'none', textAlign: 'right' }}>
                                            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                                <button onClick={e => { e.stopPropagation(); handleEdit(p); }} style={{ padding: '8px', borderRadius: '10px', background: 'rgba(255,255,255,0.05)', border: 'none', color: '#fff', cursor: 'pointer' }}><Edit2 size={16} /></button>
                                                <button onClick={e => { e.stopPropagation(); handleDelete(p); }} style={{ padding: '8px', borderRadius: '10px', background: 'rgba(239, 68, 68, 0.1)', border: 'none', color: '#ef4444', cursor: 'pointer' }}><Trash2 size={16} /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <AnimatePresence>
                {isModalOpen && (
                    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)', padding: '20px' }}>
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} style={{ background: '#111', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '30px', maxWidth: '800px', width: '100%', maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 30px 60px rgba(0,0,0,0.5)' }}>
                            {/* Header Fixo */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '25px 30px', borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.02)', flexShrink: 0 }}>
                                <h2 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 900, display: 'flex', alignItems: 'center' }}>
                                    {currentProduct.id || currentProduct.$id ? 'Editar Produto' : 'Novo Produto'}
                                    {currentProduct.sku && (
                                        <span style={{ marginLeft: '12px', fontSize: '0.8rem', color: '#D4AF37', background: 'rgba(212, 175, 55, 0.1)', padding: '4px 12px', borderRadius: '8px', border: '1px solid rgba(212, 175, 55, 0.2)', letterSpacing: '1px' }}>
                                            {currentProduct.sku}
                                        </span>
                                    )}
                                </h2>
                                <button type="button" onClick={() => setIsModalOpen(false)} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: '#fff', padding: '8px', borderRadius: '12px', cursor: 'pointer' }}><X size={20} /></button>
                            </div>

                            {/* Conteúdo Rolável */}
                            <div style={{ overflowY: 'auto', padding: '30px', flexGrow: 1 }}>
                                <form onSubmit={handleSave} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                            <span style={{ fontSize: '0.75rem', fontWeight: 900, color: '#555', textTransform: 'uppercase' }}>Imagem do Produto</span>
                                            <div style={{ width: '100%', aspectRatio: '1', background: 'rgba(0,0,0,0.3)', borderRadius: '20px', border: '2px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
                                                {previewUrl ? <img src={previewUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <ImageIcon size={40} color="#333" />}
                                            </div>
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 3fr', gap: '10px', marginBottom: '20px' }}>
                                                <button
                                                    type="button"
                                                    onClick={() => { setCurrentProduct({ ...currentProduct, image: '' }); setPreviewUrl(''); }}
                                                    style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '12px', padding: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}
                                                    title="Remover Imagem Principal"
                                                >
                                                    <Trash2 size={20} />
                                                </button>
                                                <label style={{ background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', fontWeight: 800, fontSize: '0.85rem', transition: 'all 0.2s' }}>
                                                    {isUploadingImage ? <Loader2 className="animate-spin" size={18} /> : <ImageIcon size={18} />}
                                                    {isUploadingImage ? 'ENVIANDO...' : 'FOTO PRINCIPAL'}
                                                    <input type="file" accept="image/*" style={{ display: 'none' }} onChange={async e => {
                                                        const file = e.target.files[0];
                                                        if (file) {
                                                            setIsUploadingImage(true);
                                                            try {
                                                                const localUrl = URL.createObjectURL(file);
                                                                setPreviewUrl(localUrl);
                                                                const compressed = await imageCompression(file, { maxSizeMB: 0.15, maxWidthOrHeight: 1024 });
                                                                const permissions = [Permission.read(Role.any())];
                                                                
                                                                // Se o admin estiver logado, garante que ele pode gerenciar o arquivo
                                                                try {
                                                                    const session = await account.get();
                                                                    permissions.push(Permission.write(Role.user(session.$id)));
                                                                    permissions.push(Permission.update(Role.user(session.$id)));
                                                                    permissions.push(Permission.delete(Role.user(session.$id)));
                                                                } catch (e) {}

                                                                const res = await storage.createFile(BUCKET_ID, ID.unique(), new File([compressed], file.name), permissions);
                                                                setCurrentProduct({ ...currentProduct, image: res.$id });
                                                            } catch (err) { showAlert('Erro no upload', 'error'); } finally { setIsUploadingImage(false); }
                                                        }
                                                    }} />
                                                </label>
                                            </div>

                                            {/* SEGUNDA FOTO */}
                                            <span style={{ fontSize: '0.75rem', fontWeight: 900, color: '#555', textTransform: 'uppercase' }}>Segunda Imagem (Carrossel)</span>
                                            <div style={{ width: '100%', aspectRatio: '1', background: 'rgba(0,0,0,0.3)', borderRadius: '20px', border: '2px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden', marginTop: '6px' }}>
                                                {previewUrl2 ? <img src={previewUrl2} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <ImageIcon size={40} color="#333" />}
                                            </div>
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 3fr', gap: '10px' }}>
                                                <button
                                                    type="button"
                                                    onClick={() => { setCurrentProduct({ ...currentProduct, image_2: '' }); setPreviewUrl2(''); }}
                                                    style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '12px', padding: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}
                                                    title="Remover Segunda Imagem"
                                                >
                                                    <Trash2 size={20} />
                                                </button>
                                                <label style={{ background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', fontWeight: 800, fontSize: '0.85rem', transition: 'all 0.2s' }}>
                                                    {isUploadingImage2 ? <Loader2 className="animate-spin" size={18} /> : <ImageIcon size={18} />}
                                                    {isUploadingImage2 ? 'ENVIANDO...' : 'SEGUNDA FOTO'}
                                                    <input type="file" accept="image/*" style={{ display: 'none' }} onChange={async e => {
                                                        const file = e.target.files[0];
                                                        if (file) {
                                                            setIsUploadingImage2(true);
                                                            try {
                                                                const localUrl = URL.createObjectURL(file);
                                                                setPreviewUrl2(localUrl);
                                                                const compressed = await imageCompression(file, { maxSizeMB: 0.15, maxWidthOrHeight: 1024 });
                                                                const permissions = [Permission.read(Role.any())];
                                                                
                                                                // Se o admin estiver logado, garante que ele pode gerenciar o arquivo
                                                                try {
                                                                    const session = await account.get();
                                                                    permissions.push(Permission.write(Role.user(session.$id)));
                                                                    permissions.push(Permission.update(Role.user(session.$id)));
                                                                    permissions.push(Permission.delete(Role.user(session.$id)));
                                                                } catch (e) {}

                                                                const res = await storage.createFile(BUCKET_ID, ID.unique(), new File([compressed], file.name), permissions);
                                                                setCurrentProduct({ ...currentProduct, image_2: res.$id });
                                                            } catch (err) { showAlert('Erro no upload', 'error'); } finally { setIsUploadingImage2(false); }
                                                        }
                                                    }} />
                                                </label>
                                            </div>
                                        </div>

                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                            <span style={{ fontSize: '0.75rem', fontWeight: 900, color: '#555', textTransform: 'uppercase' }}>Disponibilidade</span>
                                            <button
                                                type="button"
                                                onClick={() => setCurrentProduct({ ...currentProduct, active: !currentProduct.active })}
                                                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '15px 20px', background: currentProduct.active !== false ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)', borderRadius: '15px', border: '1px solid', borderColor: currentProduct.active !== false ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)', cursor: 'pointer', transition: 'all 0.2s' }}
                                            >
                                                <span style={{ fontWeight: 900, fontSize: '0.85rem', color: currentProduct.active !== false ? '#22c55e' : '#ef4444' }}>
                                                    {currentProduct.active !== false ? 'VISÍVEL NA LOJA' : 'OCULTO NA LOJA'}
                                                </span>
                                                {currentProduct.active !== false ? <Eye size={20} color="#22c55e" /> : <EyeOff size={20} color="#ef4444" />}
                                            </button>
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                            <span style={{ fontSize: '0.75rem', fontWeight: 900, color: '#555', textTransform: 'uppercase' }}>Título do Produto</span>
                                            <input placeholder="Título" value={currentProduct.title} onChange={e => setCurrentProduct({ ...currentProduct, title: e.target.value })} style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '12px', color: '#fff', marginBottom: '10px' }} />

                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                                                <span style={{ fontSize: '0.75rem', fontWeight: 900, color: '#555', textTransform: 'uppercase' }}>Descrição</span>
                                                <GenerateDescriptionButton 
                                                    productTitle={currentProduct.title}
                                                    category={categories.find(c => c.id === currentProduct.category)?.name}
                                                    onGenerated={(desc) => setCurrentProduct({ ...currentProduct, description: desc })}
                                                />
                                            </div>
                                            <textarea placeholder="Ex: Carne marmorizada ideal para grelha..." value={currentProduct.description} onChange={e => setCurrentProduct({ ...currentProduct, description: e.target.value })} style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '15px', color: '#fff', fontSize: '1rem', outline: 'none', height: '100px', resize: 'none' }} />
                                        </div>

                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                            <span style={{ fontSize: '0.75rem', fontWeight: 900, color: '#555', textTransform: 'uppercase' }}>URL do Vídeo (Youtube/Shorts/TikTok)</span>
                                            <input 
                                                type="text" 
                                                placeholder="https://..." 
                                                value={currentProduct.video_url || ''} 
                                                onChange={e => setCurrentProduct({ ...currentProduct, video_url: e.target.value })} 
                                                style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '12px', color: '#fff', fontSize: '0.9rem', outline: 'none' }} 
                                            />
                                        </div>

                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                                <span style={{ fontSize: '0.75rem', fontWeight: 900, color: '#555', textTransform: 'uppercase' }}>Categoria</span>
                                                <select value={currentProduct.category} onChange={e => setCurrentProduct({ ...currentProduct, category: e.target.value })} style={{ background: 'rgba(0,0,0,0.7)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '12px', color: '#fff', outline: 'none' }}>
                                                    {categories.map(cat => <option key={cat.id} value={cat.id} style={{ background: '#111' }}>{cat.name}</option>)}
                                                </select>
                                            </div>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                                <span style={{ fontSize: '0.75rem', fontWeight: 900, color: '#555', textTransform: 'uppercase' }}>Unidade</span>
                                                <select value={currentProduct.uom} onChange={e => setCurrentProduct({ ...currentProduct, uom: e.target.value })} style={{ background: 'rgba(0,0,0,0.7)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '12px', color: '#fff', outline: 'none' }}>
                                                    {uoms.map(u => <option key={u.id} value={u.name} style={{ background: '#111' }}>{u.name}</option>)}
                                                </select>
                                            </div>
                                        </div>

                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                            <span style={{ fontSize: '0.75rem', fontWeight: 900, color: '#555', textTransform: 'uppercase' }}>Preço Original</span>
                                            <div style={{ position: 'relative' }}>
                                                <input
                                                    type="text"
                                                    placeholder="0,00"
                                                    value={maskCurrency(currentProduct.price)}
                                                    onChange={e => setCurrentProduct({ ...currentProduct, price: parseCurrency(e.target.value) })}
                                                    style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '15px 15px 15px 45px', color: '#fff', fontWeight: 900, fontSize: '1.1rem', outline: 'none' }}
                                                />
                                                <span style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', color: '#D4AF37', fontWeight: 900 }}>R$</span>
                                            </div>
                                        </div>

                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                            <span style={{ fontSize: '0.75rem', fontWeight: 900, color: '#444', textTransform: 'uppercase' }}>Preço de Custo (Opcional - p/ Lucro Real)</span>
                                            <div style={{ position: 'relative' }}>
                                                <input
                                                    type="text"
                                                    placeholder="0,00"
                                                    value={maskCurrency(currentProduct.cost_price || 0)}
                                                    onChange={e => setCurrentProduct({ ...currentProduct, cost_price: parseCurrency(e.target.value) })}
                                                    style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '10px 10px 10px 35px', color: '#888', fontWeight: 700, fontSize: '0.9rem', outline: 'none' }}
                                                />
                                                <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#666', fontWeight: 900 }}>R$</span>
                                            </div>
                                        </div>

                                        {/* SEÇÃO DE PROMOÇÃO */}
                                        <div style={{ padding: '15px', background: 'rgba(147, 51, 234, 0.05)', borderRadius: '20px', border: '1px solid rgba(147, 51, 234, 0.1)' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px', opacity: currentProduct.is_promotion ? 1 : 0.5, transition: 'all 0.3s' }}>
                                                    <span style={{ fontSize: '0.75rem', fontWeight: 900, color: '#9333ea', textTransform: 'uppercase' }}>Preço Promocional</span>
                                                    <div style={{ position: 'relative' }}>
                                                        <input
                                                            type="text"
                                                            placeholder="0,00"
                                                            readOnly={!currentProduct.is_promotion}
                                                            value={maskCurrency(currentProduct.promo_price)}
                                                            onChange={e => setCurrentProduct({ ...currentProduct, promo_price: parseCurrency(e.target.value) })}
                                                            style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '10px 10px 10px 35px', color: '#fff', fontWeight: 900, fontSize: '0.9rem', outline: 'none', cursor: currentProduct.is_promotion ? 'text' : 'not-allowed' }}
                                                        />
                                                        <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#9333ea', fontWeight: 900, fontSize: '0.8rem' }}>R$</span>
                                                    </div>
                                                </div>

                                                <div style={{ marginLeft: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                                                    <span style={{ fontSize: '0.75rem', fontWeight: 900, color: '#9333ea', textTransform: 'uppercase' }}>Ativar promoção</span>
                                                    <button
                                                        type="button"
                                                        onClick={() => setCurrentProduct({ ...currentProduct, is_promotion: !currentProduct.is_promotion })}
                                                        style={{ width: '44px', height: '22px', background: currentProduct.is_promotion ? '#9333ea' : '#333', borderRadius: '11px', border: 'none', position: 'relative', cursor: 'pointer', transition: 'all 0.3s', marginTop: '5px' }}
                                                    >
                                                        <div style={{ width: '16px', height: '16px', background: '#fff', borderRadius: '50%', position: 'absolute', top: '3px', left: currentProduct.is_promotion ? '25px' : '3px', transition: 'all 0.3s' }} />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>

                                        {/* SEÇÃO DE ESTOQUE */}
                                        <div style={{ padding: '15px', background: 'rgba(212, 175, 55, 0.05)', borderRadius: '20px', border: '1px solid rgba(212, 175, 55, 0.1)', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <span style={{ fontSize: '0.75rem', fontWeight: 900, color: '#D4AF37', textTransform: 'uppercase' }}>Gerenciar Estoque</span>
                                                <button
                                                    type="button"
                                                    onClick={() => setCurrentProduct({ ...currentProduct, manage_stock: !currentProduct.manage_stock })}
                                                    style={{ width: '44px', height: '22px', background: currentProduct.manage_stock ? '#D4AF37' : '#333', borderRadius: '11px', border: 'none', position: 'relative', cursor: 'pointer', transition: 'all 0.3s' }}
                                                >
                                                    <div style={{ width: '16px', height: '16px', background: '#fff', borderRadius: '50%', position: 'absolute', top: '3px', left: currentProduct.manage_stock ? '25px' : '3px', transition: 'all 0.3s' }} />
                                                </button>
                                            </div>

                                            <div style={{ height: '1px', background: 'rgba(255,255,255,0.05)' }} />

                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '15px', opacity: currentProduct.manage_stock ? 1 : 0.3, pointerEvents: currentProduct.manage_stock ? 'all' : 'none', transition: 'all 0.3s' }}>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                                    <span style={{ fontSize: '0.75rem', fontWeight: 900, color: '#888' }}>Qtd</span>
                                                    <input
                                                        type="number"
                                                        value={currentProduct.stock_quantity}
                                                        placeholder="0"
                                                        onChange={e => {
                                                            const val = e.target.value;
                                                            if (val === '') {
                                                                setCurrentProduct({ ...currentProduct, stock_quantity: 0 });
                                                                return;
                                                            }
                                                            let num = parseInt(val);
                                                            if (isNaN(num)) num = 0;
                                                            if (num < 0) num = 0;
                                                            // O limite de 3 dígitos é aplicado aqui de forma segura
                                                            if (num > 999) return;
                                                            setCurrentProduct({ ...currentProduct, stock_quantity: num });
                                                        }}
                                                        onFocus={e => e.target.select()}
                                                        style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '10px', color: '#fff', fontWeight: 900, textAlign: 'center', fontSize: '1rem' }}
                                                    />
                                                </div>

                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            const newVal = !currentProduct.allow_backorder;
                                                            setCurrentProduct({
                                                                ...currentProduct,
                                                                allow_backorder: newVal,
                                                                disable_on_zero_stock: newVal ? false : currentProduct.disable_on_zero_stock
                                                            });
                                                        }}
                                                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '10px', cursor: 'pointer', color: '#fff' }}
                                                    >
                                                        <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>Vender sem estoque</span>
                                                        <div style={{ width: '16px', height: '16px', border: '2px solid #fff', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: currentProduct.allow_backorder ? '#fff' : 'transparent' }}>
                                                            {currentProduct.allow_backorder && <Check size={12} color="#000" />}
                                                        </div>
                                                    </button>

                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            const newVal = !currentProduct.disable_on_zero_stock;
                                                            setCurrentProduct({
                                                                ...currentProduct,
                                                                disable_on_zero_stock: newVal,
                                                                allow_backorder: newVal ? false : currentProduct.allow_backorder
                                                            });
                                                        }}
                                                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '10px', cursor: 'pointer', color: '#fff' }}
                                                    >
                                                        <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>Desativar ao zerar</span>
                                                        <div style={{ width: '16px', height: '16px', border: '2px solid #fff', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: currentProduct.disable_on_zero_stock ? '#fff' : 'transparent' }}>
                                                            {currentProduct.disable_on_zero_stock && <Check size={12} color="#000" />}
                                                        </div>
                                                    </button>
                                                </div>
                                            </div>
                                        </div>

                                        <button 
                                            type="submit" 
                                            disabled={isSaving || isUploadingImage || isUploadingImage2 || !checkChanges()} 
                                            style={{ 
                                                width: '100%', 
                                                background: (isSaving || isUploadingImage || isUploadingImage2 || !checkChanges()) ? '#333' : '#D4AF37', 
                                                color: (isSaving || isUploadingImage || isUploadingImage2 || !checkChanges()) ? '#666' : '#000', 
                                                border: 'none', 
                                                borderRadius: '14px', 
                                                padding: '16px', 
                                                fontWeight: 900, 
                                                cursor: (isSaving || isUploadingImage || isUploadingImage2 || !checkChanges()) ? 'not-allowed' : 'pointer', 
                                                display: 'flex', 
                                                alignItems: 'center', 
                                                justifyContent: 'center', 
                                                marginTop: '10px',
                                                transition: 'all 0.3s'
                                            }}
                                        >
                                            {isSaving ? 'SALVANDO...' : 'SALVAR PRODUTO'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Admin;
