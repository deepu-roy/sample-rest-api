/**
 * @swagger
 * components:
 *   schemas:
 *     Role:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         name:
 *           type: string
 *         description:
 *           type: string
 *         is_active:
 *           type: boolean
 *         created_at:
 *           type: string
 *           format: date-time
 */

const express = require("express");
const router = express.Router();
const { db } = require("../db/init");

/**
 * @swagger
 * /api/roles:
 *   get:
 *     summary: List all active roles
 *     description: Retrieve a list of all active roles available in the system
 *     tags: [Roles]
 *     responses:
 *       200:
 *         description: List of active roles
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Role'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 */
router.get("/", (req, res) => {
  // Check if we should show all roles (for management) or just active ones
  const showAll = req.query.all === "true";
  const query = showAll
    ? "SELECT * FROM roles ORDER BY name"
    : "SELECT * FROM roles WHERE is_active = 1 ORDER BY name";

  db.all(query, [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    res.json({
      data: rows,
    });
  });
});

/**
 * @swagger
 * /api/roles/{id}:
 *   get:
 *     summary: Get role by ID
 *     description: Retrieve a specific role by its ID
 *     tags: [Roles]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Role ID
 *     responses:
 *       200:
 *         description: Role found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/Role'
 *       400:
 *         description: Invalid role ID
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *       404:
 *         description: Role not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 */
router.get("/:id", (req, res) => {
  const id = req.params.id;

  // Validate that ID is a positive integer
  const numId = parseInt(id);
  if (!id || id.trim() === "" || isNaN(numId) || numId <= 0) {
    return res
      .status(400)
      .json({ error: "Invalid role ID. Must be a positive integer." });
  }

  db.get("SELECT * FROM roles WHERE id = ?", [id], (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (!row) {
      return res.status(404).json({ error: "Role not found" });
    }
    res.json({ data: row });
  });
});

/**
 * @swagger
 * /api/roles:
 *   post:
 *     summary: Create a new role
 *     description: Create a new role with name and description
 *     tags: [Roles]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 description: Role name (must be unique)
 *               description:
 *                 type: string
 *                 description: Role description
 *     responses:
 *       201:
 *         description: Role created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/Role'
 *       400:
 *         description: Invalid input data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *       409:
 *         description: Role name already exists
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 */
router.post("/", (req, res) => {
  const { name, description } = req.body;

  // Validate required fields
  if (!name || typeof name !== "string" || name.trim() === "") {
    return res.status(400).json({
      error: "Role name is required and must be a non-empty string",
    });
  }

  // Validate description if provided
  if (description !== undefined && typeof description !== "string") {
    return res.status(400).json({
      error: "Role description must be a string",
    });
  }

  const trimmedName = name.trim();
  const trimmedDescription = description ? description.trim() : null;

  // Check if role name already exists
  db.get(
    "SELECT id FROM roles WHERE name = ? COLLATE NOCASE",
    [trimmedName],
    (err, existingRole) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      if (existingRole) {
        return res.status(409).json({
          error: "A role with this name already exists",
        });
      }

      // Insert new role
      db.run(
        "INSERT INTO roles (name, description) VALUES (?, ?)",
        [trimmedName, trimmedDescription],
        function (err) {
          if (err) {
            return res.status(500).json({ error: err.message });
          }

          // Fetch the created role
          db.get(
            "SELECT * FROM roles WHERE id = ?",
            [this.lastID],
            (err, newRole) => {
              if (err) {
                return res.status(500).json({ error: err.message });
              }

              res.status(201).json({
                message: "Role created successfully",
                data: newRole,
              });
            }
          );
        }
      );
    }
  );
});

