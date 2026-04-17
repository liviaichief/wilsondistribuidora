
const { Client, Storage, InputFile } = require('node-appwrite');
const fs = require('fs');
const path = require('path');

async function testUpload() {
    console.log("--- QA SMOKE TEST: Appwrite Storage Connectivity ---");
    
    const client = new Client()
        .setEndpoint('https://sfo.cloud.appwrite.io/v1')
        .setProject('69d59db800358cca9f27')
        .setKey('standard_dc313f0ead20b43da4c50584f76ea0316cba57d539fc7586bc7dd8cb8de5d9903afecaa10aa40ebb11b0a63f73706bc9e61c1132d3342b85a40651096b43b9d04fdd54a0bc55317ef9b516542d4c10e91505aaae2d909025c7c779e2dfd09a060cf2e2d69b27f88f85eeb188ea0ada1614ecf6e01f6fb0e8d6932f6f9b37d140');

    const storage = new Storage(client);
    const BUCKET_ID = 'images_bucket';

    try {
        // 1. Check Bucket Access
        console.log(`[1/3] Checking access to bucket: ${BUCKET_ID}...`);
        const bucket = await storage.getBucket(BUCKET_ID);
        console.log(`SUCCESS: Bucket found - Name: ${bucket.name}, Max File Size: ${bucket.maximumFileSize} bytes`);

        // 2. Try simple upload
        console.log("[2/3] Attempting dummy file upload...");
        const dummyPath = path.join(__dirname, 'dummy_test.txt');
        fs.writeFileSync(dummyPath, 'QA Test Content');
        
        const result = await storage.createFile(
            BUCKET_ID,
            'qa_test_' + Date.now(),
            InputFile.fromPath(dummyPath, 'qa_test.txt')
        );
        console.log(`SUCCESS: File uploaded with ID: ${result.$id}`);

        // 3. Cleanup
        console.log("[3/3] Cleaning up test file...");
        await storage.deleteFile(BUCKET_ID, result.$id);
        fs.unlinkSync(dummyPath);
        console.log("SUCCESS: Test file removed.");
        
        console.log("\n>>> QA STATUS: PASSED - Infrastructure ready for uploads.");
    } catch (error) {
        console.error("\n>>> QA STATUS: FAILED");
        console.error("Error Details:", error.message);
        if (error.response) console.error("Response:", JSON.stringify(error.response, null, 2));
        process.exit(1);
    }
}

testUpload();
