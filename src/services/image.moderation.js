const nsfwjs = require("nsfwjs");
const tf = require("@tensorflow/tfjs-node");
const sharp = require("sharp");

let _model = null;

async function loadModel() {
  if (!_model) {
    _model = await nsfwjs.load();
    console.log("[moderation] Modelo NSFW cargado");
  }
  return _model;
}

const BLOCKED_CATEGORIES = ["Porn", "Hentai", "Sexy"];
const BLOCK_THRESHOLD = 0.3;

async function moderateImage(imageBuffer) {
  try {
    const model = await loadModel();

    const resized = await sharp(imageBuffer).resize(224, 224).png().toBuffer();

    const tensor = tf.node.decodeImage(resized, 3);
    const predictions = await model.classify(tensor);
    tensor.dispose();

    const flagged = predictions.find(
      (p) =>
        BLOCKED_CATEGORIES.includes(p.className) &&
        p.probability > BLOCK_THRESHOLD,
    );

    if (flagged) {
      return {
        ok: false,
        reason: "La imagen fue detectada como contenido inapropiado.",
      };
    }
  } catch (err) {
    console.warn("[moderation] Error en moderación de imagen:", err.message);
  }

  return { ok: true };
}

module.exports = { moderateImage, loadModel };
