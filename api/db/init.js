const sqlite3 = require("sqlite3").verbose();
const path = require("path");

// Allow configuring database path through environment variable, fallback to local path
const dbPath = process.env.DB_PATH
  ? path.resolve(process.env.DB_PATH, "database.sqlite")
  : path.resolve(__dirname, "database.sqlite");

console.log(`Initializing database at: ${dbPath}`);
const db = new sqlite3.Database(dbPath);

// Initialize database
function initializeDatabase() {
  db.serialize(() => {
    // First, check if the users table exists and has data
    db.get("SELECT COUNT(*) as count FROM sqlite_master WHERE type='table' AND name='users'", (err, row) => {
      const tableExists = !err && row && row.count > 0;

      // Create users table
      db.run(`
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          email TEXT,
          first_name TEXT,
          last_name TEXT,
          avatar TEXT,
          job TEXT
        )
      `, (err) => {
        if (err) {
          console.error('Error creating users table:', err);
          return;
        }

        // Only insert sample data if the table didn't exist before or is empty
        if (!tableExists) {
          console.log('New database detected, inserting sample users...');
          insertSampleUsers();
        } else {
          // Check if table is empty
          db.get("SELECT COUNT(*) as count FROM users", (err, row) => {
            if (!err && row && row.count === 0) {
              console.log('Empty users table detected, inserting sample users...');
              insertSampleUsers();
            } else {
              console.log('Existing users table with data found, skipping sample data insertion');
            }
          });
        }
      });
    });
  });
}

function insertSampleUsers() {
  const sampleUsers = [
    {
      email: "george.bluth@reqres.in",
      first_name: "George",
      last_name: "Bluth",
      avatar: "https://reqres.in/img/faces/1-image.jpg",
    },
    {
      email: "janet.weaver@reqres.in",
      first_name: "Janet",
      last_name: "Weaver",
      avatar: "https://reqres.in/img/faces/2-image.jpg",
    },
  ];

  const insertStmt = db.prepare(
    "INSERT INTO users (email, first_name, last_name, avatar) VALUES (?, ?, ?, ?)"
  );

  sampleUsers.forEach((user) => {
    insertStmt.run([
      user.email,
      user.first_name,
      user.last_name,
      user.avatar,
    ], function (err) {
      if (err) {
        console.error('Error inserting sample user:', err);
      } else {
        console.log(`Inserted sample user: ${user.first_name} ${user.last_name}`);
      }
    });
  });

  insertStmt.finalize(() => {
    console.log('Sample data insertion completed');
  });
}

module.exports = {
  db,
  initializeDatabase,
};
