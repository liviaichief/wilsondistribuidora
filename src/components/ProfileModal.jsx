import React, { useState, useEffect } from 'react';
import { X, Save, User, Phone, Mail, Check } from 'lucide-react';
import { account, databases } from '../lib/appwrite';
import { ID, Query } from 'appwrite';

const DATABASE_ID = import.meta.env.VITE_DATABASE_ID;
const COLLECTION_PROFILES = import.meta.env.VITE_COLLECTION_PROFILES || 'profiles';

export default function ProfileModal({ isOpen, onClose, user }) {
    console.log("ProfileModal Rendered. isOpen:", isOpen, "User:", user);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [success, setSuccess] = useState(false);
    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        whatsapp: ''
    });
    const [profileId, setProfileId] = useState(null);

    useEffect(() => {
        if (isOpen && user) {
            fetchProfile();
            setSuccess(false);
        }
    }, [isOpen, user]);

    const fetchProfile = async () => {
        if (!user?.$id) return;
        try {
            setLoading(true);
            let profile = null;

            // Strategy 1: Try to get by ID (if profile ID == user ID)
            try {
                profile = await databases.getDocument(DATABASE_ID, COLLECTION_PROFILES, user.$id);
            } catch (e) {
                // Strategy 2: If not found by ID, search by user_id field
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
                console.log("Profile found:", profile);
                setFormData({
                    first_name: profile.first_name || '',
                    last_name: profile.last_name || '',
                    whatsapp: profile.whatsapp || ''
                });
                setProfileId(profile.$id);
            } else {
                console.log("Profile not found, initializing new.");
                setFormData(prev => ({
                    ...prev,
                    first_name: user?.user_metadata?.full_name?.split(' ')[0] || ''
                }));
                setProfileId(null); // Ensure null to trigger create on save
            }
        } catch (error) {
            console.error("Error in fetchProfile:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        console.log("handleSave called. User:", user);
        if (!user || !user.$id) {
            alert("Erro: Usuário não identificado. Tente recarregar a página.");
            return;
        }

        try {
            setSaving(true);
            const data = {
                first_name: formData.first_name,
                last_name: formData.last_name,
                full_name: `${formData.first_name} ${formData.last_name || ''}`.trim(),
                whatsapp: formData.whatsapp,
                user_id: user.$id, // Ensure this matches schema
                email: user.email
            };

            console.log("Saving profile data:", data, "ProfileID:", profileId);

            if (profileId) {
                // Update existing
                await databases.updateDocument(DATABASE_ID, COLLECTION_PROFILES, profileId, data);
            } else {
                // Create new (Try using user ID as doc ID, if fails, let Appwrite generate)
                try {
                    await databases.createDocument(DATABASE_ID, COLLECTION_PROFILES, user.$id, data);
                    setProfileId(user.$id);
                } catch (e) {
                    // Fallback to auto-ID if user.$id is taken or invalid/not allowed
                    const newDoc = await databases.createDocument(DATABASE_ID, COLLECTION_PROFILES, ID.unique(), data);
                    setProfileId(newDoc.$id);
                }
            }

            if (formData.first_name) {
                const fullName = `${formData.first_name} ${formData.last_name || ''}`.trim();
                await account.updateName(fullName);
            }

            setSuccess(true);
            setTimeout(() => {
                onClose();
            }, 2000);

        } catch (error) {
            console.error("Error saving profile:", error);
            alert(`Erro ao salvar perfil: ${error.message}`);
        } finally {
            setSaving(false);
        }
    };

    if (!isOpen) return null;

    // Helper to get initials or first name for the top summary
    const userName = user?.user_metadata?.full_name || "Usuário";
    const userEmail = user?.email || "email@exemplo.com";

    // Formatting Last Login or Update if available, else standard text
    const lastUpdate = new Date().toLocaleDateString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/95 backdrop-blur-sm p-4 animate-in fade-in duration-300">
            {/* Main Container - max-width adapted to design */}
            <div className="w-full max-w-5xl relative">

                {/* Close Button (Absolute Top Right) */}
                <button
                    onClick={onClose}
                    className="absolute -top-12 right-0 text-zinc-500 hover:text-white transition-colors flex items-center gap-2 group"
                >
                    <span className="text-sm font-medium uppercase tracking-wider opacity-0 group-hover:opacity-100 transition-opacity">Fechar</span>
                    <X className="w-8 h-8" />
                </button>

                {/* Header Section */}
                <div className="mb-8 border-l-4 border-[#D4AF37] pl-6 py-1">
                    <h1 className="text-3xl font-bold text-white tracking-wide mb-1 uppercase">
                        Configurações de Perfil
                    </h1>
                    <div className="flex items-center gap-2 text-sm">
                        <span className="text-zinc-400">Usuário:</span>
                        <span className="text-[#D4AF37] font-medium mr-4">{userName}</span>
                        <span className="text-zinc-600">|</span>
                        <span className="text-zinc-400 ml-4">E-mail:</span>
                        <span className="text-[#D4AF37] font-medium">{userEmail}</span>
                    </div>
                </div>

                {/* Card Container */}
                <div className="bg-[#111111] border border-[#222] rounded-xl shadow-2xl p-8 md:p-12 relative overflow-hidden">

                    {/* Loading Overlay */}
                    {(loading || saving) && (
                        <div className="absolute inset-0 z-50 bg-black/80 flex flex-col items-center justify-center backdrop-blur-sm">
                            <div className="w-12 h-12 border-4 border-[#D4AF37] border-t-transparent rounded-full animate-spin mb-4"></div>
                            <p className="text-[#D4AF37] font-semibold animate-pulse tracking-widest">
                                {saving ? 'SALVANDO...' : 'CARREGANDO...'}
                            </p>
                        </div>
                    )}

                    {/* Success Overlay */}
                    {success && (
                        <div className="absolute inset-0 z-50 bg-black/90 flex flex-col items-center justify-center backdrop-blur-md animate-in fade-in duration-300">
                            <div className="w-20 h-20 rounded-full bg-[#D4AF37] flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(212,175,55,0.4)]">
                                <Check className="w-10 h-10 text-black" strokeWidth={3} />
                            </div>
                            <h3 className="text-3xl font-bold text-white mb-2 tracking-wide">SUCESSO!</h3>
                            <p className="text-zinc-400 uppercase tracking-widest text-sm">Perfil atualizado com êxito</p>
                        </div>
                    )}

                    {/* Form Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        {/* Nome */}
                        <div className="space-y-3">
                            <label className="text-xs font-bold text-[#D4AF37] uppercase tracking-widest ml-1">Nome</label>
                            <div className="relative group">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-600 group-focus-within:text-[#D4AF37] transition-colors" />
                                <input
                                    type="text"
                                    value={formData.first_name}
                                    onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                                    className="w-full bg-[#050505] border border-[#333] rounded-lg py-4 pl-12 pr-4 text-white focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] outline-none transition-all placeholder-zinc-800 font-medium"
                                    placeholder="João"
                                />
                            </div>
                        </div>

                        {/* Sobrenome */}
                        <div className="space-y-3">
                            <label className="text-xs font-bold text-[#D4AF37] uppercase tracking-widest ml-1">Sobrenome</label>
                            <div className="relative group">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-600 group-focus-within:text-[#D4AF37] transition-colors" />
                                <input
                                    type="text"
                                    value={formData.last_name}
                                    onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                                    className="w-full bg-[#050505] border border-[#333] rounded-lg py-4 pl-12 pr-4 text-white focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] outline-none transition-all placeholder-zinc-800 font-medium"
                                    placeholder="Silva"
                                />
                            </div>
                        </div>

                        {/* WhatsApp */}
                        <div className="space-y-3">
                            <label className="text-xs font-bold text-[#D4AF37] uppercase tracking-widest ml-1">WhatsApp</label>
                            <div className="relative group">
                                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-600 group-focus-within:text-[#D4AF37] transition-colors" />
                                <input
                                    type="tel"
                                    value={formData.whatsapp}
                                    onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                                    className="w-full bg-[#050505] border border-[#333] rounded-lg py-4 pl-12 pr-4 text-white focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] outline-none transition-all placeholder-zinc-800 font-medium"
                                    placeholder="+55 (11) 99999-9999"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Read-Only Row */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
                        {/* Email */}
                        <div className="space-y-3 opacity-60 hover:opacity-100 transition-opacity duration-300">
                            <label className="text-xs font-bold text-[#D4AF37] uppercase tracking-widest ml-1">Email Configurado</label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#D4AF37]" />
                                <input
                                    type="text"
                                    readOnly
                                    value={user?.email || ''}
                                    className="w-full bg-[#080808] border border-[#222] rounded-lg py-4 pl-12 pr-12 text-zinc-400 font-mono text-sm cursor-not-allowed"
                                />
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-600">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                                </div>
                            </div>
                        </div>

                        {/* ID */}
                        <div className="space-y-3 opacity-60 hover:opacity-100 transition-opacity duration-300">
                            <label className="text-xs font-bold text-[#D4AF37] uppercase tracking-widest ml-1">Identificador Único</label>
                            <div className="relative group cursor-copy" onClick={() => navigator.clipboard.writeText(user?.$id)}>
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center">
                                    <div className="w-2 h-2 bg-[#D4AF37] rounded-full animate-pulse"></div>
                                </div>
                                <input
                                    type="text"
                                    readOnly
                                    value={user?.$id || ''}
                                    className="w-full bg-[#080808] border border-[#222] rounded-lg py-4 pl-12 pr-12 text-zinc-500 font-mono text-xs uppercase tracking-wider cursor-copy hover:text-zinc-300 transition-colors"
                                />
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-600 group-hover:text-[#D4AF37] transition-colors">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Disclaimer */}
                    <p className="text-xs text-zinc-600 italic border-b border-[#222] pb-8 mb-8">
                        Dados de identificação do sistema são protegidos e vinculados à sua assinatura premium.
                    </p>

                    {/* Actions */}
                    <div className="flex justify-end items-center gap-8">
                        <button
                            onClick={onClose}
                            className="text-sm font-bold text-zinc-500 hover:text-white uppercase tracking-widest transition-colors"
                        >
                            Cancelar Alterações
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="px-8 py-4 bg-[#D4AF37] hover:bg-[#F2C94C] text-black font-extrabold uppercase tracking-widest rounded-lg transition-all flex items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(212,175,55,0.15)] hover:shadow-[0_0_30px_rgba(212,175,55,0.3)] transform active:scale-[0.98]"
                        >
                            <Save className="w-5 h-5" />
                            Atualizar Perfil
                        </button>
                    </div>

                </div>

                {/* Footer Status */}
                <div className="mt-8 flex justify-between items-center text-zinc-600 text-[10px] uppercase tracking-wider px-2">
                    <div className="flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
                        Criptografia Ponta a Ponta
                    </div>
                    <div className="flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                        Última Atualização: {lastUpdate}
                    </div>
                    <div>
                        Ambiente Seguro © 2024
                    </div>
                </div>
            </div>
        </div>
    );
}
