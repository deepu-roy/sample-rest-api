import sqlite3 from 'sqlite3';
import path from 'path';
import { CountRow, TableInfoRow } from '../types';

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

const DEFAULT_ROLES: DefaultRole[] = [
    { id: 1, name: 'User', description: 'Default role for regular users' },
    { id: 2, name: 'Admin', description: 'Administrative privileges' },
    { id: 3, name: 'Moderator', description: 'Limited administrative access' },
];

const SAMPLE_USERS: SampleUser[] = [
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

// Initialize database
export async function initializeDatabase(): Promise<void> {
    try {
        await createRolesTable();
        await createUsersTable();
        console.log('Database initialization completed');
    } catch (error) {
        console.error('Database initialization failed:', error);
        throw error;
    }
}

async function createRolesTable(): Promise<void> {
    await dbRun(`
        CREATE TABLE IF NOT EXISTS roles (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL UNIQUE,
            description TEXT,
            is_active BOOLEAN DEFAULT 1,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

    const row = await dbGet<CountRow>('SELECT COUNT(*) as count FROM roles');

    if (row && row.count === 0) {
        console.log('Empty roles table detected, inserting default roles...');
        await insertDefaultRoles();
    } else {
        console.log('Roles table already has data, skipping default roles insertion');
    }
}

async function insertDefaultRoles(): Promise<void> {
    for (const role of DEFAULT_ROLES) {
        await dbRun('INSERT INTO roles (id, name, description) VALUES (?, ?, ?)', [
            role.id,
            role.name,
            role.description,
        ]);
        console.log(`Inserted default role: ${role.name}`);
    }
    console.log('Default roles insertion completed');
}

async function createUsersTable(): Promise<void> {
    // Check if users table exists
    const tableRow = await dbGet<CountRow>(
        "SELECT COUNT(*) as count FROM sqlite_master WHERE type='table' AND name='users'"
    );
    const tableExists = tableRow !== undefined && tableRow.count > 0;

    // Create users table with role_id column
    await dbRun(`
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
    `);

    // If table existed, we need to add role_id column if it doesn't exist
    if (tableExists) {
        await addRoleIdColumnIfNotExists();
    }

    await checkAndInsertSampleData(tableExists);
}

async function addRoleIdColumnIfNotExists(): Promise<void> {
    const columns = await dbAll<TableInfoRow>('PRAGMA table_info(users)');
    const hasRoleId = columns.some((col) => col.name === 'role_id');

    if (!hasRoleId) {
        console.log('Adding role_id column to existing users table...');
        await dbRun('ALTER TABLE users ADD COLUMN role_id INTEGER DEFAULT 1');
        console.log('Successfully added role_id column to users table');
    } else {
        console.log('role_id column already exists in users table');
    }
}

async function checkAndInsertSampleData(tableExists: boolean): Promise<void> {
    if (!tableExists) {
        console.log('New database detected, inserting sample users...');
        await insertSampleUsers();
        return;
    }

    // Check if table is empty
    const row = await dbGet<CountRow>('SELECT COUNT(*) as count FROM users');

    if (row && row.count === 0) {
        console.log('Empty users table detected, inserting sample users...');
        await insertSampleUsers();
    } else {
        console.log('Existing users table with data found, skipping sample data insertion');
    }
}

async function insertSampleUsers(): Promise<void> {
    for (const user of SAMPLE_USERS) {
        await dbRun(
            'INSERT INTO users (email, first_name, last_name, avatar, role_id) VALUES (?, ?, ?, ?, ?)',
            [user.email, user.first_name, user.last_name, user.avatar, user.role_id]
        );
        console.log(
            `Inserted sample user: ${user.first_name} ${user.last_name} with role_id ${String(user.role_id)}`
        );
    }
    console.log('Sample data insertion completed');
}
