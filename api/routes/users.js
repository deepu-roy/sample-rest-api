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
 *         job:
 *           type: string
 *         role_id:
 *           type: integer
 *         role:
 *           type: object
 *           properties:
 *             id:
 *               type: integer
 *             name:
 *               type: string
 *             description:
 *               type: string
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
 *     description: Retrieve a list of users with pagination and optional role filtering
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
 *       - in: query
 *         name: role
 *         schema:
 *           type: integer
 *         description: Filter users by role ID
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
 *       400:
 *         description: Invalid role parameter
 */
router.get("/", (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const per_page = parseInt(req.query.per_page) || 6;
  const offset = (page - 1) * per_page;
  const roleFilter = req.query.role;

  // Validate role filter if provided
  if (roleFilter !== undefined) {
    const roleId = parseInt(roleFilter);
    if (isNaN(roleId) || roleId <= 0 || !/^\d+$/.test(roleFilter.toString())) {
      return res
        .status(400)
        .json({ error: "Invalid role parameter. Must be a positive integer." });
    }
  }

  // Build WHERE clause for role filtering
  let whereClause = "";
  let countParams = [];
  let queryParams = [];

  if (roleFilter) {
    whereClause = "WHERE u.role_id = ?";
    countParams = [parseInt(roleFilter)];
    queryParams = [parseInt(roleFilter), per_page, offset];
  } else {
    queryParams = [per_page, offset];
  }

  // Count total users with optional role filter
  const countQuery = `SELECT COUNT(*) as total FROM users u ${whereClause}`;

  db.all(countQuery, countParams, (err, countResult) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    const total = countResult[0].total;
    const total_pages = Math.ceil(total / per_page);

    // Query users with optional role filter
    const userQuery = `SELECT u.*, r.name as role_name, r.description as role_description, r.is_active as role_is_active 
                       FROM users u 
                       LEFT JOIN roles r ON u.role_id = r.id 
                       ${whereClause}
                       LIMIT ? OFFSET ?`;

    db.all(userQuery, queryParams, (err, rows) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      // Transform the data to include role object
      const transformedData = rows.map((row) => ({
        id: row.id,
        email: row.email,
        first_name: row.first_name,
        last_name: row.last_name,
        avatar: row.avatar,
        job: row.job,
        role_id: row.role_id,
        role: row.role_name
          ? {
              id: row.role_id,
              name: row.role_name,
              description: row.role_description,
              is_active: row.role_is_active,
            }
          : null,
      }));

      res.json({
        page,
        per_page,
        total,
        total_pages,
        data: transformedData,
      });
    });
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

  db.get(
    `SELECT u.*, r.name as role_name, r.description as role_description, r.is_active as role_is_active 
     FROM users u 
     LEFT JOIN roles r ON u.role_id = r.id 
     WHERE u.id = ?`,
    [id],
    (err, row) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      if (!row) {
        return res.status(404).json({ error: "User not found" });
      }

      // Transform the data to include role object
      const userData = {
        id: row.id,
        email: row.email,
        first_name: row.first_name,
        last_name: row.last_name,
        avatar: row.avatar,
        job: row.job,
        role_id: row.role_id,
        role: row.role_name
          ? {
              id: row.role_id,
              name: row.role_name,
              description: row.role_description,
              is_active: row.role_is_active,
            }
          : null,
      };

      res.json({ data: userData });
    }
  );
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
 *               role_id:
 *                 type: integer
 *                 description: Role ID to assign to the user (defaults to 1 if not provided)
 *     responses:
 *       201:
 *         description: User created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserCreateResponse'
 *       400:
 *         description: Invalid input or role does not exist
 */
router.post("/", (req, res) => {
  const { name, job, role_id } = req.body;

  if (!name || !job) {
    return res.status(400).json({ error: "Name and job are required" });
  }

  // Set default role if not provided
  const roleId = role_id || 1;

  // Validate that the role exists
  db.get(
    "SELECT id FROM roles WHERE id = ? AND is_active = 1",
    [roleId],
    (err, roleRow) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      if (!roleRow) {
        return res.status(400).json({ error: "Invalid role_id provided" });
      }

      const [first_name, last_name] = name.split(" ");
      const email = `${first_name.toLowerCase()}.${
        last_name ? last_name.toLowerCase() : "doe"
      }@reqres.in`;
      const avatar = `https://reqres.in/img/faces/${
        Math.floor(Math.random() * 10) + 1
      }-image.jpg`;

      db.run(
        "INSERT INTO users (first_name, last_name, email, avatar, job, role_id) VALUES (?, ?, ?, ?, ?, ?)",
        [first_name, last_name || "", email, avatar, job, roleId],
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
 *               role_id:
 *                 type: integer
 *                 description: Role ID to assign to the user
 *     responses:
 *       200:
 *         description: User updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserUpdateResponse'
 *       400:
 *         description: Invalid input or role does not exist
 *       404:
 *         description: User not found
 */
router.put("/:id", (req, res) => {
  const id = req.params.id;
  const { name, job, role_id } = req.body;

  if (!name && !job && !role_id) {
    return res.status(400).json({ error: "Name, job, or role_id is required" });
  }

  // First, check if user exists and get current role for audit logging
  db.get("SELECT role_id FROM users WHERE id = ?", [id], (err, currentUser) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (!currentUser) {
      return res.status(404).json({ error: "User not found" });
    }

    // If role_id is provided, validate it exists
    const validateRoleAndUpdate = (callback) => {
      if (role_id) {
        db.get(
          "SELECT id FROM roles WHERE id = ? AND is_active = 1",
          [role_id],
          (err, roleRow) => {
            if (err) {
              return res.status(500).json({ error: err.message });
            }
            if (!roleRow) {
              return res
                .status(400)
                .json({ error: "Invalid role_id provided" });
            }
            callback();
          }
        );
      } else {
        callback();
      }
    };

    validateRoleAndUpdate(() => {
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

      if (role_id) {
        updates.push("role_id = ?");
        params.push(role_id);
      }

      params.push(id);

      db.run(
        `UPDATE users SET ${updates.join(", ")} WHERE id = ?`,
        params,
        (err) => {
          if (err) {
            return res.status(500).json({ error: err.message });
          }

          // Log role change for audit purposes
          if (role_id && role_id !== currentUser.role_id) {
            console.log(
              `AUDIT: User ${id} role changed from ${
                currentUser.role_id
              } to ${role_id} at ${new Date().toISOString()}`
            );
          }

          res.json({
            name: name || "",
            job: job || "",
            updatedAt: new Date().toISOString(),
          });
        }
      );
    });
  });
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
