const express = require("express");
const cors = require("cors");
require("dotenv").config();
const pool = require("./db");
const recoveryRoutes = require("./routes/recoveryRoutes");
const app = express();

app.use(cors());
app.use(express.json());
app.use("/api/recovery", recoveryRoutes);

app.get("/", (req, res) => {
  res.json({
    message: "RecoverAI backend is running 🚀"
  });
});

app.get("/health", async (req, res) => {
  try {
    await pool.query("SELECT 1");
    res.status(200).json({
      status: "ok",
      database: "connected"
    });
  } catch (err) {
    res.status(503).json({
      status: "error",
      database: "disconnected"
    });
  }
});

const PORT = process.env.PORT || 5000;
pool.query("SELECT NOW()", (err, result) => {
    if (err) {
        console.error("❌ Database connection failed:", err.message);
    } else {
        console.log("✅ PostgreSQL connected!");
        console.log("Database time:", result.rows[0].now);
    }
});
app.listen(PORT, () => {
  console.log(`RecoverAI server running on port ${PORT}`);
});