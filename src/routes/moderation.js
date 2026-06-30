const express = require("express");
const router = express.Router();
const multer = require("multer");
const { moderateText } = require("../services/text.moderation");
const { moderateImage } = require("../services/image.moderation");

const upload = multer({ storage: multer.memoryStorage() });

// POST /moderation/text
router.post("/text", async (req, res) => {
  const { text } = req.body;
  const result = await moderateText(text);
  if (!result.ok) return res.status(422).json({ reason: result.reason });
  res.json({ ok: true });
});

// POST /moderation/image
router.post("/image", upload.single("file"), async (req, res) => {
  console.log("🔍 Moderando imagen...");
  if (!req.file)
    return res.status(400).json({ error: "No se recibió archivo" });
  const result = await moderateImage(req.file.buffer);
  if (!result.ok) return res.status(422).json({ reason: result.reason });
  res.json({ ok: true });
});

// POST /moderation/video
router.post("/video", upload.single("file"), async (req, res) => {
  if (!req.file)
    return res.status(400).json({ error: "No se recibió archivo" });
  const { moderateVideo } = require("../services/video.moderation");
  const result = await moderateVideo(req.file.buffer);
  if (!result.ok) return res.status(422).json({ reason: result.reason });
  res.json({ ok: true });
});

module.exports = router;
