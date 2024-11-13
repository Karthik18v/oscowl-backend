// Import the sqlite3 package
const sqlite3 = require('sqlite3').verbose();

// Open the SQLite database (if it doesn't exist, it will be created)
const db = new sqlite3.Database('./my_database.db', (err) => {
  if (err) {
    console.error('Error opening the database:', err.message);
  } else {
    console.log('Connected to the SQLite database.');
  }
});

// Create the 'users' table
db.run(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL
  )
`, (err) => {
  if (err) {
    console.error('Error creating users table:', err.message);
  } else {
    console.log('Users table created or already exists.');
  }
});

// Create the 'todos' table
db.run(`
  CREATE TABLE IF NOT EXISTS todos (
    id TEXT,
    user_id TEXT NOT NULL,
    title TEXT NOT NULL,
    status TEXT CHECK(status IN ('in complete', 'pending', 'done','completed')) DEFAULT 'pending',
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  )
`, (err) => {
  if (err) {
    console.error('Error creating todos table:', err.message);
  } else {
    console.log('Todos table created or already exists.');
  }
});

// Close the database connection when done
db.close((err) => {
  if (err) {
    console.error('Error closing the database:', err.message);
  } else {
    console.log('Closed the database connection.');
  }
});


