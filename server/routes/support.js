const router = require("express").Router();
const Ticket = require("../models/Ticket");

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function makeTicketId() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let id = "FI-";
  for (let i = 0; i < 6; i++) id += chars[Math.floor(Math.random() * chars.length)];
  return id;
}

function adminOnly(req, res, next) {
  if (!process.env.ADMIN_KEY || req.headers["x-admin-key"] !== process.env.ADMIN_KEY) {
    return res.status(401).json({ error: "Admin key galat hai" });
  }
  next();
}

// User: nayi query bhejo
router.post("/", async (req, res) => {
  try {
    const { name, email, category, subject, message } = req.body;
    if (!name || !email || !subject || !message)
      return res.status(400).json({ error: "Sab fields bharna zaruri hai" });
    if (!EMAIL_RE.test(email)) return res.status(400).json({ error: "Email sahi nahi hai" });
    if (message.trim().length < 10)
      return res.status(400).json({ error: "Message thoda detail me likho (kam se kam 10 akshar)" });

    const ticket = await Ticket.create({
      ticketId: makeTicketId(),
      name,
      email,
      category,
      subject,
      message,
    });
    res.json({ ticketId: ticket.ticketId });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Query save nahi ho payi: " + err.message });
  }
});

// User: apne ticket ka status dekho (ticketId + email dono match hone chahiye)
router.post("/track", async (req, res) => {
  try {
    const { ticketId, email } = req.body;
    const t = await Ticket.findOne({
      ticketId: String(ticketId || "").trim().toUpperCase(),
      email: String(email || "").trim().toLowerCase(),
    }).lean();
    if (!t) return res.status(404).json({ error: "Ticket nahi mila. ID aur email check karo." });
    res.json({
      ticketId: t.ticketId,
      category: t.category,
      subject: t.subject,
      message: t.message,
      status: t.status,
      reply: t.reply,
      createdAt: t.createdAt,
      updatedAt: t.updatedAt,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: saare tickets
router.get("/admin/all", adminOnly, async (req, res) => {
  const tickets = await Ticket.find().sort({ createdAt: -1 }).limit(200).lean();
  res.json(tickets);
});

// Admin: status / reply update
router.patch("/admin/:id", adminOnly, async (req, res) => {
  try {
    const { status, reply } = req.body;
    const t = await Ticket.findByIdAndUpdate(
      req.params.id,
      { ...(status && { status }), ...(reply !== undefined && { reply }) },
      { new: true }
    );
    if (!t) return res.status(404).json({ error: "Ticket nahi mila" });
    res.json(t);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
