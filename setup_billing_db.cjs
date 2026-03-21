require('dotenv').config();
const { Client, Databases, Role, Permission } = require('node-appwrite');

async function setupCollections() {
    const client = new Client()
        .setEndpoint(process.env.VITE_APPWRITE_ENDPOINT || 'https://sfo.cloud.appwrite.io/v1')
        .setProject(process.env.VITE_APPWRITE_PROJECT_ID)
        .setKey(process.env.APPWRITE_API_KEY);

    const databases = new Databases(client);
    const dbId = process.env.VITE_DATABASE_ID || 'boutique_carne_db';

    const collections = [
        {
            id: 'saas_projects',
            name: 'SaaS Projects',
            attributes: [
                { key: 'name', type: 'string', size: 255, required: true },
                { key: 'project_id_key', type: 'string', size: 255, required: true },
                { key: 'api_token', type: 'string', size: 255, required: false }
            ]
        },
        {
            id: 'subscriptions',
            name: 'Subscriptions',
            attributes: [
                { key: 'client_id', type: 'string', size: 255, required: true },
                { key: 'client_email', type: 'string', size: 255, required: true },
                { key: 'project_id', type: 'string', size: 255, required: true },
                { key: 'status', type: 'string', size: 50, required: true }, // active, warning, blocked, canceled
                { key: 'expires_at', type: 'datetime', required: true },
                { key: 'grace_period_until', type: 'datetime', required: true },
                { key: 'is_active', type: 'boolean', required: true, default: true },
                { key: 'mrr_value', type: 'double', required: true, default: 0.0 }
            ]
        },
        {
            id: 'payments_log',
            name: 'Payments Log',
            attributes: [
                { key: 'subscription_id', type: 'string', size: 255, required: true },
                { key: 'amount', type: 'double', required: true },
                { key: 'status', type: 'string', size: 50, required: true }, // pending, paid, expired, refunded
                { key: 'method', type: 'string', size: 50, required: true }, // pix, credit_card
                { key: 'pix_code', type: 'string', size: 500, required: false },
                { key: 'gateway_id', type: 'string', size: 255, required: false }
            ]
        },
        {
            id: 'gateways_config',
            name: 'Gateways Configuration',
            attributes: [
                { key: 'gateway_name', type: 'string', size: 50, required: true },
                { key: 'api_key', type: 'string', size: 500, required: true },
                { key: 'webhook_secret', type: 'string', size: 500, required: false },
                { key: 'is_active', type: 'boolean', required: true, default: true }
            ]
        }
    ];

    for (const col of collections) {
        try {
            console.log(`Creating collection: ${col.name}...`);
            await databases.createCollection(dbId, col.id, col.name, [
                Permission.read(Role.any()),
                Permission.write(Role.label('SUPER_ADMIN')),
                Permission.update(Role.label('SUPER_ADMIN')),
                Permission.delete(Role.label('SUPER_ADMIN')),
            ]);

            for (const attr of col.attributes) {
                console.log(`  Adding attribute: ${attr.key}...`);
                if (attr.type === 'string') {
                    await databases.createStringAttribute(dbId, col.id, attr.key, attr.size, attr.required);
                } else if (attr.type === 'datetime') {
                    await databases.createDatetimeAttribute(dbId, col.id, attr.key, attr.required);
                } else if (attr.type === 'boolean') {
                    await databases.createBooleanAttribute(dbId, col.id, attr.key, attr.required, attr.default);
                } else if (attr.type === 'double') {
                    await databases.createFloatAttribute(dbId, col.id, attr.key, attr.required, attr.default);
                }
            }
            console.log(`Collection ${col.id} created successfully.`);
        } catch (e) {
            if (e.code === 409) {
                console.log(`Collection ${col.id} already exists.`);
            } else {
                console.error(`Error creating collection ${col.id}:`, e.message);
            }
        }
    }
}

setupCollections().catch(console.error);
