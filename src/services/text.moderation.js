const axios = require("axios");
const { containsBadWords } = require("../utils/bad_words");

const PERSPECTIVE_URL =
  "https://commentanalyzer.googleapis.com/v1alpha1/comments:analyze";

// Umbral: bloquea si el score supera este valor (0.0 – 1.0)
const TOXICITY_THRESHOLD = 0.75;

/**
 * Modera un texto.
 * Retorna { ok: true } o { ok: false, reason: string }
 */
async function moderateText(text) {
  if (!text || text.trim().length === 0) return { ok: true };

  // 1. Lista local primero (rápido, sin red)
  if (containsBadWords(text)) {
    return { ok: false, reason: "El texto contiene lenguaje inapropiado." };
  }

  // 2. Perspective API (solo si PERSPECTIVE_KEY está configurada)
  const key = process.env.PERSPECTIVE_API_KEY;
  if (!key) return { ok: true }; // si no hay key, omite este paso

  try {
    const { data } = await axios.post(
      `${PERSPECTIVE_URL}?key=${key}`,
      {
        comment: { text },
        languages: ["es"],
        requestedAttributes: {
          TOXICITY: {},
          SEVERE_TOXICITY: {},
          THREAT: {},
        },
      },
      { timeout: 4000 }, // no bloquea al usuario más de 4s
    );

    const scores = data.attributeScores;
    const toxicity = scores.TOXICITY.summaryScore.value;
    const severe = scores.SEVERE_TOXICITY.summaryScore.value;
    const threat = scores.THREAT.summaryScore.value;

    if (severe > 0.6 || threat > 0.6 || toxicity > TOXICITY_THRESHOLD) {
      return {
        ok: false,
        reason: "El texto fue detectado como inapropiado. Por favor revísalo.",
      };
    }
  } catch (err) {
    // Si Perspective falla (timeout, red), no bloqueas al usuario
    console.warn("[moderation] Perspective API error:", err.message);
  }

  return { ok: true };
}

module.exports = { moderateText };
