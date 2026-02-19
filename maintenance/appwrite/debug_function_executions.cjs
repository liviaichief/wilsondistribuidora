
const { Client, Functions, Query } = require('node-appwrite');
require('dotenv').config();

const client = new Client()
    .setEndpoint('https://sfo.cloud.appwrite.io/v1')
    .setProject('698e695d001d446b21d9')
    .setKey('standard_b6cd42bf7c58b5449ecb614ace3be50ab1f5c21900cfe1d83fe521b6aa848d2a7c625c58a64bc770b3612e62e2940df27df51671ff287184ed374b60f75b177f06d6a64b6e391e047e8590ce7ebc91c7a77c8b244a5c9135c67028f55f240ccdaf4528634410fdd34fad22baaaeeddd7097a877dbb250c73aa538ade05c7d0b1');

const functions = new Functions(client);
const FUNCTION_ID = '6990eaf500142d7133f6';

async function listExecutions() {
    try {
        console.log(`Fetching executions for ${FUNCTION_ID}...`);
        const response = await functions.listExecutions(FUNCTION_ID, [
            Query.orderDesc('$createdAt'),
            Query.limit(5)
        ]);

        console.log(`Found ${response.total} executions.`);

        response.executions.forEach((exec, i) => {
            console.log(`\n--- Execution ${i + 1} [${exec.$id}] ---`);
            console.log(`Status: ${exec.status}`);
            console.log(`Created: ${exec.$createdAt}`);
            console.log(`Duration: ${exec.duration}s`);
            console.log(`Exit Code: ${exec.exitCode}`);
            console.log(`Errors (stderr):`);
            console.log(exec.errors || '(none)');
            console.log(`Output (stdout/response):`);
            console.log(exec.responseBody || '(none)');
        });

    } catch (e) {
        console.error("Error fetching executions:", e);
    }
}

listExecutions();
