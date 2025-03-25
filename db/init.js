const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const dbPath = path.resolve(__dirname, "database.sqlite");
const db = new sqlite3.Database(dbPath);

// Initialize database
function initializeDatabase() {
  db.serialize(() => {
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
    `);

    // Insert some sample data
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
      "INSERT OR IGNORE INTO users (email, first_name, last_name, avatar) VALUES (?, ?, ?, ?)"
    );

    sampleUsers.forEach((user) => {
      insertStmt.run([
        user.email,
        user.first_name,
        user.last_name,
        user.avatar,
      ]);
    });

    insertStmt.finalize();
  });
}

module.exports = {
  db,
  initializeDatabase,
};
