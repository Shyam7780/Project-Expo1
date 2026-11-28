const router = require("express").Router();
const multer = require("multer");
const axios = require("axios");
const FormData = require("form-data");
const Item = require("../models/Item");
const { saveImage } = require("../utils/storage");
const { DAYS } = require("../utils/cleanup");
const { requireAuth, requirePhone } = require("../middleware/auth");
const Alert = require("../models/Alert");
const { checkAndNotifyAlerts } = require("../utils/mailer");

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 8 * 1024 * 1024 } });
const cutoffDate = () => new Date(Date.now() - DAYS * 24 * 60 * 60 * 1000);

// Recent items (sirf login user ko)
router.get("/", requireAuth, async (req, res) => {
  const items = await Item.find({ createdAt: { $gte: cutoffDate() } }).sort({ createdAt: -1 }).limit(20);
  res.json(items);
});

// Found item upload (login zaruri)
router.post("/", requireAuth, upload.single("image"), async (req, res) => {
  try {
    const { lat, lng, description } = req.body;
    if (!req.file) return res.status(400).json({ error: "Image required" });
    if (!lat || !lng) return res.status(400).json({ error: "Location required" });
    if (!req.file.mimetype.startsWith("image/")) return res.status(400).json({ error: "Sirf image upload karo" });

    const img = await saveImage(req.file);

    const fd = new FormData();
    fd.append("file", req.file.buffer, req.file.originalname);
    const { data } = await axios.post(`${process.env.ML_URL}/tags`, fd, {
      headers: fd.getHeaders(),
      timeout: 120000,
    });

    const item = await Item.create({
      finder: req.user._id,
      imageUrl: img.url,
      imageKey: img.key,
      imageProvider: img.provider,
      tags: data.tags,
      description,
      location: { type: "Point", coordinates: [parseFloat(lng), parseFloat(lat)] },
    });

    // Background me saved alerts check karke Gmail bhejega
    checkAndNotifyAlerts(item);

    res.json(item);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Upload failed: " + err.message });
  }
});

// Search (login + verified phone zaruri)
router.post("/search", requireAuth, requirePhone, async (req, res) => {
  try {
    const { query, lat, lng, radiusKm = 5 } = req.body;
    const nearby = await Item.find({
      createdAt: { $gte: cutoffDate() },
      location: {
        $near: {
          $geometry: { type: "Point", coordinates: [parseFloat(lng), parseFloat(lat)] },
          $maxDistance: radiusKm * 1000,
        },
      },
    }).lean();

    if (nearby.length === 0) return res.json([]);

    const { data } = await axios.post(
      `${process.env.ML_URL}/match`,
      {
        query,
        items: nearby.map((i) => ({
          id: String(i._id),
          tags: i.tags.join(" ") + " " + (i.description || ""),
        })),
      },
      { timeout: 120000 }
    );

    const scoreMap = Object.fromEntries(data.results.map((r) => [r.id, r.score]));
    const ranked = nearby
      .map((i) => ({ ...i, score: scoreMap[String(i._id)] || 0 }))
      .filter((i) => i.score > 0)
      .sort((a, b) => b.score - a.score);

    res.json(ranked);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Search failed: " + err.message });
  }
});

// Gmail Alert save karne ka route
router.post("/alert", requireAuth, async (req, res) => {
  try {
    const { email, query, lat, lng, radiusKm } = req.body;
    const userEmail = email || req.user?.email;
    if (!userEmail || !query) {
      return res.status(400).json({ error: "Email aur query zaroori hai" });
    }
    await Alert.create({ email: userEmail, query, lat, lng, radiusKm });
    res.json({ ok: true, message: "Alert set ho gaya!" });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;