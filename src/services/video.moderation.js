const ffmpeg = require("fluent-ffmpeg");
const { moderateImage } = require("./image.moderation");
const path = require("path");
const fs = require("fs");
const os = require("os");

// Solo si Render no lo detecta automáticamente
if (process.env.FFMPEG_PATH) {
  ffmpeg.setFfmpegPath(process.env.FFMPEG_PATH);
}

/**
 * Extrae N frames de un video en buffer y los modera con NSFW.js.
 * Retorna { ok: true } o { ok: false, reason: string }
 */
async function moderateVideo(videoBuffer, frameCount = 4) {
  const tmpDir = os.tmpdir();
  const videoPath = path.join(tmpDir, `vid_${Date.now()}.mp4`);
  const framePaths = [];

  try {
    // 1. Escribe el buffer a un archivo temporal
    fs.writeFileSync(videoPath, videoBuffer);

    // 2. Extrae los frames como imágenes temporales
    await new Promise((resolve, reject) => {
      ffmpeg(videoPath)
        .on("end", resolve)
        .on("error", reject)
        .screenshots({
          count: frameCount,
          folder: tmpDir,
          filename: `frame_${Date.now()}_%i.jpg`,
          size: "224x224",
        });
    });

    // 3. Encuentra los frames generados
    const allFiles = fs.readdirSync(tmpDir);
    const frameFiles = allFiles
      .filter((f) => f.startsWith(`frame_`) && f.endsWith(".jpg"))
      .sort();

    for (const file of frameFiles) {
      framePaths.push(path.join(tmpDir, file));
    }

    // 4. Modera cada frame
    for (const framePath of framePaths) {
      const frameBuffer = fs.readFileSync(framePath);
      const result = await moderateImage(frameBuffer);
      if (!result.ok) {
        return {
          ok: false,
          reason: "El video contiene contenido inapropiado.",
        };
      }
    }

    return { ok: true };
  } catch (err) {
    console.warn("[moderation] Error en moderación de video:", err.message);
    // Error técnico → deja pasar
    return { ok: true };
  } finally {
    // 5. Limpia archivos temporales siempre
    _cleanup([videoPath, ...framePaths]);
  }
}

function _cleanup(paths) {
  for (const p of paths) {
    try {
      if (fs.existsSync(p)) fs.unlinkSync(p);
    } catch (_) {}
  }
}

module.exports = { moderateVideo };
