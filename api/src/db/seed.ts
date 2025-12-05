import { db, dbRun, dbGet, dbAll } from './init';
import { CountRow } from '../types';

interface SeedRole {
    id: number;
    name: string;
    description: string;
}

interface SeedUser {
    email: string;
    first_name: string;
    last_name: string;
    avatar: string;
    job: string;
    role_id: number;
}

const SEED_ROLES: SeedRole[] = [
    { id: 1, name: 'User', description: 'Default role for regular users' },
    { id: 2, name: 'Admin', description: 'Administrative privileges' },
    { id: 3, name: 'Moderator', description: 'Limited administrative access' },
    { id: 4, name: 'Developer', description: 'Developer access with API permissions' },
    { id: 5, name: 'Support', description: 'Customer support role' },
];

const SEED_USERS: SeedUser[] = [
    {
        email: 'george.bluth@reqres.in',
        first_name: 'George',
        last_name: 'Bluth',
        avatar: 'https://reqres.in/img/faces/1-image.jpg',
        job: 'CEO',
        role_id: 2, // Admin
    },
    {
        email: 'janet.weaver@reqres.in',
        first_name: 'Janet',
        last_name: 'Weaver',
        avatar: 'https://reqres.in/img/faces/2-image.jpg',
        job: 'Marketing Manager',
        role_id: 1, // User
    },
    {
        email: 'emma.wong@reqres.in',
        first_name: 'Emma',
        last_name: 'Wong',
        avatar: 'https://reqres.in/img/faces/3-image.jpg',
        job: 'Software Engineer',
        role_id: 4, // Developer
    },
    {
        email: 'eve.holt@reqres.in',
        first_name: 'Eve',
        last_name: 'Holt',
        avatar: 'https://reqres.in/img/faces/4-image.jpg',
        job: 'Community Manager',
        role_id: 3, // Moderator
    },
    {
        email: 'charles.morris@reqres.in',
        first_name: 'Charles',
        last_name: 'Morris',
        avatar: 'https://reqres.in/img/faces/5-image.jpg',
        job: 'Support Specialist',
        role_id: 5, // Support
    },
    {
        email: 'tracey.ramos@reqres.in',
        first_name: 'Tracey',
        last_name: 'Ramos',
        avatar: 'https://reqres.in/img/faces/6-image.jpg',
        job: 'Product Manager',
        role_id: 1, // User
    },
    {
        email: 'michael.lawson@reqres.in',
        first_name: 'Michael',
        last_name: 'Lawson',
        avatar: 'https://reqres.in/img/faces/7-image.jpg',
        job: 'DevOps Engineer',
        role_id: 4, // Developer
    },
    {
        email: 'lindsay.ferguson@reqres.in',
        first_name: 'Lindsay',
        last_name: 'Ferguson',
        avatar: 'https://reqres.in/img/faces/8-image.jpg',
        job: 'HR Manager',
        role_id: 2, // Admin
    },
    {
        email: 'tobias.funke@reqres.in',
        first_name: 'Tobias',
        last_name: 'Funke',
        avatar: 'https://reqres.in/img/faces/9-image.jpg',
        job: 'Data Analyst',
        role_id: 1, // User
    },
    {
        email: 'byron.fields@reqres.in',
        first_name: 'Byron',
        last_name: 'Fields',
        avatar: 'https://reqres.in/img/faces/10-image.jpg',
        job: 'Customer Support Lead',
        role_id: 5, // Support
    },
];

async function clearTables(): Promise<void> {
    console.log('Clearing existing data...');
    await dbRun('DELETE FROM users');
    await dbRun('DELETE FROM roles');
    // Reset auto-increment counters
    await dbRun("DELETE FROM sqlite_sequence WHERE name='users'");
    await dbRun("DELETE FROM sqlite_sequence WHERE name='roles'");
    console.log('Tables cleared.');
}

async function seedRoles(): Promise<void> {
    console.log('Seeding roles...');
    for (const role of SEED_ROLES) {
        await dbRun('INSERT INTO roles (id, name, description, is_active) VALUES (?, ?, ?, 1)', [
            role.id,
            role.name,
            role.description,
        ]);
        console.log(`  ✓ Created role: ${role.name}`);
    }
    console.log(`Seeded ${String(SEED_ROLES.length)} roles.`);
}

async function seedUsers(): Promise<void> {
    console.log('Seeding users...');
    for (const user of SEED_USERS) {
        await dbRun(
            'INSERT INTO users (email, first_name, last_name, avatar, job, role_id) VALUES (?, ?, ?, ?, ?, ?)',
            [user.email, user.first_name, user.last_name, user.avatar, user.job, user.role_id]
        );
        console.log(`  ✓ Created user: ${user.first_name} ${user.last_name} (${user.job})`);
    }
    console.log(`Seeded ${String(SEED_USERS.length)} users.`);
}

async function verifySeed(): Promise<void> {
    console.log('\nVerifying seed data...');

    const rolesCount = await dbGet<CountRow>('SELECT COUNT(*) as count FROM roles');
    const usersCount = await dbGet<CountRow>('SELECT COUNT(*) as count FROM users');

    console.log(`  Roles in database: ${String(rolesCount?.count ?? 0)}`);
    console.log(`  Users in database: ${String(usersCount?.count ?? 0)}`);

    // Show sample data
    const roles = await dbAll<{ id: number; name: string }>('SELECT id, name FROM roles');
    console.log('\n  Roles:', roles.map((r) => `${String(r.id)}:${r.name}`).join(', '));

    const users = await dbAll<{
        id: number;
        first_name: string;
        last_name: string;
        role_id: number;
    }>('SELECT id, first_name, last_name, role_id FROM users LIMIT 5');
    console.log(
        '  Sample users:',
        users.map((u) => `${u.first_name} ${u.last_name} (role:${String(u.role_id)})`).join(', ')
    );
}

async function seed(): Promise<void> {
    console.log('='.repeat(50));
    console.log('Starting database seed...');
    console.log('='.repeat(50));

    try {
        await clearTables();
        await seedRoles();
        await seedUsers();
        await verifySeed();

        console.log('\n' + '='.repeat(50));
        console.log('✓ Database seeding completed successfully!');
        console.log('='.repeat(50));
    } catch (error) {
        console.error('Seeding failed:', error);
        process.exit(1);
    } finally {
        db.close();
    }
}

// Run seed if this file is executed directly
seed().catch((err: unknown) => {
    console.error('Seed script failed:', err);
    process.exit(1);
});
