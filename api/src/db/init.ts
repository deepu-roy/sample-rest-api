import sqlite3 from 'sqlite3';
import path from 'path';
import { UserRow, RoleRow, CountRow, TableInfoRow } from '../types';

const sqlite3Verbose = sqlite3.verbose();

// Allow configuring database path through environment variable, fallback to local path
const dbPath = process.env.DB_PATH
    ? path.resolve(process.env.DB_PATH, 'database.sqlite')
    : path.resolve(__dirname, '../../db/database.sqlite');

console.log(`Initializing database at: ${dbPath}`);

export const db = new sqlite3Verbose.Database(dbPath);

// Promisified database methods
export function dbRun(sql: string, params: unknown[] = []): Promise<sqlite3.RunResult> {
    return new Promise((resolve, reject) => {
        db.run(sql, params, function (err) {
            if (err) reject(err);
            else resolve(this);
        });
    });
}

export function dbGet<T>(sql: string, params: unknown[] = []): Promise<T | undefined> {
    return new Promise((resolve, reject) => {
        db.get(sql, params, (err, row) => {
            if (err) reject(err);
            else resolve(row as T | undefined);
        });
    });
}

export function dbAll<T>(sql: string, params: unknown[] = []): Promise<T[]> {
    return new Promise((resolve, reject) => {
        db.all(sql, params, (err, rows) => {
            if (err) reject(err);
            else resolve(rows as T[]);
        });
    });
}

interface DefaultRole {
    id: number;
    name: string;
    description: string;
}

interface SampleUser {
    email: string;
    first_name: string;
    last_name: string;
    avatar: string;
    role_id: number;
}

// Initialize database
export function initializeDatabase(): void {
    db.serialize(() => {
        // First, create roles table
        createRolesTable(() => {
            // Then check if the users table exists and has data
            db.get(
                "SELECT COUNT(*) as count FROM sqlite_master WHERE type='table' AND name='users'",
                (err, row: CountRow | undefined) => {
                    const tableExists: boolean = !err && row !== undefined && row.count > 0;

                    // Create users table with role_id column
                    db.run(
                        `
          CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT,
            first_name TEXT,
            last_name TEXT,
            avatar TEXT,
            job TEXT,
            role_id INTEGER DEFAULT 1,
            FOREIGN KEY (role_id) REFERENCES roles(id)
          )
        `,
                        (err) => {
                            if (err) {
                                console.error('Error creating users table:', err);
                                return;
                            }

                            // If table existed, we need to add role_id column if it doesn't exist
                            if (tableExists) {
                                addRoleIdColumnIfNotExists(() => {
                                    checkAndInsertSampleData(tableExists);
                                });
                            } else {
                                checkAndInsertSampleData(tableExists);
                            }
                        }
                    );
                }
            );
        });
    });
}

function createRolesTable(callback: () => void): void {
    // Create roles table
    db.run(
        `
    CREATE TABLE IF NOT EXISTS roles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      description TEXT,
      is_active BOOLEAN DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `,
        (err) => {
            if (err) {
                console.error('Error creating roles table:', err);
                return;
            }

            // Check if roles table is empty and insert default roles
            db.get('SELECT COUNT(*) as count FROM roles', (err, row: CountRow | undefined) => {
                if (!err && row && row.count === 0) {
                    console.log('Empty roles table detected, inserting default roles...');
                    insertDefaultRoles(callback);
                } else {
                    console.log('Roles table already has data, skipping default roles insertion');
                    if (callback) callback();
                }
            });
        }
    );
}

function insertDefaultRoles(callback: () => void): void {
    const defaultRoles: DefaultRole[] = [
        { id: 1, name: 'User', description: 'Default role for regular users' },
        { id: 2, name: 'Admin', description: 'Administrative privileges' },
        { id: 3, name: 'Moderator', description: 'Limited administrative access' },
    ];

    const insertStmt = db.prepare('INSERT INTO roles (id, name, description) VALUES (?, ?, ?)');

    let completed = 0;
    defaultRoles.forEach((role) => {
        insertStmt.run([role.id, role.name, role.description], function (err) {
            if (err) {
                console.error('Error inserting default role:', err);
            } else {
                console.log(`Inserted default role: ${role.name}`);
            }
            completed++;
            if (completed === defaultRoles.length) {
                insertStmt.finalize(() => {
                    console.log('Default roles insertion completed');
                    if (callback) callback();
                });
            }
        });
    });
}

function addRoleIdColumnIfNotExists(callback: () => void): void {
    // Check if role_id column exists
    db.all('PRAGMA table_info(users)', (err, columns: TableInfoRow[]) => {
        if (err) {
            console.error('Error checking users table structure:', err);
            if (callback) callback();
            return;
        }

        const hasRoleId = columns.some((col) => col.name === 'role_id');

        if (!hasRoleId) {
            console.log('Adding role_id column to existing users table...');
            db.run('ALTER TABLE users ADD COLUMN role_id INTEGER DEFAULT 1', (err) => {
                if (err) {
                    console.error('Error adding role_id column:', err);
                } else {
                    console.log('Successfully added role_id column to users table');
                }
                if (callback) callback();
            });
        } else {
            console.log('role_id column already exists in users table');
            if (callback) callback();
        }
    });
}

function checkAndInsertSampleData(tableExists: boolean): void {
    // Only insert sample data if the table didn't exist before or is empty
    if (!tableExists) {
        console.log('New database detected, inserting sample users...');
        insertSampleUsers();
    } else {
        // Check if table is empty
        db.get('SELECT COUNT(*) as count FROM users', (err, row: CountRow | undefined) => {
            if (!err && row && row.count === 0) {
                console.log('Empty users table detected, inserting sample users...');
                insertSampleUsers();
            } else {
                console.log('Existing users table with data found, skipping sample data insertion');
            }
        });
    }
}

function insertSampleUsers(): void {
    const sampleUsers: SampleUser[] = [
        {
            email: 'george.bluth@reqres.in',
            first_name: 'George',
            last_name: 'Bluth',
            avatar: 'https://reqres.in/img/faces/1-image.jpg',
            role_id: 2, // Admin role
        },
        {
            email: 'janet.weaver@reqres.in',
            first_name: 'Janet',
            last_name: 'Weaver',
            avatar: 'https://reqres.in/img/faces/2-image.jpg',
            role_id: 1, // User role
        },
    ];

    const insertStmt = db.prepare(
        'INSERT INTO users (email, first_name, last_name, avatar, role_id) VALUES (?, ?, ?, ?, ?)'
    );

    sampleUsers.forEach((user) => {
        insertStmt.run(
            [user.email, user.first_name, user.last_name, user.avatar, user.role_id],
            function (err) {
                if (err) {
                    console.error('Error inserting sample user:', err);
                } else {
                    console.log(
                        `Inserted sample user: ${user.first_name} ${user.last_name} with role_id ${user.role_id}`
                    );
                }
            }
        );
    });

    insertStmt.finalize(() => {
        console.log('Sample data insertion completed');
    });
}
