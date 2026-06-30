const { moderateText } = require("../services/text.moderation");
const { moderateImage } = require("../services/image.moderation");

/**
 * Middleware de moderación.
 *
 * Espera en req.body:
 *   - text?    → string con el texto a moderar
 *   - fileType? → 'image' | 'video'
 *
 * Espera en req.file (multer):
 *   - buffer   → el archivo subido
 *
 * Si algo falla moderación → responde 422 con { error, reason }
 * Si todo pasa → llama next()
 */
async function moderationMiddleware(req, res, next) {
  try {
    const { text, fileType } = req.body;

    // ── 1. Moderar texto ──────────────────────────────────────────────
    if (text) {
      const result = await moderateText(text);
      if (!result.ok) {
        return res.status(422).json({
          error: "CONTENT_REJECTED",
          reason: result.reason,
        });
      }
    }

    // ── 2. Moderar imagen ─────────────────────────────────────────────
    if (req.file && fileType === "image") {
      const result = await moderateImage(req.file.buffer);
      if (!result.ok) {
        return res.status(422).json({
          error: "CONTENT_REJECTED",
          reason: result.reason,
        });
      }
    }

    // ── 3. Moderar video (frame sampling) ────────────────────────────
    if (req.file && fileType === "video") {
      const { moderateVideo } = require("../services/video.moderation");
      const result = await moderateVideo(req.file.buffer);
      if (!result.ok) {
        return res.status(422).json({
          error: "CONTENT_REJECTED",
          reason: result.reason,
        });
      }
    }

    next();
  } catch (err) {
    console.error("[moderation] Error inesperado:", err);
    next(); // error técnico → deja pasar, no bloquea al usuario
  }
}

module.exports = { moderationMiddleware };
