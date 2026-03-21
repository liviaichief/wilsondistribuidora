import React, { createContext, useContext, useEffect, useState } from 'react';
import { account, databases, DATABASE_ID, COLLECTIONS } from '../lib/appwrite';

const AdminAuthContext = createContext();

export const useAdminAuth = () => useContext(AdminAuthContext);

export const AdminAuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [role, setRole] = useState(null);
    const [loading, setLoading] = useState(true);

    const checkSession = async () => {
        try {
            const session = await account.get();
            setUser(session);
            
            // Buscar role no profile
            try {
                const profile = await databases.getDocument(DATABASE_ID, COLLECTIONS.PROFILES, session.$id);
                setRole(profile.role);
            } catch (pErr) {
                setRole('guest');
            }
        } catch (error) {
            setUser(null);
            setRole(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        checkSession();
    }, []);

    const login = async (email, password) => {
        await account.createEmailPasswordSession(email, password);
        await checkSession();
    };

    const logout = async () => {
        await account.deleteSession('current');
        setUser(null);
        setRole(null);
    };

    return (
        <AdminAuthContext.Provider value={{ user, role, loading, login, logout }}>
            {children}
        </AdminAuthContext.Provider>
    );
};
