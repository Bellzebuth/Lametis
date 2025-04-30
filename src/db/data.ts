import sqlite3 from "sqlite3";
import { hashPassword } from "../utils/hash.js";

function initSeed(db: sqlite3.Database) {
  db.serialize(async () => {
    // some users
    const users = [
      { id: 1, name: "admin", password: "admin", role: "admin" },
      { id: 2, name: "manager", password: "manager", role: "manager" },
      { id: 3, name: "reader", password: "reader", role: "reader" },
    ];

    for (const user of users) {
      const hashed = await hashPassword(user.password);
      db.run(
        "INSERT INTO users (id, name, password, role) VALUES (?, ?, ?, ?)",
        [user.id, user.name, hashed, user.role]
      );
    }

    // some projects
    db.run(`INSERT OR IGNORE INTO projects (id, name, owner_id) VALUES 
    ('1', 'Projet manager', '2'),
    ('2', 'Projet admin', '1'),
    ('3', 'Projet reader', '3')
  `);

    // grant access
    db.run(`INSERT OR IGNORE INTO project_access (user_id, project_id) VALUES 
    ('3', '2')
  `);

    // some analyses
    db.run(`INSERT OR IGNORE INTO analyses (id, name, content, project_id, created_by) VALUES 
    ('1', 'Analyse 1', 'Contenu de l’analyse 1', '1', '1'),
    ('2', 'Analyse 2', 'Contenu de l’analyse 2', '3', '1')
  `);
  });
}

export default initSeed;
