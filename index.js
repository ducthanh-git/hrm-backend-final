const jwt = require("jsonwebtoken");
const SECRET = "123456";

require("dotenv").config();

const express = require("express");
const cors = require("cors");
const mysql = require("mysql2");

const app = express();

app.use(cors());
app.use(express.json());

// =======================
// 🔥 KẾT NỐI MYSQL
// =======================
const db = mysql.createConnection({
  host: process.env.MYSQLHOST,
  user: process.env.MYSQLUSER,
  password: process.env.MYSQLPASSWORD,
  database: process.env.MYSQLDATABASE,
  port: process.env.MYSQLPORT
});

db.connect((err) => {
  if (err) {
    console.log("❌ Lỗi kết nối DB:", err);
  } else {
    console.log("✅ Kết nối DB thành công!");
  }
});

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
// 🔥 GET ALL USERS (ai cũng xem được)
// =======================
app.get("/users", verifyToken, (req, res) => {
  db.query("SELECT * FROM users", (err, result) => {
    if (err) {
      console.log(err);
      return res.status(500).json({ error: "Lỗi server" });
    }
    res.json(result);
  });
});

// =======================
// 🔥 GET USER BY ID
// =======================
app.get("/users/:id", verifyToken, (req, res) => {
  const id = req.params.id;

  db.query("SELECT * FROM users WHERE id = ?", [id], (err, result) => {
    if (err) {
      return res.status(500).json({ error: "Lỗi server" });
    }

    if (result.length === 0) {
      return res.status(404).json({ message: "User không tồn tại" });
    }

    res.json(result[0]);
  });
});

// =======================
// 🔥 CREATE USER (CHỈ ADMIN)
// =======================
app.post("/users", verifyToken, checkRole(["admin"]), (req, res) => {
  const { name, email, position, avatar, joinDate } = req.body;

  if (!name || !email) {
    return res.status(400).json({ message: "Thiếu name hoặc email" });
  }

  const sql = `
    INSERT INTO users (name, email, position, avatar, joinDate)
    VALUES (?, ?, ?, ?, ?)
  `;

  db.query(
    sql,
    [name, email, position, avatar, joinDate || null],
    (err, result) => {
      if (err) {
        console.log(err);
        return res.status(500).json({ error: "Lỗi thêm user" });
      }

      res.json({
        message: "Thêm user thành công",
        id: result.insertId
      });
    }
  );
});

// =======================
// 🔥 UPDATE USER (CHỈ ADMIN)
// =======================
app.put("/users/:id", verifyToken, checkRole(["admin"]), (req, res) => {
  const id = req.params.id;
  const { name, email, position, avatar, joinDate } = req.body;

  const sql = `
    UPDATE users
    SET name = ?, email = ?, position = ?, avatar = ?, joinDate = ?
    WHERE id = ?
  `;

  db.query(
    sql,
    [name, email, position, avatar, joinDate || null, id],
    (err) => {
      if (err) {
        console.log("SQL ERROR:", err);
        return res.status(500).json({ error: "Lỗi update user" });
      }

      res.json({ message: "Cập nhật thành công" });
    }
  );
});

// =======================
// 🔥 DELETE USER (CHỈ ADMIN)
// =======================
app.delete("/users/:id", verifyToken, checkRole(["admin"]), (req, res) => {
  const id = req.params.id;

  db.query("DELETE FROM users WHERE id = ?", [id], (err) => {
    if (err) {
      return res.status(500).json({ error: "Lỗi xóa user" });
    }

    res.json({ message: "Xóa thành công" });
  });
});

// =======================
// ⏱️ CHECK IN (AI CŨNG DÙNG ĐƯỢC)
// =======================
app.post("/checkin", verifyToken, (req, res) => {
  const { user_id } = req.body;

  const sql = `
    INSERT INTO attendance (user_id, date, check_in)
    VALUES (?, CURDATE(), CURTIME())
  `;

  db.query(sql, [user_id], (err) => {
    if (err) return res.status(500).json(err);
    res.json({ message: "Check-in thành công" });
  });
});

// =======================
// ⏱️ CHECK OUT
// =======================
app.post("/checkout", verifyToken, (req, res) => {
  const { user_id } = req.body;

  const sql = `
    UPDATE attendance
    SET check_out = CURTIME()
    WHERE user_id = ? AND date = CURDATE()
  `;

  db.query(sql, [user_id], (err) => {
    if (err) return res.status(500).json(err);
    res.json({ message: "Check-out thành công" });
  });
});

// =======================
// START SERVER
// =======================
const PORT = 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server chạy tại http://localhost:${PORT}`);
});