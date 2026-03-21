import { Client, Account, Databases } from 'appwrite';

export const client = new Client();

client
    .setEndpoint(import.meta.env.VITE_APPWRITE_ENDPOINT || 'https://sfo.cloud.appwrite.io/v1')
    .setProject(import.meta.env.VITE_APPWRITE_PROJECT_ID || '698e695d001d446b21d9');

export const account = new Account(client);
export const databases = new Databases(client);

export const DATABASE_ID = import.meta.env.VITE_DATABASE_ID || 'boutique_carne_db';
export const COLLECTIONS = {
    PROFILES: import.meta.env.VITE_COLLECTION_PROFILES || 'profiles',
    SUBSCRIPTIONS: 'subscriptions',
    PAYMENTS: 'payments_log'
};
