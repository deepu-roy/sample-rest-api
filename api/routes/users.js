/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         email:
 *           type: string
 *           format: email
 *         first_name:
 *           type: string
 *         last_name:
 *           type: string
 *         avatar:
 *           type: string
 *           format: uri
 *     UserCreateResponse:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *         job:
 *           type: string
 *         id:
 *           type: string
 *         createdAt:
 *           type: string
 *           format: date-time
 *     UserUpdateResponse:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *         job:
 *           type: string
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

const express = require("express");
const router = express.Router();
const { db } = require("../db/init");

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: List users
 *     description: Retrieve a list of users with pagination
 *     tags: [Users]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: per_page
 *         schema:
 *           type: integer
 *           default: 6
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: List of users
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 page:
 *                   type: integer
 *                 per_page:
 *                   type: integer
 *                 total:
 *                   type: integer
 *                 total_pages:
 *                   type: integer
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/User'
 */
router.get("/", (req, res) => {
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

/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     summary: Get user by ID
 *     description: Retrieve a single user by their ID
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: User ID
 *     responses:
 *       200:
 *         description: User found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       404:
 *         description: User not found
 */
router.get("/:id", (req, res) => {
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

/**
 * @swagger
 * /api/users:
 *   post:
 *     summary: Create user
 *     description: Create a new user
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - job
 *             properties:
 *               name:
 *                 type: string
 *               job:
 *                 type: string
 *     responses:
 *       201:
 *         description: User created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserCreateResponse'
 */
router.post("/", (req, res) => {
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

/**
 * @swagger
 * /api/users/{id}:
 *   put:
 *     summary: Update user
 *     description: Update an existing user
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: User ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               job:
 *                 type: string
 *     responses:
 *       200:
 *         description: User updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserUpdateResponse'
 */
router.put("/:id", (req, res) => {
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

/**
 * @swagger
 * /api/users/{id}:
 *   delete:
 *     summary: Delete user
 *     description: Delete an existing user
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: User ID
 *     responses:
 *       204:
 *         description: User deleted
 */
router.delete("/:id", (req, res) => {
  const id = req.params.id;

  db.run("DELETE FROM users WHERE id = ?", [id], (err) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.status(204).send();
  });
});

module.exports = router;
