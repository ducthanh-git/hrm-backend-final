const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

const users = [
  { id: 1, name: "Nguyen Duc Thanh" },
  { id: 2, name: "Nguyen Van Bang" },
  { id: 3, name: "Le Van A" }
];

app.get("/", (req, res) => {
  res.send("HRM Backend API running");
});

app.get("/users", (req, res) => {
  res.json(users);
});

app.get("/users/:id", (req, res) => {
  const id = parseInt(req.params.id);
  const user = users.find(u => u.id === id);

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  res.json(user);
});

module.exports = app;