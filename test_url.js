import https from 'https';

const url = 'https://sfo.cloud.appwrite.io/v1/storage/buckets/product-images/files/6998fadc001199b1f494/view?project=698e695d001d446b21d9';

https.get(url, (res) => {
    console.log('Status Code:', res.statusCode);
}).on('error', (e) => {
    console.error(e);
});
