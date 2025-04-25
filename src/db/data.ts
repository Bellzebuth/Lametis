import sqlite3 from "sqlite3";
sqlite3.verbose();

const db = new sqlite3.Database("db.sqlite3");

db.serialize(() => {
  // some users
  db.run(`INSERT OR IGNORE INTO users (id, name, role) VALUES 
    ('1', 'Admin', 'admin'),
    ('2', 'Manager', 'manager'),
    ('3', 'Reader', 'reader')
  `);

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

db.close();
