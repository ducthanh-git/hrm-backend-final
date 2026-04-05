const express = require('express');
const serverless = require('serverless-http');
const mysql = require('mysql2/promise');
require('dotenv').config();

const app = express();

// Middleware parse JSON
app.use(express.json());

// Route GET /api/users
app.get('/', async (req, res) => {
    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
            port: process.env.DB_PORT || 3306
        });

        const [rows] = await connection.execute('SELECT * FROM users');
        await connection.end();

        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error' });
    }
});

module.exports = app;
module.exports.handler = serverless(app);