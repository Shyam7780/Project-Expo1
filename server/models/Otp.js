const mongoose = require("mongoose");

// Sirf dev mode me use hota hai. 10 minute baad apne aap delete (TTL).
const otpSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, index: true },
  phone: String,
  codeHash: String,
  attempts: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now, expires: 600 },
});

module.exports = mongoose.model("Otp", otpSchema);
