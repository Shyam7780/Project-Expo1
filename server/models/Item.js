const mongoose = require("mongoose");

const itemSchema = new mongoose.Schema({
  imageUrl: String,
  tags: [String],
  description: String,
  status: { type: String, default: "found" },
  location: {
    type: { type: String, enum: ["Point"], default: "Point" },
    coordinates: { type: [Number], required: true }, // [lng, lat]
  },
  createdAt: { type: Date, default: Date.now },
});

itemSchema.index({ location: "2dsphere" });

module.exports = mongoose.model("Item", itemSchema);
