const nodemailer = require("nodemailer");
const Alert = require("../models/Alert");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS, // Gmail App Password
  },
});

// 2 coordinates ke beech distance (km me)
function getDistanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

async function checkAndNotifyAlerts(newItem) {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) return;

  try {
    const alerts = await Alert.find({ notified: false });
    const itemText = `${newItem.description || ""} ${(newItem.tags || []).join(" ")}`.toLowerCase();
    const [itemLng, itemLat] = newItem.location?.coordinates || [0, 0];

    for (const alert of alerts) {
      const words = alert.query.toLowerCase().split(/\s+/).filter((w) => w.length > 2);
      const isTextMatch = words.some((w) => itemText.includes(w));
      const dist = getDistanceKm(alert.lat, alert.lng, itemLat, itemLng);

      if (isTextMatch && dist <= alert.radiusKm) {
        await transporter.sendMail({
          from: `"FoundIT Alert" <${process.env.EMAIL_USER}>`,
          to: alert.email,
          subject: `🎉 FoundIT: Aapka "${alert.query}" mil sakta hai!`,
          html: `
            <h2>Naya matching item upload hua hai!</h2>
            <p><b>Aapki search:</b> ${alert.query}</p>
            <p><b>Description:</b> ${newItem.description || "No description"}</p>
            ${newItem.imageUrl ? `<img src="${newItem.imageUrl}" width="250" style="border-radius:8px;" />` : ""}
            <p><a href="${process.env.FRONTEND_URL || "https://project-expo1.vercel.app"}/search">FoundIT par jakar check karein →</a></p>
          `,
        });

        alert.notified = true;
        await alert.save();
      }
    }
  } catch (err) {
    console.error("Alert mail error:", err.message);
  }
}

module.exports = { checkAndNotifyAlerts };