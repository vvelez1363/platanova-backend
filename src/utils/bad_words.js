// Lista base en español — amplía según necesites
const BAD_WORDS = [
  "mierda",
  "hijueputa",
  "puta",
  "marica",
  "gonorrea",
  "malparido",
  "hp",
  "ctm",
  "culero",
  "pendejo",
  "idiota",
  "estupido",
  "imbecil",
];

/**
 * Retorna true si el texto contiene alguna palabra de la lista.
 * Ignora mayúsculas y caracteres pegados (hola_puta, puta123).
 */
function containsBadWords(text) {
  if (!text) return false;
  const normalized = text.toLowerCase().replace(/[^a-záéíóúüñ\s]/gi, " ");
  return BAD_WORDS.some((word) => {
    const regex = new RegExp(`\\b${word}\\b`, "i");
    return regex.test(normalized);
  });
}

module.exports = { containsBadWords, BAD_WORDS };
