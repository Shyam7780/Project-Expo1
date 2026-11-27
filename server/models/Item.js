const mongoose = require("mongoose");

const itemSchema = new mongoose.Schema({
  finder: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
  imageUrl: String,
  imageKey: String,       // Cloudinary public_id / S3 key / local filename
  imageProvider: String,  // cloudinary | s3 | local
  tags: [String],
  description: String,
  status: { type: String, default: "found" },
  location: {
    type: { type: String, enum: ["Point"], default: "Point" },
    coordinates: { type: [Number], required: true }, // [lng, lat]
  },
  // Safety net: cleanup job miss kare to MongoDB khud 25 din baad delete kar dega (TTL)
  createdAt: { type: Date, default: Date.now, expires: 60 * 60 * 24 * 25 },
});

itemSchema.index({ location: "2dsphere" });

module.exports = mongoose.model("Item", itemSchema);
