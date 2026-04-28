import React, { useState, useEffect } from 'react';
import { getProfiles, updateProfile, getOrders, deleteProfile, createProfile, ID } from '../services/dataService';
import { User, Search, MapPin, Phone, Mail, Calendar, Edit2, Shield, Loader2, Clock, ShoppingBag, Cake, Trash2, Pencil, AlertTriangle, X, Eye, Check, Save, Plus, RefreshCw } from 'lucide-react';
import { useAlert } from '../context/AlertContext';
import { motion, AnimatePresence } from 'framer-motion';

const AdminUsers = () => {
    const [users, setUsers] = useState([]);
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [roleFilter, setRoleFilter] = useState('all');
    const { showAlert } = useAlert();
    
    // Custom States
    const [deleteModal, setDeleteModal] = useState({ show: false, userId: null, userName: '' });
    const [roleModal, setRoleModal] = useState({ show: false, userId: null, userName: '', newRole: '' });
    const [createModal, setCreateModal] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState({ 
        full_name: '', whatsapp: '', birthday: '', role: '',
        address_cep: '', address_street: '', address_number: '', 
        address_neighborhood: '', address_city: '', address_state: '', 
        address_complement: '' 
    });
    const [newUserForm, setNewUserForm] = useState({ 
        full_name: '', email: '', whatsapp: '', role: 'client',
        address_cep: '', address_street: '', address_number: '',
        address_neighborhood: '', address_city: '', address_state: '',
        address_complement: ''
    });
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => { loadData(); }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [profilesRes, ordersRes] = await Promise.all([
                getProfiles(),
                getOrders().catch(() => ({ documents: [] }))
            ]);
            setUsers(profilesRes.documents || []);
            setOrders(ordersRes.documents || []);
        } catch (err) { 
            showAlert('Erro ao carregar dados', 'error'); 
        } finally { 
            setLoading(false); 
        }
    };

    const handleEditClick = () => {
        if (!selectedUser) return;
        setEditForm({
            full_name: selectedUser.full_name || selectedUser.name || '',
            whatsapp: selectedUser.whatsapp || selectedUser.phone || '',
            birthday: selectedUser.birthday || '',
            role: selectedUser.role || 'client',
            address_cep: selectedUser.address_cep || '',
            address_street: selectedUser.address_street || '',
            address_number: selectedUser.address_number || '',
            address_neighborhood: selectedUser.address_neighborhood || '',
            address_city: selectedUser.address_city || '',
            address_state: selectedUser.address_state || '',
            address_complement: selectedUser.address_complement || ''
        });
        setIsEditing(true);
    };

    const handleSaveEdit = async () => {
        setIsSaving(true);
        try {
            const finalForm = {
                ...editForm
            };

            // Dirty checking: envia apenas o que mudou
            const dataToSave = {};
            Object.keys(finalForm).forEach(key => {
                const newValue = finalForm[key];
                const oldValue = selectedUser[key];

                // Se mudou, adiciona ao payload
                if (newValue !== oldValue) {
                    // Higienização para campos específicos
                    if (key === 'birthday') {
                        if (newValue && newValue !== '') {
                            dataToSave[key] = newValue;
                        } else {
                            // Se era algo e agora é nada, tentamos remover? 
                            // Appwrite as vezes não permite limpar campo Date enviando null.
                            // Mas se o usuário limpou, vamos tentar não enviar para evitar erro.
                        }
                    } else if (newValue !== undefined && newValue !== null) {
                        dataToSave[key] = newValue;
                    }
                }
            });

            if (Object.keys(dataToSave).length === 0) {
                setIsEditing(false);
                showAlert('Nenhuma alteração detectada.', 'info', null, 3000);
                return;
            }

            console.log("Saving profile changes:", dataToSave);
            await updateProfile(selectedUser.$id, dataToSave);
            
            const updatedUser = { ...selectedUser, ...dataToSave };
            setUsers(users.map(u => u.$id === selectedUser.$id ? updatedUser : u));
            setSelectedUser(updatedUser);
            setIsEditing(false);
            showAlert('Alterações salvas com sucesso!', 'success', null, 3000);
        } catch (err) {
            console.error("Erro detalhado ao salvar usuário:", err);
            // Mensagem mais informativa se for erro de permissão
            const msg = err.code === 403 ? 'Você não tem permissão para editar este perfil.' : 'Erro ao salvar alterações. Verifique os dados.';
            showAlert(msg, 'error');
        } finally {
            setIsSaving(false);
        }
    };

    const handleRoleUpdate = async () => {
        const { userId, newRole } = roleModal;
        setIsSaving(true);
        try {
            await updateProfile(userId, { role: newRole });
            const updatedUsers = users.map(u => u.$id === userId ? { ...u, role: newRole } : u);
            setUsers(updatedUsers);
            if (selectedUser?.$id === userId) {
                setSelectedUser({ ...selectedUser, role: newRole });
                setEditForm(prev => ({ ...prev, role: newRole }));
            }
            showAlert('Permissão atualizada com sucesso!', 'success', null, 3000);
            setRoleModal({ show: false, userId: null, userName: '', newRole: '' });
        } catch (err) { showAlert('Erro ao atualizar permissão', 'error'); }
        finally { setIsSaving(false); }
    };

    const confirmDelete = async () => {
        setIsDeleting(true);
        try {
            await deleteProfile(deleteModal.userId);
            setUsers(users.filter(u => u.$id !== deleteModal.userId));
            if (selectedUser?.$id === deleteModal.userId) setSelectedUser(null);
            showAlert('Usuário excluído com sucesso', 'success', null, 3000);
            setDeleteModal({ show: false, userId: null, userName: '' });
        } catch (err) {
            showAlert('Erro ao excluir usuário', 'error');
        } finally {
            setIsDeleting(false);
        }
    };

    const handleCreateUser = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            const profileId = ID.unique(); 
            const profileData = {
                full_name: newUserForm.full_name || 'Perfil Adicionado',
                first_name: (newUserForm.full_name || 'Perfil').split(' ')[0],
                last_name: (newUserForm.full_name || '').split(' ').slice(1).join(' '),
                email: newUserForm.email || '',
                role: newUserForm.role || 'client',
                user_id: profileId,
                whatsapp: newUserForm.whatsapp || ''
            };

            // Apenas envia campos de endereço se eles tiverem sido preenchidos, para evitar erro de coluna inexistente
            const addressFields = ['address_cep', 'address_street', 'address_number', 'address_neighborhood', 'address_city', 'address_state', 'address_complement'];
            addressFields.forEach(field => {
                if (newUserForm[field] && newUserForm[field].trim() !== '') {
                    profileData[field] = newUserForm[field];
                }
            });
            
            await createProfile(profileId, profileData);

            showAlert('Usuário cadastrado com sucesso!', 'success', null, 3000);
            setCreateModal(false);
            setNewUserForm({ full_name: '', email: '', whatsapp: '', role: 'client' });
            loadData();
        } catch (err) {
            showAlert('Erro ao cadastrar usuário', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    const handleCepLookup = async (cep, setForm) => {
        const rawCep = cep.replace(/\D/g, '');
        if (setForm === setEditForm) {
            setEditForm(prev => ({ ...prev, address_cep: rawCep }));
        } else {
            setNewUserForm(prev => ({ ...prev, address_cep: rawCep }));
        }
        
        if (rawCep.length === 8) {
            try {
                const res = await fetch(`https://viacep.com.br/ws/${rawCep}/json/`);
                const data = await res.json();
                if (!data.erro) {
                    const updateData = {
                        address_street: data.logradouro,
                        address_neighborhood: data.bairro,
                        address_city: data.localidade,
                        address_state: data.uf
                    };
                    if (setForm === setEditForm) {
                        setEditForm(prev => ({ ...prev, ...updateData }));
                    } else {
                        setNewUserForm(prev => ({ ...prev, ...updateData }));
                    }
                }
            } catch (err) {
                console.error('ViaCEP Error:', err);
            }
        }
    };

    const handleCepChange = (cep) => handleCepLookup(cep, setEditForm);

    const formatPhone = (value) => {
        if (!value) return '';
        const phone = value.replace(/\D/g, '');
        if (phone.length <= 11) {
            return phone
                .replace(/^(\d{2})(\d)/g, '($1) $2')
                .replace(/(\d{5})(\d)/, '$1-$2');
        }
        return phone.substring(0, 11)
            .replace(/^(\d{2})(\d)/g, '($1) $2')
            .replace(/(\d{5})(\d)/, '$1-$2');
    };

    const formatDate = (dateStr, type) => {
        if (!dateStr) return '---';
        try {
            const date = new Date(dateStr);
            if (isNaN(date.getTime())) return '---';
            
            if (type === 'full') return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
            if (type === 'time') return `${date.toLocaleDateString('pt-BR', {day: '2-digit', month: '2-digit'})} ${date.toLocaleTimeString('pt-BR', {hour: '2-digit', minute: '2-digit'})}`;
            if (type === 'birthday') {
                return date.toLocaleDateString('pt-BR', {day: '2-digit', month: '2-digit'});
            }
            return date.toLocaleDateString('pt-BR');
        } catch (e) { return '---'; }
    };

    const getUserOrderCount = (userId) => {
        return orders.filter(o => o.user_id === userId).length;
    };

    const filteredUsers = users.filter(u => {
        const userName = (u.full_name || u.name || '').toLowerCase();
        const userEmail = (u.email || '').toLowerCase();
        const searchTerm = (search || '').toLowerCase();
        const matchesSearch = userName.includes(searchTerm) || userEmail.includes(searchTerm);
        const matchesRole = roleFilter === 'all' || 
                           (roleFilter === 'admin' && (u.role === 'admin' || u.role === 'owner' || u.role === 'master')) || 
                           (roleFilter === 'client' && (u.role === 'client' || u.role === 'user' || !u.role));
        return matchesSearch && matchesRole;
    });

    if (loading) return null;

    return (
        <div style={{ padding: '0 20px 40px' }}>
            <div className="glass-card" style={{ padding: '30px', marginBottom: '30px', display: 'flex', gap: '20px', alignItems: 'center' }}>
                <div style={{ flex: 1, background: 'rgba(0,0,0,0.2)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', padding: '0 15px' }}>
                    <Search size={20} color="#555" />
                    <input placeholder="Buscar usuários por nome ou e-mail..." value={search} onChange={e => setSearch(e.target.value)} style={{ background: 'none', border: 'none', color: '#fff', padding: '15px 12px', width: '100%', outline: 'none' }} />
                </div>
                <button 
                    onClick={loadData}
                    disabled={loading}
                    className="hover-scale"
                    title="Atualizar Lista"
                    style={{ padding: '15px', borderRadius: '16px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                    <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
                </button>
                <button 
                    onClick={() => setCreateModal(true)}
                    style={{ padding: '15px 30px', borderRadius: '16px', background: '#D4AF37', border: 'none', color: '#000', fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' }}
                >
                    <Plus size={20} /> NOVO USUÁRIO
                </button>
                <div style={{ background: 'rgba(255,255,255,0.02)', borderRadius: '18px', border: '1px solid rgba(255,255,255,0.05)', padding: '5px', display: 'flex', gap: '5px' }}>
                    <button onClick={() => setRoleFilter('all')} style={{ padding: '12px 24px', borderRadius: '14px', border: 'none', background: roleFilter === 'all' ? 'rgba(255,255,255,0.05)' : 'transparent', color: roleFilter === 'all' ? '#fff' : '#444', fontWeight: 900, cursor: 'pointer', transition: '0.3s' }}>TODOS</button>
                    <button onClick={() => setRoleFilter('admin')} style={{ padding: '12px 24px', borderRadius: '14px', border: 'none', background: roleFilter === 'admin' ? 'rgba(239, 68, 68, 0.1)' : 'transparent', color: roleFilter === 'admin' ? '#ef4444' : '#444', fontWeight: 900, cursor: 'pointer', transition: '0.3s' }}>ADMINS</button>
                    <button onClick={() => setRoleFilter('client')} style={{ padding: '12px 24px', borderRadius: '14px', border: 'none', background: roleFilter === 'client' ? 'rgba(34, 197, 94, 0.1)' : 'transparent', color: roleFilter === 'client' ? '#22c55e' : '#444', fontWeight: 900, cursor: 'pointer', transition: '0.3s' }}>CLIENTES</button>
                </div>
            </div>

            <div style={{ display: 'flex', gap: '30px', alignItems: 'flex-start' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 10px' }}>
                            <thead>
                                <tr style={{ color: '#fff', fontSize: '0.75rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '1px' }}>
                                    <th style={{ textAlign: 'left', padding: '0 20px' }}>NOMES</th>
                                    <th style={{ textAlign: 'left', padding: '0 20px' }}>WHATSAPP</th>
                                    <th style={{ textAlign: 'left', padding: '0 20px' }}>CRIADO</th>
                                    <th style={{ textAlign: 'left', padding: '0 20px' }}>ÚLTIMO ACESSO</th>
                                    <th style={{ textAlign: 'center', padding: '0 20px' }}>PEDIDOS</th>
                                    <th style={{ textAlign: 'center', padding: '0 20px' }}>ANIVERSÁRIO</th>
                                    <th style={{ textAlign: 'center', padding: '0 20px' }}>USUARIO</th>
                                    <th style={{ textAlign: 'right', padding: '0 20px' }}>AÇÕES</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredUsers.length === 0 ? (
                                    <tr><td colSpan="8" style={{ textAlign: 'center', padding: '100px 20px', color: '#555', fontWeight: 800 }}>Nenhum usuário encontrado nesta categoria.</td></tr>
                                ) : filteredUsers.map((u) => (
                                    <tr key={u.$id} onClick={() => { setSelectedUser(u); setIsEditing(false); }} style={{ background: selectedUser?.$id === u.$id ? 'rgba(212, 175, 55, 0.05)' : 'rgba(255,255,255,0.02)', cursor: 'pointer', transition: '0.2s' }}>
                                        <td style={{ padding: '12px 20px', borderRadius: '18px 0 0 18px', border: '1px solid rgba(255,255,255,0.05)', borderRight: 'none' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                                <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, color: '#D4AF37', fontSize: '0.8rem' }}>{(u.full_name || u.name || 'U').charAt(0).toUpperCase()}</div>
                                                <div>
                                                    <div style={{ fontWeight: 800, color: '#fff', fontSize: '0.85rem' }}>{u.full_name || u.name || 'Usuário sem nome'}</div>
                                                    <div style={{ fontSize: '0.65rem', color: '#555', fontWeight: 800 }}>{u.email}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td style={{ padding: '12px 20px', borderTop: '1px solid rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                            <div style={{ fontSize: '0.75rem', color: '#888' }}>{u.whatsapp || u.phone || 'N/A'}</div>
                                        </td>
                                        <td style={{ padding: '12px 20px', borderTop: '1px solid rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                            <div style={{ fontSize: '0.8rem', color: '#666' }}>{formatDate(u.$createdAt, 'full')}</div>
                                        </td>
                                        <td style={{ padding: '12px 20px', borderTop: '1px solid rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                            <div style={{ fontSize: '0.8rem', color: '#D4AF37' }}>{formatDate(u.last_login, 'time')}</div>
                                        </td>
                                        <td style={{ padding: '12px 20px', textAlign: 'center', borderTop: '1px solid rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', background: 'rgba(212, 175, 55, 0.1)', color: '#D4AF37', padding: '4px 10px', borderRadius: '10px', fontSize: '0.75rem', fontWeight: 900 }}>
                                                {getUserOrderCount(u.$id)}
                                            </div>
                                        </td>
                                        <td style={{ padding: '12px 20px', textAlign: 'center', borderTop: '1px solid rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                            <div style={{ fontSize: '0.8rem', color: '#888' }}>{formatDate(u.birthday, 'birthday')}</div>
                                        </td>
                                        <td style={{ padding: '12px 20px', textAlign: 'center', borderTop: '1px solid rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                            <span style={{ 
                                                fontSize: '0.65rem', 
                                                fontWeight: 900, 
                                                color: u.role === 'master' ? '#a855f7' : (u.role === 'admin' || u.role === 'owner' ? '#ef4444' : '#fff'), 
                                                background: u.role === 'master' ? 'rgba(168, 85, 247, 0.1)' : (u.role === 'admin' || u.role === 'owner' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(255,255,255,0.05)'), 
                                                padding: '4px 10px', 
                                                borderRadius: '8px' 
                                            }}>
                                                {(u.role === 'client' ? 'CLIENTE' : u.role?.toUpperCase()) || 'CLIENTE'}
                                            </span>
                                        </td>
                                        <td style={{ padding: '12px 20px', borderRadius: '0 18px 18px 0', border: '1px solid rgba(255,255,255,0.05)', borderLeft: 'none', textAlign: 'right', overflow: 'visible' }}>
                                            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                                <button title="Ver Detalhes" style={{ padding: '8px', borderRadius: '10px', background: 'rgba(255,255,255,0.05)', border: 'none', color: '#fff', cursor: 'pointer' }}><Eye size={16} /></button>
                                                <button onClick={(e) => { e.stopPropagation(); setDeleteModal({ show: true, userId: u.$id, userName: u.full_name || u.name }); }} title="Excluir Usuário" style={{ padding: '8px', borderRadius: '10px', background: 'rgba(239, 68, 68, 0.1)', border: 'none', color: '#ef4444', cursor: 'pointer', zIndex: 20, position: 'relative' }}><Trash2 size={16} /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div
                    className="glass-card"
                    style={{ 
                        width: '380px', 
                        position: 'sticky', 
                        top: '10px', 
                        height: 'calc(100vh - 200px)', 
                        padding: '0', 
                        border: '1px solid rgba(255,255,255,0.1)', 
                        overflowY: 'auto', 
                        display: 'flex', 
                        flexDirection: 'column', 
                        zIndex: 10,
                        scrollbarWidth: 'none',
                        background: selectedUser ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.01)'
                    }}
                >
                    <AnimatePresence mode="wait">
                        {!selectedUser ? (
                            <motion.div
                                key="empty"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px', textAlign: 'center', color: '#444' }}
                            >
                                <div style={{ width: '60px', height: '60px', borderRadius: '20px', background: 'rgba(255,255,255,0.02)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
                                    <User size={30} />
                                </div>
                                <h3 style={{ fontSize: '1rem', fontWeight: 900, color: '#555', marginBottom: '10px' }}>Nenhum usuário selecionado</h3>
                                <p style={{ fontSize: '0.8rem', fontWeight: 700 }}>Selecione um cliente na lista ao lado para visualizar os detalhes completos.</p>
                            </motion.div>
                        ) : (
                            <motion.div
                                key={selectedUser.$id}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                style={{ display: 'flex', flexDirection: 'column', flex: 1 }}
                            >
                                <div style={{ background: 'linear-gradient(135deg, rgba(212,175,55,0.1) 0%, rgba(0,0,0,0) 100%)', padding: '40px 30px 30px', position: 'relative' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                        <div style={{ width: '80px', height: '80px', borderRadius: '25px', background: 'rgba(212,175,55,0.2)', border: '1px solid rgba(212,175,55,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', fontWeight: 900, color: '#D4AF37', marginBottom: '20px' }}>
                                            {(isEditing ? editForm.full_name : (selectedUser.full_name || selectedUser.name || 'U')).charAt(0).toUpperCase()}
                                        </div>
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            {!isEditing && <button onClick={handleEditClick} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', borderRadius: '10px', padding: '8px', color: '#fff', cursor: 'pointer' }}><Pencil size={18} /></button>}
                                            <button onClick={() => { setSelectedUser(null); setIsEditing(false); }} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', borderRadius: '10px', padding: '8px', color: '#fff', cursor: 'pointer' }}><X size={18} /></button>
                                        </div>
                                    </div>
                                    {isEditing ? (
                                        <div style={{ marginBottom: '15px' }}>
                                            <div style={{ fontSize: '0.6rem', color: '#555', fontWeight: 900, textTransform: 'uppercase', marginBottom: '5px' }}>Nome Completo</div>
                                            <input value={editForm.full_name} onChange={e => setEditForm({...editForm, full_name: e.target.value})} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', padding: '10px', borderRadius: '12px', width: '100%', fontSize: '1rem', fontWeight: 900, outline: 'none' }} />
                                        </div>
                                    ) : (
                                        <>
                                            <h2 style={{ fontSize: '1.4rem', fontWeight: 900, color: '#fff', marginBottom: '5px' }}>{selectedUser.full_name || selectedUser.name}</h2>
                                            <p style={{ color: '#555', fontWeight: 800, fontSize: '0.85rem' }}>{selectedUser.email}</p>
                                        </>
                                    )}
                                </div>

                                <div style={{ padding: '30px', display: 'flex', flexDirection: 'column', gap: '25px' }}>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                        <div style={{ background: 'rgba(255,255,255,0.02)', padding: '15px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                            <div style={{ fontSize: '0.6rem', color: '#555', fontWeight: 900, textTransform: 'uppercase', marginBottom: '5px' }}>Total Pedidos</div>
                                            <div style={{ fontSize: '1.2rem', fontWeight: 900, color: '#D4AF37' }}>{getUserOrderCount(selectedUser.$id)}</div>
                                        </div>
                                        <div style={{ background: 'rgba(255,255,255,0.02)', padding: '15px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                            <div style={{ fontSize: '0.6rem', color: '#555', fontWeight: 900, textTransform: 'uppercase', marginBottom: '5px' }}>Usuário Desde</div>
                                            <div style={{ fontSize: '0.9rem', fontWeight: 900, color: '#fff' }}>{formatDate(selectedUser.$createdAt, 'full')}</div>
                                        </div>
                                        <div style={{ background: 'rgba(255,255,255,0.02)', padding: '15px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)', gridColumn: 'span 2' }}>
                                            <div style={{ fontSize: '0.6rem', color: '#555', fontWeight: 900, textTransform: 'uppercase', marginBottom: '5px' }}>Último Acesso</div>
                                            <div style={{ fontSize: '0.9rem', fontWeight: 900, color: '#D4AF37', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <Clock size={14} /> {formatDate(selectedUser.last_login, 'time')}
                                            </div>
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#888' }}><Phone size={16} /></div>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontSize: '0.6rem', color: '#555', fontWeight: 900 }}>WHATSAPP</div>
                                                {isEditing ? (
                                                    <input value={editForm.whatsapp} onChange={e => setEditForm({...editForm, whatsapp: formatPhone(e.target.value)})} placeholder="(00) 00000-0000" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', padding: '5px 10px', borderRadius: '8px', width: '100%', fontSize: '0.85rem', outline: 'none' }} />
                                                ) : (
                                                    <div style={{ fontSize: '0.85rem', color: '#fff', fontWeight: 700 }}>{selectedUser.whatsapp || selectedUser.phone || 'Não informado'}</div>
                                                )}
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#888' }}><Cake size={16} /></div>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontSize: '0.6rem', color: '#555', fontWeight: 900 }}>ANIVERSÁRIO</div>
                                                {isEditing ? (
                                                    <input type="date" value={editForm.birthday} onChange={e => setEditForm({...editForm, birthday: e.target.value})} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', padding: '5px 10px', borderRadius: '8px', width: '100%', fontSize: '0.85rem', outline: 'none', colorScheme: 'dark' }} />
                                                ) : (
                                                    <div style={{ fontSize: '0.85rem', color: '#fff', fontWeight: 700 }}>{formatDate(selectedUser.birthday, 'birthday')}</div>
                                                )}
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', gap: '12px' }}>
                                            <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#888', flexShrink: 0 }}><MapPin size={16} /></div>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontSize: '0.6rem', color: '#555', fontWeight: 900, marginBottom: '10px' }}>ENDEREÇO DETALHADO</div>
                                                {isEditing ? (
                                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                                        <div style={{ gridColumn: 'span 2' }}>
                                                            <label style={{ fontSize: '0.55rem', color: '#444', fontWeight: 900 }}>CEP</label>
                                                            <input 
                                                                value={editForm.address_cep} 
                                                                maxLength={8}
                                                                placeholder="Apenas números"
                                                                onChange={e => handleCepChange(e.target.value)} 
                                                                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', padding: '6px 10px', borderRadius: '8px', width: '100%', fontSize: '0.8rem', outline: 'none' }} 
                                                            />
                                                        </div>
                                                        <div style={{ gridColumn: 'span 2' }}>
                                                            <label style={{ fontSize: '0.55rem', color: '#444', fontWeight: 900 }}>RUA</label>
                                                            <input value={editForm.address_street} onChange={e => setEditForm({...editForm, address_street: e.target.value})} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', padding: '6px 10px', borderRadius: '8px', width: '100%', fontSize: '0.8rem', outline: 'none' }} />
                                                        </div>
                                                        <div>
                                                            <label style={{ fontSize: '0.55rem', color: '#444', fontWeight: 900 }}>NÚMERO</label>
                                                            <input value={editForm.address_number} onChange={e => setEditForm({...editForm, address_number: e.target.value})} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', padding: '6px 10px', borderRadius: '8px', width: '100%', fontSize: '0.8rem', outline: 'none' }} />
                                                        </div>
                                                        <div>
                                                            <label style={{ fontSize: '0.55rem', color: '#444', fontWeight: 900 }}>BAIRRO</label>
                                                            <input value={editForm.address_neighborhood} onChange={e => setEditForm({...editForm, address_neighborhood: e.target.value})} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', padding: '6px 10px', borderRadius: '8px', width: '100%', fontSize: '0.8rem', outline: 'none' }} />
                                                        </div>
                                                        <div>
                                                            <label style={{ fontSize: '0.55rem', color: '#444', fontWeight: 900 }}>CIDADE</label>
                                                            <input value={editForm.address_city} onChange={e => setEditForm({...editForm, address_city: e.target.value})} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', padding: '6px 10px', borderRadius: '8px', width: '100%', fontSize: '0.8rem', outline: 'none' }} />
                                                        </div>
                                                        <div>
                                                            <label style={{ fontSize: '0.55rem', color: '#444', fontWeight: 900 }}>ESTADO</label>
                                                            <input value={editForm.address_state} onChange={e => setEditForm({...editForm, address_state: e.target.value})} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', padding: '6px 10px', borderRadius: '8px', width: '100%', fontSize: '0.8rem', outline: 'none' }} />
                                                        </div>
                                                        <div style={{ gridColumn: 'span 2' }}>
                                                            <label style={{ fontSize: '0.55rem', color: '#444', fontWeight: 900 }}>COMPLEMENTO</label>
                                                            <input value={editForm.address_complement} onChange={e => setEditForm({...editForm, address_complement: e.target.value})} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', padding: '6px 10px', borderRadius: '8px', width: '100%', fontSize: '0.8rem', outline: 'none' }} />
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div style={{ fontSize: '0.8rem', color: '#888', fontWeight: 600, lineHeight: '1.5' }}>
                                                        {selectedUser.address_street ? (
                                                            <>
                                                                {selectedUser.address_street}, {selectedUser.address_number}<br />
                                                                {selectedUser.address_neighborhood}<br />
                                                                {selectedUser.address_city} - {selectedUser.address_state}<br />
                                                                CEP: {selectedUser.address_cep}
                                                                {selectedUser.address_complement && <div style={{ fontSize: '0.7rem', color: '#555' }}>{selectedUser.address_complement}</div>}
                                                            </>
                                                        ) : 'Nenhum endereço cadastrado.'}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div style={{ marginTop: '10px', paddingTop: '25px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                                        <div style={{ fontSize: '0.6rem', color: '#555', fontWeight: 900, textTransform: 'uppercase', marginBottom: '15px' }}>Permissões</div>
                                        <div style={{ display: 'flex', gap: '10px' }}>
                                            <button 
                                                onClick={() => isEditing ? setEditForm({...editForm, role: 'client'}) : setRoleModal({ show: true, userId: selectedUser.$id, userName: selectedUser.full_name || selectedUser.name, newRole: 'client' })}
                                                style={{ flex: 1, padding: '12px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', background: (isEditing ? editForm.role === 'client' : selectedUser.role === 'client') ? 'rgba(255,255,255,0.1)' : 'transparent', color: (isEditing ? editForm.role === 'client' : selectedUser.role === 'client') ? '#fff' : '#444', fontWeight: 900, fontSize: '0.7rem', cursor: 'pointer' }}
                                            >
                                                CLIENTE
                                            </button>
                                            <button 
                                                onClick={() => isEditing ? setEditForm({...editForm, role: 'admin'}) : setRoleModal({ show: true, userId: selectedUser.$id, userName: selectedUser.full_name || selectedUser.name, newRole: 'admin' })}
                                                style={{ flex: 1, padding: '12px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', background: (isEditing ? editForm.role === 'admin' : selectedUser.role === 'admin') ? 'rgba(239, 68, 68, 0.1)' : 'transparent', color: (isEditing ? editForm.role === 'admin' : selectedUser.role === 'admin') ? '#ef4444' : '#444', fontWeight: 900, fontSize: '0.7rem', cursor: 'pointer' }}
                                            >
                                                ADMIN
                                            </button>
                                            <button 
                                                onClick={() => isEditing ? setEditForm({...editForm, role: 'master'}) : setRoleModal({ show: true, userId: selectedUser.$id, userName: selectedUser.full_name || selectedUser.name, newRole: 'master' })}
                                                style={{ flex: 1, padding: '12px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', background: (isEditing ? editForm.role === 'master' : selectedUser.role === 'master') ? 'rgba(168, 85, 247, 0.1)' : 'transparent', color: (isEditing ? editForm.role === 'master' : selectedUser.role === 'master') ? '#a855f7' : '#444', fontWeight: 900, fontSize: '0.7rem', cursor: 'pointer' }}
                                            >
                                                MASTER
                                            </button>
                                        </div>
                                    </div>

                                    {isEditing && (
                                        <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                                            <button onClick={() => setIsEditing(false)} style={{ flex: 1, padding: '15px', borderRadius: '14px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontWeight: 900, cursor: 'pointer' }}>CANCELAR</button>
                                            <button onClick={handleSaveEdit} disabled={isSaving} style={{ flex: 1, padding: '15px', borderRadius: '14px', background: '#D4AF37', border: 'none', color: '#000', fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                                {isSaving ? <Loader2 size={18} className="animate-spin" /> : <><Save size={18} /> SALVAR</>}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            <AnimatePresence>
                {createModal && (
                    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="glass-card" 
                            style={{ maxWidth: '500px', width: '100%', padding: '40px', border: '1px solid rgba(255,255,255,0.1)' }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                                <h3 style={{ fontSize: '1.5rem', fontWeight: 900, color: '#fff' }}>Novo Usuário</h3>
                                <button onClick={() => setCreateModal(false)} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', borderRadius: '10px', padding: '8px', color: '#fff', cursor: 'pointer' }}><X size={20} /></button>
                            </div>
                            <form onSubmit={handleCreateUser} style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxHeight: '70vh', overflowY: 'auto', paddingRight: '10px' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                    <div style={{ gridColumn: 'span 2' }}>
                                        <label style={{ fontSize: '0.7rem', color: '#555', fontWeight: 900, textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>Nome Completo</label>
                                        <input required value={newUserForm.full_name} onChange={e => setNewUserForm({...newUserForm, full_name: e.target.value})} style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', padding: '12px', borderRadius: '12px', outline: 'none' }} />
                                    </div>
                                    <div>
                                        <label style={{ fontSize: '0.7rem', color: '#555', fontWeight: 900, textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>E-mail</label>
                                        <input required type="email" value={newUserForm.email} onChange={e => setNewUserForm({...newUserForm, email: e.target.value.toLowerCase()})} placeholder="exemplo@email.com" style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', padding: '12px', borderRadius: '12px', outline: 'none' }} />
                                    </div>
                                    <div>
                                        <label style={{ fontSize: '0.7rem', color: '#555', fontWeight: 900, textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>WhatsApp</label>
                                        <input value={newUserForm.whatsapp} onChange={e => setNewUserForm({...newUserForm, whatsapp: formatPhone(e.target.value)})} placeholder="(00) 00000-0000" style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', padding: '12px', borderRadius: '12px', outline: 'none' }} />
                                    </div>
                                    <div style={{ gridColumn: 'span 2' }}>
                                        <div style={{ height: '1px', background: 'rgba(255,255,255,0.05)', margin: '10px 0' }} />
                                        <label style={{ fontSize: '0.8rem', color: '#D4AF37', fontWeight: 900, marginBottom: '15px', display: 'block' }}>Endereço de Entrega</label>
                                    </div>
                                    <div>
                                        <label style={{ fontSize: '0.7rem', color: '#555', fontWeight: 900, textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>CEP</label>
                                        <input value={newUserForm.address_cep} maxLength={8} onChange={e => handleCepLookup(e.target.value, setNewUserForm)} placeholder="00000000" style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', padding: '12px', borderRadius: '12px', outline: 'none' }} />
                                    </div>
                                    <div>
                                        <label style={{ fontSize: '0.7rem', color: '#555', fontWeight: 900, textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>Número</label>
                                        <input value={newUserForm.address_number} onChange={e => setNewUserForm({...newUserForm, address_number: e.target.value})} style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', padding: '12px', borderRadius: '12px', outline: 'none' }} />
                                    </div>
                                    <div style={{ gridColumn: 'span 2' }}>
                                        <label style={{ fontSize: '0.7rem', color: '#555', fontWeight: 900, textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>Rua</label>
                                        <input value={newUserForm.address_street} onChange={e => setNewUserForm({...newUserForm, address_street: e.target.value})} style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', padding: '12px', borderRadius: '12px', outline: 'none' }} />
                                    </div>
                                    <div>
                                        <label style={{ fontSize: '0.7rem', color: '#555', fontWeight: 900, textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>Bairro</label>
                                        <input value={newUserForm.address_neighborhood} onChange={e => setNewUserForm({...newUserForm, address_neighborhood: e.target.value})} style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', padding: '12px', borderRadius: '12px', outline: 'none' }} />
                                    </div>
                                    <div>
                                        <label style={{ fontSize: '0.7rem', color: '#555', fontWeight: 900, textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>Cidade</label>
                                        <input value={newUserForm.address_city} onChange={e => setNewUserForm({...newUserForm, address_city: e.target.value})} style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', padding: '12px', borderRadius: '12px', outline: 'none' }} />
                                    </div>
                                    <div style={{ gridColumn: 'span 2' }}>
                                        <label style={{ fontSize: '0.7rem', color: '#555', fontWeight: 900, textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>Complemento</label>
                                        <input value={newUserForm.address_complement} onChange={e => setNewUserForm({...newUserForm, address_complement: e.target.value})} style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', padding: '12px', borderRadius: '12px', outline: 'none' }} />
                                    </div>
                                    <div style={{ gridColumn: 'span 2' }}>
                                        <div style={{ height: '1px', background: 'rgba(255,255,255,0.05)', margin: '10px 0' }} />
                                        <label style={{ fontSize: '0.7rem', color: '#555', fontWeight: 900, textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>Cargo / Permissão</label>
                                        <select value={newUserForm.role} onChange={e => setNewUserForm({...newUserForm, role: e.target.value})} style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', padding: '12px', borderRadius: '12px', outline: 'none' }}>
                                            <option value="client" style={{ background: '#111' }}>Cliente</option>
                                            <option value="admin" style={{ background: '#111' }}>Administrador</option>
                                            <option value="master" style={{ background: '#111' }}>Master</option>
                                        </select>
                                    </div>
                                </div>

                                <button type="submit" disabled={isSaving} style={{ marginTop: '10px', padding: '15px', borderRadius: '14px', background: '#D4AF37', border: 'none', color: '#000', fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                                    {isSaving ? <Loader2 size={20} className="animate-spin" /> : 'CRIAR USUÁRIO'}
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {roleModal.show && (
                    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="glass-card" 
                            style={{ maxWidth: '450px', width: '100%', padding: '40px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }}
                        >
                            <div style={{ width: '80px', height: '80px', background: 'rgba(212, 175, 55, 0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 25px', color: '#D4AF37' }}>
                                <Shield size={40} />
                            </div>
                            
                            <h3 style={{ fontSize: '1.5rem', fontWeight: 900, color: '#fff', marginBottom: '15px' }}>Alterar Permissão</h3>
                            <p style={{ color: '#888', fontSize: '1.1rem', marginBottom: '35px', lineHeight: '1.6' }}>
                                Você deseja alterar o nível de acesso de <strong style={{ color: '#fff' }}>{roleModal.userName}</strong> para <strong style={{ color: roleModal.newRole === 'admin' ? '#ef4444' : '#22c55e' }}>{roleModal.newRole?.toUpperCase()}</strong>?
                            </p>

                            <div style={{ display: 'flex', gap: '15px' }}>
                                <button 
                                    onClick={() => setRoleModal({ show: false, userId: null, userName: '', newRole: '' })}
                                    style={{ flex: 1, padding: '15px', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: '#fff', fontWeight: 900, cursor: 'pointer' }}
                                >
                                    CANCELAR
                                </button>
                                <button 
                                    onClick={handleRoleUpdate}
                                    disabled={isSaving}
                                    style={{ flex: 1, padding: '15px', borderRadius: '14px', border: 'none', background: '#D4AF37', color: '#000', fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}
                                >
                                    {isSaving ? <Loader2 size={20} className="animate-spin" /> : 'CONFIRMAR'}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {deleteModal.show && (
                    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="glass-card" 
                            style={{ maxWidth: '270px', width: '100%', padding: '25px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }}
                        >
                            <div style={{ width: '60px', height: '60px', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', color: '#ef4444' }}>
                                <AlertTriangle size={30} />
                            </div>
                            
                            <h3 style={{ fontSize: '1.2rem', fontWeight: 900, color: '#fff', marginBottom: '10px' }}>Excluir?</h3>
                            <p style={{ color: '#888', fontSize: '0.85rem', marginBottom: '25px', lineHeight: '1.4' }}>
                                Você está prestes a excluir permanentemente o usuário <strong style={{ color: '#fff' }}>{deleteModal.userName}</strong>. Esta ação não poderá ser revertida.
                            </p>

                            <div style={{ display: 'flex', gap: '15px' }}>
                                <button 
                                    onClick={() => setDeleteModal({ show: false, userId: null, userName: '' })}
                                    style={{ flex: 1, padding: '10px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: '#fff', fontWeight: 900, fontSize: '0.7rem', cursor: 'pointer', transition: '0.3s' }}
                                >
                                    CANCELAR
                                </button>
                                <button 
                                    onClick={confirmDelete}
                                    disabled={isDeleting}
                                    style={{ flex: 1, padding: '10px', borderRadius: '10px', border: 'none', background: '#ef4444', color: '#fff', fontWeight: 900, fontSize: '0.7rem', cursor: 'pointer', transition: '0.3s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                                >
                                    {isDeleting ? <Loader2 size={16} className="animate-spin" /> : 'EXCLUIR AGORA'}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>


        </div>
    );
};

export default AdminUsers;
