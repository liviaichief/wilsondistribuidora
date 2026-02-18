
import { Client, Databases, Query, Storage } from 'node-appwrite';

const ENDPOINT = 'https://sfo.cloud.appwrite.io/v1';
const PROJECT_ID = '698e695d001d446b21d9';
const API_KEY = 'standard_b6cd42bf7c58b5449ecb614ace3be50ab1f5c21900cfe1d83fe521b6aa848d2a7c625c58a64bc770b3612e62e2940df27df51671ff287184ed374b60f75b177f06d6a64b6e391e047e8590ce7ebc91c7a77c8b244a5c9135c67028f55f240ccdaf4528634410fdd34fad22baaaeeddd7097a877dbb250c73aa538ade05c7d0b1';
const DATABASE_ID = 'boutique_carne_db';
const PRODUCTS_COLLECTION = 'products';

const client = new Client()
    .setEndpoint(ENDPOINT)
    .setProject(PROJECT_ID)
    .setKey(API_KEY);

const databases = new Databases(client);
const storage = new Storage(client);

async function debugImage() {
    try {
        console.log("Searching for product 3RG-00121...");
        const response = await databases.listDocuments(DATABASE_ID, PRODUCTS_COLLECTION, [
            Query.equal('product_sku', '3RG-00121')
        ]);

        if (response.documents.length === 0) {
            console.log("Product not found.");
            return;
        }

        const product = response.documents[0];
        console.log("Product found:", product.title);
        console.log("Image field value:", product.image);

        if (product.image) {
            console.log("Checking buckets...");
            const buckets = await storage.listBuckets();
            console.log("Buckets found:", buckets.buckets.map(b => b.$id));

            // Try to find the file in 'product-images' if it exists
            const bucketId = 'product-images';
            try {
                console.log(`Checking file ${product.image} in bucket ${bucketId}...`);
                const file = await storage.getFile(bucketId, product.image);
                console.log("File found in storage!");
                console.log("File size:", file.sizeOriginal);
                console.log("File mimeType:", file.mimeType);
            } catch (err) {
                console.log(`File NOT found in ${bucketId}:`, err.message);
            }
        }

    } catch (error) {
        console.error("Error:", error);
    }
}

debugImage();
