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

import express, { Request, Response } from 'express';
import { db, dbAll } from '../db/init';
import {
    UserRow,
    CountRow,
    RoleRow,
    UserWithRole,
    CreateUserRequest,
    UpdateUserRequest,
} from '../types';

const router = express.Router();

interface UserQueryParams {
    page?: string;
    per_page?: string;
    role?: string;
}

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
 *       400:
 *         description: Invalid role parameter
 */
router.get(
    '/',
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    async (req: Request<unknown, unknown, unknown, UserQueryParams>, res: Response) => {
        try {
            const page = parseInt(req.query.page || '1') || 1;
            const per_page = parseInt(req.query.per_page || '6') || 6;
            const offset = (page - 1) * per_page;
            const roleFilter = req.query.role;

            // Validate role filter if provided
            if (roleFilter !== undefined) {
                const roleId = parseInt(roleFilter);
                if (isNaN(roleId) || roleId <= 0 || !/^\d+$/.test(roleFilter)) {
                    res.status(400).json({
                        error: 'Invalid role parameter. Must be a positive integer.',
                    });
                    return;
                }
            }

            // Build WHERE clause for role filtering
            let whereClause = '';
            let countParams: unknown[] = [];
            let queryParams: unknown[];

            if (roleFilter) {
                whereClause = 'WHERE u.role_id = ?';
                countParams = [parseInt(roleFilter)];
                queryParams = [parseInt(roleFilter), per_page, offset];
            } else {
                queryParams = [per_page, offset];
            }

            // Build queries
            const countQuery = `SELECT COUNT(*) as total FROM users u ${whereClause}`;
            const userQuery = `
                SELECT u.*, r.name as role_name, r.description as role_description, r.is_active as role_is_active 
                FROM users u 
                LEFT JOIN roles r ON u.role_id = r.id 
                ${whereClause}
                LIMIT ? OFFSET ?`;

            // Run both queries concurrently
            const [countResult, rows] = await Promise.all([
                dbAll<CountRow>(countQuery, countParams),
                dbAll<UserRow>(userQuery, queryParams),
            ]);

            const total = countResult[0]?.total || 0;
            const total_pages = Math.ceil(total / per_page);

            // Transform the data to include role object
            const transformedData: UserWithRole[] = rows.map((row) => ({
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
                          description: row.role_description || null,
                          is_active: row.role_is_active || 0,
                          created_at: '',
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
        } catch (err) {
            const error = err as Error;
            res.status(500).json({ error: error.message });
        }
    }
);

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
 *       404:
 *         description: User not found
 */
router.get('/:id', (req: Request, res: Response) => {
    const id = req.params.id;

    db.get(
        `SELECT u.*, r.name as role_name, r.description as role_description, r.is_active as role_is_active 
     FROM users u 
     LEFT JOIN roles r ON u.role_id = r.id 
     WHERE u.id = ?`,
        [id],
        (err, row: UserRow | undefined) => {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            if (!row) {
                res.status(404).json({ error: 'User not found' });
                return;
            }

            // Transform the data to include role object
            const userData: UserWithRole = {
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
                          description: row.role_description || null,
                          is_active: row.role_is_active || 0,
                          created_at: '',
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
 *       400:
 *         description: Invalid input or role does not exist
 */
router.post('/', (req: Request<unknown, unknown, CreateUserRequest>, res: Response) => {
    const { name, job, role_id } = req.body;

    if (!name || !job) {
        res.status(400).json({ error: 'Name and job are required' });
        return;
    }

    // Set default role if not provided
    const roleId = role_id || 1;

    // Validate that the role exists
    db.get(
        'SELECT id FROM roles WHERE id = ? AND is_active = 1',
        [roleId],
        (err, roleRow: RoleRow | undefined) => {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }

            if (!roleRow) {
                res.status(400).json({ error: 'Invalid role_id provided' });
                return;
            }

            const nameParts = name.split(' ');
            const first_name = nameParts[0];
            const last_name = nameParts[1] || '';
            const email = `${first_name.toLowerCase()}.${last_name ? last_name.toLowerCase() : 'doe'}@reqres.in`;
            const avatar = `https://reqres.in/img/faces/${String(Math.floor(Math.random() * 10) + 1)}-image.jpg`;

            db.run(
                'INSERT INTO users (first_name, last_name, email, avatar, job, role_id) VALUES (?, ?, ?, ?, ?, ?)',
                [first_name, last_name, email, avatar, job, roleId],
                function (err) {
                    if (err) {
                        res.status(500).json({ error: err.message });
                        return;
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
 *       400:
 *         description: Invalid input or role does not exist
 *       404:
 *         description: User not found
 */
router.put('/:id', (req: Request<{ id: string }, unknown, UpdateUserRequest>, res: Response) => {
    const id = req.params.id;
    const { name, first_name, last_name, job, role_id } = req.body;

    if (!name && !first_name && !last_name && !job && !role_id) {
        res.status(400).json({
            error: 'Name (or first_name/last_name), job, or role_id is required',
        });
        return;
    }

    // First, check if user exists and get current role for audit logging
    db.get(
        'SELECT role_id FROM users WHERE id = ?',
        [id],
        (err, currentUser: { role_id: number } | undefined) => {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            if (!currentUser) {
                res.status(404).json({ error: 'User not found' });
                return;
            }

            // If role_id is provided, validate it exists
            const validateRoleAndUpdate = (callback: () => void): void => {
                if (role_id) {
                    db.get(
                        'SELECT id FROM roles WHERE id = ? AND is_active = 1',
                        [role_id],
                        (err, roleRow: RoleRow | undefined) => {
                            if (err) {
                                res.status(500).json({ error: err.message });
                                return;
                            }
                            if (!roleRow) {
                                res.status(400).json({ error: 'Invalid role_id provided' });
                                return;
                            }
                            callback();
                        }
                    );
                } else {
                    callback();
                }
            };

            validateRoleAndUpdate(() => {
                const updates: string[] = [];
                const params: unknown[] = [];

                if (name) {
                    const nameParts = name.split(' ');
                    const fName = nameParts[0];
                    const lName = nameParts[1] || '';
                    updates.push('first_name = ?', 'last_name = ?');
                    params.push(fName, lName);
                } else {
                    if (first_name) {
                        updates.push('first_name = ?');
                        params.push(first_name);
                    }
                    if (last_name) {
                        updates.push('last_name = ?');
                        params.push(last_name);
                    }
                }

                if (job) {
                    updates.push('job = ?');
                    params.push(job);
                }

                if (role_id) {
                    updates.push('role_id = ?');
                    params.push(role_id);
                }

                params.push(id);

                db.run(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, params, (err) => {
                    if (err) {
                        res.status(500).json({ error: err.message });
                        return;
                    }

                    // Log role change for audit purposes
                    if (role_id && role_id !== currentUser.role_id) {
                        console.log(
                            `AUDIT: User ${id} role changed from ${String(currentUser.role_id)} to ${String(role_id)} at ${new Date().toISOString()}`
                        );
                    }

                    // Fetch updated user to return correct name
                    db.get(
                        'SELECT * FROM users WHERE id = ?',
                        [id],
                        (err, updatedUser: UserRow | undefined) => {
                            if (err || !updatedUser) {
                                // Fallback if fetch fails
                                res.json({
                                    name: name || `${first_name || ''} ${last_name || ''}`.trim(),
                                    job: job || '',
                                    updatedAt: new Date().toISOString(),
                                });
                                return;
                            }

                            res.json({
                                name: `${updatedUser.first_name} ${updatedUser.last_name}`.trim(),
                                job: updatedUser.job,
                                role_id: updatedUser.role_id,
                                updatedAt: new Date().toISOString(),
                            });
                        }
                    );
                });
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
router.delete('/:id', (req: Request, res: Response) => {
    const id = req.params.id;

    db.run('DELETE FROM users WHERE id = ?', [id], (err) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.status(204).send();
    });
});

export default router;
