
import { Client, Databases, Users, ID, Query } from 'node-appwrite';

// Configuration
const ENDPOINT = 'https://sfo.cloud.appwrite.io/v1';
const PROJECT_ID = '698e695d001d446b21d9';
const API_KEY = 'standard_b6cd42bf7c58b5449ecb614ace3be50ab1f5c21900cfe1d83fe521b6aa848d2a7c625c58a64bc770b3612e62e2940df27df51671ff287184ed374b60f75b177f06d6a64b6e391e047e8590ce7ebc91c7a77c8b244a5c9135c67028f55f240ccdaf4528634410fdd34fad22baaaeeddd7097a877dbb250c73aa538ade05c7d0b1';
const DATABASE_ID = 'boutique_carne_db';
const PROFILES_COLLECTION_ID = 'profiles';

const client = new Client()
    .setEndpoint(ENDPOINT)
    .setProject(PROJECT_ID)
    .setKey(API_KEY);

const databases = new Databases(client);
const users = new Users(client);

const targetUsers = [
    {
        email: 'admin@local.com',
        password: '12345678',
        name: 'Administrador Principal',
        phone: '+5511999990000', // Appwrite requires E.164 format for phones usually, but we store string in profile
        profilePhone: '(11) 99999-0000',
        role: 'admin'
    },
    {
        email: 'cliente@local.com',
        password: '12345678',
        name: 'Cliente Exemplo',
        phone: '+5511988881111',
        profilePhone: '(11) 98888-1111',
        role: 'client'
    },
    {
        email: 'dono@local.com',
        password: '12345678',
        name: 'Dono da Loja',
        phone: '+5511977772222',
        profilePhone: '(11) 97777-2222',
        role: 'owner'
    }
];

async function runSeeding() {
    console.log("Starting Auth & Profile Seeding...");

    // 1. Cleanup previous loose profiles (from create_initial_users.js)
    try {
        const { documents } = await databases.listDocuments(DATABASE_ID, PROFILES_COLLECTION_ID);
        // Identify documents to delete (those matching our seed emails)
        const toDelete = documents.filter(doc => targetUsers.some(u => u.email === doc.email));

        console.log(`Found ${toDelete.length} old profiles to cleanup.`);
        for (const doc of toDelete) {
            await databases.deleteDocument(DATABASE_ID, PROFILES_COLLECTION_ID, doc.$id);
            console.log(`Deleted old profile for ${doc.email}`);
        }
    } catch (e) {
        console.log("Error listing/deleting profiles:", e.message);
    }

    // 2. Create Auth Users and Profiles
    for (const user of targetUsers) {
        let authId;

        // A. Create/Get Auth User
        try {
            // Check if user exists by listing (cant search easily without index/api key rights sometimes)
            // But we can try to create and catch "already exists"
            // Or better: list users with search
            const existingList = await users.list([Query.equal('email', user.email)]);

            if (existingList.total > 0) {
                console.log(`Auth user ${user.email} already exists.`);
                authId = existingList.users[0].$id;
                // Ideally update password to ensure it is known, but simplistic for now
                await users.updatePassword(authId, user.password);
                console.log(`Updated password for ${user.email}`);
            } else {
                const newAuth = await users.create(ID.unique(), user.email, user.phone, user.password, user.name);
                authId = newAuth.$id;
                console.log(`Created Auth User: ${user.email} (${authId})`);
            }
        } catch (authError) {
            console.error(`Error managing Auth User ${user.email}:`, authError.message);
            continue; // Skip profile if auth failed
        }

        // B. Create Profile linked to Auth ID
        try {
            await databases.createDocument(
                DATABASE_ID,
                PROFILES_COLLECTION_ID,
                authId, // Use Auth ID as Document ID
                {
                    email: user.email,
                    full_name: user.name,
                    phone: user.profilePhone,
                    role: user.role
                }
            );
            console.log(`Created Profile for: ${user.email}`);
        } catch (dbError) {
            // If conflict (profile already exists with this ID), maybe update it?
            if (dbError.code === 409) {
                console.log(`Profile for ${user.email} already exists (ID match). Updating...`);
                try {
                    await databases.updateDocument(DATABASE_ID, PROFILES_COLLECTION_ID, authId, {
                        role: user.role, // ensure role is correct
                        full_name: user.name
                    });
                    console.log(`Updated Profile for: ${user.email}`);
                } catch (updateErr) {
                    console.error(`Failed to update profile ${user.email}:`, updateErr.message);
                }
            } else {
                console.error(`Error creating profile for ${user.email}:`, dbError.message);
            }
        }
    }

    console.log("Auth & Profile Seeding Complete.");
}

runSeeding();
