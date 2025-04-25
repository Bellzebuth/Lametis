import sqlite3 from "sqlite3";

sqlite3.verbose();

const db = new sqlite3.Database("db.sqlite3");

db.serialize(() => {
  // users table
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('admin', 'manager', 'reader'))
    )
  `);

  // projects table
  db.run(`
    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      owner_id TEXT NOT NULL,
      FOREIGN KEY (owner_id) REFERENCES users(id)
    )
  `);

  // access
  db.run(`
    CREATE TABLE IF NOT EXISTS project_access (
      user_id TEXT NOT NULL,
      project_id TEXT NOT NULL,
      PRIMARY KEY (user_id, project_id),
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (project_id) REFERENCES projects(id)
    )
  `);

  // analyses table
  db.run(`
    CREATE TABLE IF NOT EXISTS analyses (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      content TEXT NOT NULL,
      project_id TEXT NOT NULL,
      created_by TEXT NOT NULL,
      FOREIGN KEY (project_id) REFERENCES projects(id),
      FOREIGN KEY (created_by) REFERENCES users(id)
    )
  `);
});

db.close();
