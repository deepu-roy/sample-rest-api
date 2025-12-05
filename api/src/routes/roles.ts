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

import express, { Request, Response } from 'express';
import { dbAll, dbGet, dbRun } from '../db/init';
import { RoleRow, CreateRoleRequest, UpdateRoleRequest } from '../types';

const router = express.Router();

interface RoleQueryParams {
    all?: string;
}

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
 *       500:
 *         description: Internal server error
 */
router.get(
    '/',
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    async (req: Request<unknown, unknown, unknown, RoleQueryParams>, res: Response) => {
        try {
            const showAll = req.query.all === 'true';
            const query = showAll
                ? 'SELECT * FROM roles ORDER BY name'
                : 'SELECT * FROM roles WHERE is_active = 1 ORDER BY name';

            const rows = await dbAll<RoleRow>(query);
            res.json({ data: rows });
        } catch (err) {
            const error = err as Error;
            res.status(500).json({ error: error.message });
        }
    }
);

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
 *       400:
 *         description: Invalid role ID
 *       404:
 *         description: Role not found
 *       500:
 *         description: Internal server error
 */
router.get(
    '/:id',
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    async (req: Request, res: Response) => {
        try {
            const id = req.params.id;

            // Validate that ID is a positive integer
            const numId = parseInt(id);
            if (!id || id.trim() === '' || isNaN(numId) || numId <= 0 || !/^\d+$/.test(id.trim())) {
                res.status(400).json({ error: 'Invalid role ID. Must be a positive integer.' });
                return;
            }

            const row = await dbGet<RoleRow>('SELECT * FROM roles WHERE id = ?', [id]);

            if (!row) {
                res.status(404).json({ error: 'Role not found' });
                return;
            }

            res.json({ data: row });
        } catch (err) {
            const error = err as Error;
            res.status(500).json({ error: error.message });
        }
    }
);

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
 *       400:
 *         description: Invalid input data
 *       409:
 *         description: Role name already exists
 *       500:
 *         description: Internal server error
 */
router.post(
    '/',
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    async (req: Request<unknown, unknown, CreateRoleRequest>, res: Response) => {
        try {
            const { name, description } = req.body;

            // Validate required fields
            if (!name || typeof name !== 'string' || name.trim() === '') {
                res.status(400).json({
                    error: 'Role name is required and must be a non-empty string',
                });
                return;
            }

            // Validate description if provided
            if (description !== undefined && typeof description !== 'string') {
                res.status(400).json({
                    error: 'Role description must be a string',
                });
                return;
            }

            const trimmedName = name.trim();
            const trimmedDescription =
                description && description.trim() !== '' ? description.trim() : null;

            // Check if role name already exists
            const existingRole = await dbGet<RoleRow>(
                'SELECT id FROM roles WHERE name = ? COLLATE NOCASE',
                [trimmedName]
            );

            if (existingRole) {
                res.status(409).json({
                    error: 'A role with this name already exists',
                });
                return;
            }

            // Insert new role
            const result = await dbRun('INSERT INTO roles (name, description) VALUES (?, ?)', [
                trimmedName,
                trimmedDescription,
            ]);

            // Fetch the created role
            const newRole = await dbGet<RoleRow>('SELECT * FROM roles WHERE id = ?', [
                result.lastID,
            ]);

            res.status(201).json({
                message: 'Role created successfully',
                data: newRole,
            });
        } catch (err) {
            const error = err as Error;
            res.status(500).json({ error: error.message });
        }
    }
);

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
 *       400:
 *         description: Invalid input data or role ID
 *       404:
 *         description: Role not found
 *       409:
 *         description: Role name already exists
 *       500:
 *         description: Internal server error
 */
