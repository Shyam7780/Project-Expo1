const fs = require("fs");
const path = require("path");

const UPLOAD_DIR = path.join(__dirname, "..", "uploads");

// Image save: Cloudinary > S3 > local
async function saveImage(file) {
  const name = `${Date.now()}-${file.originalname.replace(/\s+/g, "_")}`;

  if (process.env.CLOUDINARY_URL) {
    const cloudinary = require("cloudinary").v2;
    const result = await new Promise((resolve, reject) => {
      cloudinary.uploader
        .upload_stream({ folder: "foundit" }, (err, r) => (err ? reject(err) : resolve(r)))
        .end(file.buffer);
    });
    return { url: result.secure_url, key: result.public_id, provider: "cloudinary" };
  }

  if (process.env.AWS_BUCKET && process.env.AWS_ACCESS_KEY_ID) {
    const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
    const s3 = new S3Client({ region: process.env.AWS_REGION });
    const key = `items/${name}`;
    await s3.send(
      new PutObjectCommand({
        Bucket: process.env.AWS_BUCKET,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
      })
    );
    return {
      url: `https://${process.env.AWS_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`,
      key,
      provider: "s3",
    };
  }

  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  fs.writeFileSync(path.join(UPLOAD_DIR, name), file.buffer);
  return {
    url: `${process.env.PUBLIC_URL || "http://localhost:5000"}/uploads/${name}`,
    key: name,
    provider: "local",
  };
}

async function deleteImage(item) {
  try {
    if (item.imageProvider === "cloudinary") {
      const cloudinary = require("cloudinary").v2;
      await cloudinary.uploader.destroy(item.imageKey);
    } else if (item.imageProvider === "s3") {
      const { S3Client, DeleteObjectCommand } = require("@aws-sdk/client-s3");
      const s3 = new S3Client({ region: process.env.AWS_REGION });
      await s3.send(new DeleteObjectCommand({ Bucket: process.env.AWS_BUCKET, Key: item.imageKey }));
    } else if (item.imageProvider === "local" && item.imageKey) {
      fs.unlink(path.join(UPLOAD_DIR, item.imageKey), () => {});
    }
  } catch (err) {
    console.error("Image delete failed:", item.imageKey, err.message);
  }
}

module.exports = { saveImage, deleteImage };
