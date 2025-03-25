const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const { db, initializeDatabase } = require("./db/init");

const app = express();
const port = 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Initialize database
initializeDatabase();

// List users
app.get("/api/users", (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const per_page = parseInt(req.query.per_page) || 6;
  const offset = (page - 1) * per_page;

  db.all("SELECT COUNT(*) as total FROM users", [], (err, countResult) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    const total = countResult[0].total;
    const total_pages = Math.ceil(total / per_page);

    db.all(
      "SELECT * FROM users LIMIT ? OFFSET ?",
      [per_page, offset],
      (err, rows) => {
        if (err) {
          return res.status(500).json({ error: err.message });
        }

        res.json({
          page,
          per_page,
          total,
          total_pages,
          data: rows,
        });
      }
    );
  });
});

// Get user by ID
app.get("/api/users/:id", (req, res) => {
  const id = req.params.id;

  db.get("SELECT * FROM users WHERE id = ?", [id], (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (!row) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json({ data: row });
  });
});

// Create user
app.post("/api/users", (req, res) => {
  const { name, job } = req.body;

  if (!name || !job) {
    return res.status(400).json({ error: "Name and job are required" });
  }

  const [first_name, last_name] = name.split(" ");
  const email = `${first_name.toLowerCase()}.${
    last_name ? last_name.toLowerCase() : "doe"
  }@reqres.in`;
  const avatar = `https://reqres.in/img/faces/${
    Math.floor(Math.random() * 10) + 1
  }-image.jpg`;

  db.run(
    "INSERT INTO users (first_name, last_name, email, avatar, job) VALUES (?, ?, ?, ?, ?)",
    [first_name, last_name || "", email, avatar, job],
    function (err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      res.status(201).json({
        name,
        job,
        id: this.lastID,
        createdAt: new Date().toISOString(),
      });
    }
  );
});

// Update user
app.put("/api/users/:id", (req, res) => {
  const id = req.params.id;
  const { name, job } = req.body;

  if (!name && !job) {
    return res.status(400).json({ error: "Name or job is required" });
  }

  let updates = [];
  let params = [];

  if (name) {
    const [first_name, last_name] = name.split(" ");
    updates.push("first_name = ?", "last_name = ?");
    params.push(first_name, last_name || "");
  }

  if (job) {
    updates.push("job = ?");
    params.push(job);
  }

  params.push(id);

  db.run(
    `UPDATE users SET ${updates.join(", ")} WHERE id = ?`,
    params,
    (err) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      res.json({
        name: name || "",
        job: job || "",
        updatedAt: new Date().toISOString(),
      });
    }
  );
});

// Delete user
app.delete("/api/users/:id", (req, res) => {
  const id = req.params.id;

  db.run("DELETE FROM users WHERE id = ?", [id], (err) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.status(204).send();
  });
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
