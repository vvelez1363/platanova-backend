const express = require("express");
const router = express.Router();
const { sendToPlayers } = require("../services/onesignal.service");
const admin = require("firebase-admin");

const db = admin.firestore();

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function getPlayerId(userId) {
  const doc = await db.collection("users").doc(userId).get();
  return doc.exists ? doc.data()?.oneSignalPlayerId : null;
}

async function guardarNotificacion(
  toUserId,
  tipo,
  descripcion,
  prioridad = "media",
  extras = {},
) {
  const now = new Date();
  await db
    .collection("users")
    .doc(toUserId)
    .collection("notifications")
    .add({
      tipo,
      descripcion,
      estado: "activa",
      prioridad,
      fecha: now,
      creado_en: now,
      ...extras,
    });
}

// ─── POST /notifications/chat ─────────────────────────────────────────────────
router.post("/chat", async (req, res) => {
  try {
    const { toUserId, fromUserName, messagePreview, chatId, offerId } =
      req.body;

    if (!toUserId || !fromUserName || !messagePreview || !chatId || !offerId) {
      return res.status(400).json({ error: "Faltan campos requeridos" });
    }

    const playerId = await getPlayerId(toUserId);
    if (!playerId)
      return res.status(404).json({ error: "Player ID no encontrado" });

    // Armamos la fecha actual de forma limpia
    const now = new Date();

    await Promise.all([
      // Enviar a OneSignal para la alerta push nativa
      sendToPlayers([playerId], `💬 ${fromUserName}`, messagePreview, {
        type: "chat",
        targetId: chatId,
        offerId,
      }),

      // Guardar en la base de datos de Firestore del usuario
      guardarNotificacion(
        toUserId,
        "chat",
        `${fromUserName}: ${messagePreview}`,
        "media",
        {
          offerId: offerId,
          chatId: chatId,
          creadoEn: now,
        },
      ),
    ]);

    res.json({ success: true });
  } catch (e) {
    console.error("❌ /chat error:", e.message);
    res.status(500).json({ error: e.message });
  }
});

// ─── POST /notifications/marketplace ─────────────────────────────────────────
router.post("/marketplace", async (req, res) => {
  try {
    const { toUserId, producerName, offerTitle, offerId } = req.body;

    if (!toUserId || !producerName || !offerTitle || !offerId) {
      return res.status(400).json({ error: "Faltan campos requeridos" });
    }

    const playerId = await getPlayerId(toUserId);
    if (!playerId)
      return res.status(404).json({ error: "Player ID no encontrado" });

    await Promise.all([
      sendToPlayers(
        [playerId],
        "🍌 Nueva oferta en Marketplace",
        `${producerName} publicó: ${offerTitle}`,
        { type: "marketplace", targetId: offerId },
      ),
      guardarNotificacion(
        toUserId,
        "interes",
        `${producerName} publicó: ${offerTitle}`,
        "media",
      ),
    ]);

    res.json({ success: true });
  } catch (e) {
    console.error("❌ /marketplace error:", e.message);
    res.status(500).json({ error: e.message });
  }
});

// ─── POST /notifications/feed ─────────────────────────────────────────────────
router.post("/feed", async (req, res) => {
  try {
    const { toUserId, fromUserName, action, postId } = req.body;

    if (!toUserId || !fromUserName || !action || !postId) {
      return res.status(400).json({ error: "Faltan campos requeridos" });
    }

    const playerId = await getPlayerId(toUserId);
    if (!playerId)
      return res.status(404).json({ error: "Player ID no encontrado" });

    await Promise.all([
      sendToPlayers(
        [playerId],
        "🌱 PlataNOVA",
        `${fromUserName} ${action} tu publicación`,
        { type: "feed", targetId: postId },
      ),
      guardarNotificacion(
        toUserId,
        "like",
        `${fromUserName} ${action} tu publicación`,
        "baja",
      ),
    ]);

    res.json({ success: true });
  } catch (e) {
    console.error("❌ /feed error:", e.message);
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
