const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
require("dotenv").config({ path: path.join(__dirname, ".env") });
const pool = require("./db");
const recoveryRoutes = require("./routes/recoveryRoutes");

const app = express();

app.use(cors());
app.use(express.json());

// API Routes
app.use("/api/recovery", recoveryRoutes);

// Health Check Endpoint
app.get("/health", async (req, res) => {
  try {
    await pool.query("SELECT 1");
    res.status(200).json({
      status: "ok",
      database: "connected",
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    res.status(503).json({
      status: "error",
      database: "disconnected",
      timestamp: new Date().toISOString()
    });
  }
});

// Production Static Client Serving
const clientDistPath = path.join(__dirname, "../client/dist");
if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));
  app.use((req, res, next) => {
    if (req.method === "GET" && !req.path.startsWith("/api") && req.path !== "/health") {
      return res.sendFile(path.join(clientDistPath, "index.html"));
    }
    next();
  });
} else {
  app.get("/", (req, res) => {
    res.json({
      message: "RecoverAI backend is running 🚀"
    });
  });
}

if (require.main === module) {
  const PORT = process.env.PORT || 5000;
  pool.query("SELECT NOW()", (err, result) => {
      if (err) {
          console.error("❌ Database connection failed:", err.message);
      } else {
          console.log("✅ PostgreSQL connected!");
          console.log("Database time:", result.rows[0].now);
      }
  });

  const HOST = process.env.HOST || "0.0.0.0";
  app.listen(PORT, HOST, () => {
    console.log(`RecoverAI server running on http://${HOST}:${PORT}`);
  });
}

module.exports = app;