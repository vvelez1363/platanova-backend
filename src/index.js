require("dotenv").config();
const express = require("express");
const cors = require("cors");
const admin = require("firebase-admin");
const moderationRouter = require("./routes/moderation");

const serviceAccountBuffer = Buffer.from(
  process.env.FIREBASE_SERVICE_ACCOUNT,
  "base64",
);
const serviceAccount = JSON.parse(serviceAccountBuffer.toString("utf8"));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: process.env.FIREBASE_PROJECT_ID,
});

console.log("✅ Firebase Admin inicializado");

const app = express();
app.use(cors());
app.use(express.json());
app.use("/moderation", moderationRouter);

app.use("/notifications", require("./routes/notifications"));

app.get("/health", (req, res) => {
  res.json({ status: "ok", service: "PlataNOVA Notifications" });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
});
