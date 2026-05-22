const express = require("express");
const router = express.Router();
const { sendToPlayers } = require("../services/onesignal.service");
const admin = require("firebase-admin");

const db = admin.firestore();

async function getPlayerId(userId) {
  const doc = await db.collection("users").doc(userId).get();
  return doc.exists ? doc.data()?.oneSignalPlayerId : null;
}

// Notificación de chat
router.post("/chat", async (req, res) => {
  try {
    const { toUserId, fromUserName, messagePreview, chatId } = req.body;
    const playerId = await getPlayerId(toUserId);
    if (!playerId)
      return res.status(404).json({ error: "Player ID no encontrado" });

    await sendToPlayers([playerId], `💬 ${fromUserName}`, messagePreview, {
      type: "chat",
      targetId: chatId,
    });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Notificación de marketplace
router.post("/marketplace", async (req, res) => {
  try {
    const { toUserId, producerName, offerTitle, offerId } = req.body;
    const playerId = await getPlayerId(toUserId);
    if (!playerId)
      return res.status(404).json({ error: "Player ID no encontrado" });

    await sendToPlayers(
      [playerId],
      "🍌 Nueva oferta en Marketplace",
      `${producerName} publicó: ${offerTitle}`,
      { type: "marketplace", targetId: offerId },
    );
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Notificación de feed
router.post("/feed", async (req, res) => {
  try {
    const { toUserId, fromUserName, action, postId } = req.body;
    const playerId = await getPlayerId(toUserId);
    if (!playerId)
      return res.status(404).json({ error: "Player ID no encontrado" });

    await sendToPlayers(
      [playerId],
      "🌱 PlataNOVA",
      `${fromUserName} ${action} tu publicación`,
      { type: "feed", targetId: postId },
    );
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
