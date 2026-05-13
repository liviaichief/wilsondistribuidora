import React, { useState, useEffect } from 'react';
import { getProfiles, updateProfile, getOrders, deleteProfile, createProfile, ID } from '../services/dataService';
import { User, Search, MapPin, Phone, Mail, Calendar, Edit2, Shield, ShieldCheck, ShieldOff, ShieldAlert, Loader2, Clock, ShoppingBag, Cake, Trash2, Pencil, AlertTriangle, X, Eye, EyeOff, Check, Save, Plus, RefreshCw, Lock, Unlock, KeyRound, MessageSquare, Link, Copy, LogOut, Smartphone } from 'lucide-react';
import { useAlert } from '../context/AlertContext';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { account } from '../lib/appwrite';
import { openWhatsApp } from '../services/whatsappService';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

const AdminUsers = () => {
    const [users, setUsers] = useState([]);
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [roleFilter, setRoleFilter] = useState('all');
    const { showAlert } = useAlert();
    const { role: currentRole } = useAuth();
    const isOwner = currentRole === 'owner';
    
    // Custom States
    const [deleteModal, setDeleteModal] = useState({ show: false, userId: null, userName: '' });
    const [roleModal, setRoleModal] = useState({ show: false, userId: null, userName: '', newRole: '' });
    const [createModal, setCreateModal] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState({
        full_name: '', email: '', whatsapp: '', birthday: '', role: '',
        address_cep: '', address_street: '', address_number: '',
        address_neighborhood: '', address_city: '', address_state: '',
        address_complement: ''
    });
    const [passwordForm, setPasswordForm] = useState({ newPassword: '', confirm: '', show: false, showConfirm: false, open: false });
    const [newUserForm, setNewUserForm] = useState({ 
        full_name: '', email: '', whatsapp: '', role: 'client',
        address_cep: '', address_street: '', address_number: '',
        address_neighborhood: '', address_city: '', address_state: '',
        address_complement: ''
    });
    const [isSaving, setIsSaving] = useState(false);
    const [detailTab, setDetailTab]         = useState('perfil'); // 'perfil' | 'seguranca'
    const [securityLoading, setSecurityLoading] = useState({});

    const [newUsersCount, setNewUsersCount] = useState(0);
    const lastKnownCount = React.useRef(null);

    // Sincronização silenciosa (sem spinner) para detectar novos usuários
    const silentSync = React.useCallback(async () => {
        try {
            const [profilesRes, ordersRes] = await Promise.all([
                getProfiles(),
                getOrders().catch(() => ({ documents: [] }))
            ]);
            const freshUsers = profilesRes.documents || [];
            const freshOrders = ordersRes.documents || [];

            if (lastKnownCount.current !== null && freshUsers.length > lastKnownCount.current) {
                const diff = freshUsers.length - lastKnownCount.current;
                setNewUsersCount(diff);
                showAlert(`${diff} novo(s) usuário(s) cadastrado(s)!`, 'success', null, 5000);
            }

            lastKnownCount.current = freshUsers.length;
            setUsers(freshUsers);
            setOrders(freshOrders);
        } catch (e) {
            // silencioso
        }
    }, [showAlert]);

    // Migra perfis com role='admin' para 'master' automaticamente ao carregar
    useEffect(() => {
        const migrateAdminToMaster = async () => {
            try {
                const res = await getProfiles();
                const adminUsers = (res.documents || []).filter(u => u.role === 'admin');
                if (adminUsers.length === 0) return;
                await Promise.all(adminUsers.map(u => updateProfile(u.$id, { role: 'master' })));
                console.log(`[migration] ${adminUsers.length} perfil(is) admin → master`);
            } catch (err) {
                console.warn('[migration] Falha ao migrar admin→master:', err.message);
            }
        };
        migrateAdminToMaster();
    }, []);

    useEffect(() => {
        loadData();

        // Sincroniza ao focar a janela (ex: usuário volta de outra aba)
        const handleFocus = () => silentSync();
        const handleVisibility = () => {
            if (document.visibilityState === 'visible') silentSync();
        };

        window.addEventListener('focus', handleFocus);
        document.addEventListener('visibilitychange', handleVisibility);

        return () => {
            window.removeEventListener('focus', handleFocus);
            document.removeEventListener('visibilitychange', handleVisibility);
        };
    }, [silentSync]);

    const [showUserOrdersModal, setShowUserOrdersModal] = useState(false);
    const [expandedOrderId, setExpandedOrderId] = useState(null);

    const [modalTab, setModalTab] = useState('pedidos'); // 'pedidos' ou 'dashboard'

    const analyzeUserData = (userOrders) => {
        const productStats = {};
        const dayStats = Array(7).fill(0); 
        const hourStats = Array(24).fill(0);
        const monthStats = Array(12).fill(0);

        userOrders.forEach(order => {
            const date = new Date(order.$createdAt);
            dayStats[date.getDay()]++;
            hourStats[date.getHours()]++;
            monthStats[date.getMonth()]++;

            try {
                const items = typeof order.items === 'string' ? JSON.parse(order.items) : (order.items || []);
                items.forEach(item => {
                    const key = item.title || 'Produto sem nome';
                    if (!productStats[key]) {
                        productStats[key] = { name: key, qty: 0, value: 0, recurrence: 0 };
                    }
                    productStats[key].qty += Number(item.quantity || 0);
                    productStats[key].value += Number(item.price || 0) * Number(item.quantity || 0);
                    productStats[key].recurrence++;
                });
            } catch (e) {}
        });

        const topByValue = Object.values(productStats).sort((a, b) => b.value - a.value).slice(0, 5);
        const topByQty = Object.values(productStats).sort((a, b) => b.qty - a.qty).slice(0, 5);
        const recurrenceRanking = Object.values(productStats).sort((a, b) => b.recurrence - a.recurrence).slice(0, 5);

        const dayLabels = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
        const daysData = dayStats.map((count, i) => ({ day: dayLabels[i], count }));
        const hoursData = hourStats.map((count, i) => ({ hour: `${i}h`, count }));
        const monthsNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
        const monthsData = monthStats.map((count, i) => ({ month: monthsNames[i], count }));

        return { topByValue, topByQty, recurrenceRanking, daysData, hoursData, monthsData, productStats };
    };

    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div style={{ background: 'rgba(5,5,5,0.95)', border: '1px solid rgba(255,255,255,0.1)', padding: '12px', borderRadius: '12px', backdropFilter: 'blur(15px)', boxShadow: '0 10px 20px rgba(0,0,0,0.5)' }}>
                    <p style={{ color: '#fff', fontSize: '0.8rem', fontWeight: 900, marginBottom: '8px', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '5px' }}>{label}</p>
                    {payload.map((item, index) => (
                        <p key={index} style={{ color: item.color || item.fill || '#D4AF37', fontSize: '0.75rem', fontWeight: 800, margin: '3px 0', display: 'flex', justifyContent: 'space-between', gap: '20px' }}>
                            <span>{item.name}:</span>
                            <span>{typeof item.value === 'number' && item.name.includes('Valor') 
                                ? item.value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) 
                                : item.value}</span>
                        </p>
                    ))}
                </div>
            );
        }
        return null;
    };

    const loadData = async () => {
        setLoading(true);
        setNewUsersCount(0); // limpa badge ao carregar manualmente
        try {
            const [profilesRes, ordersRes] = await Promise.all([
                getProfiles(),
                getOrders().catch(() => ({ documents: [] }))
            ]);
            const freshUsers = profilesRes.documents || [];
            const freshOrders = ordersRes.documents || [];
            lastKnownCount.current = freshUsers.length;
            setUsers(freshUsers);
            setOrders(freshOrders);
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
            address_complement: selectedUser.address_complement || '',
            email: selectedUser.email || '',
        });
        setPasswordForm({ newPassword: '', confirm: '', show: false, showConfirm: false, open: false });
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
                            dataToSave[key] = newValue.length === 10 ? `${newValue}T12:00:00.000Z` : newValue;
                        } else {
                            // Se era algo e agora é nada, tentamos remover? 
                            // Appwrite as vezes não permite limpar campo Date enviando null.
                            // Mas se o usuário limpou, vamos tentar não enviar para evitar erro.
                            // dataToSave[key] = null;
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
            // Gera um ID alfanumérico válido para evitar o erro do "unique()" no Appwrite
            const profileId = "usr" + Date.now().toString(36) + Math.random().toString(36).substring(2, 8); 
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
            console.error('[handleCreateUser]', err);
            const msg = err?.message || err?.response?.message || 'Verifique o console para detalhes.';
            showAlert(`Erro ao cadastrar usuário: ${msg}`, 'error');
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
                        setForm(prev => ({ ...prev, ...updateData }));
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

    const getUserOrders = (userId) => {
        return orders.filter(o => o.user_id === userId).sort((a, b) => new Date(b.$createdAt) - new Date(a.$createdAt));
    };

    const getUserOrderCount = (userId) => {
        return orders.filter(o => o.user_id === userId).length;
    };

    // ── Funções de Segurança ────────────────────────────────────────────────

    const secBusy = (key, v) => setSecurityLoading(p => ({ ...p, [key]: v }));

    // Envia e-mail de redefinição de senha via Appwrite
    const handlePasswordRecoveryEmail = async (user) => {
        if (!user.email) return showAlert('Usuário sem e-mail cadastrado.', 'warning');
        secBusy('email', true);
        try {
            const resetUrl = `${window.location.origin}/reset-password`;
            await account.createRecovery(user.email, resetUrl);
            showAlert(`Link de redefinição enviado para ${user.email}`, 'success', null, 4000);
        } catch (err) {
            showAlert(`Erro ao enviar e-mail: ${err.message}`, 'error');
        } finally {
            secBusy('email', false);
        }
    };

    // Envia link de redefinição via WhatsApp (abre conversa com o link)
    const handlePasswordRecoveryWhatsApp = async (user) => {
        const phone = (user.whatsapp || '').replace(/\D/g, '');
        if (!phone) return showAlert('Usuário sem WhatsApp cadastrado.', 'warning');
        secBusy('whatsapp', true);
        try {
            const resetUrl = `${window.location.origin}/reset-password`;
            const name = user.full_name?.split(' ')[0] || 'Olá';
            const msg = `Olá ${name}! 👋\n\nVocê solicitou a redefinição de senha.\n\nClique no link abaixo para criar uma nova senha:\n🔗 ${resetUrl}\n\n_O link expira em 1 hora._`;
            openWhatsApp(`55${phone}`, msg);
            showAlert('WhatsApp aberto com o link de redefinição.', 'success', null, 3000);
        } catch (err) {
            showAlert('Erro ao abrir WhatsApp.', 'error');
        } finally {
            secBusy('whatsapp', false);
        }
    };

    // Bloqueia ou desbloqueia a conta do usuário
    const handleToggleBlock = async (user) => {
        const newBlocked = !user.is_blocked;
        secBusy('block', true);
        try {
            await updateProfile(user.$id, { is_blocked: newBlocked });
            setUsers(prev => prev.map(u => u.$id === user.$id ? { ...u, is_blocked: newBlocked } : u));
            setSelectedUser(prev => ({ ...prev, is_blocked: newBlocked }));
            showAlert(newBlocked ? 'Conta bloqueada com sucesso.' : 'Conta desbloqueada com sucesso.', newBlocked ? 'warning' : 'success', null, 3000);
        } catch (err) {
            showAlert(`Erro ao ${newBlocked ? 'bloquear' : 'desbloquear'} conta: ${err.message}`, 'error');
        } finally {
            secBusy('block', false);
        }
    };

    // Ativa/desativa exigência de MFA para o perfil
    const handleToggleMFA = async (user) => {
        const newMFA = !user.mfa_required;
        secBusy('mfa', true);
        try {
            await updateProfile(user.$id, { mfa_required: newMFA });
            setUsers(prev => prev.map(u => u.$id === user.$id ? { ...u, mfa_required: newMFA } : u));
            setSelectedUser(prev => ({ ...prev, mfa_required: newMFA }));
            showAlert(newMFA ? 'MFA ativado para este usuário.' : 'MFA desativado.', 'success', null, 3000);
        } catch (err) {
            showAlert(`Erro ao configurar MFA: ${err.message}`, 'error');
        } finally {
            secBusy('mfa', false);
        }
    };

    // Marca conta para forçar troca de senha no próximo login
    const handleForcePasswordChange = async (user) => {
        const curr = !user.force_password_change;
        secBusy('forcePass', true);
        try {
            await updateProfile(user.$id, { force_password_change: curr });
            setUsers(prev => prev.map(u => u.$id === user.$id ? { ...u, force_password_change: curr } : u));
            setSelectedUser(prev => ({ ...prev, force_password_change: curr }));
            showAlert(curr ? 'Usuário deverá redefinir senha no próximo acesso.' : 'Obrigação de troca de senha removida.', 'success', null, 3000);
        } catch (err) {
            showAlert('Erro ao configurar política de senha.', 'error');
        } finally {
            secBusy('forcePass', false);
        }
    };

    // Define senha diretamente via Appwrite Admin REST API (apenas master)
    const handleSetPassword = async () => {
        if (passwordForm.newPassword.length < 8) {
            return showAlert('A senha deve ter pelo menos 8 caracteres.', 'warning');
        }
        if (passwordForm.newPassword !== passwordForm.confirm) {
            return showAlert('As senhas não coincidem.', 'warning');
        }
        const apiKey = import.meta.env.VITE_APPWRITE_API_KEY;
        if (!apiKey) {
            return showAlert('Chave de API de administrador não configurada (VITE_APPWRITE_API_KEY).', 'error');
        }
        secBusy('setPass', true);
        try {
            const endpoint = import.meta.env.VITE_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1';
            const projectId = import.meta.env.VITE_APPWRITE_PROJECT_ID;
            // user_id armazena o ID da conta Appwrite vinculada ao perfil
            const accountId = selectedUser.user_id || selectedUser.$id;
            const res = await fetch(`${endpoint}/v1/users/${accountId}/password`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Appwrite-Project': projectId,
                    'X-Appwrite-Key': apiKey,
                },
                body: JSON.stringify({ password: passwordForm.newPassword }),
            });
            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.message || `HTTP ${res.status}`);
            }
            showAlert('Senha definida com sucesso! O usuário pode fazer login com a nova senha.', 'success', null, 5000);
            setPasswordForm({ newPassword: '', confirm: '', show: false, showConfirm: false, open: false });
        } catch (err) {
            showAlert(`Erro ao definir senha: ${err.message}`, 'error');
        } finally {
            secBusy('setPass', false);
        }
    };

    // Copia link de convite para acesso à loja
    const handleCopyInviteLink = (user) => {
        const link = `${window.location.origin}/?ref=${user.$id}`;
        navigator.clipboard.writeText(link).then(() => {
            showAlert('Link de convite copiado!', 'success', null, 2000);
        });
    };

    // ── Fim Funções de Segurança ────────────────────────────────────────────

    const filteredUsers = users.filter(u => {
        // Proprietário não enxerga contas master
        if (isOwner && (u.role === 'master' || u.role === 'admin')) return false;

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
            <div className="glass-card" style={{ padding: '12px 16px', marginBottom: '16px', display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                {/* Campo de busca */}
                <div style={{ flex: 1, minWidth: '180px', background: 'rgba(0,0,0,0.2)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', padding: '0 12px' }}>
                    <Search size={14} color="#555" />
                    <input placeholder="Buscar por nome ou e-mail..." value={search} onChange={e => setSearch(e.target.value)} style={{ background: 'none', border: 'none', color: '#fff', padding: '8px 10px', width: '100%', outline: 'none', fontSize: '0.82rem' }} />
                </div>

                {/* Atualizar */}
                <button
                    onClick={loadData}
                    disabled={loading}
                    title="Atualizar Lista"
                    style={{ position: 'relative', padding: '8px 11px', borderRadius: '10px', background: newUsersCount > 0 ? 'rgba(34,197,94,0.15)' : 'rgba(255,255,255,0.05)', border: `1px solid ${newUsersCount > 0 ? 'rgba(34,197,94,0.4)' : 'rgba(255,255,255,0.08)'}`, color: newUsersCount > 0 ? '#22c55e' : '#aaa', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.3s' }}
                >
                    <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
                    {newUsersCount > 0 && (
                        <span style={{ position: 'absolute', top: '-6px', right: '-6px', background: '#22c55e', color: '#000', fontSize: '0.58rem', fontWeight: 900, width: '15px', height: '15px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {newUsersCount}
                        </span>
                    )}
                </button>

                {/* Novo Usuário */}
                <button
                    onClick={() => setCreateModal(true)}
                    style={{ padding: '8px 14px', borderRadius: '10px', background: '#D4AF37', border: 'none', color: '#000', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', whiteSpace: 'nowrap' }}
                >
                    <Plus size={14} /> Novo Usuário
                </button>

                {/* Filtros */}
                <div style={{ background: 'rgba(255,255,255,0.02)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.05)', padding: '3px', display: 'flex', gap: '2px' }}>
                    <button onClick={() => setRoleFilter('all')} style={{ padding: '6px 12px', borderRadius: '8px', border: 'none', background: roleFilter === 'all' ? 'rgba(255,255,255,0.07)' : 'transparent', color: roleFilter === 'all' ? '#fff' : '#555', fontWeight: 700, cursor: 'pointer', fontSize: '0.75rem', transition: '0.2s' }}>Todos</button>
                    {!isOwner && <button onClick={() => setRoleFilter('admin')} style={{ padding: '6px 12px', borderRadius: '8px', border: 'none', background: roleFilter === 'admin' ? 'rgba(168,85,247,0.1)' : 'transparent', color: roleFilter === 'admin' ? '#a855f7' : '#555', fontWeight: 700, cursor: 'pointer', fontSize: '0.75rem', transition: '0.2s' }}>Master</button>}
                    <button onClick={() => setRoleFilter('client')} style={{ padding: '6px 12px', borderRadius: '8px', border: 'none', background: roleFilter === 'client' ? 'rgba(34,197,94,0.1)' : 'transparent', color: roleFilter === 'client' ? '#22c55e' : '#555', fontWeight: 700, cursor: 'pointer', fontSize: '0.75rem', transition: '0.2s' }}>Clientes</button>
                </div>
            </div>
            {/* Barra de status de sincronização automática */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px', padding: '8px 16px', background: 'rgba(34,197,94,0.04)', border: '1px solid rgba(34,197,94,0.08)', borderRadius: '12px' }}>
                <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 6px #22c55e', flexShrink: 0, animation: 'pulse 2s infinite' }} />
                <span style={{ fontSize: '0.72rem', color: '#555', fontWeight: 700 }}>
                    Sincronização automática ativa · atualiza ao abrir a tela · {users.length} usuário{users.length !== 1 ? 's' : ''} no banco
                </span>
            </div>

            <div>
                <div>
                    <div className="custom-scroll" style={{ overflowX: 'auto', paddingBottom: '10px' }}>
                        <table className="desktop-only products-table" style={{ width: '100%', minWidth: '900px', borderCollapse: 'separate', borderSpacing: '0 10px' }}>
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
                                    <tr><td colSpan="8" style={{ textAlign: 'center', padding: '100px 20px', color: '#555', fontWeight: 800 }}>Nenhum usuário encontrado nesta categoria..</td></tr>
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
                                                color: (u.role === 'master' || u.role === 'admin') ? '#a855f7' : u.role === 'owner' ? '#D4AF37' : '#fff',
                                                background: (u.role === 'master' || u.role === 'admin') ? 'rgba(168, 85, 247, 0.1)' : u.role === 'owner' ? 'rgba(212, 175, 55, 0.15)' : 'rgba(255,255,255,0.05)',
                                                padding: '4px 10px', 
                                                borderRadius: '8px' 
                                            }}>
                                                {u.role === 'client' || !u.role ? 'CLIENTE' : u.role === 'owner' ? 'PROPRIETÁRIO' : 'MASTER'}
                                            </span>
                                        </td>
                                        <td style={{ padding: '12px 20px', borderRadius: '0 18px 18px 0', border: '1px solid rgba(255,255,255,0.05)', borderLeft: 'none', textAlign: 'right', overflow: 'visible' }}>
                                            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                                <button onClick={(e) => { e.stopPropagation(); setSelectedUser(u); setIsEditing(false); setDetailTab('perfil'); }} title="Ver Detalhes" style={{ padding: '8px', borderRadius: '10px', background: 'rgba(255,255,255,0.05)', border: 'none', color: '#fff', cursor: 'pointer' }}><Eye size={16} /></button>
                                                <button onClick={(e) => { e.stopPropagation(); setDeleteModal({ show: true, userId: u.$id, userName: u.full_name || u.name }); }} title="Excluir Usuário" style={{ padding: '8px', borderRadius: '10px', background: 'rgba(239, 68, 68, 0.1)', border: 'none', color: '#ef4444', cursor: 'pointer', zIndex: 20, position: 'relative' }}><Trash2 size={16} /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        <div className="mobile-only" style={{ flexDirection: 'column', gap: '10px' }}>
                            {filteredUsers.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '40px 20px', color: '#555', fontWeight: 800 }}>Nenhum usuário encontrado...</div>
                            ) : filteredUsers.map((u) => (
                                <motion.div 
                                    key={u.$id} 
                                    onClick={() => { setSelectedUser(u); setIsEditing(false); }}
                                    whileTap={{ scale: 0.98 }}
                                    style={{ 
                                        background: selectedUser?.$id === u.$id ? 'rgba(212, 175, 55, 0.08)' : 'rgba(255,255,255,0.02)', 
                                        borderRadius: '16px', 
                                        padding: '16px', 
                                        border: `1px solid ${selectedUser?.$id === u.$id ? 'rgba(212, 175, 55, 0.3)' : 'rgba(255,255,255,0.05)'}`,
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        justifyContent: 'space-between', 
                                        cursor: 'pointer', 
                                        transition: '0.2s',
                                        backdropFilter: 'blur(10px)'
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0, flex: 1 }}>
                                        <div style={{ width: '40px', height: '40px', flexShrink: 0, borderRadius: '12px', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, color: '#D4AF37', fontSize: '1rem', border: '1px solid rgba(255,255,255,0.05)' }}>
                                            {(u.full_name || u.name || 'U').charAt(0).toUpperCase()}
                                        </div>
                                        <div style={{ minWidth: 0 }}>
                                            <div style={{ fontWeight: 800, color: '#fff', fontSize: '0.95rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{u.full_name || u.name || 'Usuário'}</div>
                                            <div style={{ fontSize: '0.7rem', color: '#777', fontWeight: 600 }}>{u.whatsapp || u.email}</div>
                                        </div>
                                    </div>
                                    
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
                                        <span style={{ 
                                            fontSize: '0.65rem', 
                                            fontWeight: 900, 
                                            color: u.role === 'master' ? '#a855f7' : u.role === 'owner' ? '#D4AF37' : (u.role === 'admin' ? '#ef4444' : '#fff'),
                                            background: u.role === 'master' ? 'rgba(168, 85, 247, 0.1)' : u.role === 'owner' ? 'rgba(212, 175, 55, 0.15)' : (u.role === 'admin' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(255,255,255,0.05)'),
                                            padding: '4px 8px', 
                                            borderRadius: '8px' 
                                        }}>
                                            {u.role === 'client' || !u.role ? 'CLI' : u.role === 'owner' ? 'PRO' : 'MAS'}
                                        </span>
                                        <button onClick={(e) => { e.stopPropagation(); setDeleteModal({ show: true, userId: u.$id, userName: u.full_name || u.name }); }} title="Excluir" style={{ padding: '6px', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.1)', border: 'none', color: '#ef4444', cursor: 'pointer', zIndex: 20 }}><Trash2 size={16} /></button>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Drawer modal — detalhe do usuário */}
            <AnimatePresence>
                {selectedUser && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={(e) => { if (e.target === e.currentTarget) { setSelectedUser(null); setIsEditing(false); setDetailTab('perfil'); } }}
                        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)', zIndex: 200, display: 'flex', alignItems: 'stretch', justifyContent: 'flex-end' }}
                    >
                        <motion.div
                            key={selectedUser.$id}
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
                            style={{ width: '460px', maxWidth: '100vw', height: '100vh', padding: 0, overflowY: 'auto', display: 'flex', flexDirection: 'column', scrollbarWidth: 'none', background: 'rgba(10,10,10,0.99)', borderLeft: '1px solid rgba(255,255,255,0.08)' }}
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
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '5px' }}>
                                            <div>
                                                <div style={{ fontSize: '0.6rem', color: '#555', fontWeight: 900, textTransform: 'uppercase', marginBottom: '5px' }}>Nome Completo</div>
                                                <input value={editForm.full_name} onChange={e => setEditForm({...editForm, full_name: e.target.value})} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', padding: '10px', borderRadius: '12px', width: '100%', fontSize: '1rem', fontWeight: 900, outline: 'none' }} />
                                            </div>
                                            <div>
                                                <div style={{ fontSize: '0.6rem', color: currentRole === 'master' ? '#555' : '#333', fontWeight: 900, textTransform: 'uppercase', marginBottom: '5px' }}>
                                                    E-mail {currentRole !== 'master' && <span style={{ color: '#333', fontWeight: 600 }}>(somente leitura)</span>}
                                                </div>
                                                <input
                                                    type="email"
                                                    value={editForm.email}
                                                    onChange={e => currentRole === 'master' ? setEditForm({...editForm, email: e.target.value.toLowerCase().trim()}) : undefined}
                                                    readOnly={currentRole !== 'master'}
                                                    placeholder="email@exemplo.com"
                                                    style={{ background: 'rgba(255,255,255,0.05)', border: `1px solid ${currentRole === 'master' ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.03)'}`, color: currentRole === 'master' ? '#fff' : '#444', padding: '10px', borderRadius: '12px', width: '100%', fontSize: '0.9rem', outline: 'none', cursor: currentRole === 'master' ? 'text' : 'not-allowed' }}
                                                />
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            <h2 style={{ fontSize: '1.4rem', fontWeight: 900, color: '#fff', marginBottom: '5px' }}>{selectedUser.full_name || selectedUser.name}</h2>
                                            <p style={{ color: '#555', fontWeight: 800, fontSize: '0.85rem' }}>{selectedUser.email}</p>
                                        </>
                                    )}
                                </div>

                                {/* Tab switcher: Perfil | Segurança (Segurança visível apenas para master) */}
                                <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '0 20px' }}>
                                    {[{ id: 'perfil', label: 'Perfil', icon: <User size={13} /> }, ...(!isOwner ? [{ id: 'seguranca', label: 'Segurança', icon: <Shield size={13} /> }] : [])].map(tab => (
                                        <button key={tab.id} onClick={() => setDetailTab(tab.id)} style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '12px 16px', background: 'none', border: 'none', borderBottom: `2px solid ${detailTab === tab.id ? '#D4AF37' : 'transparent'}`, color: detailTab === tab.id ? '#D4AF37' : '#555', fontWeight: 700, fontSize: '0.78rem', cursor: 'pointer', transition: '0.2s', marginBottom: '-1px' }}>
                                            {tab.icon} {tab.label}
                                        </button>
                                    ))}
                                </div>

                                {detailTab === 'seguranca' ? (
                                <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

                                    {/* Status da conta */}
                                    <div style={{ background: selectedUser.is_blocked ? 'rgba(239,68,68,0.06)' : 'rgba(34,197,94,0.06)', border: `1px solid ${selectedUser.is_blocked ? 'rgba(239,68,68,0.2)' : 'rgba(34,197,94,0.15)'}`, borderRadius: '12px', padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            {selectedUser.is_blocked ? <ShieldOff size={18} color="#ef4444" /> : <ShieldCheck size={18} color="#22c55e" />}
                                            <div>
                                                <div style={{ fontSize: '0.78rem', fontWeight: 700, color: selectedUser.is_blocked ? '#ef4444' : '#22c55e' }}>{selectedUser.is_blocked ? 'Conta Bloqueada' : 'Conta Ativa'}</div>
                                                <div style={{ fontSize: '0.68rem', color: '#555' }}>{selectedUser.is_blocked ? 'Usuário não consegue fazer login' : 'Acesso liberado normalmente'}</div>
                                            </div>
                                        </div>
                                        <button onClick={() => handleToggleBlock(selectedUser)} disabled={securityLoading.block} style={{ padding: '7px 14px', borderRadius: '8px', border: 'none', background: selectedUser.is_blocked ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.12)', color: selectedUser.is_blocked ? '#22c55e' : '#ef4444', fontWeight: 700, fontSize: '0.72rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                            {securityLoading.block ? <Loader2 size={13} className="animate-spin" /> : selectedUser.is_blocked ? <><Unlock size={13} /> Liberar</> : <><Lock size={13} /> Bloquear</>}
                                        </button>
                                    </div>

                                    {/* Redefinição de senha */}
                                    <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', padding: '16px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                                            <KeyRound size={15} color="#D4AF37" />
                                            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#ccc' }}>Redefinição de Senha</span>
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                            <button onClick={() => handlePasswordRecoveryEmail(selectedUser)} disabled={securityLoading.email || !selectedUser.email} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', borderRadius: '9px', background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)', color: '#818cf8', fontWeight: 600, fontSize: '0.78rem', cursor: selectedUser.email ? 'pointer' : 'not-allowed', opacity: selectedUser.email ? 1 : 0.4 }}>
                                                {securityLoading.email ? <Loader2 size={14} className="animate-spin" /> : <Mail size={14} />}
                                                Enviar link por e-mail
                                                {selectedUser.email && <span style={{ marginLeft: 'auto', fontSize: '0.65rem', color: '#555', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '120px' }}>{selectedUser.email}</span>}
                                            </button>
                                            <button onClick={() => handlePasswordRecoveryWhatsApp(selectedUser)} disabled={securityLoading.whatsapp || !selectedUser.whatsapp} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', borderRadius: '9px', background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.15)', color: '#22c55e', fontWeight: 600, fontSize: '0.78rem', cursor: selectedUser.whatsapp ? 'pointer' : 'not-allowed', opacity: selectedUser.whatsapp ? 1 : 0.4 }}>
                                                {securityLoading.whatsapp ? <Loader2 size={14} className="animate-spin" /> : <MessageSquare size={14} />}
                                                Enviar link por WhatsApp
                                                {selectedUser.whatsapp && <span style={{ marginLeft: 'auto', fontSize: '0.65rem', color: '#555' }}>{selectedUser.whatsapp}</span>}
                                            </button>
                                        </div>
                                    </div>

                                    {/* Definir Nova Senha — apenas Master */}
                                    {currentRole === 'master' && (
                                    <div style={{ background: 'rgba(168,85,247,0.04)', border: '1px solid rgba(168,85,247,0.2)', borderRadius: '12px', padding: '16px' }}>
                                        <button
                                            onClick={() => setPasswordForm(p => ({ ...p, open: !p.open, newPassword: '', confirm: '' }))}
                                            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                                        >
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <KeyRound size={15} color="#a855f7" />
                                                <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#c084fc' }}>Definir Nova Senha</span>
                                                <span style={{ fontSize: '0.58rem', background: 'rgba(168,85,247,0.15)', color: '#a855f7', borderRadius: '4px', padding: '1px 6px', fontWeight: 700 }}>MASTER</span>
                                            </div>
                                            <span style={{ fontSize: '0.7rem', color: '#555' }}>{passwordForm.open ? '▲' : '▼'}</span>
                                        </button>
                                        {passwordForm.open && (
                                            <div style={{ marginTop: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                                <div style={{ fontSize: '0.65rem', color: '#666', lineHeight: 1.5 }}>
                                                    Define uma nova senha diretamente para este usuário. O usuário poderá fazer login imediatamente com a nova senha.
                                                </div>
                                                {/* Nova senha */}
                                                <div style={{ position: 'relative' }}>
                                                    <label style={{ fontSize: '0.6rem', color: '#555', fontWeight: 900, textTransform: 'uppercase', display: 'block', marginBottom: '5px' }}>Nova Senha</label>
                                                    <input
                                                        type={passwordForm.show ? 'text' : 'password'}
                                                        value={passwordForm.newPassword}
                                                        onChange={e => setPasswordForm(p => ({ ...p, newPassword: e.target.value }))}
                                                        placeholder="Mínimo 8 caracteres"
                                                        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(168,85,247,0.25)', color: '#fff', padding: '9px 36px 9px 12px', borderRadius: '9px', width: '100%', fontSize: '0.82rem', outline: 'none' }}
                                                    />
                                                    <button onClick={() => setPasswordForm(p => ({ ...p, show: !p.show }))} style={{ position: 'absolute', right: '10px', top: '28px', background: 'none', border: 'none', color: '#555', cursor: 'pointer', padding: 0 }}>
                                                        {passwordForm.show ? <EyeOff size={14} /> : <Eye size={14} />}
                                                    </button>
                                                </div>
                                                {/* Confirmar senha */}
                                                <div style={{ position: 'relative' }}>
                                                    <label style={{ fontSize: '0.6rem', color: '#555', fontWeight: 900, textTransform: 'uppercase', display: 'block', marginBottom: '5px' }}>Confirmar Senha</label>
                                                    <input
                                                        type={passwordForm.showConfirm ? 'text' : 'password'}
                                                        value={passwordForm.confirm}
                                                        onChange={e => setPasswordForm(p => ({ ...p, confirm: e.target.value }))}
                                                        placeholder="Repita a senha"
                                                        style={{ background: 'rgba(255,255,255,0.05)', border: `1px solid ${passwordForm.confirm && passwordForm.confirm !== passwordForm.newPassword ? 'rgba(239,68,68,0.5)' : 'rgba(168,85,247,0.25)'}`, color: '#fff', padding: '9px 36px 9px 12px', borderRadius: '9px', width: '100%', fontSize: '0.82rem', outline: 'none' }}
                                                    />
                                                    <button onClick={() => setPasswordForm(p => ({ ...p, showConfirm: !p.showConfirm }))} style={{ position: 'absolute', right: '10px', top: '28px', background: 'none', border: 'none', color: '#555', cursor: 'pointer', padding: 0 }}>
                                                        {passwordForm.showConfirm ? <EyeOff size={14} /> : <Eye size={14} />}
                                                    </button>
                                                </div>
                                                {/* Botão confirmar */}
                                                <button
                                                    onClick={handleSetPassword}
                                                    disabled={securityLoading.setPass || !passwordForm.newPassword || !passwordForm.confirm}
                                                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '10px 14px', borderRadius: '9px', background: 'rgba(168,85,247,0.15)', border: '1px solid rgba(168,85,247,0.35)', color: '#c084fc', fontWeight: 700, fontSize: '0.78rem', cursor: 'pointer', opacity: (!passwordForm.newPassword || !passwordForm.confirm) ? 0.4 : 1 }}
                                                >
                                                    {securityLoading.setPass ? <Loader2 size={14} className="animate-spin" /> : <KeyRound size={14} />}
                                                    Definir Senha
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                    )}

                                    {/* Políticas de senha */}
                                    <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', padding: '16px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                                            <ShieldAlert size={15} color="#D4AF37" />
                                            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#ccc' }}>Políticas de Acesso</span>
                                        </div>
                                        {/* Forçar troca de senha */}
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                                            <div>
                                                <div style={{ fontSize: '0.76rem', color: '#ccc', fontWeight: 600 }}>Forçar troca de senha</div>
                                                <div style={{ fontSize: '0.67rem', color: '#555' }}>Usuário deve redefinir no próximo login</div>
                                            </div>
                                            <button onClick={() => handleForcePasswordChange(selectedUser)} disabled={securityLoading.forcePass} style={{ width: '42px', height: '24px', borderRadius: '12px', border: 'none', background: selectedUser.force_password_change ? '#D4AF37' : 'rgba(255,255,255,0.1)', cursor: 'pointer', position: 'relative', transition: '0.2s' }}>
                                                {securityLoading.forcePass ? <Loader2 size={12} className="animate-spin" style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', color: '#fff' }} /> : <div style={{ width: '18px', height: '18px', borderRadius: '50%', background: '#fff', position: 'absolute', top: '3px', left: selectedUser.force_password_change ? '21px' : '3px', transition: '0.2s' }} />}
                                            </button>
                                        </div>
                                        {/* MFA — apenas para master/owner */}
                                        {(selectedUser.role === 'master' || selectedUser.role === 'owner') && (
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0' }}>
                                                <div>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                        <span style={{ fontSize: '0.76rem', color: '#ccc', fontWeight: 600 }}>Autenticação em dois fatores</span>
                                                        <span style={{ fontSize: '0.6rem', background: 'rgba(168,85,247,0.15)', color: '#a855f7', borderRadius: '4px', padding: '1px 5px', fontWeight: 700 }}>MFA</span>
                                                    </div>
                                                    <div style={{ fontSize: '0.67rem', color: '#555' }}>Recomendado para Master e Proprietário</div>
                                                </div>
                                                <button onClick={() => handleToggleMFA(selectedUser)} disabled={securityLoading.mfa} style={{ width: '42px', height: '24px', borderRadius: '12px', border: 'none', background: selectedUser.mfa_required ? '#a855f7' : 'rgba(255,255,255,0.1)', cursor: 'pointer', position: 'relative', transition: '0.2s' }}>
                                                    {securityLoading.mfa ? <Loader2 size={12} className="animate-spin" style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', color: '#fff' }} /> : <div style={{ width: '18px', height: '18px', borderRadius: '50%', background: '#fff', position: 'absolute', top: '3px', left: selectedUser.mfa_required ? '21px' : '3px', transition: '0.2s' }} />}
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    {/* Ações rápidas */}
                                    <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', padding: '16px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                                            <Link size={15} color="#D4AF37" />
                                            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#ccc' }}>Ações Rápidas</span>
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                            <button onClick={() => handleCopyInviteLink(selectedUser)} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', borderRadius: '9px', background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.15)', color: '#D4AF37', fontWeight: 600, fontSize: '0.78rem', cursor: 'pointer' }}>
                                                <Copy size={14} /> Copiar link de convite
                                            </button>
                                            <button onClick={() => setDeleteModal({ show: true, userId: selectedUser.$id, userName: selectedUser.full_name || selectedUser.name })} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', borderRadius: '9px', background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.12)', color: '#ef4444', fontWeight: 600, fontSize: '0.78rem', cursor: 'pointer' }}>
                                                <Trash2 size={14} /> Excluir conta permanentemente
                                            </button>
                                        </div>
                                    </div>

                                    {/* Info último acesso */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: '10px' }}>
                                        <Clock size={13} color="#444" />
                                        <span style={{ fontSize: '0.7rem', color: '#555' }}>
                                            Perfil atualizado em: {selectedUser.$updatedAt ? new Date(selectedUser.$updatedAt).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}
                                        </span>
                                    </div>
                                </div>
                                ) : (
                                <div style={{ padding: '30px', display: 'flex', flexDirection: 'column', gap: '25px' }}>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                        <div 
                                            onClick={() => setShowUserOrdersModal(true)}
                                            style={{ background: 'rgba(212, 175, 55, 0.1)', padding: '15px', borderRadius: '16px', border: '1px solid rgba(212, 175, 55, 0.2)', cursor: 'pointer', transition: 'all 0.2s' }}
                                            className="hover-scale"
                                        >
                                            <div style={{ fontSize: '0.6rem', color: '#D4AF37', fontWeight: 900, textTransform: 'uppercase', marginBottom: '5px' }}>Total Pedidos</div>
                                            <div style={{ fontSize: '1.2rem', fontWeight: 900, color: '#fff', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                {getUserOrderCount(selectedUser.$id)}
                                                <ShoppingBag size={18} />
                                            </div>
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
                                                onClick={() => isEditing ? setEditForm({...editForm, role: 'owner'}) : setRoleModal({ show: true, userId: selectedUser.$id, userName: selectedUser.full_name || selectedUser.name, newRole: 'owner' })}
                                                style={{ flex: 1, padding: '12px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', background: (isEditing ? editForm.role === 'owner' : selectedUser.role === 'owner') ? 'rgba(212, 175, 55, 0.15)' : 'transparent', color: (isEditing ? editForm.role === 'owner' : selectedUser.role === 'owner') ? '#D4AF37' : '#444', fontWeight: 900, fontSize: '0.7rem', cursor: 'pointer' }}
                                            >
                                                PROPRIETÁRIO
                                            </button>
                                            {!isOwner && (
                                            <button
                                                onClick={() => isEditing ? setEditForm({...editForm, role: 'master'}) : setRoleModal({ show: true, userId: selectedUser.$id, userName: selectedUser.full_name || selectedUser.name, newRole: 'master' })}
                                                style={{ flex: 1, padding: '12px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', background: (isEditing ? editForm.role === 'master' : selectedUser.role === 'master') ? 'rgba(168, 85, 247, 0.1)' : 'transparent', color: (isEditing ? editForm.role === 'master' : selectedUser.role === 'master') ? '#a855f7' : '#444', fontWeight: 900, fontSize: '0.7rem', cursor: 'pointer' }}
                                            >
                                                MASTER
                                            </button>
                                            )}
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
                                )}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

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
                                        <input required type="text" value={newUserForm.email} onChange={e => setNewUserForm({...newUserForm, email: e.target.value.toLowerCase()})} placeholder="exemplo@email.com" style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', padding: '12px', borderRadius: '12px', outline: 'none' }} />
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
                                            <option value="owner" style={{ background: '#111' }}>Proprietário</option>
                                            {!isOwner && <option value="master" style={{ background: '#111' }}>Master</option>}
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
                                Você deseja alterar o nível de acesso de <strong style={{ color: '#fff' }}>{roleModal.userName}</strong> para <strong style={{ color: roleModal.newRole === 'master' ? '#a855f7' : roleModal.newRole === 'owner' ? '#D4AF37' : '#22c55e' }}>{roleModal.newRole === 'master' ? 'MASTER' : roleModal.newRole === 'owner' ? 'PROPRIETÁRIO' : 'CLIENTE'}</strong>?
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
                {showUserOrdersModal && (
                    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(15px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: '20px' }}>
                        <motion.div 
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 30 }}
                            className="glass-card" 
                            style={{ maxWidth: '1000px', width: '100%', maxHeight: '90vh', display: 'flex', flexDirection: 'column', padding: '0', border: '1px solid rgba(255,255,255,0.1)', overflow: 'hidden' }}
                        >
                            <div style={{ padding: '25px 30px', borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(212,175,55,0.05)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                                    <div>
                                        <h3 style={{ fontSize: '1.4rem', fontWeight: 900, color: '#fff', margin: 0 }}>Portal do Cliente</h3>
                                        <p style={{ margin: '5px 0 0', color: '#888', fontSize: '0.85rem' }}>Analisando: <strong style={{ color: '#D4AF37' }}>{selectedUser.full_name || selectedUser.name}</strong></p>
                                    </div>
                                    <button onClick={() => { setShowUserOrdersModal(false); setModalTab('pedidos'); }} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', borderRadius: '12px', padding: '10px', color: '#fff', cursor: 'pointer' }} className="hover-scale">
                                        <X size={24} />
                                    </button>
                                </div>

                                <div style={{ display: 'flex', gap: '10px', background: 'rgba(0,0,0,0.2)', padding: '5px', borderRadius: '16px', width: 'fit-content' }}>
                                    <button onClick={() => setModalTab('pedidos')} style={{ padding: '10px 25px', borderRadius: '12px', border: 'none', background: modalTab === 'pedidos' ? '#D4AF37' : 'transparent', color: modalTab === 'pedidos' ? '#000' : '#666', fontWeight: 900, fontSize: '0.75rem', cursor: 'pointer', transition: '0.3s' }}>
                                        HISTÓRICO DE PEDIDOS
                                    </button>
                                    <button onClick={() => setModalTab('dashboard')} style={{ padding: '10px 25px', borderRadius: '12px', border: 'none', background: modalTab === 'dashboard' ? '#D4AF37' : 'transparent', color: modalTab === 'dashboard' ? '#000' : '#666', fontWeight: 900, fontSize: '0.75rem', cursor: 'pointer', transition: '0.3s' }}>
                                        DASHBOARD ANALÍTICO
                                    </button>
                                </div>
                            </div>

                            <div style={{ flex: 1, overflowY: 'auto', padding: '30px' }}>
                                {modalTab === 'pedidos' ? (
                                    getUserOrders(selectedUser.$id).length === 0 ? (
                                        <div style={{ textAlign: 'center', padding: '60px', color: '#444' }}>
                                            <ShoppingBag size={50} style={{ marginBottom: '20px', opacity: 0.2 }} />
                                            <p style={{ fontWeight: 800 }}>Este usuário ainda não realizou nenhum pedido.</p>
                                        </div>
                                    ) : (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                            {getUserOrders(selectedUser.$id).map((order) => (
                                                <div key={order.$id} className="glass-card" style={{ padding: '0', background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.05)', overflow: 'hidden' }}>
                                                    <div 
                                                        onClick={() => setExpandedOrderId(expandedOrderId === order.$id ? null : order.$id)}
                                                        style={{ padding: '20px 25px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
                                                    >
                                                        <div style={{ display: 'flex', gap: '30px', alignItems: 'center' }}>
                                                            <div>
                                                                <div style={{ fontSize: '0.6rem', color: '#555', fontWeight: 900 }}>Nº PEDIDO</div>
                                                                <div style={{ fontWeight: 900, color: '#fff' }}>#{order.$id.slice(-6).toUpperCase()}</div>
                                                            </div>
                                                            <div>
                                                                <div style={{ fontSize: '0.6rem', color: '#555', fontWeight: 900 }}>DATA</div>
                                                                <div style={{ fontSize: '0.85rem', color: '#888' }}>{formatDate(order.$createdAt, 'full')}</div>
                                                            </div>
                                                            <div>
                                                                <div style={{ fontSize: '0.6rem', color: '#555', fontWeight: 900 }}>TOTAL</div>
                                                                <div style={{ fontWeight: 900, color: '#fff' }}>
                                                                    R$ {(() => {
                                                                        const amount = Number(order.total_amount || 0);
                                                                        if (amount > 0) return amount.toFixed(2);
                                                                        try {
                                                                            const items = typeof order.items === 'string' ? JSON.parse(order.items) : (order.items || []);
                                                                            return items.reduce((acc, item) => acc + (item.price * item.quantity), 0).toFixed(2);
                                                                        } catch (e) { return '0.00'; }
                                                                    })()}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div style={{ color: '#D4AF37' }}>
                                                            {expandedOrderId === order.$id ? <Eye size={20} style={{ opacity: 0.5 }} /> : <Eye size={20} />}
                                                        </div>
                                                    </div>

                                                    <AnimatePresence>
                                                        {expandedOrderId === order.$id && (
                                                            <motion.div 
                                                                initial={{ height: 0, opacity: 0 }}
                                                                animate={{ height: 'auto', opacity: 1 }}
                                                                exit={{ height: 0, opacity: 0 }}
                                                                style={{ borderTop: '1px solid rgba(255,255,255,0.05)', background: 'rgba(0,0,0,0.2)', padding: '25px' }}
                                                            >
                                                                <h4 style={{ margin: '0 0 15px', fontSize: '0.75rem', color: '#555', fontWeight: 900 }}>ITENS DO PEDIDO</h4>
                                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                                                    <div style={{ display: 'grid', gridTemplateColumns: '50px 140px 1fr 100px', gap: '15px', padding: '0 5px 10px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                                                        <div style={{ fontSize: '0.65rem', color: '#aaa', fontWeight: 900 }}>QTD</div>
                                                                        <div style={{ fontSize: '0.65rem', color: '#aaa', fontWeight: 900 }}>CÓD. EXTERNO</div>
                                                                        <div style={{ fontSize: '0.65rem', color: '#aaa', fontWeight: 900 }}>NOME ITEM</div>
                                                                        <div style={{ fontSize: '0.65rem', color: '#aaa', fontWeight: 900, textAlign: 'right' }}>PREÇO</div>
                                                                    </div>
                                                                    {(() => {
                                                                        try {
                                                                            const items = typeof order.items === 'string' ? JSON.parse(order.items) : (order.items || []);
                                                                            return items.map((item, idx) => (
                                                                                <div key={idx} style={{ display: 'grid', gridTemplateColumns: '50px 140px 1fr 100px', gap: '15px', alignItems: 'center', padding: '0 5px' }}>
                                                                                    <div style={{ fontWeight: 900, color: '#D4AF37', fontSize: '0.9rem' }}>{item.quantity}x</div>
                                                                                    <div style={{ color: '#fff', fontSize: '0.8rem', fontFamily: 'monospace', fontWeight: 700 }}>{item.external_code || '---'}</div>
                                                                                    <div style={{ color: '#fff', fontSize: '0.9rem', fontWeight: 500 }}>{item.title}</div>
                                                                                    <div style={{ fontWeight: 800, textAlign: 'right', color: '#fff', fontSize: '0.9rem' }}>R$ {(item.price * item.quantity).toFixed(2)}</div>
                                                                                </div>
                                                                            ));
                                                                        } catch (e) {
                                                                            return <div style={{ color: '#ef4444', fontSize: '0.8rem' }}>Erro ao carregar itens</div>;
                                                                        }
                                                                    })()}
                                                                </div>
                                                            </motion.div>
                                                        )}
                                                    </AnimatePresence>
                                                </div>
                                            ))}
                                        </div>
                                    )
                                ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
                                        {(() => {
                                            const stats = analyzeUserData(getUserOrders(selectedUser.$id));
                                            if (getUserOrders(selectedUser.$id).length === 0) return <p style={{ textAlign: 'center', color: '#444', fontWeight: 800 }}>Dados insuficientes para gerar dashboard.</p>;

                                            return (
                                                <>
                                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '25px' }}>
                                                        <div className="glass-card" style={{ padding: '25px', background: 'rgba(255,255,255,0.02)' }}>
                                                            <h4 style={{ fontSize: '0.8rem', fontWeight: 900, color: '#D4AF37', marginBottom: '20px', textTransform: 'uppercase' }}>Produtos Mais Comprados (Faturamento)</h4>
                                                            <div style={{ height: '250px' }}>
                                                                <ResponsiveContainer width="100%" height="100%">
                                                                    <BarChart data={stats.topByValue} layout="vertical">
                                                                        <XAxis type="number" hide />
                                                                        <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 10, fill: '#666' }} />
                                                                        <Tooltip content={<CustomTooltip />} />
                                                                        <Bar dataKey="value" name="Valor Total" fill="#D4AF37" radius={[0, 4, 4, 0]} />
                                                                        <Bar dataKey="qty" name="Qtd Vendida" fill="#ffffff20" radius={[0, 4, 4, 0]} />
                                                                    </BarChart>
                                                                </ResponsiveContainer>
                                                            </div>
                                                        </div>
                                                        <div className="glass-card" style={{ padding: '25px', background: 'rgba(255,255,255,0.02)' }}>
                                                            <h4 style={{ fontSize: '0.8rem', fontWeight: 900, color: '#00AEEF', marginBottom: '20px', textTransform: 'uppercase' }}>Ranking de Recorrência</h4>
                                                            <div style={{ height: '250px' }}>
                                                                <ResponsiveContainer width="100%" height="100%">
                                                                    <BarChart data={stats.recurrenceRanking}>
                                                                        <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#666' }} height={50} />
                                                                        <YAxis tick={{ fontSize: 10, fill: '#666' }} />
                                                                        <Tooltip content={<CustomTooltip />} />
                                                                        <Bar dataKey="recurrence" name="Frequência (Vezes)" fill="#00AEEF" radius={[4, 4, 0, 0]} />
                                                                    </BarChart>
                                                                </ResponsiveContainer>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="glass-card" style={{ padding: '25px', background: 'rgba(255,255,255,0.02)' }}>
                                                        <h4 style={{ fontSize: '0.8rem', fontWeight: 900, color: '#8B5CF6', marginBottom: '20px', textTransform: 'uppercase' }}>Padrão de Compra: Horários e Dias</h4>
                                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
                                                            <div>
                                                                <p style={{ fontSize: '0.7rem', color: '#555', fontWeight: 900, marginBottom: '15px' }}>FREQUÊNCIA POR DIA DA SEMANA</p>
                                                                <div style={{ height: '200px' }}>
                                                                    <ResponsiveContainer width="100%" height="100%">
                                                                        <AreaChart data={stats.daysData}>
                                                                            <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#666' }} />
                                                                            <Tooltip content={<CustomTooltip />} />
                                                                            <Area type="monotone" dataKey="count" name="Pedidos" stroke="#8B5CF6" fill="rgba(139, 92, 246, 0.1)" strokeWidth={3} />
                                                                        </AreaChart>
                                                                    </ResponsiveContainer>
                                                                </div>
                                                            </div>
                                                            <div>
                                                                <p style={{ fontSize: '0.7rem', color: '#555', fontWeight: 900, marginBottom: '15px' }}>FREQUÊNCIA POR HORA DO DIA</p>
                                                                <div style={{ height: '200px' }}>
                                                                    <ResponsiveContainer width="100%" height="100%">
                                                                        <AreaChart data={stats.hoursData}>
                                                                            <XAxis dataKey="hour" tick={{ fontSize: 10, fill: '#666' }} />
                                                                            <Tooltip content={<CustomTooltip />} />
                                                                            <Area type="monotone" dataKey="count" name="Pedidos" stroke="#fff" fill="rgba(255,255,255,0.05)" strokeWidth={3} />
                                                                        </AreaChart>
                                                                    </ResponsiveContainer>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px' }}>
                                                        <div className="glass-card" style={{ padding: '20px', textAlign: 'center', background: 'rgba(139, 92, 246, 0.05)', border: '1px solid rgba(139, 92, 246, 0.1)' }}>
                                                            <div style={{ fontSize: '0.6rem', color: '#8B5CF6', fontWeight: 900 }}>TOP DIA</div>
                                                            <div style={{ fontSize: '1.2rem', fontWeight: 900, color: '#fff' }}>{stats.daysData.sort((a,b) => b.count - a.count)[0].day}</div>
                                                        </div>
                                                        <div className="glass-card" style={{ padding: '20px', textAlign: 'center', background: 'rgba(0, 174, 239, 0.05)', border: '1px solid rgba(0, 174, 239, 0.1)' }}>
                                                            <div style={{ fontSize: '0.6rem', color: '#00AEEF', fontWeight: 900 }}>HORÁRIO PICO</div>
                                                            <div style={{ fontSize: '1.2rem', fontWeight: 900, color: '#fff' }}>{stats.hoursData.sort((a,b) => b.count - a.count)[0].hour}</div>
                                                        </div>
                                                        <div className="glass-card" style={{ padding: '20px', textAlign: 'center', background: 'rgba(212, 175, 55, 0.05)', border: '1px solid rgba(212, 175, 55, 0.1)' }}>
                                                            <div style={{ fontSize: '0.6rem', color: '#D4AF37', fontWeight: 900 }}>TOTAL PRODUTOS</div>
                                                            <div style={{ fontSize: '1.2rem', fontWeight: 900, color: '#fff' }}>{Object.keys(stats.productStats).length}</div>
                                                        </div>
                                                    </div>

                                                    <div className="glass-card" style={{ padding: '25px', background: 'rgba(255,255,255,0.02)' }}>
                                                        <h4 style={{ fontSize: '0.8rem', fontWeight: 900, color: '#10B981', marginBottom: '20px', textTransform: 'uppercase' }}>Volume de Compras por Mês</h4>
                                                        <div style={{ height: '200px' }}>
                                                            <ResponsiveContainer width="100%" height="100%">
                                                                <AreaChart data={stats.monthsData}>
                                                                    <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#666' }} />
                                                                    <YAxis tick={{ fontSize: 10, fill: '#666' }} />
                                                                    <Tooltip content={<CustomTooltip />} />
                                                                    <Area type="step" dataKey="count" name="Pedidos" stroke="#10B981" fill="rgba(16, 185, 129, 0.05)" strokeWidth={2} />
                                                                </AreaChart>
                                                            </ResponsiveContainer>
                                                        </div>
                                                    </div>
                                                </>
                                            );
                                        })()}
                                    </div>
                                )}
                            </div>
                            
                            <div style={{ padding: '20px 30px', background: 'rgba(0,0,0,0.2)', borderTop: '1px solid rgba(255,255,255,0.05)', textAlign: 'right' }}>
                                <button onClick={() => { setShowUserOrdersModal(false); setModalTab('pedidos'); }} style={{ padding: '12px 30px', borderRadius: '12px', background: '#D4AF37', border: 'none', color: '#000', fontWeight: 900, cursor: 'pointer' }}>
                                    FECHAR
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
                            style={{ maxWidth: '300px', width: '100%', padding: '30px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }}
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
                                    style={{ flex: 1, padding: '12px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: '#fff', fontWeight: 900, fontSize: '0.75rem', cursor: 'pointer' }}
                                >
                                    CANCELAR
                                </button>
                                <button 
                                    onClick={confirmDelete}
                                    disabled={isDeleting}
                                    style={{ flex: 1, padding: '12px', borderRadius: '12px', border: 'none', background: '#ef4444', color: '#fff', fontWeight: 900, fontSize: '0.75rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                                >
                                    {isDeleting ? <Loader2 size={16} className="animate-spin" /> : 'EXCLUIR'}
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
