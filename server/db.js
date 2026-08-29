const { Pool } = require("pg");

const useSsl = process.env.DB_SSL === "true" || (process.env.NODE_ENV === "production" && process.env.DB_SSL !== "false");
const sslConfig = useSsl ? { rejectUnauthorized: false } : false;

let poolConfig;

if (process.env.DATABASE_URL) {
    poolConfig = {
        connectionString: process.env.DATABASE_URL,
        ssl: sslConfig
    };
} else {
    poolConfig = {
        user: process.env.DB_USER,
        host: process.env.DB_HOST,
        database: process.env.DB_NAME,
        password: process.env.DB_PASSWORD,
        port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 5432,
        ssl: sslConfig
    };
}

const pool = new Pool(poolConfig);

pool.on("connect", () => {
    console.log("✅ Connected to RecoverAI PostgreSQL database");
});

pool.on("error", (err) => {
    console.error("❌ PostgreSQL pool error:", err.message);
});

module.exports = pool;