import React, { useState, useEffect } from 'react';
import { getProducts, saveProduct, deleteProduct, getSettings, updateSettings, getCategories } from '../services/dataService';
import { storage, BUCKET_ID } from '../lib/appwrite';
import { ID, Permission, Role } from 'appwrite';
import { Plus, Edit2, Trash2, X, Image as ImageIcon, ShoppingBag, Search, Filter, ClipboardList, Settings, CheckCircle, Save, Loader2 } from 'lucide-react';
import { getImageUrl } from '../lib/imageUtils';
import AdminBanners from './AdminBanners';
import AdminOrders from './AdminOrders';
import { useAlert } from '../context/AlertContext';
import imageCompression from 'browser-image-compression';
import './Admin.css';

const Admin = () => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [products, setProducts] = useState([]);
    const [settingsData, setSettingsData] = useState({ whatsapp_number: '' });
    const [isSaving, setIsSaving] = useState(false);
    const [isUploadingImage, setIsUploadingImage] = useState(false);
    const [previewUrl, setPreviewUrl] = useState('');

    const { showAlert, showConfirm } = useAlert();
    const [categories, setCategories] = useState([]);

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
        category: '',
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
        loadProducts();
        loadCategories();
    }, []);

    const loadCategories = async () => {
        try {
            const data = await getCategories();
            setCategories(data);
            if (data.length > 0 && !currentProduct.category) {
                setCurrentProduct(prev => ({ ...prev, category: data[0].id }));
            }
        } catch (e) {
            console.error("Admin: Error loading categories:", e);
        }
    };

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

    const handleDelete = async (product) => {
        showConfirm(
            'Tem certeza que deseja excluir este produto?',
            async () => {
                try {
                    // First delete the file if it exists
                    if (product.image) {
                        try {
                            await storage.deleteFile(BUCKET_ID, product.image);
                        } catch (e) {
                            console.warn('Failed to delete product image:', e);
                        }
                    }
                    
                    // Then delete the document
                    await deleteProduct(product.id || product.$id);
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
            category: categories.length > 0 ? categories[0].id : '',
            image: '',
            uom: 'KG',
            is_promotion: false,
            promo_price: '',
            active: true,
            manage_stock: false,
            stock_quantity: 0,
            allow_backorder: false
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
        const matchSku = (product.sku || '').toLowerCase().includes(skuFilter.toLowerCase());
        const matchTitle = (product.title || '').toLowerCase().includes(titleFilter.toLowerCase());
        const matchCategory = categoryFilter === 'all' || (product.category || '').toLowerCase() === categoryFilter.toLowerCase();

        return matchSku && matchTitle && matchCategory;
    });

    return (
        <>
            {/* Removed NotificationModal component */}

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
                            {categories.map(cat => (
                                <option key={cat.id} value={cat.id}>{cat.name}</option>
                            ))}
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
                                        <th style={{ textAlign: 'center' }}>Estoque</th>
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
                                                <td style={{ fontSize: '0.8rem', color: '#888' }}>{item.sku || '-'}</td>
                                                <td>{item.title}</td>
                                                <td><span className="badge">{item.category}</span></td>
                                                <td>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(parseFloat(item.price || 0))}</td>
                                                <td>
                                                    <div style={{ display: 'flex', alignItems: 'center', minHeight: '42px' }}>
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
                                                    </div>
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
                                                                <span style={{ fontSize: '0.7rem', color: '#fff', fontWeight: 'bold' }}>EDITAR VALOR:</span>
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                                                    <div style={{
                                                                        display: 'flex',
                                                                        alignItems: 'center',
                                                                        backgroundColor: '#1a1a1a',
                                                                        border: '1px solid #333',
                                                                        borderRadius: '4px',
                                                                        padding: '0 8px'
                                                                    }}>
                                                                        <span style={{ color: '#888', fontSize: '0.8rem', marginRight: '4px' }}>R$</span>
                                                                        <input
                                                                            type="number"
                                                                            step="0.01"
                                                                            value={editingPromoId === item.id ? tempPromoPrice : (item.promo_price || '')}
                                                                            onChange={(e) => {
                                                                                setEditingPromoId(item.id);
                                                                                setTempPromoPrice(e.target.value);
                                                                            }}
                                                                            style={{
                                                                                width: '70px',
                                                                                padding: '4px 0',
                                                                                fontSize: '0.9rem',
                                                                                backgroundColor: 'transparent',
                                                                                border: 'none',
                                                                                color: '#fff',
                                                                                outline: 'none'
                                                                            }}
                                                                            placeholder="Valor"
                                                                        />
                                                                    </div>
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
                                                <td style={{ textAlign: 'center' }}>
                                                    {item.manage_stock ? (
                                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '2px' }}>
                                                            <span style={{ 
                                                                fontWeight: 'bold', 
                                                                color: item.stock_quantity > 0 ? '#4ade80' : '#f87171',
                                                                fontSize: '1rem' 
                                                            }}>
                                                                {item.stock_quantity}
                                                            </span>
                                                        </div>
                                                    ) : (
                                                        <span style={{ color: '#aaa', fontSize: '1.2rem'}} title="Estoque Infinito">∞</span>
                                                    )}
                                                </td>
                                                <td>
                                                    <div className="actions">
                                                        <button className="icon-btn edit" onClick={() => handleEdit(item)} title="Editar Produto">
                                                            <Edit2 size={18} />
                                                        </button>
                                                        <button 
                                                            className="icon-btn" 
                                                            onClick={(e) => { 
                                                                e.stopPropagation(); 
                                                                handleEdit(item); 
                                                            }} 
                                                            title="Regras de Estoque"
                                                            style={{ border: '1px solid #333', background: 'transparent' }}
                                                        >
                                                            <Settings size={18} style={{ color: '#22d3ee' }} />
                                                        </button>
                                                        <button className="icon-btn delete" onClick={(e) => { e.stopPropagation(); handleDelete(item); }} title="Excluir">
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
                                <label>Imagem do Produto</label>
                                <label className="custom-file-upload">
                                    <ImageIcon size={32} color="#a855f7" />
                                    <span style={{ color: '#fff', fontSize: '1rem', fontWeight: 600 }}>Escolher Imagem</span>
                                    <span style={{ color: '#666', fontSize: '0.8rem' }}>PNG, JPG ou WEBP (Max 800px)</span>
                                    <input
                                        type="file"
                                        accept="image/png, image/jpeg, image/jpg, image/webp"
                                        style={{ display: 'none' }}
                                        onChange={async (e) => {
                                            const file = e.target.files[0];
                                            if (file) {
                                                setIsUploadingImage(true);
                                                try {
                                                    const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
                                                    if (!validTypes.includes(file.type)) throw new Error('Apenas JPG/PNG/WEBP.');

                                                    const localUrl = URL.createObjectURL(file);
                                                    setPreviewUrl(localUrl);

                                                    const options = {
                                                        maxSizeMB: 0.06, 
                                                        maxWidthOrHeight: 800,
                                                        useWebWorker: true,
                                                        initialQuality: 0.7
                                                    };
                                                    const compressedBlob = await imageCompression(file, options);
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

                                                    if (currentProduct.image && currentProduct.image !== result.$id) {
                                                        try {
                                                            await storage.deleteFile(BUCKET_ID, currentProduct.image);
                                                        } catch (e) {
                                                            console.warn('Failed to delete old image:', e);
                                                        }
                                                    }

                                                    setCurrentProduct(prev => ({ ...prev, image: result.$id }));
                                                } catch (err) {
                                                    showAlert('Erro no upload: ' + err.message, 'error');
                                                } finally {
                                                    setIsUploadingImage(false);
                                                }
                                            }
                                        }}
                                    />
                                </label>
                                
                                {previewUrl && (
                                    <div className="image-preview-container">
                                        <img src={previewUrl} alt="Preview" />
                                        <div className="preview-overlay">
                                            <span className="preview-badge">Visualização da Distribuidora</span>
                                            <button
                                                type="button"
                                                className="remove-image-btn"
                                                onClick={() => {
                                                    setPreviewUrl('');
                                                    setCurrentProduct(prev => ({ ...prev, image: '' }));
                                                }}
                                                title="Remover Imagem"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                <div className="form-group">
                                    <label>Categoria</label>
                                    <select
                                        value={currentProduct.category}
                                        onChange={e => setCurrentProduct({ ...currentProduct, category: e.target.value })}
                                    >
                                        {categories.map(cat => (
                                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Preço (R$)</label>
                                    <div style={{ position: 'relative' }}>
                                        <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#a855f7', fontWeight: 'bold' }}>R$</span>
                                        <input
                                            type="number"
                                            step="0.01"
                                            required
                                            value={currentProduct.price}
                                            onChange={e => setCurrentProduct({ ...currentProduct, price: e.target.value })}
                                            style={{ paddingLeft: '40px' }}
                                            placeholder="0,00"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Unidade de Medida</label>
                                <div style={{ display: 'flex', gap: '15px' }}>
                                    {['KG', 'Unidade'].map(u => (
                                        <label key={u} style={{ 
                                            flex: 1, 
                                            display: 'flex', 
                                            alignItems: 'center', 
                                            justifyContent: 'center',
                                            gap: '8px', 
                                            cursor: 'pointer',
                                            padding: '12px',
                                            background: currentProduct.uom === u || (!currentProduct.uom && u === 'KG') ? 'rgba(168, 85, 247, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                                            border: `1.5px solid ${currentProduct.uom === u || (!currentProduct.uom && u === 'KG') ? '#a855f7' : 'rgba(255, 255, 255, 0.08)'}`,
                                            borderRadius: '12px',
                                            color: '#fff',
                                            fontWeight: 600,
                                            transition: 'all 0.3s'
                                        }}>
                                            <input
                                                type="radio"
                                                name="uom"
                                                value={u}
                                                checked={currentProduct.uom === u || (!currentProduct.uom && u === 'KG')}
                                                onChange={e => setCurrentProduct({ ...currentProduct, uom: e.target.value })}
                                                style={{ display: 'none' }}
                                            />
                                            {u}
                                        </label>
                                    ))}
                                </div>
                            </div>
                            
                            {/* Stock Management Section */}
                            <div className="form-group" style={{ 
                                background: 'rgba(34, 211, 238, 0.05)', 
                                padding: '15px 20px', 
                                borderRadius: '15px', 
                                border: '1px solid rgba(34, 211, 238, 0.1)',
                                marginTop: '15px'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: currentProduct.manage_stock ? '15px' : '0' }}>
                                    <span style={{ color: '#fff', fontWeight: 600 }}>Gerenciar Estoque deste Produto?</span>
                                    <label className="switch">
                                        <input
                                            type="checkbox"
                                            checked={currentProduct.manage_stock}
                                            onChange={e => setCurrentProduct({ ...currentProduct, manage_stock: e.target.checked })}
                                        />
                                        <span className="slider round"></span>
                                    </label>
                                </div>
                                
                                {currentProduct.manage_stock && (
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', paddingTop: '15px', borderTop: '1px solid rgba(34, 211, 238, 0.1)' }}>
                                        <div className="form-group" style={{ marginBottom: 0 }}>
                                            <label style={{ color: '#aaa', fontSize: '0.9rem' }}>Quantidade Atual</label>
                                            <input
                                                type="number"
                                                min="0"
                                                value={currentProduct.stock_quantity !== undefined ? currentProduct.stock_quantity : 0}
                                                onChange={e => setCurrentProduct({ ...currentProduct, stock_quantity: parseInt(e.target.value) || 0 })}
                                                placeholder="0"
                                                style={{ border: '1px solid rgba(34, 211, 238, 0.3)' }}
                                            />
                                        </div>
                                        <div className="form-group" style={{ marginBottom: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                                <label style={{ marginBottom: 0, color: '#aaa', fontSize: '0.9rem', cursor: 'pointer' }} htmlFor="allow_backorder">
                                                    Vender sem estoque?
                                                </label>
                                                <input
                                                    id="allow_backorder"
                                                    type="checkbox"
                                                    checked={currentProduct.allow_backorder}
                                                    onChange={e => setCurrentProduct({ ...currentProduct, allow_backorder: e.target.checked })}
                                                    style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                                                />
                                            </div>
                                            <small style={{ color: '#666', fontSize: '0.75rem', marginTop: '5px' }}>
                                                (Se marcado, cliente pode comprar mesmo se a quantidade for 0)
                                            </small>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="form-group" style={{ 
                                background: 'rgba(168, 85, 247, 0.05)', 
                                padding: '15px 20px', 
                                borderRadius: '15px', 
                                border: '1px solid rgba(168, 85, 247, 0.1)',
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'space-between',
                                marginTop: '10px' 
                            }}>
                                <span style={{ color: '#fff', fontWeight: 600 }}>Cofigurações de Promoção</span>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <label className="switch">
                                        <input
                                            type="checkbox"
                                            checked={currentProduct.is_promotion}
                                            onChange={e => setCurrentProduct({ ...currentProduct, is_promotion: e.target.checked })}
                                        />
                                        <span className="slider round"></span>
                                    </label>
                                </div>
                            </div>

                            {currentProduct.is_promotion && (
                                <div className="form-group" style={{ marginTop: '15px' }}>
                                    <label>Preço Promocional (R$)</label>
                                    <div style={{ position: 'relative' }}>
                                        <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#10b981', fontWeight: 'bold' }}>R$</span>
                                        <input
                                            type="number"
                                            step="0.01"
                                            required={currentProduct.is_promotion}
                                            value={currentProduct.promo_price}
                                            onChange={e => setCurrentProduct({ ...currentProduct, promo_price: e.target.value })}
                                            placeholder="0,00"
                                            style={{ paddingLeft: '40px', borderColor: 'rgba(16, 185, 129, 0.3)' }}
                                        />
                                    </div>
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
        </>
    );
};

export default Admin;
