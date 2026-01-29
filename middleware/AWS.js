const { S3Client, PutObjectCommand, DeleteObjectCommand } = require("@aws-sdk/client-s3");
const dotenv = require("dotenv");
const fs = require("fs");

dotenv.config();

// Initialize S3 client
const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

/**
 * Get the correct S3 URL format based on region
 */
const getS3Url = (bucketName, key) => {
  const region = process.env.AWS_REGION;
  if (region === "us-east-1") {
    return `https://${bucketName}.s3.amazonaws.com/${key}`;
  } else {
    return `https://${bucketName}.s3.${region}.amazonaws.com/${key}`;
  }
};

/**
 * Upload a file from a multipart form (formidable)
 */
const uploadFile = async (file, bucketname) => {
  try {
    const params = {
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Key: `${bucketname}/${Date.now()}_${file.originalFilename}`,
      Body: fs.createReadStream(file.filepath),
      ContentType: file.mimetype,
    };

    const command = new PutObjectCommand(params);
    await s3Client.send(command);

    const location = getS3Url(process.env.AWS_S3_BUCKET_NAME, params.Key);
    console.log(`File uploaded: ${location}`);
    return location;
  } catch (error) {
    console.error("Error uploading file:", error);
    throw new Error(`File upload failed: ${error.message}`);
  }
};

/**
 * Upload a file from express-multer middleware
 */
const uploadFile2 = async (file, bucketname) => {
  try {
    const params = {
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Key: `${bucketname}/${Date.now()}_${file.originalname}`,
      Body: file.buffer,
      ContentType: file.mimetype,
    };

    const command = new PutObjectCommand(params);
    await s3Client.send(command);

    const location = getS3Url(process.env.AWS_S3_BUCKET_NAME, params.Key);
    console.log(`File uploaded: ${location}`);
    return location;
  } catch (error) {
    console.error("Error uploading file:", error);
    throw new Error(`File upload failed: ${error.message}`);
  }
};

/**
 * Extract the S3 key from a full S3 URL
 */
const getUrlFileKey = (url) => {
  const regex = /^https?:\/\/([^\.]+)\.s3\.(?:[^\.]+\.)?amazonaws\.com\/(.+)$/;
  const match = url.match(regex);
  if (match) {
    return match[2];
  } else {
    throw new Error(`Invalid S3 URL: ${url}`);
  }
};

/**
 * Delete a file from S3
 */
const deleteFile = async (url) => {
  try {
    const fileKey = getUrlFileKey(url);
    console.log(`Deleting file with key: ${fileKey}`);

    const params = {
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Key: fileKey,
    };

    const command = new DeleteObjectCommand(params);
    const data = await s3Client.send(command);
    console.log(`File deleted successfully: ${fileKey}`);
    return data;
  } catch (error) {
    console.error("Error deleting file:", error);
    throw new Error(`Error deleting file: ${error.message}`);
  }
};

/**
 * Update a file in S3
 */
const updateFile = async (url, newFile) => {
  try {
    const fileKey = getUrlFileKey(url);
    await deleteFile(url);

    const params = {
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Key: fileKey,
      Body: newFile.buffer,
      ContentType: newFile.mimetype,
    };

    const command = new PutObjectCommand(params);
    await s3Client.send(command);

    const location = getS3Url(process.env.AWS_S3_BUCKET_NAME, fileKey);
    console.log(`File updated: ${location}`);
    return location;
  } catch (error) {
    console.error("Error updating file:", error);
    throw new Error(`Error updating file: ${error.message}`);
  }
};

/**
 * Upload multiple files to S3
 */
const multifileUpload = async (files, bucketname) => {
  try {
    const uploadPromises = files.map(async (file) => {
      const params = {
        Bucket: process.env.AWS_S3_BUCKET_NAME,
        Key: `${bucketname}/${Date.now()}_${file.originalname}`,
        Body: file.buffer,
        ContentType: file.mimetype,
      };

      const command = new PutObjectCommand(params);
      await s3Client.send(command);

      const location = getS3Url(process.env.AWS_S3_BUCKET_NAME, params.Key);
      console.log(`File uploaded: ${location}`);
      return location;
    });

    return Promise.all(uploadPromises);
  } catch (error) {
    console.error("Error uploading multiple files:", error);
    throw new Error(`Error uploading multiple files: ${error.message}`);
  }
};

module.exports = {
  uploadFile,
  uploadFile2,
  deleteFile,
  updateFile,
  multifileUpload,
};
