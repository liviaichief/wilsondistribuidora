import React, { useEffect, useState } from 'react';
import { useAlert } from '../context/AlertContext';
import { databases, DATABASE_ID, COLLECTIONS, client } from '../lib/appwrite';
import { ID, Query } from 'appwrite';
import { UserPlus, X, Trash2, Edit2, Search, ChevronLeft, ChevronRight, Shield, User } from 'lucide-react';
import './Admin.css';

const AdminUsers = () => {
    const { showAlert, showConfirm } = useAlert();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    // Tab State: 'admins' | 'customers'
    const [activeTab, setActiveTab] = useState('admins');

    // Pagination & Filter State (Only for Customers)
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const ITEMS_PER_PAGE = 30;

    // Create User Modal State
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [newUser, setNewUser] = useState({
        email: '',
        password: '',
        full_name: '',
        phone: '',
        role: 'client'
    });

    // Edit User Modal State
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [isUpdating, setIsUpdating] = useState(false);

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(search);
            setPage(1); // Reset to page 1 on search change
        }, 500);
        return () => clearTimeout(timer);
    }, [search]);

    useEffect(() => {
        loadUsers();
    }, [activeTab, page, debouncedSearch]);

    const loadUsers = async () => {
        setLoading(true);
        try {
            let queries = [];

            // Base queries
            if (activeTab === 'admins') {
                queries = [
                    Query.equal('role', ['admin', 'owner']),
                    Query.orderDesc('$createdAt')
                ];
            } else {
                queries = [
                    Query.equal('role', 'client'),
                    Query.orderDesc('$createdAt')
                ];
            }

            // If searching, we fetch MORE items (up to a limit) and filter client-side
            // to avoid "missing index" errors from Appwrite.
            if (activeTab === 'customers' && debouncedSearch) {
                queries.push(Query.limit(100)); // Fetch up to 100 customers to search
            } else {
                // Determine pagination only if NOT searching (or if we trust DB pagination)
                // Actually, if we are NOT searching, we use efficient DB pagination
                if (activeTab === 'customers') {
                    queries.push(Query.limit(ITEMS_PER_PAGE));
                    queries.push(Query.offset((page - 1) * ITEMS_PER_PAGE));
                }
            }

            const response = await databases.listDocuments(
                DATABASE_ID,
                COLLECTIONS.PROFILES,
                queries
            );

            // Map Appwrite docs to flat structure
            let mappedUsers = response.documents.map(doc => ({
                ...doc,
                id: doc.$id
            }));

            // Client-side filtering if searching
            if (activeTab === 'customers' && debouncedSearch) {
                const term = debouncedSearch.toLowerCase();
                mappedUsers = mappedUsers.filter(u =>
                    (u.full_name && u.full_name.toLowerCase().includes(term)) ||
                    (u.email && u.email.toLowerCase().includes(term))
                );

                // Client-side Pagination for search results
                setTotalPages(Math.ceil(mappedUsers.length / ITEMS_PER_PAGE));
                const start = (page - 1) * ITEMS_PER_PAGE;
                mappedUsers = mappedUsers.slice(start, start + ITEMS_PER_PAGE);
            } else if (activeTab === 'customers') {
                // Server-side pagination total
                setTotalPages(Math.ceil(response.total / ITEMS_PER_PAGE));
            }

            setUsers(mappedUsers);

        } catch (error) {
            console.error('Error fetching users:', error);
            showAlert('Erro ao carregar usuários: ' + error.message, 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateUser = async (e) => {
        e.preventDefault();
        setIsCreating(true);

        try {
            // Check for API Key for "Admin Mode"
            const apiKey = import.meta.env.VITE_APPWRITE_API_KEY;
            let authId = ID.unique();

            if (apiKey) {
                try {
                    const res = await fetch(`${client.config.endpoint}/users`, {
                        method: 'POST',
                        headers: {
                            'X-Appwrite-Project': client.config.project,
                            'X-Appwrite-Key': apiKey,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            userId: authId,
                            email: newUser.email,
                            password: newUser.password,
                            name: newUser.full_name
                        })
                    });
                    if (!res.ok) {
                        const err = await res.json();
                        throw new Error(err.message || 'Falha ao criar usuário Auth');
                    }
                    const data = await res.json();
                    authId = data.$id;

                    // [NEW] Sync Label
                    if (newUser.role === 'admin' || newUser.role === 'owner') {
                        await fetch(`${client.config.endpoint}/users/${authId}/labels`, {
                            method: 'PUT',
                            headers: {
                                'X-Appwrite-Project': client.config.project,
                                'X-Appwrite-Key': apiKey,
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({ labels: ['admin'] })
                        });
                    }
                } catch (apiErr) {
                    console.error("Auth creation/label failed:", apiErr);
                    throw apiErr;
                }
            } else {
                showAlert("⚠️ Sem API Key configurada. O usuário não poderá fazer login até se registrar manualmente.", "warning");
            }

            // Create Profile
            await databases.createDocument(
                DATABASE_ID,
                COLLECTIONS.PROFILES,
                authId,
                {
                    email: newUser.email,
                    full_name: newUser.full_name,
                    first_name: (newUser.full_name || '').split(' ')[0] || '',
                    last_name: (newUser.full_name || '').split(' ').slice(1).join(' ') || '',
                    phone: newUser.phone,
                    user_id: authId,
                    role: newUser.role
                }
            );

            showAlert('Usuário criado com sucesso!', 'success');
            setIsCreateModalOpen(false);
            setNewUser({ email: '', password: '', full_name: '', phone: '', role: 'client' });
            loadUsers();

        } catch (error) {
            console.error('Create user error:', error);
            showAlert('Erro ao criar usuário: ' + error.message, 'error');
        } finally {
            setIsCreating(false);
        }
    };

    const handleDeleteUser = async (userId) => {
        showConfirm(
            "Tem certeza? Isso excluirá o PERFIL permanentemente.",
            async () => {
                try {
                    const apiKey = import.meta.env.VITE_APPWRITE_API_KEY;
                    if (apiKey) {
                        try {
                            await fetch(`${client.config.endpoint}/users/${userId}`, {
                                method: 'DELETE',
                                headers: {
                                    'X-Appwrite-Project': client.config.project,
                                    'X-Appwrite-Key': apiKey
                                }
                            });
                        } catch (e) { console.warn("Could not delete from auth", e); }
                    }

                    await databases.deleteDocument(
                        DATABASE_ID,
                        COLLECTIONS.PROFILES,
                        userId
                    );
                    showAlert("Usuário excluído com sucesso.", 'success');
                    loadUsers();
                } catch (error) {
                    console.error("Delete error:", error);
                    showAlert("Erro ao excluir: " + error.message, 'error');
                }
            }
        );
    };

    const handleUpdateUser = async (e) => {
        e.preventDefault();
        setIsUpdating(true);
        try {
            await databases.updateDocument(
                DATABASE_ID,
                COLLECTIONS.PROFILES,
                editingUser.id,
                {
                    full_name: editingUser.full_name,
                    first_name: (editingUser.full_name || '').split(' ')[0] || '',
                    last_name: (editingUser.full_name || '').split(' ').slice(1).join(' ') || '',
                    phone: editingUser.phone,
                    role: editingUser.role
                }
            );

            // [NEW] Sync Auth Labels
            const apiKey = import.meta.env.VITE_APPWRITE_API_KEY;
            if (apiKey) {
                try {
                    const labels = (editingUser.role === 'admin' || editingUser.role === 'owner') ? ['admin'] : [];
                    await fetch(`${client.config.endpoint}/users/${editingUser.id}/labels`, {
                        method: 'PUT',
                        headers: {
                            'X-Appwrite-Project': client.config.project,
                            'X-Appwrite-Key': apiKey,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ labels })
                    });
                    console.log(`Auth labels synced for ${editingUser.email}:`, labels);
                } catch (apiErr) {
                    console.error("Failed to sync labels:", apiErr);
                }
            }
            showAlert("Dados atualizados com sucesso!", 'success');
            setIsEditModalOpen(false);
            loadUsers();
        } catch (error) {
            console.error("Update error:", error);
            showAlert("Erro ao atualizar: " + error.message, 'error');
        } finally {
            setIsUpdating(false);
        }
    };

    const openEditModal = (user) => {
        setEditingUser({
            id: user.id,
            email: user.email,
            full_name: user.full_name,
            phone: user.phone,
            role: user.role
        });
        setIsEditModalOpen(true);
    };

    return (
        <div className="admin-container">
            <div className="admin-content-inner">
                <div className="admin-section-header">
                    <div>
                        <h2>Gestão de Usuários</h2>
                        <p className="section-subtitle">Gerencie perfis e acessos do sistema.</p>
                    </div>
                    <button onClick={() => setIsCreateModalOpen(true)} className="add-btn">
                        <UserPlus size={20} /> <span className="add-text">Novo Usuário</span>
                    </button>
                </div>

                {/* Tabs */}
                <div className="tabs-container">
                    <button
                        onClick={() => setActiveTab('admins')}
                        className={`tab-underlined ${activeTab === 'admins' ? 'active' : ''}`}
                    >
                        <Shield size={18} /> Administration
                    </button>
                    <button
                        onClick={() => setActiveTab('customers')}
                        className={`tab-underlined ${activeTab === 'customers' ? 'active' : ''}`}
                    >
                        <User size={18} /> Clientes
                    </button>
                </div>

                {/* Filters (Only for Customers) */}
                {activeTab === 'customers' && (
                    <div className="filters-bar">
                        <div className="search-input-wrapper">
                            <Search size={18} className="search-icon" />
                            <input
                                type="text"
                                placeholder="Buscar por nome..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="filter-input-main"
                            />
                        </div>
                    </div>
                )}

                {loading ? (
                    <p style={{ textAlign: 'center', padding: '40px' }}>Carregando usuários...</p>
                ) : users.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px', color: '#888' }}>
                        <p>{activeTab === 'admins' ? 'Nenhum administrador encontrado.' : 'Nenhum cliente encontrado.'}</p>
                    </div>
                ) : (
                    <>
                        <div style={{ overflowX: 'auto' }}>
                            <table className="products-table">
                                <thead>
                                    <tr>
                                        <th>Usuário</th>
                                        <th>Role</th>
                                        <th>Criado em</th>
                                        <th style={{ textAlign: 'right' }}>Ações</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {users.map((user) => (
                                        <tr key={user.id}>
                                            <td>
                                                <div style={{ fontWeight: 'bold', color: '#e0e0e0' }}>{user.full_name || 'Sem nome'}</div>
                                                <div style={{ fontSize: '0.9rem', color: '#888' }}>{user.email}</div>
                                                {user.phone && <div style={{ fontSize: '0.8rem', color: '#666' }}>{user.phone}</div>}
                                            </td>
                                            <td>
                                                <span style={{
                                                    padding: '4px 8px',
                                                    borderRadius: '4px',
                                                    fontSize: '0.75rem',
                                                    fontWeight: '600',
                                                    backgroundColor: ['admin', 'owner'].includes(user.role) ? 'rgba(212, 175, 55, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                                                    color: ['admin', 'owner'].includes(user.role) ? '#D4AF37' : '#aaa',
                                                    border: ['admin', 'owner'].includes(user.role) ? '1px solid rgba(212, 175, 55, 0.3)' : '1px solid #444'
                                                }}>
                                                    {user.role ? user.role.toUpperCase() : 'CLIENT'}
                                                </span>
                                            </td>
                                            <td style={{ color: '#888' }}>
                                                {new Date(user.$createdAt).toLocaleDateString()}
                                            </td>
                                            <td style={{ textAlign: 'right' }}>
                                                <div className="actions" style={{ justifyContent: 'flex-end' }}>
                                                    <button onClick={() => openEditModal(user)} className="icon-btn" title="Editar">
                                                        <Edit2 size={18} />
                                                    </button>
                                                    <button onClick={() => handleDeleteUser(user.id)} className="icon-btn delete" title="Excluir">
                                                        <Trash2 size={18} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination (Only for Customers) */}
                        {activeTab === 'customers' && totalPages > 1 && (
                            <div className="pagination" style={{ display: 'flex', justifyContent: 'center', marginTop: '20px', gap: '10px' }}>
                                <button
                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                    disabled={page === 1}
                                    style={{
                                        padding: '8px 12px',
                                        background: page === 1 ? '#222' : '#333',
                                        border: 'none',
                                        borderRadius: '4px',
                                        color: page === 1 ? '#555' : '#fff',
                                        cursor: page === 1 ? 'not-allowed' : 'pointer',
                                        display: 'flex',
                                        alignItems: 'center'
                                    }}
                                >
                                    <ChevronLeft size={16} /> Anterior
                                </button>
                                <span style={{ display: 'flex', alignItems: 'center', color: '#888' }}>
                                    Página {page} de {totalPages}
                                </span>
                                <button
                                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                    disabled={page === totalPages}
                                    style={{
                                        padding: '8px 12px',
                                        background: page === totalPages ? '#222' : '#333',
                                        border: 'none',
                                        borderRadius: '4px',
                                        color: page === totalPages ? '#555' : '#fff',
                                        cursor: page === totalPages ? 'not-allowed' : 'pointer',
                                        display: 'flex',
                                        alignItems: 'center'
                                    }}
                                >
                                    Próxima <ChevronRight size={16} />
                                </button>
                            </div>
                        )}
                    </>
                )}

                {/* Create Modal */}
                {isCreateModalOpen && (
                    <div className="modal-overlay">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h2>Novo Usuário</h2>
                                <button className="close-btn" onClick={() => setIsCreateModalOpen(false)}>
                                    <X size={24} />
                                </button>
                            </div>
                            <form onSubmit={handleCreateUser} className="product-form">
                                <div className="form-group">
                                    <label>Nome Completo</label>
                                    <input type="text" required
                                        value={newUser.full_name} onChange={e => setNewUser({ ...newUser, full_name: e.target.value })}
                                        placeholder="Ex: João Silva" />
                                </div>
                                <div className="form-group">
                                    <label>Email</label>
                                    <input type="email" required
                                        value={newUser.email} onChange={e => setNewUser({ ...newUser, email: e.target.value })}
                                        placeholder="email@exemplo.com" />
                                </div>
                                <div className="form-group">
                                    <label>Senha</label>
                                    <input type="password" required
                                        value={newUser.password} onChange={e => setNewUser({ ...newUser, password: e.target.value })}
                                        placeholder="******" />
                                </div>
                                <div className="form-group">
                                    <label>Telefone</label>
                                    <input type="text"
                                        value={newUser.phone} onChange={e => setNewUser({ ...newUser, phone: e.target.value })}
                                        placeholder="(11) 99999-9999" />
                                </div>
                                <div className="form-group">
                                    <label>Perfil de Acesso</label>
                                    <select
                                        value={newUser.role} onChange={e => setNewUser({ ...newUser, role: e.target.value })}
                                        style={{ width: '100%', padding: '0.8rem', background: '#121212', border: '1px solid #444', color: 'white', borderRadius: '4px' }}>
                                        <option value="client">Cliente</option>
                                        <option value="owner">Proprietário</option>
                                        <option value="admin">Administrador</option>
                                    </select>
                                </div>
                                <button type="submit" className="save-btn" disabled={isCreating} style={{ justifyContent: 'center', width: '100%' }}>
                                    {isCreating ? 'Criando...' : 'Criar Usuário'}
                                </button>
                            </form>
                        </div>
                    </div>
                )}

                {/* Edit Modal */}
                {isEditModalOpen && editingUser && (
                    <div className="modal-overlay">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h2>Editar Usuário</h2>
                                <button className="close-btn" onClick={() => setIsEditModalOpen(false)}>
                                    <X size={24} />
                                </button>
                            </div>
                            <form onSubmit={handleUpdateUser} className="product-form">
                                <div className="form-group">
                                    <label>Email (Somente Leitura)</label>
                                    <input type="email" disabled style={{ backgroundColor: '#1a1a1a', cursor: 'not-allowed', color: '#666' }}
                                        value={editingUser.email} />
                                </div>
                                <div className="form-group">
                                    <label>Nome Completo</label>
                                    <input type="text" required
                                        value={editingUser.full_name} onChange={e => setEditingUser({ ...editingUser, full_name: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label>Telefone</label>
                                    <input type="text"
                                        value={editingUser.phone} onChange={e => setEditingUser({ ...editingUser, phone: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label>Perfil de Acesso</label>
                                    <select
                                        value={editingUser.role} onChange={e => setEditingUser({ ...editingUser, role: e.target.value })}
                                        style={{ width: '100%', padding: '0.8rem', background: '#121212', border: '1px solid #444', color: 'white', borderRadius: '4px' }}>
                                        <option value="client">Cliente</option>
                                        <option value="owner">Proprietário</option>
                                        <option value="admin">Administrador</option>
                                    </select>
                                </div>
                                <button type="submit" className="save-btn" disabled={isUpdating} style={{ justifyContent: 'center', width: '100%' }}>
                                    {isUpdating ? 'Salvando...' : 'Salvar Alterações'}
                                </button>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminUsers;
