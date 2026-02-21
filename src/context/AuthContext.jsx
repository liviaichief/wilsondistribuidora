import React, { createContext, useContext, useEffect, useState } from 'react';
import { account, client, databases, DATABASE_ID, COLLECTIONS } from '../lib/appwrite';
import { ID } from 'appwrite';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
    const [authModalView, setAuthModalView] = useState('login');
    const [guestMode, setGuestMode] = useState(false); // [NEW] Guest Mode

    const [role, setRole] = useState(null);
    const [profile, setProfile] = useState(null); // [NEW]

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

            // [NEW] Track Last Activity (Login) for Dashboard KPIs
            // We update this if it's missing or if the date has changed (once per day per user)
            const now = new Date();
            const lastLogin = doc.last_login ? new Date(doc.last_login) : null;
            const isDifferentDay = !lastLogin ||
                lastLogin.getDate() !== now.getDate() ||
                lastLogin.getMonth() !== now.getMonth() ||
                lastLogin.getFullYear() !== now.getFullYear();

            if (isDifferentDay) {
                // Fire and forget update to avoid blocking UI
                databases.updateDocument(
                    DATABASE_ID,
                    COLLECTIONS.PROFILES,
                    userId,
                    { last_login: now.toISOString() }
                ).catch(err => {
                    // Suppress error if field doesn't exist yet in schema
                    console.warn("Could not update last_login:", err);
                });
            }

        } catch (error) {
            if (error.code !== 404) {
                console.error("Error fetching profile:", error);
            }
            setProfile(null);
            setRole('client');
            throw error; // Throw so caller knows what happened (e.g. 404)
        }
    };

    const continueAsGuest = () => {
        setGuestMode(true);
        closeAuthModal();
    };

    useEffect(() => {
        const checkSession = async () => {
            try {
                const session = await account.get();
                setUser(mapUser(session));

                // [FIX for Task-3] Ensure profile document exists (especially for OAuth users)
                try {
                    await fetchProfile(session.$id);
                } catch (pErr) {
                    if (pErr.code === 404) {
                        const defaultRole = 'client';
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
                        await fetchProfile(session.$id);
                    } else {
                        console.error("Profile check error:", pErr);
                    }
                }
            } catch (error) {
                // Not logged in
                setUser(null);
                setRole(null);
                setProfile(null);
            } finally {
                setLoading(false);
            }
        };

        checkSession();
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
            return { data: { user: mapUser(acc) } }; // Role is set in state
        } catch (error) {
            console.error("Login error:", error);
            return { error };
        } finally {
            setLoading(false);
        }
    };

    const signUp = async (email, password, additionalData) => {
        setLoading(true);
        try {
            // 1. Create Identity
            const userId = ID.unique();
            await account.create(
                userId,
                email,
                password,
                additionalData?.full_name || ''
            );

            // 2. Auto login after signup to establish session for database write
            await account.createEmailPasswordSession(email, password);
            const acc = await account.get();
            setUser(mapUser(acc));

            // 3. Create Profile Document
            // Note: We use the SAME ID as the Auth User for easier lookup
            const defaultRole = 'client';
            try {
                await databases.createDocument(
                    DATABASE_ID,
                    COLLECTIONS.PROFILES,
                    acc.$id, // Use the auth user ID as the document ID
                    {
                        email: email,
                        full_name: additionalData?.full_name || '',
                        first_name: (additionalData?.full_name || '').split(' ')[0] || '',
                        last_name: (additionalData?.full_name || '').split(' ').slice(1).join(' ') || '',
                        phone: additionalData?.phone || '',
                        user_id: acc.$id,
                        role: defaultRole
                    }
                );
            } catch (dbError) {
                console.error("Error creating profile document during signup:", dbError);
            }

            setRole(defaultRole);
            await fetchProfile(acc.$id);

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

    const signInWithGoogle = () => {
        // OAuth with Appwrite
        account.createOAuth2Session(
            'google',
            window.location.origin,
            window.location.origin + '/login'
        );
    };

    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);


    const openProfileModal = () => setIsProfileModalOpen(true);
    const closeProfileModal = () => setIsProfileModalOpen(false);

    const updateProfile = async (data) => {
        if (!user || !user.$id) return;
        try {
            await databases.updateDocument(
                DATABASE_ID,
                COLLECTIONS.PROFILES,
                user.$id,
                data
            );
            // Refresh local user state/profile
            const doc = await databases.getDocument(DATABASE_ID, COLLECTIONS.PROFILES, user.$id);
            setProfile(doc);
            return { success: true };
        } catch (error) {
            console.error("Failed to update profile:", error);
            return { error };
        }
    };

    const authValue = React.useMemo(() => {
        // Appwrite Labels/Teams handles roles differently. 
        // For simplicity in this port, we can check email or label.
        // Assuming admin@local.com is admin for now.
        // [FIX] Relaxed check for testing: any email starting with 'admin' is admin
        // Also check actual DB role
        const isAdmin = user?.email?.startsWith('admin') || role === 'admin' || role === 'owner';

        return {
            user,
            profile,
            role,
            isAdmin,
            isOwner: role === 'owner' || isAdmin, // Map owner to admin for simplicity
            loading,
            isAuthModalOpen,
            authModalView,
            setAuthModalView,
            openAuthModal,
            closeAuthModal,
            guestMode,        // [NEW]
            continueAsGuest,  // [NEW]
            isProfileModalOpen, // Exported state
            openProfileModal,   // Exported function
            closeProfileModal,  // Exported function
            signIn,
            signUp,
            signOut,
            resetPassword,
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
