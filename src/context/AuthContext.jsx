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

    const [role, setRole] = useState(null);

    // Helper: Map Appwrite User to our App context user shape
    // Appwrite user has $id, email, name, etc.
    const mapUser = (acc) => ({
        id: acc.$id,
        $id: acc.$id, // Keep $id for Appwrite SDK compatibility
        email: acc.email,
        full_name: acc.name,
        user_metadata: { full_name: acc.name } // Keep compatibility
    });

    const fetchProfileRole = async (userId) => {
        try {
            const doc = await databases.getDocument(
                DATABASE_ID,
                COLLECTIONS.PROFILES,
                userId
            );
            return doc.role || 'client';
        } catch (error) {
            console.error("Error fetching profile role:", error);
            return 'client';
        }
    };

    useEffect(() => {
        const checkSession = async () => {
            try {
                const session = await account.get();
                setUser(mapUser(session));
                const userRole = await fetchProfileRole(session.$id);
                setRole(userRole);
            } catch (error) {
                // Not logged in
                setUser(null);
                setRole(null);
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
            const userRole = await fetchProfileRole(acc.$id);
            setRole(userRole);
            return { data: { user: mapUser(acc), role: userRole } };
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
                        phone: additionalData?.phone || '',
                        role: defaultRole
                    }
                );
            } catch (dbError) {
                console.error("Error creating profile document:", dbError);
                // Continue even if profile creation fails? Or rollback? 
                // For now, log it. The user is created in Auth.
            }

            setRole(defaultRole);

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


    const openProfileModal = () => {
        console.log("AuthContext: openProfileModal called");
        setIsProfileModalOpen(true);
    };
    const closeProfileModal = () => {
        console.log("AuthContext: closeProfileModal called");
        setIsProfileModalOpen(false);
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
            role,
            isAdmin,
            isOwner: role === 'owner' || isAdmin, // Map owner to admin for simplicity
            loading,
            isAuthModalOpen,
            authModalView,
            setAuthModalView,
            openAuthModal,
            closeAuthModal,
            isProfileModalOpen, // Exported state
            openProfileModal,   // Exported function
            closeProfileModal,  // Exported function
            signIn,
            signUp,
            signOut,
            resetPassword,
            signInWithGoogle,
            updateProfile: async () => { }
        };
    }, [user, loading, isAuthModalOpen, authModalView, isProfileModalOpen, role]);

    return (
        <AuthContext.Provider value={authValue}>
            {children}
        </AuthContext.Provider>
    );
};
