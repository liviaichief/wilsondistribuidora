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
    const [filters, setFilters] = useState({
        sku: '',
        title: '',
        category: ''
    });

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
        const matchSku = (product.product_sku || '').toLowerCase().includes(filters.sku.toLowerCase());
        const matchTitle = (product.title || '').toLowerCase().includes(filters.title.toLowerCase());
        // Handle category being a string (most likely)
        const matchCategory = filters.category === '' || (product.category || '').toLowerCase() === filters.category.toLowerCase();

        return matchSku && matchTitle && matchCategory;
    });

    // Unique categories for filter dropdown
    const categories = ['carne', 'frango', 'embutidos', 'acompanhamentos', 'acessorios', 'insumos'];

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
                    ) : (
                        <>
                            {/* Filter Bar (Integrated into Table Headers roughly, but nicer above) - Let's do inside headers as per plan */}

                            {products.length === 0 ? (
                                <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>
                                    <h3>Nenhum produto encontrado.</h3>
                                    <p>Comece adicionando itens ao seu cardápio.</p>
                                    <button onClick={openNewModal} className="add-btn" style={{ margin: '20px auto' }}>
                                        <Plus size={20} /> Adicionar Primeiro Produto
                                    </button>
                                </div>
                            ) : (
                                <table className="products-table">
                                    <thead>
                                        <tr>
                                            <th>Imagem</th>
                                            <th>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                                    <span>SKU</span>
                                                    <div className="filter-input-wrapper">
                                                        <Search size={12} className="filter-icon" />
                                                        <input
                                                            type="text"
                                                            placeholder="Filtrar SKU"
                                                            value={filters.sku}
                                                            onChange={e => setFilters({ ...filters, sku: e.target.value })}
                                                            className="filter-input"
                                                        />
                                                    </div>
                                                </div>
                                            </th>
                                            <th>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                                    <span>Título</span>
                                                    <div className="filter-input-wrapper">
                                                        <Search size={12} className="filter-icon" />
                                                        <input
                                                            type="text"
                                                            placeholder="Filtrar Nome"
                                                            value={filters.title}
                                                            onChange={e => setFilters({ ...filters, title: e.target.value })}
                                                            className="filter-input"
                                                        />
                                                    </div>
                                                </div>
                                            </th>
                                            <th>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                                    <span>Categoria</span>
                                                    <select
                                                        value={filters.category}
                                                        onChange={e => setFilters({ ...filters, category: e.target.value })}
                                                        className="filter-select"
                                                    >
                                                        <option value="">Todas</option>
                                                        {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                                                    </select>
                                                </div>
                                            </th>
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
                            )}
                        </>
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

                                                // Get View URL (public)
                                                // Using project/bucket/files/id/view
                                                // Or use storage.getFileView(BUCKET_ID, result.$id)

                                                // Construct URL manually to be safe or use getFileView if it returns URL object
                                                // storage.getFileView returns URL string in new SDK versions? or just the path?
                                                // Let's use getFileView
                                                const url = storage.getFileView(BUCKET_ID, result.$id);

                                                setCurrentProduct({ ...currentProduct, image: url.href || url }); // SDK might return URL object
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