/**
 * @swagger
 * /api/roles/{id}:
 *   put:
 *     summary: Update an existing role
 *     description: Update name and/or description of an existing role
 *     tags: [Roles]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Role ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Role name (must be unique)
 *               description:
 *                 type: string
 *                 description: Role description
 *     responses:
 *       200:
 *         description: Role updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/Role'
 *       400:
 *         description: Invalid input data or role ID
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *       404:
 *         description: Role not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *       409:
 *         description: Role name already exists
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 */
router.put("/:id", (req, res) => {
  const id = req.params.id;
  const { name, description } = req.body;

  // Validate that ID is a positive integer
  const numId = parseInt(id);
  if (!id || id.trim() === "" || isNaN(numId) || numId <= 0) {
    return res
      .status(400)
      .json({ error: "Invalid role ID. Must be a positive integer." });
  }

  // Validate that at least one field is provided
  if (!name && description === undefined) {
    return res.status(400).json({
      error: "At least one field (name or description) must be provided",
    });
  }

  // Validate name if provided
  if (name !== undefined && (typeof name !== "string" || name.trim() === "")) {
    return res.status(400).json({
      error: "Role name must be a non-empty string",
    });
  }

  // Validate description if provided
  if (description !== undefined && typeof description !== "string") {
    return res.status(400).json({
      error: "Role description must be a string",
    });
  }

  // Check if role exists
  db.get("SELECT * FROM roles WHERE id = ?", [id], (err, existingRole) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    if (!existingRole) {
      return res.status(404).json({ error: "Role not found" });
    }

    const trimmedName = name ? name.trim() : existingRole.name;
    const trimmedDescription =
      description !== undefined
        ? description
          ? description.trim()
          : null
        : existingRole.description;

    // Check if new name conflicts with existing role (if name is being changed)
    if (name && trimmedName !== existingRole.name) {
      db.get(
        "SELECT id FROM roles WHERE name = ? COLLATE NOCASE AND id != ?",
        [trimmedName, id],
        (err, conflictingRole) => {
          if (err) {
            return res.status(500).json({ error: err.message });
          }

          if (conflictingRole) {
            return res.status(409).json({
              error: "A role with this name already exists",
            });
          }

          updateRole();
        }
      );
    } else {
      updateRole();
    }

    function updateRole() {
      db.run(
        "UPDATE roles SET name = ?, description = ? WHERE id = ?",
        [trimmedName, trimmedDescription, id],
        function (err) {
          if (err) {
            return res.status(500).json({ error: err.message });
          }

          // Fetch the updated role
          db.get(
            "SELECT * FROM roles WHERE id = ?",
            [id],
            (err, updatedRole) => {
              if (err) {
                return res.status(500).json({ error: err.message });
              }

              res.json({
                message: "Role updated successfully",
                data: updatedRole,
              });
            }
          );
        }
      );
    }
  });
});

/**
 * @swagger
 * /api/roles/{id}:
 *   delete:
 *     summary: Deactivate a role (soft delete)
 *     description: Mark a role as inactive while preserving existing user assignments
 *     tags: [Roles]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Role ID
 *     responses:
 *       200:
 *         description: Role deactivated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/Role'
 *       400:
 *         description: Invalid role ID or cannot deactivate default role
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *       404:
 *         description: Role not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 */
router.delete("/:id", (req, res) => {
  const id = req.params.id;

  // Validate that ID is a positive integer
  const numId = parseInt(id);
  if (!id || id.trim() === "" || isNaN(numId) || numId <= 0) {
    return res
      .status(400)
      .json({ error: "Invalid role ID. Must be a positive integer." });
  }

  // Prevent deactivation of default User role (id: 1)
  if (numId === 1) {
    return res.status(400).json({
      error: "Cannot deactivate the default User role",
    });
  }

  // Check if role exists
  db.get("SELECT * FROM roles WHERE id = ?", [id], (err, existingRole) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    if (!existingRole) {
      return res.status(404).json({ error: "Role not found" });
    }

    if (!existingRole.is_active) {
      return res.status(400).json({
        error: "Role is already deactivated",
      });
    }

    // Soft delete by setting is_active to 0
    db.run("UPDATE roles SET is_active = 0 WHERE id = ?", [id], function (err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      // Fetch the updated role
      db.get(
        "SELECT * FROM roles WHERE id = ?",
        [id],
        (err, deactivatedRole) => {
          if (err) {
            return res.status(500).json({ error: err.message });
          }

          res.json({
            message: "Role deactivated successfully",
            data: deactivatedRole,
          });
        }
      );
    });
  });
});

module.exports = router;
