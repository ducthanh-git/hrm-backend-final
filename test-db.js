require("dotenv").config();
const mysql = require("mysql2/promise");

(async () => {
  try {
    const pool = mysql.createPool({
      host: process.env.MYSQLHOST,
      user: process.env.MYSQLUSER,
      password: process.env.MYSQLPASSWORD,
      database: process.env.MYSQLDATABASE,
      port: process.env.MYSQLPORT
    });

    const [rows] = await pool.query("SELECT * FROM users");
    console.log("✅ Users trong DB:", rows);
    process.exit(0);
  } catch (err) {
    console.error("❌ Lỗi DB:", err.message);
    process.exit(1);
  }
})();