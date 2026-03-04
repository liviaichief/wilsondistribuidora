
import React, { useState, useEffect } from 'react';
import { databases, storage, DATABASE_ID, COLLECTIONS, BUCKET_ID } from '../lib/appwrite';
import { useAlert } from '../context/AlertContext';
import { Plus, Edit, Trash2, X, Image as ImageIcon, CheckCircle, XCircle, Clock, Upload, Loader2, Save } from 'lucide-react';
import { ID, Query, Permission, Role } from 'appwrite';
import { getImageUrl } from '../lib/imageUtils';
import imageCompression from 'browser-image-compression';
import './Admin.css'; // Reuse admin styles

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
        link: '',
        product_id: '',
        active: true,
        display_order: 0,
        duration: 5
    });
    const [imageFile, setImageFile] = useState(null);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            console.log('Fetching banners and products...');
            const [bannersResponse, productsResponse] = await Promise.all([
                databases.listDocuments(
                    DATABASE_ID,
                    COLLECTIONS.BANNERS,
                    [Query.orderAsc('display_order')]
                ),
                databases.listDocuments(
                    DATABASE_ID,
                    COLLECTIONS.PRODUCTS,
                    [Query.orderAsc('title'), Query.limit(100)]
                )
            ]);

            // Map Appwrite docs
            const mappedBanners = bannersResponse.documents.map(doc => ({
                ...doc,
                id: doc.$id,
                // Handle product relationship if expanded, or just ID
                product_id: doc.product ? (typeof doc.product === 'object' ? doc.product.$id : doc.product) : null
            }));

            const mappedProducts = productsResponse.documents.map(doc => ({
                id: doc.$id,
                title: doc.title
            }));

            setBanners(mappedBanners);
            setProducts(mappedProducts);
        } catch (error) {
            console.error('Error loading data:', error);
            showAlert('Erro ao carregar dados: ' + error.message, 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (banner = null) => {
        setImageFile(null); // Reset file input
        if (banner) {
            setEditingBanner(banner);
            setFormData({
                title: banner.title,
                image_url: banner.image_url,
                link: banner.link || '',
                product_id: banner.product_id || (banner.product ? (typeof banner.product === 'object' ? banner.product.$id : banner.product) : ''),
                active: banner.active,
                display_order: banner.display_order,
                duration: banner.duration || 5
            });
        } else {
            setEditingBanner(null);
            setFormData({
                title: '',
                image_url: '',
                link: '',
                product_id: '',
                active: true,
                display_order: banners.length + 1,
                duration: 5
            });
        }
        setIsModalOpen(true);
    };

    const handleImageChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            setImageFile(e.target.files[0]);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSaving(true);

        try {
            let finalImageUrl = formData.image_url;

            // Upload image if selected
            if (imageFile) {
                const options = {
                    maxSizeMB: 0.25, // ~250KB max
                    maxWidthOrHeight: 1920,
                    useWebWorker: true,
                };
                const compressedBlob = await imageCompression(imageFile, options);
                console.log(`Comprimiu banner: ${(imageFile.size / 1024).toFixed(0)}KB para ${(compressedBlob.size / 1024).toFixed(0)}KB`);

                // Appwrite requires a File object with a name in some SDK versions/environments
                const compressedFile = new File([compressedBlob], imageFile.name, { type: imageFile.type });

                const fileUpload = await storage.createFile(
                    BUCKET_ID,
                    ID.unique(),
                    compressedFile,
                    [
                        Permission.read(Role.any()),
                        Permission.write(Role.users()),
                        Permission.update(Role.users()),
                        Permission.delete(Role.users())
                    ]
                );

                // Construct URL manually to match the Product behavior and satisfy the URL format requirement
                const url = storage.getFileView(BUCKET_ID, fileUpload.$id);
                finalImageUrl = url.href || url; // Handle if it returns object or string
            }

            // Ensure we don't send an empty string if it's required as URL, but if it's optional it should be null?
            // If the schema says URL and it's required, we must have one.
            // If logic relies on either file or external URL, we should have one by now.

            const payload = {
                title: formData.title,
                image_url: finalImageUrl,
                link: formData.link || null,
                product: formData.product_id || null, // Appwrite relationship expects ID
                active: formData.active,
                display_order: parseInt(formData.display_order),
                duration: parseInt(formData.duration)
            };

            if (editingBanner) {
                await databases.updateDocument(
                    DATABASE_ID,
                    COLLECTIONS.BANNERS,
                    editingBanner.id,
                    payload
                );
                showAlert('Banner atualizado com sucesso!', 'success', null, 1000);
            } else {
                await databases.createDocument(
                    DATABASE_ID,
                    COLLECTIONS.BANNERS,
                    ID.unique(),
                    payload
                );
                showAlert('Banner criado com sucesso!', 'success', null, 1000);
            }

            setIsModalOpen(false);
            loadData();
        } catch (error) {
            console.error('Error saving banner:', error);
            showAlert('Erro ao salvar banner: ' + error.message, 'error');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = (id) => {
        showConfirm(
            'Tem certeza que deseja excluir este banner?',
            async () => {
                try {
                    await databases.deleteDocument(
                        DATABASE_ID,
                        COLLECTIONS.BANNERS,
                        id
                    );
                    showAlert('Banner excluído com sucesso!', 'success', null, 1000);
                    loadData();
                } catch (error) {
                    console.error('Error deleting banner:', error);
                    showAlert('Erro ao excluir banner: ' + error.message, 'error');
                }
            }
        );
    };

    const toggleActive = async (banner) => {
        try {
            await databases.updateDocument(
                DATABASE_ID,
                COLLECTIONS.BANNERS,
                banner.id,
                { active: !banner.active }
            );
            loadData();
        } catch (error) {
            console.error('Error toggling banner:', error);
            showAlert('Erro ao atualizar status: ' + error.message, 'error');
        }
    };

    return (
        <div className="admin-container">
            <div className="admin-content">
                <div className="header-title" style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h2>Gestão de Banners</h2>
                        <p style={{ color: '#888' }}>Gerencie os banners da página inicial.</p>
                    </div>
                    <button onClick={() => handleOpenModal()} className="add-btn">
                        <Plus size={20} /> Novo Banner
                    </button>
                </div>

                {loading ? (
                    <p style={{ textAlign: 'center', padding: '20px' }}>Carregando banners...</p>
                ) : banners.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px', color: '#888' }}>
                        <p>Nenhum banner encontrado.</p>
                        <button onClick={() => handleOpenModal()} className="add-btn" style={{ margin: '10px auto' }}>Criar Primeiro Banner</button>
                    </div>
                ) : (
                    <div className="banners-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
                        {banners.map((banner) => (
                            <div key={banner.id} className="banner-card" style={{ background: '#1e1e1e', borderRadius: '8px', overflow: 'hidden', border: '1px solid #333' }}>
                                <div className="banner-image" style={{ height: '150px', position: 'relative', backgroundColor: '#000' }}>
                                    <img
                                        src={getImageUrl(banner.image_url)}
                                        alt={banner.title}
                                        style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                                    />
                                    <div style={{ position: 'absolute', top: 10, right: 10, display: 'flex', gap: '5px' }}>
                                        <div style={{ background: 'rgba(0,0,0,0.7)', borderRadius: '4px', padding: '4px 8px' }}>
                                            <span style={{ color: banner.active ? '#4CAF50' : '#888', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem' }}>
                                                {banner.active ? <CheckCircle size={14} /> : <XCircle size={14} />}
                                                {banner.active ? 'Ativo' : 'Inativo'}
                                            </span>
                                        </div>
                                    </div>
                                    <div style={{ position: 'absolute', bottom: 10, right: 10, background: 'rgba(0,0,0,0.7)', borderRadius: '4px', padding: '4px 8px' }}>
                                        <span style={{ color: '#fff', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            <Clock size={14} /> {banner.duration || 5}s
                                        </span>
                                    </div>
                                </div>
                                <div className="banner-info" style={{ padding: '15px' }}>
                                    <h3 style={{ margin: '0 0 5px 0', color: '#fff' }}>{banner.title}</h3>
                                    <p style={{ margin: '0 0 10px 0', fontSize: '0.9rem', color: '#888' }}>Link: {banner.link || 'Sem link'}</p>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
                                        <span style={{ fontSize: '0.8rem', color: '#666' }}>Ordem: {banner.display_order}</span>
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            <button
                                                onClick={() => toggleActive(banner)}
                                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: banner.active ? '#ffeb3b' : '#4CAF50' }}
                                                title={banner.active ? "Desativar" : "Ativar"}
                                            >
                                                {banner.active ? <XCircle size={18} /> : <CheckCircle size={18} />}
                                            </button>
                                            <button
                                                onClick={() => handleOpenModal(banner)}
                                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#2196F3' }}
                                                title="Editar"
                                            >
                                                <Edit size={18} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(banner.id)}
                                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ff4444' }}
                                                title="Excluir"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Modal */}
                {isModalOpen && (
                    <div className="modal-overlay">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h2>{editingBanner ? 'Editar Banner' : 'Novo Banner'}</h2>
                                <button className="close-btn" onClick={() => setIsModalOpen(false)}>
                                    <X size={24} />
                                </button>
                            </div>

                            <div className="info-banner" style={{
                                backgroundColor: 'rgba(212, 175, 55, 0.1)',
                                border: '1px solid var(--primary-color)',
                                borderRadius: '4px',
                                padding: '10px',
                                marginBottom: '15px',
                                fontSize: '0.9rem',
                                color: '#e0e0e0'
                            }}>
                                <p><strong>Dica de Imagem:</strong> A proporção ideal para banners é <strong>16:9</strong> (ex: 1920x1080). Caso a imagem seja menor ou tenha outra proporção, o fundo será preenchido automaticamente com a cor do site.</p>
                            </div>

                            <form onSubmit={handleSubmit} className="product-form">
                                <div className="form-group">
                                    <label>Título</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.title}
                                        onChange={e => setFormData({ ...formData, title: e.target.value })}
                                        placeholder="Ex: Promoção de Picanha"
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Imagem do Banner</label>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                        <div style={{ position: 'relative', overflow: 'hidden', display: 'inline-block' }}>
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={handleImageChange}
                                                style={{
                                                    padding: '10px',
                                                    background: '#333',
                                                    border: '1px solid #444',
                                                    borderRadius: '4px',
                                                    width: '100%',
                                                    color: '#fff'
                                                }}
                                            />
                                        </div>
                                        {(imageFile || formData.image_url) && (
                                            <div style={{
                                                marginTop: '10px',
                                                height: '150px',
                                                background: '#000',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                border: '1px solid #444',
                                                borderRadius: '4px'
                                            }}>
                                                <img
                                                    src={imageFile ? URL.createObjectURL(imageFile) : getImageUrl(formData.image_url)}
                                                    alt="Preview"
                                                    style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }}
                                                />
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label>Link (Opcional)</label>
                                    <input
                                        type="text"
                                        value={formData.link}
                                        onChange={e => setFormData({ ...formData, link: e.target.value })}
                                        placeholder="Ex: /promocoes"
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Vincular Produto (Opcional)</label>
                                    <select
                                        value={formData.product_id}
                                        onChange={e => setFormData({ ...formData, product_id: e.target.value })}
                                        style={{ width: '100%', padding: '0.8rem', background: '#333', border: '1px solid #444', color: 'white', borderRadius: '4px' }}
                                    >
                                        <option value="">-- Selecione um produto --</option>
                                        {products.map(p => (
                                            <option key={p.id} value={p.id}>{p.title}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="form-row" style={{ display: 'flex', gap: '20px' }}>
                                    <div className="form-group" style={{ flex: 1 }}>
                                        <label>Ordem</label>
                                        <input
                                            type="number"
                                            value={formData.display_order}
                                            onChange={e => setFormData({ ...formData, display_order: e.target.value })}
                                        />
                                    </div>
                                    <div className="form-group" style={{ flex: 1 }}>
                                        <label>Duração (seg)</label>
                                        <input
                                            type="number"
                                            min="1"
                                            value={formData.duration}
                                            onChange={e => setFormData({ ...formData, duration: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="form-group" style={{ display: 'flex', alignItems: 'center', marginTop: '10px' }}>
                                    <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', gap: '10px' }}>
                                        <input
                                            type="checkbox"
                                            checked={formData.active}
                                            onChange={e => setFormData({ ...formData, active: e.target.checked })}
                                        />
                                        Ativo
                                    </label>
                                </div>

                                <button type="submit" className="save-btn" disabled={isSaving}>
                                    {isSaving ? (
                                        <>
                                            <Loader2 className="animate-spin" size={20} />
                                            <span>Salvando...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Save size={20} />
                                            <span>{editingBanner ? 'Salvar Alterações' : 'Criar Banner'}</span>
                                        </>
                                    )}
                                </button>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminBanners;
