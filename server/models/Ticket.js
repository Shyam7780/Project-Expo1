const mongoose = require("mongoose");

const ticketSchema = new mongoose.Schema(
  {
    ticketId: { type: String, unique: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 80 },
    email: { type: String, required: true, trim: true, lowercase: true },
    category: {
      type: String,
      enum: ["claim", "upload", "search", "report", "other"],
      default: "other",
    },
    subject: { type: String, required: true, trim: true, maxlength: 120 },
    message: { type: String, required: true, trim: true, maxlength: 1500 },
    status: { type: String, enum: ["open", "in_progress", "resolved"], default: "open" },
    reply: { type: String, default: "" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Ticket", ticketSchema);
