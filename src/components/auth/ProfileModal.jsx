
import React, { useState, useEffect } from 'react';
import { account, databases } from '../../lib/appwrite';
import { ID, Query } from 'appwrite';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useAlert } from '../../context/AlertContext';
import { X, Save, Loader2, User, Mail, Smartphone, CheckCircle, Key, Send, Calendar } from 'lucide-react';
import '../../pages/Admin.css';

export default function ProfileModal({ isOpen, onClose, user }) {
    const navigate = useNavigate();
    const location = useLocation();
    const { updateProfile, resetPassword } = useAuth();
    const { showAlert } = useAlert();
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [success, setSuccess] = useState(false);
    const [resetLoading, setResetLoading] = useState(false);
    const [resetSent, setResetSent] = useState(false);

    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        whatsapp: '',
        birthday: ''
    });
    const [profileId, setProfileId] = useState(null);

    // Initial Load e Trava de Scroll
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
            if (user) {
                fetchProfile();
                setSuccess(false);
                setResetSent(false);
            }
        } else {
            document.body.style.overflow = 'auto';
        }
        
        return () => {
            document.body.style.overflow = 'auto';
        };
    }, [isOpen, user]);

    // Fechar automaticamente caso a pessoa navegue no background
    useEffect(() => {
        if (isOpen) {
            onClose();
        }
    }, [location.pathname]);

    const handleWhatsAppChange = (e) => {
        let value = e.target.value.replace(/\D/g, '');
        if (value.length > 11) value = value.slice(0, 11);

        let formatted = value;
        if (value.length > 2) formatted = `(${value.slice(0, 2)}) ${value.slice(2)}`;
        if (value.length > 7) formatted = `(${value.slice(0, 2)}) ${value.slice(2, 7)}-${value.slice(7)}`;

        setFormData({ ...formData, whatsapp: formatted });
    };

    const handleBirthdayChange = (e) => {
        let value = e.target.value.replace(/\D/g, '');
        if (value.length > 8) value = value.slice(0, 8);

        let formatted = value;
        if (value.length > 2) formatted = `${value.slice(0, 2)}/${value.slice(2)}`;
        if (value.length > 4) formatted = `${value.slice(0, 2)}/${value.slice(2, 4)}/${value.slice(4)}`;

        setFormData({ ...formData, birthday: formatted });
    };

    const fetchProfile = async () => {
        if (!user?.$id) return;
        try {
            setLoading(true);
            let profile = null;

            try {
                profile = await databases.getDocument(
                    import.meta.env.VITE_DATABASE_ID,
                    import.meta.env.VITE_COLLECTION_PROFILES || 'profiles',
                    user.$id
                );
            } catch (e) {
                try {
                    const response = await databases.listDocuments(
                        import.meta.env.VITE_DATABASE_ID,
                        import.meta.env.VITE_COLLECTION_PROFILES || 'profiles',
                        [Query.equal('user_id', user.$id)]
                    );
                    if (response.documents.length > 0) {
                        profile = response.documents[0];
                    }
                } catch (idxError) {
                    console.error("Error querying profile:", idxError);
                }
            }

            if (profile) {
                // Convert ISO YYYY-MM-DD to DD/MM/YYYY
                let displayBirthday = '';
                if (profile.birthday) {
                    const [year, month, day] = profile.birthday.split('-');
                    displayBirthday = `${day}/${month}/${year}`;
                }

                setFormData({
                    first_name: profile.first_name || '',
                    last_name: profile.last_name || '',
                    whatsapp: profile.whatsapp || '',
                    birthday: displayBirthday,
                    address_cep: profile.address_cep || '',
                    address_street: profile.address_street || '',
                    address_neighborhood: profile.address_neighborhood || '',
                    address_city: profile.address_city || '',
                    address_state: profile.address_state || '',
                    address_number: profile.address_number || '',
                    address_complement: profile.address_complement || ''
                });
                setProfileId(profile.$id);
            } else {
                const parts = (user?.name || user?.user_metadata?.full_name || '').split(' ');
                setFormData({
                    first_name: parts[0] || '',
                    last_name: parts.slice(1).join(' ') || '',
                    whatsapp: '',
                    birthday: '',
                    address_cep: '',
                    address_street: '',
                    address_neighborhood: '',
                    address_city: '',
                    address_state: '',
                    address_number: '',
                    address_complement: ''
                });
                setProfileId(null);
            }
        } catch (error) {
            console.error("Error in fetchProfile:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e) => {
        if (e) e.preventDefault();
        if (!user || !user.$id) return;

        if (!formData.birthday) {
            showAlert('Churrasqueiro(a), sua data de aniversário é obrigatória! 🎂', 'error', 'Campo Obrigatório');
            return;
        }

        try {
            setSaving(true);
            const fullName = `${formData.first_name} ${formData.last_name || ''}`.trim();

            // Convert DD/MM/YYYY back to YYYY-MM-DD
            let isoBirthday = null;
            if (formData.birthday && formData.birthday.length === 10) {
                const [day, month, year] = formData.birthday.split('/');
                isoBirthday = `${year}-${month}-${day}`;
            }

            const data = {
                first_name: formData.first_name,
                last_name: formData.last_name,
                full_name: fullName,
                whatsapp: formData.whatsapp,
                birthday: isoBirthday,
                address_cep: formData.address_cep,
                address_street: formData.address_street,
                address_neighborhood: formData.address_neighborhood,
                address_city: formData.address_city,
                address_state: formData.address_state,
                address_number: formData.address_number,
                address_complement: formData.address_complement
            };

            const result = await updateProfile(data, profileId);

            if (result.error) {
                throw result.error;
            }

            // Sync name with Auth account (independent from profile doc)
            if (fullName) {
                try {
                    await account.updateName(fullName);
                } catch (nameErr) {
                    console.warn("[ProfileModal] Could not update Auth name:", nameErr);
                }
            }

            setSuccess(true);
            setTimeout(() => {
                setSuccess(false);
                onClose();
                navigate('/');
            }, 1500);

        } catch (error) {
            console.error("Error saving profile:", error);
            let msg = error.message;
            if (error.code === 403 || error.code === 401) {
                msg = "Você ainda não tem permissão para editar este perfil. Tente deslogar e logar novamente para atualizar suas permissões.";
            }
            showAlert(msg, 'error', 'Erro ao Salvar');
        } finally {
            setSaving(false);
        }
    };

    const handlePasswordChangeRequest = async () => {
        if (!user?.email) return;
        try {
            setResetLoading(true);
            await resetPassword(user.email);
            setResetSent(true);
        } catch (error) {
            console.error("Password change error:", error);
            showAlert("Erro ao solicitar troca de senha.", "error");
        } finally {
            setResetLoading(false);
        }
    };

    if (!isOpen) return null;

    const userEmail = user?.email || "";

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()} style={{ width: '600px', maxWidth: '95%' }}>
                <div className="modal-header">
                    <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <User size={24} /> Meus Dados
                    </h2>
                    <button className="close-btn" onClick={onClose} title="Fechar">
                        <X size={24} />
                    </button>
                </div>
                
                <div className="modal-body">
                    {loading ? (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px' }}>
                            <Loader2 className="animate-spin" size={40} color="var(--primary-color)" />
                            <p style={{ marginTop: '15px', color: 'var(--text-muted)' }}>Buscando suas informações...</p>
                        </div>
                    ) : (
                        <form onSubmit={handleSave} className="product-form">
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                            <div className="form-group">
                                <label>Nome</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.first_name}
                                    onChange={e => setFormData({ ...formData, first_name: e.target.value })}
                                    placeholder="Ex: João"
                                />
                            </div>
                            <div className="form-group">
                                <label>Sobrenome</label>
                                <input
                                    type="text"
                                    value={formData.last_name}
                                    onChange={e => setFormData({ ...formData, last_name: e.target.value })}
                                    placeholder="Ex: Silva"
                                />
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                            <div className="form-group">
                                <label>WhatsApp</label>
                                <div style={{ position: 'relative' }}>
                                    <Smartphone size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#666' }} />
                                    <input
                                        type="tel"
                                        style={{ paddingLeft: '40px' }}
                                        value={formData.whatsapp}
                                        onChange={handleWhatsAppChange}
                                        placeholder="(11) 99999-9999"
                                    />
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Data de Aniversário</label>
                                <div style={{ position: 'relative' }}>
                                    <Calendar size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#666' }} />
                                    <input
                                        type="text"
                                        style={{ paddingLeft: '40px' }}
                                        value={formData.birthday}
                                        onChange={handleBirthdayChange}
                                        placeholder="DD/MM/AAAA"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Endereço Padrão (Opcional) */}
                        <div style={{ marginTop: '5px', marginBottom: '15px' }}>
                            <h4 style={{ color: 'var(--primary-color)', fontSize: '0.9rem', marginBottom: '10px' }}>Endereço Padrão (Opcional)</h4>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '15px', marginBottom: '10px' }}>
                                <div className="form-group">
                                    <label>CEP</label>
                                    <input
                                        type="text"
                                        value={formData.address_cep}
                                        onChange={e => {
                                            let rawCep = e.target.value.replace(/\D/g, '');
                                            let maskedCep = rawCep;
                                            if (rawCep.length > 5) {
                                                maskedCep = `${rawCep.slice(0, 5)}-${rawCep.slice(5, 8)}`;
                                            }
                                            setFormData(prev => ({ ...prev, address_cep: maskedCep }));

                                            // Auto fetch se chegar a 8
                                            if (rawCep.length === 8) {
                                                fetch(`https://viacep.com.br/ws/${rawCep}/json/`)
                                                    .then(res => res.json())
                                                    .then(data => {
                                                        if (!data.erro) {
                                                            setFormData(p => ({
                                                                ...p,
                                                                address_street: data.logradouro || '',
                                                                address_neighborhood: data.bairro || '',
                                                                address_city: data.localidade || '',
                                                                address_state: data.uf || ''
                                                            }));
                                                        }
                                                    })
                                                    .catch(err => console.log('ViaCEP Error:', err));
                                            }
                                        }}
                                        placeholder="XXXXX-XXX"
                                        maxLength={9}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Rua/Logradouro</label>
                                    <input
                                        type="text"
                                        value={formData.address_street}
                                        onChange={e => setFormData({ ...formData, address_street: e.target.value })}
                                        placeholder="Rua Exemplo"
                                    />
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '10px' }}>
                                <div className="form-group">
                                    <label>Número</label>
                                    <input
                                        type="text"
                                        value={formData.address_number}
                                        onChange={e => setFormData({ ...formData, address_number: e.target.value })}
                                        placeholder="123"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Bairro</label>
                                    <input
                                        type="text"
                                        value={formData.address_neighborhood}
                                        onChange={e => setFormData({ ...formData, address_neighborhood: e.target.value })}
                                        placeholder="Centro"
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Complemento/Ponto de Referência</label>
                                <input
                                    type="text"
                                    value={formData.address_complement}
                                    onChange={e => setFormData({ ...formData, address_complement: e.target.value })}
                                    placeholder="Apto 101, Ao lado da padaria..."
                                />
                            </div>
                        </div>

                        <div className="form-group" style={{ marginBottom: '25px' }}>
                            <label>Email (Somente Leitura)</label>
                            <div style={{ position: 'relative' }}>
                                <Mail size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#666' }} />
                                <input
                                    type="email"
                                    readOnly
                                    value={userEmail}
                                    style={{ paddingLeft: '40px', backgroundColor: '#1a1a1a', cursor: 'not-allowed', color: '#888' }}
                                />
                            </div>
                        </div>

                        <div style={{
                            padding: '20px',
                            background: 'rgba(212, 175, 55, 0.05)',
                            borderRadius: '8px',
                            border: '1px dashed rgba(212, 175, 55, 0.2)',
                            marginBottom: '25px'
                        }}>
                            <h4 style={{ color: 'var(--primary-color)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                                <Key size={18} /> Segurança da Conta
                            </h4>
                            <p style={{ fontSize: '0.8rem', color: '#888', marginBottom: '15px' }}>
                                Para sua segurança, a troca de senha exige verificação por e-mail (duplo fator). Enviaremos um link seguro para o seu e-mail cadastrado.
                            </p>

                            {resetSent ? (
                                <div style={{ background: 'rgba(68, 255, 68, 0.1)', padding: '10px', borderRadius: '4px', textAlign: 'center' }}>
                                    <p style={{ color: '#44ff44', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '5px', justifyContent: 'center' }}>
                                        <Send size={14} /> Link de verificação enviado! Confira sua caixa de entrada.
                                    </p>
                                </div>
                            ) : (
                                <button
                                    type="button"
                                    onClick={handlePasswordChangeRequest}
                                    disabled={resetLoading}
                                    style={{
                                        background: 'transparent',
                                        border: '1px solid var(--primary-color)',
                                        color: 'var(--primary-color)',
                                        padding: '10px 15px',
                                        borderRadius: '6px',
                                        fontSize: '0.85rem',
                                        fontWeight: 'bold',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        width: 'fit-content',
                                        transition: 'all 0.2s'
                                    }}
                                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(212, 175, 55, 0.1)' }}
                                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
                                >
                                    {resetLoading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                                    Solicitar Troca de Senha
                                </button>
                            )}
                        </div>

                        <div style={{ height: '30px', textAlign: 'center' }}>
                            {success && (
                                <p style={{ color: '#44ff44', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '5px', justifyContent: 'center' }}>
                                    <CheckCircle size={16} /> Perfil salvo com sucesso!
                                </p>
                            )}
                        </div>

                        <button type="submit" className="save-btn" disabled={saving} style={{ width: '100%', marginTop: '10px' }}>
                            {saving ? (
                                <>
                                    <Loader2 className="animate-spin" size={20} />
                                    <span>Salvando...</span>
                                </>
                            ) : (
                                <>
                                    <Save size={20} />
                                    <span>Salvar Perfil</span>
                                </>
                            )}
                        </button>
                    </form>
                )}
                </div>
            </div>
        </div>
    );
}


