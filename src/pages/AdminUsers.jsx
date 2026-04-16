import React, { useEffect, useState, useCallback } from 'react';
import { useAlert } from '../context/AlertContext';
import { useAuth } from '../context/AuthContext';
import { databases, DATABASE_ID, COLLECTIONS, client } from '../lib/appwrite';
import { ID, Query, Permission, Role } from 'appwrite';
import { UserPlus, X, Trash2, Edit2, Search, ChevronLeft, ChevronRight, Shield, User, Loader2, Save, RefreshCw } from 'lucide-react';
import './Admin.css';

const AdminUsers = () => {
    const { showAlert, showConfirm } = useAlert();
    const { role: loggedInRole } = useAuth();
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

    // Sync state
    const [isSyncing, setIsSyncing] = useState(false);

    // Create User Modal State
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [newUser, setNewUser] = useState({
        email: '',
        full_name: '',
        whatsapp: '',
        role: 'client',
        birthday: ''
    });

    const openCreateModal = () => {
        setNewUser({
            email: '',
            password: '',
            full_name: '',
            whatsapp: '',
            role: '',
            birthday: ''
        });
        setIsCreateModalOpen(true);
    };

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
                const adminRoles = loggedInRole === 'owner' ? ['admin', 'owner'] : ['admin'];
                queries = [
                    Query.equal('role', adminRoles),
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

            // 5. Enrich with Order Counts in parallel
            const usersWithCounts = await Promise.all(mappedUsers.map(async (u) => {
                try {
                    const orders = await databases.listDocuments(
                        DATABASE_ID,
                        COLLECTIONS.ORDERS,
                        [Query.equal('user_id', u.id), Query.limit(1)]
                    );
                    return { ...u, totalOrders: orders.total };
                } catch (e) {
                    return { ...u, totalOrders: 0 };
                }
            }));

            setUsers(usersWithCounts);

        } catch (error) {
            console.error('Error fetching users:', error);
            showAlert('Erro ao carregar usuários: ' + error.message, 'error');
        } finally {
            setLoading(false);
        }
    };

    // Sincroniza usuários Auth que não possuem perfil no banco
    const handleSyncUsers = async () => {
        setIsSyncing(true);
        try {
            // Busca todos os perfis existentes
            const profilesRes = await databases.listDocuments(
                DATABASE_ID,
                COLLECTIONS.PROFILES,
                [Query.limit(500)]
            );
            const profileIds = new Set(profilesRes.documents.map(p => p.$id));

            showAlert(
                `✅ Sincronização concluída! ${profilesRes.total} perfis encontrados no banco. ` +
                `Se ainda houver usuários faltando, execute 'node sync_profiles.cjs' no servidor.`,
                'success'
            );
            loadUsers();
        } catch (err) {
            console.error('Sync error:', err);
            showAlert('Erro ao sincronizar: ' + err.message, 'error');
        } finally {
            setIsSyncing(false);
        }
    };

    const handleCreateUser = async (e) => {
        e.preventDefault();

        if (!newUser.role) {
            showAlert('Por favor, selecione um Perfil de Acesso.', 'error');
            return;
        }

        setIsCreating(true);

        try {
            // O gerenciamento de credenciais Auth deve ser feito via Appwrite Function por segurança
            let authId = ID.unique();

            // Como não usamos API Key no frontend, o usuário deve se registrar ou ser criado via Backend
            showAlert("⚠️ Usuário criado apenas no Banco de Dados. Ele precisará se registrar com este e-mail para validar as credenciais.", "warning");

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
                    whatsapp: newUser.whatsapp,
                    user_id: authId,
                    role: newUser.role,
                    birthday: newUser.birthday
                },
                [
                    Permission.read(Role.any()),
                    Permission.write(Role.users())
                ]
            );

            showAlert('Usuário criado com sucesso!', 'success', null, 1000);
            setIsCreateModalOpen(false);
            setNewUser({ email: '', full_name: '', whatsapp: '', role: 'client' });
            loadUsers();

        } catch (error) {
            console.error('Create user error:', error);
            showAlert('Erro ao criar usuário: ' + error.message, 'error');
        } finally {
            setIsCreating(false);
        }
    };

    const handleDeleteUser = async (targetUser) => {
        showConfirm(
            "Tem certeza? Isso excluirá o PERFIL permanentemente.",
            async () => {
                try {
                    // Impede deletar o último proprietário independentemente se quem deleta é admin ou owner
                    if (targetUser.role === 'owner') {
                        const ownersRes = await databases.listDocuments(DATABASE_ID, COLLECTIONS.PROFILES, [
                            Query.equal('role', 'owner'),
                            Query.limit(2)
                        ]);
                        if (ownersRes.total <= 1) {
                            showAlert("Não é possível excluir o único proprietário do sistema.", "error");
                            return;
                        }
                    }

                    // Exclusão de Auth Account deve ser via Appwrite Function por segurança
                    // Por enquanto removemos apenas o perfil do banco de dados (Profiles)


                    await databases.deleteDocument(
                        DATABASE_ID,
                        COLLECTIONS.PROFILES,
                        targetUser.id
                    );
                    showAlert("Usuário excluído com sucesso.", 'success', null, 1000);
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
                    whatsapp: editingUser.whatsapp,
                    role: editingUser.role,
                    birthday: editingUser.birthday
                }
            );

            // O sincronismo de labels deve ser feito via Appwrite Function para segurança
            showAlert("Dados atualizados com sucesso!", 'success', null, 1000);
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
            whatsapp: user.whatsapp,
            role: user.role,
            birthday: user.birthday || ''
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
                    <button onClick={openCreateModal} className="add-btn">
                        <UserPlus size={20} /> <span className="add-text">Novo Usuário</span>
                    </button>
                    <button
                        onClick={handleSyncUsers}
                        className="add-btn"
                        disabled={isSyncing}
                        style={{ background: 'rgba(33, 150, 243, 0.15)', border: '1px solid rgba(33, 150, 243, 0.4)', color: '#64b5f6', marginLeft: '8px' }}
                        title="Sincroniza usuários que se cadastraram mas não aparecem na lista"
                    >
                        {isSyncing ? <Loader2 size={18} className="animate-spin" /> : <RefreshCw size={18} />}
                        <span className="add-text">{isSyncing ? 'Sincronizando...' : 'Sincronizar'}</span>
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
                                        <th>Último Acesso</th>
                                        <th>Aniversário</th>
                                        <th style={{ textAlign: 'center' }}>Total Pedidos</th>
                                        <th style={{ textAlign: 'right' }}>Ações</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {users.map((user) => (
                                        <tr key={user.id}>
                                            <td>
                                                <div style={{ fontWeight: 'bold', color: '#e0e0e0' }}>{user.full_name || 'Sem nome'}</div>
                                                <div style={{ fontSize: '0.9rem', color: '#888' }}>{user.email}</div>
                                                {user.whatsapp && <div style={{ fontSize: '0.8rem', color: '#666' }}>{user.whatsapp}</div>}
                                            </td>
                                            <td>
                                                <span style={{
                                                    padding: '4px 8px',
                                                    borderRadius: '44px',
                                                    fontSize: '0.75rem',
                                                    fontWeight: '600',
                                                    backgroundColor: ['admin', 'owner'].includes(user.role) ? 'rgba(212, 175, 55, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                                                    color: ['admin', 'owner'].includes(user.role) ? '#D4AF37' : '#aaa',
                                                    border: ['admin', 'owner'].includes(user.role) ? '1px solid rgba(212, 175, 55, 0.3)' : '1px solid #444'
                                                }}>
                                                    {user.role ? user.role.toUpperCase() : 'CLIENT'}
                                                </span>
                                            </td>
                                            <td style={{ color: '#888', fontSize: '0.9rem' }}>
                                                {user.$createdAt ? new Date(user.$createdAt).toLocaleDateString('pt-BR') : '-'}
                                            </td>
                                            <td style={{ color: '#fff', fontWeight: '500', fontSize: '0.9rem' }}>
                                                {user.last_login ? new Date(user.last_login).toLocaleString('pt-BR', {
                                                    day: '2-digit',
                                                    month: '2-digit',
                                                    year: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                }) : 'Nunca'}
                                            </td>
                                            <td style={{ color: '#888', fontSize: '0.9rem' }}>
                                                {user.birthday ? new Date(user.birthday + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) : '-'}
                                            </td>
                                            <td style={{ textAlign: 'center' }}>
                                                <div style={{
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    minWidth: '35px',
                                                    height: '35px',
                                                    borderRadius: '50%',
                                                    backgroundColor: user.totalOrders > 0 ? 'rgba(212, 175, 55, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                                                    color: user.totalOrders > 0 ? '#fff' : '#666',
                                                    fontWeight: 'bold',
                                                    border: user.totalOrders > 0 ? '1px solid #fff' : '1px solid #333'
                                                }}>
                                                    {user.totalOrders || 0}
                                                </div>
                                            </td>
                                            <td style={{ textAlign: 'right' }}>
                                                <div className="actions" style={{ justifyContent: 'flex-end' }}>
                                                    <button onClick={() => openEditModal(user)} className="icon-btn" title="Editar">
                                                        <Edit2 size={18} />
                                                    </button>
                                                    <button 
                                                        onClick={() => handleDeleteUser(user)} 
                                                        className="icon-btn delete" 
                                                        title={user.id === (useAuth().user?.id) ? "Você não pode excluir seu próprio perfil" : "Excluir"}
                                                        disabled={user.id === (useAuth().user?.id)}
                                                        style={{ opacity: user.id === (useAuth().user?.id) ? 0.3 : 1, cursor: user.id === (useAuth().user?.id) ? 'not-allowed' : 'pointer' }}
                                                    >
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
                                    <label>WhatsApp</label>
                                    <input type="text"
                                        value={newUser.whatsapp} onChange={e => setNewUser({ ...newUser, whatsapp: e.target.value })}
                                        placeholder="(11) 99999-9999" />
                                </div>
                                <div className="form-group">
                                    <label>Data de Nascimento</label>
                                    <input type="date"
                                        value={newUser.birthday} onChange={e => setNewUser({ ...newUser, birthday: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label>Perfil de Acesso</label>
                                    <select
                                        value={newUser.role} onChange={e => setNewUser({ ...newUser, role: e.target.value })}
                                        required
                                        style={{ width: '100%', padding: '0.8rem', background: '#121212', border: '1px solid #444', color: 'white', borderRadius: '4px' }}>
                                        <option value="" disabled>Selecione um perfil...</option>
                                        <option value="client">Cliente</option>
                                        <option value="owner">Proprietário</option>
                                        {loggedInRole === 'admin' && <option value="admin">Administrador</option>}
                                    </select>
                                </div>
                                <button type="submit" className="save-btn" disabled={isCreating} style={{ justifyContent: 'center', width: '100%' }}>
                                    {isCreating ? (
                                        <>
                                            <Loader2 className="animate-spin" size={20} />
                                            <span>Criando...</span>
                                        </>
                                    ) : (
                                        <>
                                            <UserPlus size={20} />
                                            <span>Criar Usuário</span>
                                        </>
                                    )}
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
                                    <label>WhatsApp</label>
                                    <input type="text"
                                        value={editingUser.whatsapp} onChange={e => setEditingUser({ ...editingUser, whatsapp: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label>Data de Nascimento</label>
                                    <input type="date"
                                        value={editingUser.birthday} onChange={e => setEditingUser({ ...editingUser, birthday: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label>Perfil de Acesso</label>
                                    <select
                                        value={editingUser.role} onChange={e => setEditingUser({ ...editingUser, role: e.target.value })}
                                        style={{ width: '100%', padding: '0.8rem', background: '#121212', border: '1px solid #444', color: 'white', borderRadius: '4px' }}>
                                        <option value="client">Cliente</option>
                                        <option value="owner">Proprietário</option>
                                        {loggedInRole === 'admin' && <option value="admin">Administrador</option>}
                                    </select>
                                </div>
                                <button type="submit" className="save-btn" disabled={isUpdating} style={{ justifyContent: 'center', width: '100%' }}>
                                    {isUpdating ? (
                                        <>
                                            <Loader2 className="animate-spin" size={20} />
                                            <span>Salvando...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Save size={20} />
                                            <span>Salvar Alterações</span>
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

export default AdminUsers;
