import React, { useState, useEffect } from 'react';
import { getProducts, saveProduct, deleteProduct } from '../services/dataService';
import { storage, BUCKET_ID } from '../lib/appwrite';
import { ID } from 'appwrite';
import { Plus, Edit2, Trash2, X, Image as ImageIcon, ShoppingBag, Search, Filter } from 'lucide-react'; // Added icons
import { getImageUrl } from '../lib/imageUtils';
import AdminBanners from './AdminBanners';
import NotificationModal from '../components/NotificationModal'; // Import Notification
import './Admin.css';

const Admin = () => {
    const [activeTab, setActiveTab] = useState('products');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [products, setProducts] = useState([]);

    // Notification State
    const [notification, setNotification] = useState({
        isOpen: false,
        type: 'success',
        title: '',
        message: ''
    });

    const showNotification = (type, title, message) => {
        setNotification({
            isOpen: true,
            type,
            title,
            message
        });
    };

    const closeNotification = () => {
        setNotification(prev => ({ ...prev, isOpen: false }));
    };

    // Filter State
    const [filterTitle, setFilterTitle] = useState('');
    const [filterCategory, setFilterCategory] = useState({ value: 'all', label: 'Todas' }); // distinct from string to safely handle dropdown if needed, but string 'all' is fine. Let's stick to string 'all'
    // Actually simplicity:
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
        image: ''
    });

    useEffect(() => {
        if (activeTab === 'products') {
            loadProducts();
        }
    }, [activeTab]);

    const loadProducts = async () => {
        setLoading(true);
        setError(null);

        try {
            const data = await getProducts(); // Assuming getProducts handles Appwrite fetch

            if (data) {
                setProducts(data);
            } else {
                setProducts([]);
            }
        } catch (err) {
            console.error('Admin: Load error:', err);
            setError(err.message);
            showNotification('error', 'Erro ao carregar', 'Não foi possível carregar os produtos.');
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (product) => {
        setCurrentProduct(product);
        setIsModalOpen(true);
    };

    const handleDelete = async (id) => {
        if (window.confirm('Tem certeza que deseja excluir este produto?')) {
            try {
                await deleteProduct(id);
                loadProducts();
                showNotification('success', 'Produto excluído', 'O produto foi removido com sucesso.');
            } catch (err) {
                showNotification('error', 'Erro ao excluir', err.message);
            }
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            await saveProduct(currentProduct);
            setIsModalOpen(false);
            loadProducts();
            showNotification('success', 'Sucesso!', 'Produto salvo com sucesso.');
        } catch (err) {
            showNotification('error', 'Erro ao salvar', err.message);
        }
    };

    const openNewModal = () => {
        setCurrentProduct({ title: '', description: '', price: '', category: 'carne', image: '' });
        setIsModalOpen(true);
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
            <NotificationModal
                isOpen={notification.isOpen}
                onClose={closeNotification}
                type={notification.type}
                title={notification.title}
                message={notification.message}
            />

            <div className="admin-sidebar-tabs" style={{ marginBottom: '20px', display: 'flex', gap: '10px', borderBottom: '1px solid #333', paddingBottom: '10px' }}>
                <button
                    className={`tab-btn ${activeTab === 'products' ? 'active' : ''}`}
                    onClick={() => setActiveTab('products')}
                    style={{
                        background: activeTab === 'products' ? '#444' : 'transparent',
                        border: 'none',
                        color: 'white',
                        padding: '10px 20px',
                        cursor: 'pointer',
                        borderRadius: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                    }}
                >
                    <ShoppingBag size={18} /> Produtos
                </button>
                <button
                    className={`tab-btn ${activeTab === 'banners' ? 'active' : ''}`}
                    onClick={() => setActiveTab('banners')}
                    style={{
                        background: activeTab === 'banners' ? '#444' : 'transparent',
                        border: 'none',
                        color: 'white',
                        padding: '10px 20px',
                        cursor: 'pointer',
                        borderRadius: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                    }}
                >
                    <ImageIcon size={18} /> Banners
                </button>
            </div>

            {activeTab === 'banners' ? (
                <AdminBanners />
            ) : (
                <div className="admin-content">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                        <h2>Gerenciar Produtos</h2>
                        <button onClick={openNewModal} className="add-btn">
                            <Plus size={20} /> Novo Produto
                        </button>
                    </div>

                    {/* Filters Bar */}
                    <div className="filters-bar" style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
                        <input
                            type="text"
                            placeholder="Filtrar por Título..."
                            value={titleFilter}
                            onChange={(e) => setTitleFilter(e.target.value)}
                            style={{
                                padding: '8px',
                                borderRadius: '4px',
                                border: '1px solid #333',
                                background: '#121212',
                                color: '#fff',
                                flex: 1,
                                minWidth: '200px'
                            }}
                        />
                        <input
                            type="text"
                            placeholder="Filtrar por SKU..."
                            value={skuFilter}
                            onChange={(e) => setSkuFilter(e.target.value)}
                            style={{
                                padding: '8px',
                                borderRadius: '4px',
                                border: '1px solid #333',
                                background: '#121212',
                                color: '#fff',
                                flex: 1,
                                minWidth: '150px'
                            }}
                        />
                        <select
                            value={categoryFilter}
                            onChange={(e) => setCategoryFilter(e.target.value)}
                            style={{
                                padding: '8px',
                                borderRadius: '4px',
                                border: '1px solid #333',
                                background: '#121212',
                                color: '#fff',
                                minWidth: '150px'
                            }}
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

                                                const url = storage.getFileView(BUCKET_ID, result.$id);
                                                setCurrentProduct({ ...currentProduct, image: url.href || url });
                                            } catch (err) {
                                                alert('Erro no upload: ' + err.message);
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
                            <button type="submit" className="save-btn" style={{ width: '100%', justifyContent: 'center' }}>
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
