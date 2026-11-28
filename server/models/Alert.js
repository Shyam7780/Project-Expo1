const mongoose = require("mongoose");

const alertSchema = new mongoose.Schema({
  email: { type: String, required: true },
  query: { type: String, required: true },
  lat: { type: Number, required: true },
  lng: { type: Number, required: true },
  radiusKm: { type: Number, default: 5 },
  notified: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now, expires: 60 * 60 * 24 * 20 } // 20 din me auto-delete
});

module.exports = mongoose.model("Alert", alertSchema);