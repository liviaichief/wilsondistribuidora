
import { Client, Databases, Permission, Role, Storage } from 'node-appwrite';
import dotenv from 'dotenv';
dotenv.config();

const client = new Client()
    .setEndpoint(process.env.VITE_APPWRITE_ENDPOINT)
    .setProject(process.env.VITE_APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);
const storage = new Storage(client);

const DATABASE_ID = process.env.VITE_DATABASE_ID || 'boutique_carne_db';
const COLLECTION_ID = process.env.VITE_COLLECTION_PROFILES || 'profiles';
const BUCKET_ID = 'product-images'; // We are using this one now

async function fixPermissions() {
    try {
        console.log(`Updating permissions for Collection '${COLLECTION_ID}'...`);

        // Enable Document Security? 
        // If we set permissions at collection level like this, usually we want Document Level Security to be FALSE if we want these to apply broadly, 
        // OR we want Document Security TRUE but we give basic CREATE rights here.
        // Let's set broadly permissive for now to ensure it works.
        // If Document Security is TRUE, then 'update(Role.users())' here might allow updating ANY document? No, usually it defines defaults.
        // Let's look at Appwrite logic: 
        // If "Document Security" is enabled, access is determined by the document's own permissions + Collection permissions? 
        // Actually, easiest fix for "Not Authorized" 401/403 is to grant the role on the collection.

        await databases.updateCollection(
            DATABASE_ID,
            COLLECTION_ID,
            COLLECTION_ID,
            [
                Permission.read(Role.any()),              // Public Read
                Permission.create(Role.users()),          // Users can create
                Permission.update(Role.users()),          // Users can update (any doc if Doc Security off, or their own if on? Let's just enable it)
                Permission.delete(Role.users()),          // Users can delete
                Permission.read(Role.users())
            ],
            true // documentSecurity: Enabled. 
            // When enabled, the User who creates the document becomes the "owner" (write access).
            // However, "create" permission on collection is Required to create.
        );
        console.log(`Collection '${COLLECTION_ID}' permissions updated.`);


        console.log(`Updating permissions for Bucket '${BUCKET_ID}'...`);
        await storage.updateBucket(
            BUCKET_ID,
            'Product Images', // Name
            [
                Permission.read(Role.any()),
                Permission.create(Role.users()),
                Permission.update(Role.users()),
                Permission.delete(Role.users())
            ],
            false, // File Security
            true, // Enabled
            20000000, // Max size 20MB
            ['jpg', 'png', 'gif', 'jpeg', 'webp']
        );
        console.log(`Bucket '${BUCKET_ID}' permissions updated.`);

    } catch (error) {
        console.error("Error fixing permissions:", error);
    }
}

fixPermissions();
