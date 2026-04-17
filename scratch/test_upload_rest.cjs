
const fs = require('fs');

async function testUploadRest() {
    console.log("--- QA SMOKE TEST: Appwrite Storage Connectivity (REST) ---");
    
    const projectId = '69d59db800358cca9f27';
    const apiKey = 'standard_dc313f0ead20b43da4c50584f76ea0316cba57d539fc7586bc7dd8cb8de5d9903afecaa10aa40ebb11b0a63f73706bc9e61c1132d3342b85a40651096b43b9d04fdd54a0bc55317ef9b516542d4c10e91505aaae2d909025c7c779e2dfd09a060cf2e2d69b27f88f85eeb188ea0ada1614ecf6e01f6fb0e8d6932f6f9b37d140';
    const bucketId = 'images_bucket';
    const endpoint = `https://sfo.cloud.appwrite.io/v1/storage/buckets/${bucketId}/files`;

    try {
        console.log("[1/3] Attempting file upload via REST...");
        const fileName = 'qa_smoke_test.txt';
        const fileContent = 'QA Audit Test - Infrastructure Verification';
        
        const form = new FormData();
        form.append('fileId', 'unique()');
        form.append('file', new Blob([fileContent], { type: 'text/plain' }), fileName);

        const uploadRes = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'x-appwrite-project': projectId,
                'x-appwrite-key': apiKey
            },
            body: form
        });

        const data = await uploadRes.json();

        if (!uploadRes.ok) {
            throw new Error(`Upload Failed: ${JSON.stringify(data)}`);
        }

        console.log(`SUCCESS: File uploaded. ID: ${data.$id}`);

        console.log("[2/3] Verifying file visibility...");
        const viewRes = await fetch(`${endpoint}/${data.$id}/view?project=${projectId}`, {
            headers: {
                'x-appwrite-project': projectId,
                'x-appwrite-key': apiKey
            }
        });

        if (viewRes.ok) {
            console.log("SUCCESS: File is accessible.");
        } else {
            console.warn("WARNING: File view returned status", viewRes.status);
        }

        console.log("[3/3] Cleaning up test file...");
        const delRes = await fetch(`${endpoint}/${data.$id}`, {
            method: 'DELETE',
            headers: {
                'x-appwrite-project': projectId,
                'x-appwrite-key': apiKey
            }
        });

        if (delRes.ok || delRes.status === 204) {
            console.log("SUCCESS: Test file removed.");
        } else {
            console.error("ERROR: Failed to delete test file.");
        }

        console.log("\n>>> QA STATUS: PASSED - Appwrite Integration Healthy.");
    } catch (error) {
        console.error("\n>>> QA STATUS: FAILED");
        console.error("Error Details:", error.message);
        process.exit(1);
    }
}

testUploadRest();
