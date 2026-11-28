const Alert = require("../models/Alert");

function getDistanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

async function sendEmailViaScript({ to, subject, html }) {
  const res = await fetch(process.env.MAIL_WEBHOOK_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ to, subject, html }),
  });

  if (!res.ok) {
    throw new Error(`Script Mail error: ${res.status}`);
  }
}

async function checkAndNotifyAlerts(newItem) {
  console.log("🔔 Checking alerts for item:", newItem.description);

  if (!process.env.MAIL_WEBHOOK_URL) {
    console.log("❌ MAIL_WEBHOOK_URL Render me set nahi hai!");
    return;
  }

  try {
    const alerts = await Alert.find({ notified: false });
    console.log("📋 Pending alerts found:", alerts.length);

    const itemText = `${newItem.description || ""} ${(newItem.tags || []).join(" ")}`.toLowerCase();
    const [itemLng, itemLat] = newItem.location?.coordinates || [0, 0];

    for (const alert of alerts) {
      const words = alert.query
        .toLowerCase()
        .split(/\s+/)
        .filter((w) => w.length > 2);

      const isTextMatch = words.some((w) => {
        const root = w.endsWith("s") ? w.slice(0, -1) : w;
        return itemText.includes(w) || itemText.includes(root);
      });

      const dist = getDistanceKm(alert.lat, alert.lng, itemLat, itemLng);

      console.log(
        `🔍 Checking alert "${alert.query}" | TextMatch: ${isTextMatch} | Dist: ${dist.toFixed(2)}km (Max: ${alert.radiusKm}km)`
      );

      if (isTextMatch && dist <= alert.radiusKm) {
        await sendEmailViaScript({
          to