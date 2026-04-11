import { Client, Account, Databases, Storage, Functions } from 'appwrite';

export const client = new Client();

client
    .setEndpoint(import.meta.env.VITE_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1')
    .setProject(import.meta.env.VITE_APPWRITE_PROJECT_ID || '');

export const account = new Account(client);
export const databases = new Databases(client);
export const storage = new Storage(client);
export const functions = new Functions(client);

// Helper to get Database ID
export const DATABASE_ID = import.meta.env.VITE_DATABASE_ID || '';
export const BUCKET_ID = import.meta.env.VITE_APPWRITE_BUCKET_ID || '';
export const COLLECTIONS = {
    PRODUCTS: import.meta.env.VITE_COLLECTION_PRODUCTS || 'products',
    BANNERS: import.meta.env.VITE_COLLECTION_BANNERS || 'banners',
    ORDERS: import.meta.env.VITE_COLLECTION_ORDERS || 'orders',
    PROFILES: import.meta.env.VITE_COLLECTION_PROFILES || 'profiles'
};
