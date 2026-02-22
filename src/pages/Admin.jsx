import React, { useState, useEffect } from 'react';
import { getProducts, saveProduct, deleteProduct, getSettings, updateSettings } from '../services/dataService';
import { storage, BUCKET_ID } from '../lib/appwrite';
import { ID, Permission, Role } from 'appwrite';
import { Plus, Edit2, Trash2, X, Image as ImageIcon, ShoppingBag, Search, Filter, ClipboardList, Settings, CheckCircle, Save, Loader2 } from 'lucide-react';
import { getImageUrl } from '../lib/imageUtils';
import AdminBanners from './AdminBanners';
import AdminOrders from './AdminOrders';
import AdminSettings from './AdminSettings';
import { useAlert } from '../context/AlertContext';
import imageCompression from 'browser-image-compression';
import './Admin.css';

const Admin = () => {
    const [activeTab, setActiveTab] = useState('products');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [products, setProducts] = useState([]);
    const [settingsData, setSettingsData] = useState({ whatsapp_number: '' });
    const [isSaving, setIsSaving] = useState(false);
    const [isUploadingImage, setIsUploadingImage] = useState(false);
    const [previewUrl, setPreviewUrl] = useState('');

    const { showAlert, showConfirm } = useAlert();

    // Filter State
    const [filterTitle, setFilterTitle] = useState('');
    const [filterCategory, setFilterCategory] = useState({ value: 'all', label: 'Todas' });
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [skuFilter, setSkuFilter] = useState('');
    const [titleFilter, setTitleFilter] = useState('');

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentProduct, setCurrentProduct] = useState({
        title: '',
        description: '',
        price: '',
        category: 'carne',
        image: '',
        is_promotion: false,
        promo_price: '',
        active: true
    });

    const [editingPromoId, setEditingPromoId] = useState(null);
    const [tempPromoPrice, setTempPromoPrice] = useState('');

    // Zoom Modal State
    const [zoomedImage, setZoomedImage] = useState(null);

    useEffect(() => {
        if (activeTab === 'products') {
            loadProducts();
        }
    }, [activeTab]);

    const loadProducts = async (silent = false) => {
        if (!silent) setLoading(true);
        setError(null);

        try {
            const data = await getProducts();

            if (data && data.documents) {
                setProducts(data.documents);
            } else {
                setProducts([]);
            }
        } catch (err) {
            console.error('Admin: Load error:', err);
            setError(err.message);
            showAlert('Não foi possível carregar os produtos.', 'error', 'Erro ao carregar');
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (product) => {
        setCurrentProduct(product);
        setPreviewUrl(getImageUrl(product.image));
        setIsModalOpen(true);
    };

    const handleDelete = async (id) => {
        showConfirm(
            'Tem certeza que deseja excluir este produto?',
            async () => {
                try {
                    await deleteProduct(id);
                    loadProducts();
                    showAlert('O produto foi removido com sucesso.', 'success', 'Produto excluído');
                } catch (err) {
                    showAlert(err.message, 'error', 'Erro ao excluir');
                }
            },
            'Excluir Produto',
            'Sim, Excluir',
            'Cancelar'
        );
    };

    const handleSave = async (e) => {
        e.preventDefault();
        if (isSaving) return;

        setIsSaving(true);
        try {
            await saveProduct(currentProduct);
            setIsModalOpen(false);
            setPreviewUrl('');
            loadProducts();
            showAlert('Produto salvo com sucesso.', 'success', 'Sucesso!', 1000);
        } catch (err) {
            console.error('Save error:', err);
            showAlert(err.message, 'error', 'Erro ao salvar');
        } finally {
            setIsSaving(false);
        }
    };

    const openNewModal = () => {
        setCurrentProduct({
            title: '',
            description: '',
            price: '',
            category: 'carne',
            image: '',
            uom: 'KG',
            is_promotion: false,
            promo_price: '',
            active: true
        });
        setPreviewUrl('');
        setIsModalOpen(true);
    };

    const handleTogglePromotion = async (product) => {
        const newStatus = !product.is_promotion;
        try {
            await saveProduct({
                ...product,
                is_promotion: newStatus,
                promo_price: newStatus ? (product.promo_price || product.price) : null
            });
            loadProducts(true);
            if (newStatus) {
                setEditingPromoId(product.id);
                setTempPromoPrice(product.promo_price || product.price);
            }
        } catch (err) {
            showAlert('Erro ao atualizar promoção: ' + err.message, 'error');
        }
    };

    const handleSavePromoPrice = async (product) => {
        try {
            await saveProduct({
                ...product,
                promo_price: parseFloat(tempPromoPrice)
            });
            setEditingPromoId(null);
            loadProducts(true);
            showAlert('Preço promocional atualizado!', 'success', null, 1000);
        } catch (err) {
            showAlert('Erro ao salvar preço: ' + err.message, 'error');
        }
    };

    // Filter Logic
    const filteredProducts = products.filter(product => {
        const matchSku = (product.product_sku || '').toLowerCase().includes(skuFilter.toLowerCase());
        const matchTitle = (product.title || '').toLowerCase().includes(titleFilter.toLowerCase());
        const matchCategory = categoryFilter === 'all' || (product.category || '').toLowerCase() === categoryFilter.toLowerCase();

        return matchSku && matchTitle && matchCategory;
    });

    return (
        <div className="admin-container">
            {/* Removed NotificationModal component */}

            <div className="admin-sidebar-tabs">
                <button
                    className={`tab-btn ${activeTab === 'products' ? 'active' : ''}`}
                    onClick={() => setActiveTab('products')}
                >
                    <ShoppingBag size={18} /> <span>Produtos</span>
                </button>
                <button
                    className={`tab-btn ${activeTab === 'banners' ? 'active' : ''}`}
                    onClick={() => setActiveTab('banners')}
                >
                    <ImageIcon size={18} /> <span>Banners</span>
                </button>
                <button
                    className={`tab-btn ${activeTab === 'orders' ? 'active' : ''}`}
                    onClick={() => setActiveTab('orders')}
                >
                    <ClipboardList size={18} /> <span>Pedidos</span>
                </button>
                <button
                    className={`tab-btn ${activeTab === 'settings' ? 'active' : ''}`}
                    onClick={() => setActiveTab('settings')}
                >
                    <Settings size={18} /> <span>Configurações</span>
                </button>
            </div>

            {activeTab === 'banners' ? (
                <AdminBanners />
            ) : activeTab === 'orders' ? (
                <AdminOrders />
            ) : activeTab === 'settings' ? (
                <AdminSettings />
            ) : (
                <div className="admin-content-inner">
                    <div className="admin-section-header">
                        <h2>Gerenciar Produtos</h2>
                        <button onClick={openNewModal} className="add-btn">
                            <Plus size={20} /> <span className="add-text">Novo Produto</span>
                        </button>
                    </div>

                    {/* Filters Bar */}
                    <div className="filters-bar">
                        <input
                            type="text"
                            placeholder="Filtrar por Título..."
                            value={titleFilter}
                            onChange={(e) => setTitleFilter(e.target.value)}
                            className="filter-input-main"
                        />
                        <input
                            type="text"
                            placeholder="Filtrar por SKU..."
                            value={skuFilter}
                            onChange={(e) => setSkuFilter(e.target.value)}
                            className="filter-input-main"
                        />
                        <select
                            value={categoryFilter}
                            onChange={(e) => setCategoryFilter(e.target.value)}
                            className="filter-select-main"
                        >
                            <option value="all">Todas as Categorias</option>
                            <option value="carne">Carne</option>
                            <option value="frango">Frango</option>
                            <option value="embutidos">Embutidos</option>
                            <option value="acompanhamentos">Acompanhamentos</option>
                            <option value="acessorios">Acessórios</option>
                            <option value="insumos">Insumos</option>
                            <option value="bebidas">Bebidas</option>
                        </select>
                        {/* Clear Filters Button */}
                        {(titleFilter || skuFilter || categoryFilter !== 'all') && (
                            <button
                                onClick={() => { setTitleFilter(''); setSkuFilter(''); setCategoryFilter('all'); }}
                                style={{
                                    padding: '8px 12px',
                                    borderRadius: '4px',
                                    border: '1px solid #ff4444',
                                    background: 'transparent',
                                    color: '#ff4444',
                                    cursor: 'pointer'
                                }}
                            >
                                Limpar
                            </button>
                        )}
                    </div>

                    {loading ? (
                        <div style={{ padding: '40px', textAlign: 'center', color: '#888' }}>
                            Carregando produtos...
                        </div>
                    ) : error ? (
                        <div style={{ padding: '20px', textAlign: 'center', backgroundColor: 'rgba(255,0,0,0.1)', borderRadius: '8px', color: '#ff6666' }}>
                            <h3>Erro ao carregar</h3>
                            <p>{error}</p>
                            <button onClick={loadProducts} className="icon-btn" style={{ width: 'auto', padding: '0 20px', margin: '10px auto' }}>Tentar Novamente</button>
                        </div>
                    ) : products.length === 0 ? (
                        <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>
                            <h3>Nenhum produto encontrado.</h3>
                            <p>Comece adicionando itens ao seu cardápio.</p>
                            <button onClick={openNewModal} className="add-btn" style={{ margin: '20px auto' }}>
                                <Plus size={20} /> Adicionar Primeiro Produto
                            </button>
                        </div>
                    ) : (
                        <div style={{ overflowX: 'auto' }}>
                            <table className="products-table">
                                <thead>
                                    <tr>
                                        <th>Imagem</th>
                                        <th>SKU</th>
                                        <th>Título</th>
                                        <th>Categoria</th>
                                        <th>Preço</th>
                                        <th>Ativo</th>
                                        <th>Promoção</th>
                                        <th>Ações</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredProducts.length > 0 ? (
                                        filteredProducts.map((item) => (
                                            <tr key={item.id} onDoubleClick={() => handleEdit(item)} style={{ cursor: 'pointer' }} title="Clique duas vezes para editar">
                                                <td onClick={(e) => { e.stopPropagation(); setZoomedImage(item); }}>
                                                    {item.image ? (
                                                        <img
                                                            src={getImageUrl(item.image)}
                                                            alt={item.title}
                                                            className="thumb-img"
                                                            style={{ cursor: 'zoom-in' }}
                                                        />
                                                    ) : (
                                                        <div className="thumb-img" style={{ background: '#222', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>📷</div>
                                                    )}
                                                </td>
                                                <td style={{ fontSize: '0.8rem', color: '#888' }}>{item.product_sku || '-'}</td>
                                                <td>{item.title}</td>
                                                <td><span className="badge">{item.category}</span></td>
                                                <td>R$ {parseFloat(item.price || 0).toFixed(2)}</td>
                                                <td>
                                                    <label className="switch">
                                                        <input
                                                            type="checkbox"
                                                            checked={item.active !== false}
                                                            onChange={async () => {
                                                                try {
                                                                    await saveProduct({ ...item, active: !item.active });
                                                                    loadProducts(true);
                                                                    showAlert(item.active ? 'Produto desativado' : 'Produto ativado', 'success', null, 1000);
                                                                } catch (err) {
                                                                    showAlert(err.message, 'error');
                                                                }
                                                            }}
                                                        />
                                                        <span className="slider round"></span>
                                                    </label>
                                                </td>
                                                <td>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                        <label className="switch">
                                                            <input
                                                                type="checkbox"
                                                                checked={item.is_promotion}
                                                                onChange={() => handleTogglePromotion(item)}
                                                            />
                                                            <span className="slider round"></span>
                                                        </label>
                                                        {item.is_promotion && (
                                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                                <span style={{ fontSize: '0.7rem', color: 'var(--primary-color)', fontWeight: 'bold' }}>EDITAR VALOR:</span>
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                                                    <input
                                                                        type="number"
                                                                        step="0.01"
                                                                        value={editingPromoId === item.id ? tempPromoPrice : (item.promo_price || '')}
                                                                        onChange={(e) => {
                                                                            setEditingPromoId(item.id);
                                                                            setTempPromoPrice(e.target.value);
                                                                        }}
                                                                        style={{ width: '80px', padding: '4px', fontSize: '0.9rem', backgroundColor: '#1a1a1a', border: '1px solid #333', color: '#fff', borderRadius: '4px' }}
                                                                        placeholder="Preço"
                                                                    />
                                                                    {editingPromoId === item.id && (
                                                                        <button
                                                                            onClick={() => handleSavePromoPrice(item)}
                                                                            className="icon-btn"
                                                                            style={{ width: '24px', height: '24px', background: 'var(--primary-color)', color: '#000' }}
                                                                        >
                                                                            <CheckCircle size={14} />
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                                <td>
                                                    <div className="actions">
                                                        <button className="icon-btn edit" onClick={() => handleEdit(item)} title="Editar">
                                                            <Edit2 size={18} />
                                                        </button>
                                                        <button className="icon-btn delete" onClick={() => handleDelete(item.id)} title="Excluir">
                                                            <Trash2 size={18} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
                                                Nenhum produto encontrado com os filtros atuais.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {isModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h2>{currentProduct.id ? 'Editar Produto' : 'Novo Produto'}</h2>
                            <button className="close-btn" onClick={() => setIsModalOpen(false)}>
                                <X size={24} />
                            </button>
                        </div>
                        <form onSubmit={handleSave} className="product-form">
                            <div className="form-group">
                                <label>Título</label>
                                <input
                                    required
                                    value={currentProduct.title}
                                    onChange={e => setCurrentProduct({ ...currentProduct, title: e.target.value })}
                                    placeholder="Ex: Picanha Angus"
                                />
                            </div>
                            <div className="form-group">
                                <label>Descrição</label>
                                <textarea
                                    required
                                    rows="3"
                                    value={currentProduct.description}
                                    onChange={e => setCurrentProduct({ ...currentProduct, description: e.target.value })}
                                    placeholder="Detalhes do produto..."
                                />
                            </div>
                            <div className="form-group">
                                <label>Preço (R$)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    required
                                    value={currentProduct.price}
                                    onChange={e => setCurrentProduct({ ...currentProduct, price: e.target.value })}
                                />
                            </div>
                            <div className="form-group">
                                <label>Imagem</label>
                                <input
                                    type="file"
                                    accept="image/png, image/jpeg, image/jpg, image/webp"
                                    onChange={async (e) => {
                                        const file = e.target.files[0];
                                        if (file) {
                                            setIsUploadingImage(true);
                                            try {
                                                const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
                                                if (!validTypes.includes(file.type)) throw new Error('Apenas JPG/PNG/WEBP.');

                                                // Show local preview immediately
                                                const localUrl = URL.createObjectURL(file);
                                                setPreviewUrl(localUrl);

                                                const options = {
                                                    maxSizeMB: 0.2,
                                                    maxWidthOrHeight: 1000,
                                                    useWebWorker: true,
                                                };
                                                const compressedBlob = await imageCompression(file, options);
                                                console.log(`Comprimiu imagem: ${(file.size / 1024).toFixed(0)}KB para ${(compressedBlob.size / 1024).toFixed(0)}KB`);

                                                // Appwrite requires a File object with a name in some SDK versions/environments
                                                const compressedFile = new File([compressedBlob], file.name, { type: file.type });

                                                const result = await storage.createFile(
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

                                                setCurrentProduct(prev => ({ ...prev, image: result.$id }));
                                            } catch (err) {
                                                showAlert('Erro no upload: ' + err.message, 'error');
                                                console.error(err);
                                            } finally {
                                                setIsUploadingImage(false);
                                            }
                                        }
                                    }}
                                />
                                {previewUrl && (
                                    <div style={{ marginTop: '10px', position: 'relative', display: 'inline-block' }}>
                                        <img src={previewUrl} alt="Preview" style={{ maxHeight: '150px', borderRadius: '8px', border: '1px solid #444' }} />
                                        <span style={{ position: 'absolute', bottom: '5px', left: '5px', background: 'rgba(0,0,0,0.6)', padding: '2px 6px', fontSize: '10px', borderRadius: '4px', color: 'white' }}>
                                            Preview
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setPreviewUrl('');
                                                setCurrentProduct(prev => ({ ...prev, image: '' }));
                                            }}
                                            style={{
                                                position: 'absolute',
                                                top: '5px',
                                                right: '5px',
                                                background: 'rgba(255,0,0,0.8)',
                                                border: 'none',
                                                borderRadius: '50%',
                                                width: '30px',
                                                height: '30px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                cursor: 'pointer',
                                                color: 'white',
                                                boxShadow: '0 2px 4px rgba(0,0,0,0.3)'
                                            }}
                                            title="Remover Imagem"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                )}
                            </div>
                            <div className="form-group">
                                <label>Categoria</label>
                                <select
                                    value={currentProduct.category}
                                    onChange={e => setCurrentProduct({ ...currentProduct, category: e.target.value })}
                                >
                                    <option value="carne">Carne</option>
                                    <option value="frango">Frango</option>
                                    <option value="embutidos">Embutidos</option>
                                    <option value="acompanhamentos">Acompanhamentos</option>
                                    <option value="acessorios">Acessórios</option>
                                    <option value="insumos">Insumos</option>
                                    <option value="bebidas">Bebidas</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Unidade de Medida</label>
                                <div style={{ display: 'flex', gap: '20px', padding: '10px 0' }}>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                                        <input
                                            type="radio"
                                            name="uom"
                                            value="KG"
                                            checked={currentProduct.uom === 'KG' || !currentProduct.uom}
                                            onChange={e => setCurrentProduct({ ...currentProduct, uom: e.target.value })}
                                        />
                                        KG
                                    </label>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                                        <input
                                            type="radio"
                                            name="uom"
                                            value="Unidade"
                                            checked={currentProduct.uom === 'Unidade'}
                                            onChange={e => setCurrentProduct({ ...currentProduct, uom: e.target.value })}
                                        />
                                        Unidade
                                    </label>
                                </div>
                            </div>
                            <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '10px' }}>
                                <label className="switch">
                                    <input
                                        type="checkbox"
                                        checked={currentProduct.is_promotion}
                                        onChange={e => setCurrentProduct({ ...currentProduct, is_promotion: e.target.checked })}
                                    />
                                    <span className="slider round"></span>
                                </label>
                                <span>Produto em Promoção</span>
                            </div>

                            {currentProduct.is_promotion && (
                                <div className="form-group">
                                    <label>Preço Promocional (R$)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        required={currentProduct.is_promotion}
                                        value={currentProduct.promo_price}
                                        onChange={e => setCurrentProduct({ ...currentProduct, promo_price: e.target.value })}
                                        placeholder="Ex: 79.90"
                                    />
                                </div>
                            )}

                            <button
                                type="submit"
                                className="save-btn"
                                disabled={isSaving || isUploadingImage}
                                style={{ width: '100%', justifyContent: 'center', marginTop: '20px', opacity: (isSaving || isUploadingImage) ? 0.7 : 1 }}
                            >
                                {isSaving ? (
                                    <>
                                        <Loader2 className="animate-spin" size={20} />
                                        <span>Salvando...</span>
                                    </>
                                ) : isUploadingImage ? (
                                    <>
                                        <Loader2 className="animate-spin" size={20} />
                                        <span>Enviando Imagem...</span>
                                    </>
                                ) : (
                                    <>
                                        <Save size={20} />
                                        <span>Salvar Produto</span>
                                    </>
                                )}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Image Zoom Modal */}
            {zoomedImage && (
                <div className="modal-overlay" onClick={() => setZoomedImage(null)} style={{ zIndex: 1000000 }}>
                    <div className="modal-content" onClick={e => e.stopPropagation()} style={{ background: 'transparent', border: 'none', boxShadow: 'none', maxWidth: '90vw', maxHeight: '90vh' }}>
                        <div className="modal-header" style={{ position: 'absolute', right: '-10px', top: '-10px', zIndex: 1, padding: 0 }}>
                            <button className="close-btn" onClick={() => setZoomedImage(null)} style={{ background: '#fff', color: '#000', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.5)' }}>
                                <X size={24} />
                            </button>
                        </div>
                        <img
                            src={getImageUrl(zoomedImage.image)}
                            alt={zoomedImage.title}
                            style={{
                                width: '100%',
                                height: 'auto',
                                maxHeight: '85vh',
                                objectFit: 'contain',
                                borderRadius: '8px',
                                boxShadow: '0 10px 30px rgba(0,0,0,0.8)'
                            }}
                        />
                        <div style={{ textAlign: 'center', marginTop: '15px', color: '#fff', fontSize: '1.2rem', fontWeight: 'bold', textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>
                            {zoomedImage.title}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Admin;
