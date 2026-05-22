const axios = require("axios");

const client = axios.create({
  baseURL: "https://onesignal.com/api/v1",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Basic ${process.env.ONESIGNAL_API_KEY}`,
  },
});

async function sendToPlayers(playerIds, title, body, data = {}) {
  if (!playerIds || playerIds.length === 0) return null;

  const payload = {
    app_id: process.env.ONESIGNAL_APP_ID,
    include_player_ids: playerIds,
    headings: { en: title, es: title },
    contents: { en: body, es: body },
    data,
  };

  const response = await client.post("/notifications", payload);
  console.log("✅ Notificación enviada:", response.data);
  return response.data;
}

module.exports = { sendToPlayers };
