const jwt = require("jsonwebtoken");
const SECRET = "123456";

require("dotenv").config();

const express = require("express");
const cors = require("cors");
const mysql = require("mysql2/promise"); // dùng promise cho async/await

const app = express();

app.use(cors());
app.use(express.json());

// =======================
// 🔐 LOGIN (🔥 THÊM ROLE)
// =======================
app.post("/login", (req, res) => {
  const { email, password } = req.body;

  // ADMIN
  if (email === "admin@gmail.com" && password === "123456") {
    const token = jwt.sign(
      { email, role: "admin" },
      SECRET,
      { expiresIn: "1h" }
    );

    return res.json({
      message: "Đăng nhập admin",
      token,
      role: "admin"
    });
  }

  // USER
  if (email === "user@gmail.com" && password === "123456") {
    const token = jwt.sign(
      { email, role: "user" },
      SECRET,
      { expiresIn: "1h" }
    );

    return res.json({
      message: "Đăng nhập user",
      token,
      role: "user"
    });
  }

  res.status(401).json({ message: "Sai tài khoản hoặc mật khẩu" });
});

// =======================
// 🔒 CHECK TOKEN
// =======================
const verifyToken = (req, res, next) => {
  const token = req.headers["authorization"];

  if (!token) {
    return res.status(403).json({ message: "Không có token" });
  }

  jwt.verify(token, SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).json({ message: "Token không hợp lệ" });
    }

    req.user = decoded;
    next();
  });
};

// =======================
// 🔒 CHECK ROLE
// =======================
const checkRole = (roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Không có quyền" });
    }
    next();
  };
};

// =======================
// TEST
// =======================
app.get("/", (req, res) => {
  res.send("HRM Backend API running");
});

// =======================
// 🔥 MYSQL CONNECTION HELPER
// =======================
const getConnection = async () => {
  return await mysql.createConnection({
    host: process.env.MYSQLHOST,
    user: process.env.MYSQLUSER,
    password: process.env.MYSQLPASSWORD,
    database: process.env.MYSQLDATABASE,
    port: process.env.MYSQLPORT || 3306,
    ssl: { rejectUnauthorized: true } // nếu Railway yêu cầu SSL
  });
};

// =======================
// 🔥 GET ALL USERS
// =======================
app.get("/users", verifyToken, async (req, res) => {
  let connection;
  try {
    connection = await getConnection();
    const [rows] = await connection.execute("SELECT * FROM users");
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Lỗi server" });
  } finally {
    if (connection) await connection.end();
  }
});

// =======================
// 🔥 GET USER BY ID
// =======================
app.get("/users/:id", verifyToken, async (req, res) => {
  const id = req.params.id;
  let connection;
  try {
    connection = await getConnection();
    const [rows] = await connection.execute("SELECT * FROM users WHERE id = ?", [id]);

    if (rows.length === 0) return res.status(404).json({ message: "User không tồn tại" });

    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Lỗi server" });
  } finally {
    if (connection) await connection.end();
  }
});

// =======================
// 🔥 CREATE USER
// =======================
app.post("/users", verifyToken, checkRole(["admin"]), async (req, res) => {
  const { name, email, position, avatar, joinDate } = req.body;

  if (!name || !email) return res.status(400).json({ message: "Thiếu name hoặc email" });

  const sql = `
    INSERT INTO users (name, email, position, avatar, joinDate)
    VALUES (?, ?, ?, ?, ?)
  `;
  let connection;
  try {
    connection = await getConnection();
    const [result] = await connection.execute(sql, [name, email, position, avatar, joinDate || null]);
    res.json({ message: "Thêm user thành công", id: result.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Lỗi thêm user" });
  } finally {
    if (connection) await connection.end();
  }
});

// =======================
// 🔥 UPDATE USER
// =======================
app.put("/users/:id", verifyToken, checkRole(["admin"]), async (req, res) => {
  const id = req.params.id;
  const { name, email, position, avatar, joinDate } = req.body;
  const sql = `
    UPDATE users
    SET name = ?, email = ?, position = ?, avatar = ?, joinDate = ?
    WHERE id = ?
  `;
  let connection;
  try {
    connection = await getConnection();
    await connection.execute(sql, [name, email, position, avatar, joinDate || null, id]);
    res.json({ message: "Cập nhật thành công" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Lỗi update user" });
  } finally {
    if (connection) await connection.end();
  }
});

// =======================
// 🔥 DELETE USER
// =======================
app.delete("/users/:id", verifyToken, checkRole(["admin"]), async (req, res) => {
  const id = req.params.id;
  let connection;
  try {
    connection = await getConnection();
    await connection.execute("DELETE FROM users WHERE id = ?", [id]);
    res.json({ message: "Xóa thành công" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Lỗi xóa user" });
  } finally {
    if (connection) await connection.end();
  }
});

// =======================
// ⏱️ CHECK IN
// =======================
app.post("/checkin", verifyToken, async (req, res) => {
  const { user_id } = req.body;
  const sql = `
    INSERT INTO attendance (user_id, date, check_in)
    VALUES (?, CURDATE(), CURTIME())
  `;
  let connection;
  try {
    connection = await getConnection();
    await connection.execute(sql, [user_id]);
    res.json({ message: "Check-in thành công" });
  } catch (err) {
    console.error(err);
    res.status(500).json(err);
  } finally {
    if (connection) await connection.end();
  }
});

// =======================
// ⏱️ CHECK OUT
// =======================
app.post("/checkout", verifyToken, async (req, res) => {
  const { user_id } = req.body;
  const sql = `
    UPDATE attendance
    SET check_out = CURTIME()
    WHERE user_id = ? AND date = CURDATE()
  `;
  let connection;
  try {
    connection = await getConnection();
    await connection.execute(sql, [user_id]);
    res.json({ message: "Check-out thành công" });
  } catch (err) {
    console.error(err);
    res.status(500).json(err);
  } finally {
    if (connection) await connection.end();
  }
});

// =======================
// START SERVER
// =======================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server chạy tại port ${PORT}`);
});