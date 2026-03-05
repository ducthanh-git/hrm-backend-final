const express = require("express");
const app = express();

app.get("/", (req, res) => {
  res.send("HRM Backend API is running");
});

module.exports = app;
