const router = require("express").Router();
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const axios = require("axios");
const { OAuth2Client } = require("google-auth-library");
const User = require("../models/User");
const Otp = require("../models/Otp");
const { requireAuth } = require("../middleware/auth");

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const SMS_MODE = process.env.OTP_MODE === "sms" && process.env.TWILIO_VERIFY_SID;

const publicUser = (u) => ({
  id: u._id,
  name: u.name,
  email: u.email,
  picture: u.picture,
  phone: u.phone,
  phoneVerified: u.phoneVerified,
});

const hash = (s) => crypto.createHash("sha256").update(s + process.env.JWT_SECRET).digest("hex");

function normalizePhone(raw) {
  const digits = String(raw || "").replace(/[\s-]/g, "");
  if (/^[6-9]\d{9}$/.test(digits)) return "+91" + digits;         // 10 digit Indian number
  if (/^\+\d{10,14}$/.test(digits)) return digits;                 // country code ke saath
  return null;
}

// ---------- Google login ----------
router.post("/google", async (req, res) => {
  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: req.body.credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const p = ticket.getPayload();
    if (!p.email_verified) return res.status(400).json({ error: "Google email verified nahi hai" });

    const user = await User.findOneAndUpdate(
      { googleId: p.sub },
      { googleId: p.sub, email: p.email, name: p.name, picture: p.picture },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });
    res.json({ token, user: publicUser(user) });
  } catch (err) {
    console.error("Google login error:", err.message);
    res.status(401).json({ error: "Google login fail hua. Dobara try karo." });
  }
});

router.get("/me", requireAuth, (req, res) => res.json(publicUser(req.user)));

// ---------- Phone OTP ----------
router.post("/phone/send-otp", requireAuth, async (req, res) => {
  try {
    const phone = normalizePhone(req.body.phone);
    if (!phone) return res.status(400).json({ error: "Phone number sahi nahi hai (10 digit likho)" });

    const recent = await Otp.findOne({ userId: req.user._id, createdAt: { $gt: new Date(Date.now() - 30000) } });
    if (recent) return res.status(429).json({ error: "30 second ruko, phir dobara OTP maango" });

    if (SMS_MODE) {
      await axios.post(
        `https://verify.twilio.com/v2/Services/${process.env.TWILIO_VERIFY_SID}/Verifications`,
        new URLSearchParams({ To: phone, Channel: "sms" }),
        { auth: { username: process.env.TWILIO_ACCOUNT_SID, password: process.env.TWILIO_AUTH_TOKEN } }
      );
      await Otp.deleteMany({ userId: req.user._id });
      await Otp.create({ userId: req.user._id, phone, codeHash: "twilio" }); // sirf rate-limit ke liye
      return res.json({ sent: true, phone });
    }

    // DEV mode: OTP khud banao
    const code = String(crypto.randomInt(100000, 1000000));
    await Otp.deleteMany({ userId: req.user._id });
    await Otp.create({ userId: req.user._id, phone, codeHash: hash(code) });
    console.log(`[DEV OTP] ${phone} -> ${code}`);
    res.json({ sent: true, phone, devOtp: code });
  } catch (err) {
    console.error("send-otp error:", err.response?.data || err.message);
    res.status(500).json({ error: "OTP nahi bhej paye. Number check karo ya baad me try karo." });
  }
});

router.post("/phone/verify", requireAuth, async (req, res) => {
  try {
    const phone = normalizePhone(req.body.phone);
    const otp = String(req.body.otp || "").trim();
    if (!phone || !/^\d{4,8}$/.test(otp)) return res.status(400).json({ error: "Phone aur OTP sahi daalo" });

    const rec = await Otp.findOne({ userId: req.user._id, phone });
    if (!rec) return res.status(400).json({ error: "OTP expire ho gaya, naya OTP maango" });
    if (rec.attempts >= 5) return res.status(429).json({ error: "Bahut galat try. Naya OTP maango." });

    let ok = false;
    if (SMS_MODE) {
      const r = await axios.post(
        `https://verify.twilio.com/v2/Services/${process.env.TWILIO_VERIFY_SID}/VerificationCheck`,
        new URLSearchParams({ To: phone, Code: otp }),
        { auth: { username: process.env.TWILIO_ACCOUNT_SID, password: process.env.TWILIO_AUTH_TOKEN } }
      );
      ok = r.data.status === "approved";
    } else {
      ok = rec.codeHash === hash(otp);
    }

    if (!ok) {
      rec.attempts += 1;
      await rec.save();
      return res.status(400).json({ error: "OTP galat hai" });
    }

    req.user.phone = phone;
    req.user.phoneVerified = true;
    await req.user.save();
    await Otp.deleteMany({ userId: req.user._id });
    res.json({ user: publicUser(req.user) });
  } catch (err) {
    console.error("verify-otp error:", err.response?.data || err.message);
    res.status(400).json({ error: "OTP verify nahi ho paya" });
  }
});

module.exports = router;
