const { Pool } = require("pg");

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: Number(process.env.DB_PORT)
});

pool.on("connect", () => {
    console.log("✅ Connected to RecoverAI PostgreSQL database");
});

pool.on("error", (err) => {
    console.error("❌ PostgreSQL error:", err);
});

module.exports = pool;