const { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const crypto = require("crypto");

const DEFAULT_BUCKET = "tutorialhub-uploads";

const extensionByMime = {
  "application/pdf": ".pdf",
  "image/png": ".png",
  "image/jpeg": ".jpg",
  "image/jpg": ".jpg",
  "image/webp": ".webp",
  "image/gif": ".gif",
};

let client = null;

function getBucketName() {
  return process.env.S3_BUCKET_NAME || DEFAULT_BUCKET;
}

function getRegion() {
  return process.env.AWS_REGION || process.env.S3_REGION || "ap-south-1";
}

function getPublicBaseUrl(bucketName) {
  if (process.env.S3_PUBLIC_BASE_URL) {
    return process.env.S3_PUBLIC_BASE_URL.replace(/\/+$/, "");
  }

  return `https://${bucketName}.s3.${getRegion()}.amazonaws.com`;
}

function getSignedUrlExpirySeconds() {
  const parsed = Number(process.env.S3_SIGNED_URL_EXPIRES_IN || 3600);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 3600;
}

function getS3Client() {
  if (client) {
    return client;
  }

  client = new S3Client({
    region: getRegion(),
    credentials: process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY
      ? {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        }
      : undefined,
  });

  return client;
}

function parseDataUrl(dataUrl) {
  const match = String(dataUrl || "").match(/^data:([^;]+);base64,(.+)$/);
  if (!match) {
    const error = new Error("Invalid upload payload.");
    error.statusCode = 400;
    throw error;
  }

  return {
    mimeType: match[1],
    buffer: Buffer.from(match[2], "base64"),
  };
}

function sanitizeSegment(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-_/.]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^[-/.]+|[-/.]+$/g, "");
}

function getObjectKeyUrl(key) {
  return `${getPublicBaseUrl(getBucketName())}/${key}`;
}

async function uploadDataUrl({
  keyPrefix,
  fileNamePrefix,
  dataUrl,
  originalName,
  allowedMimeTypes,
  maxBytes,
}) {
  const { mimeType, buffer } = parseDataUrl(dataUrl);
  if (allowedMimeTypes && !allowedMimeTypes.has(mimeType)) {
    const error = new Error("Unsupported file type.");
    error.statusCode = 400;
    throw error;
  }

  if (maxBytes && buffer.byteLength > maxBytes) {
    const error = new Error("Uploaded file is too large.");
    error.statusCode = 400;
    throw error;
  }

  const extension = extensionByMime[mimeType] || "";
  const safePrefix = sanitizeSegment(fileNamePrefix) || "file";
  const safeOriginalName = sanitizeSegment(originalName || "");
  const key = `${sanitizeSegment(keyPrefix)}/${safePrefix}-${Date.now()}-${crypto.randomBytes(6).toString("hex")}${extension || (safeOriginalName ? `-${safeOriginalName}` : "")}`;

  await getS3Client().send(
    new PutObjectCommand({
      Bucket: getBucketName(),
      Key: key,
      Body: buffer,
      ContentType: mimeType,
    })
  );

  return {
    key,
    url: getObjectKeyUrl(key),
    mimeType,
    size: buffer.byteLength,
    name: String(originalName || `${safePrefix}${extension}`),
  };
}

function getKeyFromUrl(url) {
  if (!url) return null;

  const publicBase = `${getPublicBaseUrl(getBucketName())}/`;
  if (String(url).startsWith(publicBase)) {
    return String(url).slice(publicBase.length);
  }

  return null;
}

async function deleteObjectByUrl(url) {
  const key = getKeyFromUrl(url);
  if (!key) return;

  await getS3Client().send(
    new DeleteObjectCommand({
      Bucket: getBucketName(),
      Key: key,
    })
  );
}

async function getSignedObjectUrl(url, options = {}) {
  if (!url) return null;

  const key = getKeyFromUrl(url);
  if (!key) {
    return url;
  }

  return getSignedUrl(
    getS3Client(),
    new GetObjectCommand({
      Bucket: getBucketName(),
      Key: key,
    }),
    {
      expiresIn: options.expiresIn || getSignedUrlExpirySeconds(),
    }
  );
}

module.exports = {
  deleteObjectByUrl,
  getBucketName,
  getKeyFromUrl,
  getObjectKeyUrl,
  getSignedObjectUrl,
  sanitizeSegment,
  uploadDataUrl,
};