router.put(
    '/:id',
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    async (req: Request<{ id: string }, unknown, UpdateRoleRequest>, res: Response) => {
        try {
            const id = req.params.id;
            const { name, description } = req.body;

            // Validate that ID is a positive integer
            const numId = parseInt(id);
            if (!id || id.trim() === '' || isNaN(numId) || numId <= 0 || !/^\d+$/.test(id.trim())) {
                res.status(400).json({ error: 'Invalid role ID. Must be a positive integer.' });
                return;
            }

            // Validate name if provided
            if (name !== undefined && (typeof name !== 'string' || name.trim() === '')) {
                res.status(400).json({
                    error: 'Role name must be a non-empty string',
                });
                return;
            }

            // Validate that at least one field is provided
            if (!name && description === undefined) {
                res.status(400).json({
                    error: 'At least one field (name or description) must be provided',
                });
                return;
            }

            // Validate description if provided
            if (description !== undefined && typeof description !== 'string') {
                res.status(400).json({
                    error: 'Role description must be a string',
                });
                return;
            }

            // Check if role exists
            const existingRole = await dbGet<RoleRow>('SELECT * FROM roles WHERE id = ?', [id]);

            if (!existingRole) {
                res.status(404).json({ error: 'Role not found' });
                return;
            }

            const newName = name !== undefined ? name.trim() : existingRole.name;
            const newDescription =
                description !== undefined
                    ? description && description.trim() !== ''
                        ? description.trim()
                        : null
                    : existingRole.description;

            // Check if new name conflicts with existing role (if name is being changed)
            if (name !== undefined && newName !== existingRole.name) {
                const conflictingRole = await dbGet<RoleRow>(
                    'SELECT id FROM roles WHERE name = ? COLLATE NOCASE AND id != ?',
                    [newName, id]
                );

                if (conflictingRole) {
                    res.status(409).json({
                        error: 'A role with this name already exists',
                    });
                    return;
                }
            }

            // Update the role
            await dbRun('UPDATE roles SET name = ?, description = ? WHERE id = ?', [
                newName,
                newDescription,
                id,
            ]);

            // Fetch the updated role
            const updatedRole = await dbGet<RoleRow>('SELECT * FROM roles WHERE id = ?', [id]);

            res.json({
                message: 'Role updated successfully',
                data: updatedRole,
            });
        } catch (err) {
            const error = err as Error;
            res.status(500).json({ error: error.message });
        }
    }
);

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
 *       400:
 *         description: Invalid role ID or cannot deactivate default role
 *       404:
 *         description: Role not found
 *       500:
 *         description: Internal server error
 */
router.delete(
    '/:id',
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    async (req: Request, res: Response) => {
        try {
            const id = req.params.id;

            // Validate that ID is a positive integer
            const numId = parseInt(id);
            if (!id || id.trim() === '' || isNaN(numId) || numId <= 0 || !/^\d+$/.test(id.trim())) {
                res.status(400).json({ error: 'Invalid role ID. Must be a positive integer.' });
                return;
            }

            // Prevent deactivation of default User role (id: 1)
            if (numId === 1) {
                res.status(400).json({
                    error: 'Cannot deactivate the default User role',
                });
                return;
            }

            // Check if role exists
            const existingRole = await dbGet<RoleRow>('SELECT * FROM roles WHERE id = ?', [id]);

            if (!existingRole) {
                res.status(404).json({ error: 'Role not found' });
                return;
            }

            if (!existingRole.is_active) {
                res.status(400).json({
                    error: 'Role is already deactivated',
                });
                return;
            }

            // Soft delete by setting is_active to 0
            await dbRun('UPDATE roles SET is_active = 0 WHERE id = ?', [id]);

            // Fetch the updated role
            const deactivatedRole = await dbGet<RoleRow>('SELECT * FROM roles WHERE id = ?', [id]);

            res.json({
                message: 'Role deactivated successfully',
                data: deactivatedRole,
            });
        } catch (err) {
            const error = err as Error;
            res.status(500).json({ error: error.message });
        }
    }
);

export default router;
