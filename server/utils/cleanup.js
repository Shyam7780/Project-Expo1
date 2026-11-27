const Item = require("../models/Item");
const { deleteImage } = require("./storage");

const DAYS = Number(process.env.ITEM_EXPIRY_DAYS || 20);

// 20 din (ya ITEM_EXPIRY_DAYS) se purane items + unki images delete
async function cleanupOldItems() {
  const cutoff = new Date(Date.now() - DAYS * 24 * 60 * 60 * 1000);
  const old = await Item.find({ createdAt: { $lt: cutoff } });
  for (const item of old) await deleteImage(item);
  const r = await Item.deleteMany({ createdAt: { $lt: cutoff } });
  if (r.deletedCount) console.log(`Cleanup: ${r.deletedCount} purane item delete hue`);
}

function startCleanup() {
  cleanupOldItems().catch((e) => console.error("Cleanup error:", e.message));
  setInterval(() => cleanupOldItems().catch((e) => console.error("Cleanup error:", e.message)), 6 * 60 * 60 * 1000);
}

module.exports = { startCleanup, DAYS };
