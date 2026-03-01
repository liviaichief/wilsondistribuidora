import React, { createContext, useContext, useEffect, useState } from 'react';
import { account, client, databases, DATABASE_ID, COLLECTIONS } from '../lib/appwrite';
import { ID, Permission, Role } from 'appwrite';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
    const [authModalView, setAuthModalView] = useState('login');
    const [guestMode, setGuestMode] = useState(false); // Guest Mode

    const [role, setRole] = useState(null);
    const [profile, setProfile] = useState(null);

    // Helper: Map Appwrite User to our App context user shape
    const mapUser = (acc) => ({
        id: acc.$id,
        $id: acc.$id,
        email: acc.email,
        full_name: acc.name,
        user_metadata: { full_name: acc.name }
    });

    const fetchProfile = async (userId) => {
        try {
            const doc = await databases.getDocument(
                DATABASE_ID,
                COLLECTIONS.PROFILES,
                userId
            );
            setProfile(doc);
            setRole(doc.role || 'client');

            // Track Last Activity (Login) for Dashboard KPIs
            const now = new Date();
            const lastLogin = doc.last_login ? new Date(doc.last_login) : null;
            const fifteenMinutesAgo = new Date(now.getTime() - 15 * 60 * 1000);

            const shouldUpdateLastLogin = !lastLogin || lastLogin < fifteenMinutesAgo;

            if (shouldUpdateLastLogin) {
                databases.updateDocument(
                    DATABASE_ID,
                    COLLECTIONS.PROFILES,
                    userId,
                    { last_login: now.toISOString() }
                ).catch(err => {
                    console.warn("Could not update last_login:", err);
                });
            }

        } catch (error) {
            if (error.code !== 404) {
                console.error("Error fetching profile:", error);
            }
            setProfile(null);
            setRole('client');
            throw error;
        }
    };

    const continueAsGuest = () => {
        setGuestMode(true);
        closeAuthModal();
    };

    useEffect(() => {
        let isMounted = true;

        const checkSession = async (retryCount = 0) => {
            if (!isMounted) return;
            console.log(`[Auth] Checking session (attempt ${retryCount + 1})...`);

            try {
                const session = await account.get();
                console.log("[Auth] Session active:", session.$id, session.email);
                setUser(mapUser(session));

                // Ensure profile document exists
                try {
                    console.log("[Auth] Fetching profile for:", session.$id);
                    await fetchProfile(session.$id);
                } catch (pErr) {
                    if (pErr.code === 404) {
                        console.log("[Auth] Profile not found, creating one...");
                        const defaultRole = 'client';
                        try {
                            await databases.createDocument(
                                DATABASE_ID,
                                COLLECTIONS.PROFILES,
                                session.$id,
                                {
                                    email: session.email,
                                    full_name: session.name || '',
                                    first_name: (session.name || '').split(' ')[0] || '',
                                    last_name: (session.name || '').split(' ').slice(1).join(' ') || '',
                                    user_id: session.$id,
                                    role: defaultRole
                                }
                            );
                            console.log("[Auth] Profile created successfully");
                            await fetchProfile(session.$id);

                            const oauthIntent = localStorage.getItem('oauth_intent');
                            localStorage.removeItem('oauth_intent');

                            if (oauthIntent === 'login') {
                                console.log("[Auth] OAuth Login intent but user does not have an account. Forcing to register.");
                                // Remove session as they shouldn't just bypass the register view
                                await account.deleteSession('current');
                                setUser(null);
                                setRole(null);
                                setProfile(null);

                                setTimeout(() => {
                                    alert("Parece que você ainda não tem um cadastro. Por favor, crie sua conta para continuar!");
                                    openAuthModal('register');
                                }, 500);
                                return;
                            }

                            // Avisar o usuário e mudar o foco para o preenchimento dos dados obrigatórios (WhatsApp e Aniversário)
                            setTimeout(() => {
                                alert("Identificamos que este é o seu primeiro acesso! Por favor, complete as informações do seu cadastro para continuar (WhatsApp e Data de Aniversário).");
                                setIsProfileModalOpen(true);
                            }, 500);

                        } catch (createErr) {
                            if (createErr.code === 409) {
                                console.log("[Auth] Profile document conflict (409), retrying fetch...");
                                await fetchProfile(session.$id);
                            } else {
                                console.error("[Auth] Error creating profile document:", createErr);
                                setRole(defaultRole);
                            }
                        }
                    } else {
                        console.error("[Auth] Profile fetch error (non-404):", pErr);
                        setRole('client');
                    }
                }
            } catch (error) {
                const hasOauthParams = window.location.search.includes('userId=');
                if (hasOauthParams && retryCount < 2) {
                    console.log("[Auth] OAuth params detected but session not ready, retrying in 1s...");
                    setTimeout(() => checkSession(retryCount + 1), 1000);
                    return;
                }

                console.log("[Auth] No session found:", error.message);
                setUser(null);
                setRole(null);
                setProfile(null);
            } finally {
                if (retryCount >= (window.location.search.includes('userId=') ? 2 : 0)) {
                    setLoading(false);
                }
            }
        };

        if (window.location.search.includes('userId=')) {
            setTimeout(() => checkSession(0), 500);
        } else {
            checkSession();
        }

        const handleStorageChange = (e) => {
            if (e.key === 'app_auth_sync_login' || e.key === 'app_auth_sync_logout') {
                console.log("[Auth] Cross-tab session sync triggered:", e.key);
                checkSession();
            }
        };
        window.addEventListener('storage', handleStorageChange);

        return () => {
            isMounted = false;
            window.removeEventListener('storage', handleStorageChange);
        };
    }, []);

    const openAuthModal = (view = 'login') => {
        setAuthModalView(view);
        setIsAuthModalOpen(true);
    };

    const closeAuthModal = () => setIsAuthModalOpen(false);

    const signIn = async (email, password) => {
        setLoading(true);
        try {
            await account.createEmailPasswordSession(email, password);
            const acc = await account.get();
            setUser(mapUser(acc));
            await fetchProfile(acc.$id);
            localStorage.setItem('app_auth_sync_login', Date.now().toString());
            return { data: { user: mapUser(acc) } };
        } catch (error) {
            // Se já houver uma sessão ativa, apague ela e tente logar novamente
            if (error?.message?.includes('prohibited when a session is active') || error?.type === 'user_session_already_exists') {
                try {
                    await account.deleteSession('current');
                    await account.createEmailPasswordSession(email, password);
                    const acc = await account.get();
                    setUser(mapUser(acc));
                    await fetchProfile(acc.$id);
                    localStorage.setItem('app_auth_sync_login', Date.now().toString());
                    return { data: { user: mapUser(acc) } };
                } catch (retryError) {
                    console.error("Login retry error after session clear:", retryError);
                    return { error: retryError };
                }
            }

            console.error("Login error:", error);
            return { error };
        } finally {
            setLoading(false);
        }
    };

    const signUp = async (email, password, additionalData) => {
        setLoading(true);
        try {
            const userId = ID.unique();
            await account.create(
                userId,
                email,
                password,
                additionalData?.full_name || ''
            );

            await account.createEmailPasswordSession(email, password);
            const acc = await account.get();
            setUser(mapUser(acc));

            const defaultRole = 'client';
            try {
                await databases.createDocument(
                    DATABASE_ID,
                    COLLECTIONS.PROFILES,
                    acc.$id,
                    {
                        email: email,
                        full_name: additionalData?.full_name || '',
                        first_name: (additionalData?.full_name || '').split(' ')[0] || '',
                        last_name: (additionalData?.full_name || '').split(' ').slice(1).join(' ') || '',
                        whatsapp: additionalData?.whatsapp || '',
                        birthday: additionalData?.birthday || null,
                        user_id: acc.$id,
                        role: defaultRole
                    }
                );
            } catch (dbError) {
                console.error("Error creating profile document during signup:", dbError);
                throw new Error("Erro ao criar perfil: " + dbError.message);
            }

            setRole(defaultRole);
            await fetchProfile(acc.$id);
            localStorage.setItem('app_auth_sync_login', Date.now().toString());
            return { data: { user: mapUser(acc), role: defaultRole } };
        } catch (error) {
            console.error("Signup error:", error);
            return { error };
        } finally {
            setLoading(false);
        }
    };

    const signOut = async () => {
        try {
            await account.deleteSession('current');
            setUser(null);
            setRole(null);
            setProfile(null);
            localStorage.setItem('app_auth_sync_logout', Date.now().toString());
            return true;
        } catch (error) {
            console.error("Logout error:", error);
            return false;
        }
    };

    const resetPassword = async (email) => {
        try {
            await account.createRecovery(
                email,
                window.location.origin + '/reset-password'
            );
            return { success: true };
        } catch (error) {
            return { error };
        }
    };

    const confirmPasswordReset = async (userId, secret, password, passwordAgain) => {
        try {
            await account.updateRecovery(userId, secret, password, passwordAgain);
            return { success: true };
        } catch (error) {
            console.error("Confirm password reset error:", error);
            return { error };
        }
    };

    const signInWithGoogle = (intent = 'login') => {
        localStorage.setItem('oauth_intent', intent);

        const currentPath = window.location.pathname;
        const successUrl = (currentPath === '/login' || currentPath === '/logout')
            ? window.location.origin
            : window.location.href;

        console.log("Starting Google OAuth with intent:", intent, "redirecting to:", successUrl);

        account.createOAuth2Session(
            'google',
            successUrl,
            successUrl + (successUrl.includes('?') ? '&' : '?') + 'error=oauth_failed'
        );
    };

    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

    const openProfileModal = () => setIsProfileModalOpen(true);
    const closeProfileModal = () => setIsProfileModalOpen(false);

    const updateProfile = async (data, docId = null) => {
        if (!user || !user.$id) {
            console.error("[Auth] No user session found for updateProfile");
            return { error: new Error("Sessão não encontrada. Por favor, faça login novamente.") };
        }

        const targetDocId = docId || user.$id;
        console.log(`[Auth] Updating profile document: ${targetDocId} for user: ${user.$id}`);

        try {
            await databases.updateDocument(
                DATABASE_ID,
                COLLECTIONS.PROFILES,
                targetDocId,
                data
            );

            // Refresh local profile state
            const doc = await databases.getDocument(DATABASE_ID, COLLECTIONS.PROFILES, targetDocId);
            setProfile(doc);
            return { success: true, data: doc };
        } catch (error) {
            console.error("[Auth] Failed to update profile:", error);
            // Help developer/admin understand the error
            if (error.code === 403 || error.code === 401) {
                console.warn(`[Auth] PERMISSION DENIED: User ${user.$id} cannot update document ${targetDocId}. Verify Document Permissions in Appwrite Console for collection ${COLLECTIONS.PROFILES}.`);
            }
            return { error };
        }
    };

    const authValue = React.useMemo(() => {
        const isAdmin = role === 'admin' || role === 'owner';

        return {
            user,
            profile,
            role,
            isAdmin,
            isOwner: role === 'owner' || isAdmin,
            loading,
            isAuthModalOpen,
            authModalView,
            setAuthModalView,
            openAuthModal,
            closeAuthModal,
            guestMode,
            continueAsGuest,
            isProfileModalOpen,
            openProfileModal,
            closeProfileModal,
            signIn,
            signUp,
            signOut,
            resetPassword,
            confirmPasswordReset,
            signInWithGoogle,
            updateProfile,
            refreshProfile: async () => {
                if (user && user.$id) {
                    await fetchProfile(user.$id);
                }
            }
        };
    }, [user, profile, role, loading, isAuthModalOpen, authModalView, isProfileModalOpen, guestMode]);

    return (
        <AuthContext.Provider value={authValue}>
            {children}
        </AuthContext.Provider>
    );
};
