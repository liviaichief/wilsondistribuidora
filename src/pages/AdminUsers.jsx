import React, { useEffect, useState } from 'react';
import { useAlert } from '../context/AlertContext';
import { databases, DATABASE_ID, COLLECTIONS, client } from '../lib/appwrite';
import { ID, Query } from 'appwrite';
import { UserPlus, X, Trash2, Edit2 } from 'lucide-react';
import './Admin.css';

const AdminUsers = () => {
    const { showAlert, showConfirm } = useAlert();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

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

    useEffect(() => {
        loadUsers();
    }, []);

    const loadUsers = async () => {
        setLoading(true);
        try {
            const response = await databases.listDocuments(
                DATABASE_ID,
                COLLECTIONS.PROFILES,
                [Query.orderDesc('$createdAt')]
            );
            // Map Appwrite docs to flat structure
            const mappedUsers = response.documents.map(doc => ({
                ...doc,
                id: doc.$id
            }));
            setUsers(mappedUsers);
        } catch (error) {
            console.error('Error fetching users:', error);
            showAlert('Erro ao carregar usuários.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateUser = async (e) => {
        e.preventDefault();
        setIsCreating(true);

        // NOTE: Creating a user in Authentication from Client SDK requires 'account.create' 
        // which usually logs the current user out if done in same context, OR it's just 'signup'.
        // For this local migration, we focus on the Profile document creation.
        // Warn user that Auth account must be created separately or via Sign Up if no API key.

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
                } catch (apiErr) {
                    console.error("Auth creation failed:", apiErr);
                    throw apiErr;
                }
            } else {
                showAlert("⚠️ Sem API Key configurada (VITE_APPWRITE_API_KEY). O perfil será criado, mas o usuário não poderá fazer login até se registrar com este email.", "warning");
            }

            // Create Profile
            await databases.createDocument(
                DATABASE_ID,
                COLLECTIONS.PROFILES,
                authId,
                {
                    email: newUser.email,
                    full_name: newUser.full_name,
                    phone: newUser.phone,
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
            "Tem certeza? Isso excluirá o PERFIL. A conta Auth deve ser excluída manualmente ou via API Key.",
            async () => {
                try {
                    const apiKey = import.meta.env.VITE_APPWRITE_API_KEY;
                    if (apiKey) {
                        await fetch(`${client.config.endpoint}/users/${userId}`, {
                            method: 'DELETE',
                            headers: {
                                'X-Appwrite-Project': client.config.project,
                                'X-Appwrite-Key': apiKey
                            }
                        });
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
                    phone: editingUser.phone,
                    role: editingUser.role
                }
            );
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
            <div className="admin-content">
                <div className="header-title" style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h2>Gestão de Usuários</h2>
                        <p style={{ color: '#888' }}>Gerencie perfis e acessos do sistema.</p>
                    </div>
                    <button onClick={() => setIsCreateModalOpen(true)} className="add-btn">
                        <UserPlus size={20} /> Novo Usuário
                    </button>
                </div>

                {loading ? (
                    <p style={{ textAlign: 'center', padding: '20px' }}>Carregando usuários...</p>
                ) : users.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px', color: '#888' }}>
                        <p>Nenhum usuário encontrado.</p>
                    </div>
                ) : (
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
                                                backgroundColor: user.role === 'admin' ? 'rgba(212, 175, 55, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                                                color: user.role === 'admin' ? '#D4AF37' : '#aaa',
                                                border: user.role === 'admin' ? '1px solid rgba(212, 175, 55, 0.3)' : '1px solid #444'
                                            }}>
                                                {user.role.toUpperCase()}
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
