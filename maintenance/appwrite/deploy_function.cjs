
const { Client, Functions } = require('node-appwrite');
const { InputFile } = require('node-appwrite/file'); // Try path import if main fails, or polyfill
// Actually, let's verify if InputFile exists on the main object
// If not, we might simply pass the stream if the SDK version allows.
// But 11.1.0 should have InputFile.
// Let's debug require.

const fs = require('fs');
const path = require('path');

// Configuration
const ENDPOINT = 'https://sfo.cloud.appwrite.io/v1'; // Hardcoded for simplicity as seen in tests
const PROJECT_ID = '698e695d001d446b21d9';
const API_KEY = 'standard_b6cd42bf7c58b5449ecb614ace3be50ab1f5c21900cfe1d83fe521b6aa848d2a7c625c58a64bc770b3612e62e2940df27df51671ff287184ed374b60f75b177f06d6a64b6e391e047e8590ce7ebc91c7a77c8b244a5c9135c67028f55f240ccdaf4528634410fdd34fad22baaaeeddd7097a877dbb250c73aa538ade05c7d0b1';
const FUNCTION_ID = '6990eaf500142d7133f6'; // From .env

// Initialize Client
const client = new Client()
    .setEndpoint(ENDPOINT)
    .setProject(PROJECT_ID)
    .setKey(API_KEY);

const functions = new Functions(client);

async function deployFunction() {
    try {
        console.log('Starting deployment for function:', FUNCTION_ID);

        // Check file exists
        const filePath = path.join(__dirname, 'place_order.tar.gz');
        if (!fs.existsSync(filePath)) {
            console.error('Error: place_order.tar.gz not found!');
            return;
        }

        const size = fs.statSync(filePath).size;
        console.log(`Uploading tar.gz file (${size} bytes)...`);

        // Create Deployment
        // Note: For createDeployment, 'code' must be an InputFile for node-appwrite
        // Wait, node-appwrite expects a ReadStream or Buffer for file uploads usually.
        // Let's verify InputFile usage.

        const file = InputFile.fromPath(filePath, 'place_order.tar.gz');

        const deployment = await functions.createDeployment(
            FUNCTION_ID,
            file,
            true // activate immediately
        );

        console.log('Deployment created successfully!');
        console.log('ID:', deployment.$id);
        console.log('Status:', deployment.status);
        console.log('Active:', deployment.activate);

    } catch (error) {
        console.error('Deployment Failed:', error);
    }
}

deployFunction();
