const { Storage } = require('@google-cloud/storage');

const storage = new Storage({
    projectId: process.env.PROJECT_ID,
    keyFilename: process.env.KEY
});

const bucketName = process.env.BUCKET;
const bucket = storage.bucket(bucketName);

const uploadFile = async(filePath, destination) => {
    await bucket.upload(filePath, {
        destination: destination,
        public: true
    });

    return `https://storage.googleapis.com/${bucketName}/${destination}`;
};

module.exports = uploadFile;