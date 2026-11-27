const jwt = require("jsonwebtoken");
const User = require("../models/User");

async function requireAuth(req, res, next) {
  const h = req.headers.authorization || "";
  const token = h.startsWith("Bearer ") ? h.slice(7) : null;
  if (!token) return res.status(401).json({ error: "Pehle login karo" });
  try {
    const { id } = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(id);
    if (!user) return res.status(401).json({ error: "User nahi mila, dobara login karo" });
    req.user = user;
    next();
  } catch {
    res.status(401).json({ error: "Session expire ho gaya, dobara login karo" });
  }
}

function requirePhone(req, res, next) {
  if (!req.user.phoneVerified) {
    return res.status(403).json({ error: "Pehle phone number verify karo", code: "PHONE_REQUIRED" });
  }
  next();
}

module.exports = { requireAuth, requirePhone };
