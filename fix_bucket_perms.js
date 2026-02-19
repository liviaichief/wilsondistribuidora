
import { Client, Storage, Permission, Role } from 'node-appwrite';

const client = new Client()
    .setEndpoint('https://sfo.cloud.appwrite.io/v1')
    .setProject('698e695d001d446b21d9')
    .setKey('standard_b6cd42bf7c58b5449ecb614ace3be50ab1f5c21900cfe1d83fe521b6ace848d2a7c625c58a64bc770b3612e62e2940df27df51671ff287184ed374b60f75b177f06d6a64b6e391e047e8590ce7ebc91c7a77c8b244a5c9135c67028f55f240ccdaf4528634410fdd34fad22baaaeeddd7097a877dbb250c73aa538ade05c7d0b1');

const storage = new Storage(client);

async function fixPermissions() {
    try {
        console.log("Ensuring public read on product-images...");
        await storage.updateBucket(
            'product-images',
            'Product Images',
            [
                Permission.read(Role.any()),
                Permission.write(Role.users()),
                Permission.update(Role.users()),
                Permission.delete(Role.users())
            ],
            true // fileSecurity
        );
        console.log("Bucket permissions updated successfully.");
    } catch (e) {
        console.error("Error updating permissions:", e);
    }
}

fixPermissions();
