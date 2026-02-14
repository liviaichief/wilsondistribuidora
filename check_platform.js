
import { Client, Projects } from 'node-appwrite';

const ENDPOINT = 'https://sfo.cloud.appwrite.io/v1';
const PROJECT_ID = '698e695d001d446b21d9';
const API_KEY = 'standard_b6cd42bf7c58b5449ecb614ace3be50ab1f5c21900cfe1d83fe521b6aa848d2a7c625c58a64bc770b3612e62e2940df27df51671ff287184ed374b60f75b177f06d6a64b6e391e047e8590ce7ebc91c7a77c8b244a5c9135c67028f55f240ccdaf4528634410fdd34fad22baaaeeddd7097a877dbb250c73aa538ade05c7d0b1';

const client = new Client()
    .setEndpoint(ENDPOINT)
    .setProject(PROJECT_ID)
    .setKey(API_KEY);

// Projects service is not typically exposed in standard node-appwrite for *Client* use, 
// ensuring we are using the correct import.
// Actually, 'node-appwrite' exports 'Projects' service? 
// Let's try to instantiate it.

async function checkPlatforms() {
    try {
        // Projects service might require a Console API Key or specific scope.
        // The key we have is likely a Project API Key. Project API keys usually can't manage the project itself (platforms), 
        // only resources WITHIN the project (DB, Users, Storage).
        // But let's try.
        const projects = new Projects(client);
        
        // List platforms? 
        // The API for listing platforms is `projects.listPlatforms(projectId)`.
        // Wait, if we are using a Project API Key, we might not be able to access `projects` service 
        // which is for Console/Server level management.
        
        console.log('Attempting to list platforms...');
        const response = await projects.listPlatforms(PROJECT_ID);
        
        console.log('Platforms:', response.platforms.map(p => `${p.name} (${p.type}): ${p.hostname || p.key}`));

        const productionDomain = 'boutiquecarne.vercel.app';
        const exists = response.platforms.some(p => p.hostname === productionDomain);

        if (!exists) {
            console.log(`Adding platform for ${productionDomain}...`);
            await projects.createPlatform(
                PROJECT_ID,
                'web',
                'Production Vercel',
                productionDomain
            );
            console.log('Platform added successfully!');
        } else {
            console.log('Platform already exists.');
        }

    } catch (error) {
        console.error('Error managing platforms:', error.message);
        if (error.code === 401 || error.code === 403) {
            console.log('NOTE: The current API Key does not have permission to manage platforms. User must do this manually in Console.');
        }
    }
}

checkPlatforms();
