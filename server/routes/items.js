const router = require("express").Router();
const multer = require("multer");
const axios = require("axios");
const FormData = require("form-data");
const fs = require("fs");
const path = require("path");
const Item = require("../models/Item");

const upload = multer({ storage: multer.memoryStorage() });

// Image save: S3 (agar keys hain) warna local uploads folder
async function saveImage(file) {
  const name = `${Date.now()}-${file.originalname.replace(/\s+/g, "_")}`;

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
    return `https://${process.env.AWS_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
  }

  // Local fallback
  fs.writeFileSync(path.join(__dirname, "..", "uploads", name), file.buffer);
  return `${process.env.PUBLIC_URL || "http://localhost:5000"}/uploads/${name}`;
}

// DEBUG: saare items dekhne ke liye -> http://localhost:5000/api/items
router.get("/", async (req, res) => {
  const items = await Item.find().sort({ createdAt: -1 }).limit(20);
  res.json(items);
});

// POST /api/items -> found item upload
router.post("/", upload.single("image"), async (req, res) => {
  try {
    const { lat, lng, description } = req.body;
    if (!req.file) return res.status(400).json({ error: "Image required" });
    if (!lat || !lng) return res.status(400).json({ error: "Location required" });

    const imageUrl = await saveImage(req.file);

    const fd = new FormData();
    fd.append("file", req.file.buffer, req.file.originalname);
    const { data } = await axios.post(`${process.env.ML_URL}/tags`, fd, {
      headers: fd.getHeaders(),
    });

    const item = await Item.create({
      imageUrl,
      tags: data.tags,
      description,
      location: { type: "Point", coordinates: [parseFloat(lng), parseFloat(lat)] },
    });
    res.json(item);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Upload failed: " + err.message });
  }
});

// POST /api/items/search -> natural language query + landmark
router.post("/search", async (req, res) => {
  try {
    const { query, lat, lng, radiusKm = 5 } = req.body;

    const nearby = await Item.find({
      location: {
        $near: {
          $geometry: { type: "Point", coordinates: [parseFloat(lng), parseFloat(lat)] },
          $maxDistance: radiusKm * 1000,
        },
      },
    }).lean();

    console.log(`Search "${query}": ${nearby.length} item(s) in ${radiusKm} km`);
    if (nearby.length === 0) return res.json([]);

    // Tags + description dono par matching
    const { data } = await axios.post(`${process.env.ML_URL}/match`, {
      query,
      items: nearby.map((i) => ({
        id: String(i._id),
        tags: i.tags.join(" ") + " " + (i.description || ""),
      })),
    });

    const scoreMap = Object.fromEntries(data.results.map((r) => [r.id, r.score]));
    const ranked = nearby
      .map((i) => ({ ...i, score: scoreMap[String(i._id)] || 0 }))
      .filter((i) => i.score > 0)
      .sort((a, b) => b.score - a.score);

    console.log(`Matched: ${ranked.length}`);
    res.json(ranked);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Search failed: " + err.message });
  }
});

module.exports = router;