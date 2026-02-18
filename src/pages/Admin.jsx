import React, { useState, useEffect } from 'react';
import { getProducts, saveProduct, deleteProduct } from '../services/dataService';
import { storage, BUCKET_ID } from '../lib/appwrite';
import { ID } from 'appwrite';
import { Plus, Edit2, Trash2, X, Image as ImageIcon, ShoppingBag, Search, Filter } from 'lucide-react';
import { getImageUrl } from '../lib/imageUtils';
import AdminBanners from './AdminBanners';
import { useAlert } from '../context/AlertContext'; // Import useAlert
import './Admin.css';

const Admin = () => {
    const [activeTab, setActiveTab] = useState('products');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [products, setProducts] = useState([]);

    const { showAlert, showConfirm } = useAlert(); // Hook usage

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
        promo_price: ''
    });

    const [editingPromoId, setEditingPromoId] = useState(null);
    const [tempPromoPrice, setTempPromoPrice] = useState('');

    useEffect(() => {
        if (activeTab === 'products') {
            loadProducts();
        }
    }, [activeTab]);

    const loadProducts = async () => {
        setLoading(true);
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
        try {
            await saveProduct(currentProduct);
            setIsModalOpen(false);
            loadProducts();
            showAlert('Produto salvo com sucesso.', 'success', 'Sucesso!');
        } catch (err) {
            showAlert(err.message, 'error', 'Erro ao salvar');
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
            promo_price: ''
        });
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
            loadProducts();
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
            loadProducts();
            showAlert('Preço promocional atualizado!', 'success');
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
            </div>

            {activeTab === 'banners' ? (
                <AdminBanners />
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
                                        <th>Promoção</th>
                                        <th>Ações</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredProducts.length > 0 ? (
                                        filteredProducts.map((item) => (
                                            <tr key={item.id}>
                                                <td>
                                                    {item.image ? (
                                                        <img src={getImageUrl(item.image)} alt={item.title} className="thumb-img" />
                                                    ) : (
                                                        <div className="thumb-img" style={{ background: '#222', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>📷</div>
                                                    )}
                                                </td>
                                                <td style={{ fontSize: '0.8rem', color: '#888' }}>{item.product_sku || '-'}</td>
                                                <td>{item.title}</td>
                                                <td><span className="badge">{item.category}</span></td>
                                                <td>R$ {parseFloat(item.price || 0).toFixed(2)}</td>
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
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                                                <input
                                                                    type="number"
                                                                    step="0.01"
                                                                    value={editingPromoId === item.id ? tempPromoPrice : (item.promo_price || '')}
                                                                    onChange={(e) => {
                                                                        setEditingPromoId(item.id);
                                                                        setTempPromoPrice(e.target.value);
                                                                    }}
                                                                    style={{ width: '80px', padding: '4px', fontSize: '0.9rem' }}
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
                                    accept="image/png, image/jpeg, image/jpg"
                                    onChange={async (e) => {
                                        const file = e.target.files[0];
                                        if (file) {
                                            try {
                                                const validTypes = ['image/jpeg', 'image/png', 'image/jpg'];
                                                if (!validTypes.includes(file.type)) throw new Error('Apenas JPG/PNG.');

                                                const result = await storage.createFile(
                                                    BUCKET_ID,
                                                    ID.unique(),
                                                    file
                                                );

                                                // Store the File ID, not the URL.
                                                // getImageUrl() in ProductCard and Admin will handle this ID correctly.
                                                setCurrentProduct({ ...currentProduct, image: result.$id });
                                            } catch (err) {
                                                showAlert('Erro no upload: ' + err.message, 'error');
                                                console.error(err);
                                            }
                                        }
                                    }}
                                />
                                {currentProduct.image && (
                                    <img src={getImageUrl(currentProduct.image)} alt="Preview" style={{ marginTop: '10px', maxHeight: '100px', borderRadius: '4px' }} />
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

                            <button type="submit" className="save-btn" style={{ width: '100%', justifyContent: 'center', marginTop: '20px' }}>
                                Salvar Produto
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Admin;
