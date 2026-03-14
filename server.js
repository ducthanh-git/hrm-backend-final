const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '123456',
  database: 'hrm_db'
});

db.connect((err) => {
  if (err) {
    console.log('Lỗi kết nối MySQL:', err);
  } else {
    console.log('Kết nối MySQL thành công!');
  }
});

app.get('/', (req, res) => {
  res.send('Backend đang chạy');
});

app.get('/users', (req, res) => {
  const sql = 'SELECT * FROM users';
  db.query(sql, (err, result) => {
    if (err) {
      res.status(500).json({ error: 'Lỗi truy vấn users' });
    } else {
      res.json(result);
    }
  });
});

app.get('/users/:id', (req, res) => {
  const id = req.params.id;
  const sql = 'SELECT * FROM users WHERE id = ?';
  db.query(sql, [id], (err, result) => {
    if (err) {
      res.status(500).json({ error: 'Lỗi truy vấn user theo id' });
    } else {
      res.json(result);
    }
  });
});

app.listen(3000, () => {
  console.log('Server đang chạy tại http://localhost:3000');
});