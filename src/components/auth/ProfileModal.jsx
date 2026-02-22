
import React, { useState, useEffect } from 'react';
import { account, databases } from '../../lib/appwrite';
import { ID, Query } from 'appwrite';
import { useAuth } from '../../context/AuthContext';

const DATABASE_ID = import.meta.env.VITE_DATABASE_ID;
const COLLECTION_PROFILES = import.meta.env.VITE_COLLECTION_PROFILES || 'profiles';

export default function ProfileModal({ isOpen, onClose, user }) {
    const { updateProfile } = useAuth();
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [success, setSuccess] = useState(false);
    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        whatsapp: ''
    });
    const [profileId, setProfileId] = useState(null);

    // Initial Load
    useEffect(() => {
        if (isOpen && user) {
            fetchProfile();
            setSuccess(false);
        }
    }, [isOpen, user]);

    const handleWhatsAppChange = (e) => {
        let value = e.target.value.replace(/\D/g, '');
        if (value.length > 11) value = value.slice(0, 11);

        let formatted = value;
        if (value.length > 2) formatted = `(${value.slice(0, 2)}) ${value.slice(2)}`;
        if (value.length > 7) formatted = `(${value.slice(0, 2)}) ${value.slice(2, 7)}-${value.slice(7)}`;

        setFormData({ ...formData, whatsapp: formatted });
    };

    const fetchProfile = async () => {
        if (!user?.$id) return;
        try {
            setLoading(true);
            let profile = null;

            // Strategy: Try to get by ID
            try {
                profile = await databases.getDocument(DATABASE_ID, COLLECTION_PROFILES, user.$id);
            } catch (e) {
                // If not found by ID, search by user_id field
                try {
                    const response = await databases.listDocuments(
                        DATABASE_ID,
                        COLLECTION_PROFILES,
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
                setFormData({
                    first_name: profile.first_name || '',
                    last_name: profile.last_name || '',
                    whatsapp: profile.whatsapp || ''
                });
                setProfileId(profile.$id);
            } else {
                // Initialize from Auth User Name
                const parts = (user?.name || user?.user_metadata?.full_name || '').split(' ');
                setFormData({
                    first_name: parts[0] || '',
                    last_name: parts.slice(1).join(' ') || '',
                    whatsapp: ''
                });
                setProfileId(null);
            }
        } catch (error) {
            console.error("Error in fetchProfile:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!user || !user.$id) return;

        try {
            setSaving(true);
            const fullName = `${formData.first_name} ${formData.last_name || ''}`.trim();

            const data = {
                first_name: formData.first_name,
                last_name: formData.last_name,
                full_name: fullName,
                whatsapp: formData.whatsapp,
                user_id: user.$id,
                email: user.email
            };

            if (profileId) {
                await databases.updateDocument(DATABASE_ID, COLLECTION_PROFILES, profileId, data);
            } else {
                try {
                    await databases.createDocument(DATABASE_ID, COLLECTION_PROFILES, user.$id, data);
                    setProfileId(user.$id);
                } catch (e) {
                    const newDoc = await databases.createDocument(DATABASE_ID, COLLECTION_PROFILES, ID.unique(), data);
                    setProfileId(newDoc.$id);
                }
            }

            // Sync Auth Name
            if (fullName) {
                await account.updateName(fullName);
            }

            setSuccess(true);
            setTimeout(() => {
                onClose();
            }, 2000);

        } catch (error) {
            console.error("Error saving profile:", error);
            alert(`Erro ao salvar: ${error.message}`);
        } finally {
            setSaving(false);
        }
    };

    if (!isOpen) return null;

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
    };

    // Derived Display Data
    const userName = `${formData.first_name} ${formData.last_name}`.trim() || user?.name || "Usuário";
    const userEmail = user?.email || "";
    const userId = user?.$id || "";
    const lastLogin = new Date().toLocaleDateString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    return (
        <div className="fixed inset-0 z-[9999] bg-black/95 backdrop-blur-sm overflow-y-auto flex items-center justify-center p-4">
            <div className="w-full max-w-4xl bg-[#121212] border border-[#2d2a1e] rounded-xl shadow-2xl p-8 relative font-display">

                {/* Close Button - Enhanced Visibility */}
                <button
                    onClick={onClose}
                    className="absolute -top-12 right-0 text-white hover:text-red-500 transition-colors p-2 rounded-full hover:bg-white/10"
                    title="Fechar"
                >
                    <span className="material-symbols-outlined text-[32px] font-bold">close</span>
                </button>

                {/* Form Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6 mt-6">
                    {/* First Name */}
                    <div className="flex flex-col gap-2">
                        <label className="text-[10px] font-bold text-[#D4AF37] uppercase tracking-widest pl-1">Nome</label>
                        <div className="relative group">
                            <input
                                className="w-full px-4 py-3 bg-[#0a0a0a] border border-[#2d2a1e] rounded-lg text-white focus:ring-1 focus:ring-[#D4AF37] focus:border-[#D4AF37] transition-all placeholder-zinc-700 outline-none"
                                type="text"
                                value={formData.first_name}
                                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                                placeholder="João"
                            />
                        </div>
                    </div>

                    {/* Last Name */}
                    <div className="flex flex-col gap-2">
                        <label className="text-[10px] font-bold text-[#D4AF37] uppercase tracking-widest pl-1">Sobrenome</label>
                        <div className="relative group">
                            <input
                                className="w-full px-4 py-3 bg-[#0a0a0a] border border-[#2d2a1e] rounded-lg text-white focus:ring-1 focus:ring-[#D4AF37] focus:border-[#D4AF37] transition-all placeholder-zinc-700 outline-none"
                                type="text"
                                value={formData.last_name}
                                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                                placeholder="Silva"
                            />
                        </div>
                    </div>
                </div>

                {/* WhatsApp */}
                <div className="flex flex-col gap-2 mb-6">
                    <label className="text-[10px] font-bold text-[#D4AF37] uppercase tracking-widest pl-1">WhatsApp</label>
                    <div className="relative group">
                        <input
                            className="w-full px-4 py-3 bg-[#0a0a0a] border border-[#2d2a1e] rounded-lg text-white focus:ring-1 focus:ring-[#D4AF37] focus:border-[#D4AF37] transition-all placeholder-zinc-700 outline-none"
                            type="text"
                            value={formData.whatsapp}
                            onChange={handleWhatsAppChange}
                            placeholder="(11) 98765-4321"
                        />
                    </div>
                </div>

                {/* Email (Readonly) */}
                <div className="flex flex-col gap-2 mb-2">
                    <label className="text-[10px] font-bold text-[#D4AF37] uppercase tracking-widest pl-1">Email Configurado</label>
                    <div className="relative opacity-80">
                        <input
                            className="w-full px-4 py-3 bg-[#0a0a0a] border border-[#2d2a1e] rounded-lg text-zinc-400 cursor-not-allowed outline-none"
                            readOnly
                            type="email"
                            value={userEmail}
                        />
                    </div>
                    <p className="text-[10px] text-zinc-600 italic px-1">O e-mail principal não pode ser alterado através deste painel.</p>
                </div>

                {/* ID (Readonly) */}
                <div className="flex flex-col gap-2 mb-10">
                    <label className="text-[10px] font-bold text-[#D4AF37] uppercase tracking-widest pl-1">Identificador Único</label>
                    <div className="relative group">
                        <input
                            className="w-full px-4 py-3 bg-[#0a0a0a] border border-[#2d2a1e] rounded-lg text-zinc-400 font-mono tracking-wider cursor-text outline-none"
                            readOnly
                            type="text"
                            value={userId}
                        />
                        <button
                            onClick={() => copyToClipboard(userId)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-[#D4AF37] hover:text-white transition-colors text-xs font-bold uppercase"
                        >
                            Copiar
                        </button>
                    </div>
                </div>

                {/* Separator Line */}
                <div className="h-px w-full bg-[#2d2a1e] mb-8"></div>

                {/* Actions */}
                <div className="flex items-center justify-between">
                    <button
                        onClick={onClose}
                        className="text-xs font-bold text-zinc-500 hover:text-white uppercase tracking-widest transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={loading || saving}
                        className="bg-[#D4AF37] hover:bg-[#b8962a] text-black font-bold py-2 px-6 text-sm rounded-lg flex items-center gap-2 shadow-[0_4px_15px_rgba(212,175,53,0.3)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <span className="uppercase tracking-widest text-[10px]">Salvar Dados</span>
                    </button>
                </div>

                {/* Loading / Content Overlay */}
                {(loading || saving || success) && (
                    <div className="absolute inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50">
                        {success ? (
                            <div className="flex flex-col items-center animate-in fade-in zoom-in duration-300">
                                <div className="w-16 h-16 bg-[#D4AF37] rounded-full flex items-center justify-center mb-4 shadow-[0_0_20px_rgba(212,175,53,0.5)]">
                                    <span className="material-symbols-outlined text-black text-[32px]">check_circle</span>
                                </div>
                                <h3 className="text-xl font-bold text-white tracking-wide">PERFIL ATUALIZADO</h3>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center">
                                <div className="w-10 h-10 border-4 border-[#D4AF37] border-t-transparent rounded-full animate-spin mb-4"></div>
                                <p className="text-[#D4AF37] font-bold tracking-widest text-xs animate-pulse uppercase">
                                    {saving ? 'Salvando...' : 'Carregando...'}
                                </p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}


