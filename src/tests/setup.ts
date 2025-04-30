import { Hono } from "hono";
import { afterAll, beforeAll } from "vitest";
import { serve } from "@hono/node-server";
import sqlite3 from "sqlite3";
import authRoutes from "../routes/auth.js";
import protectedRoutes from "../routes/routes.js";
import { hashPassword } from "../utils/hash.js";

let app: Hono;
export let db: sqlite3.Database;
let server: ReturnType<typeof serve>;
export let baseUrl: string;

export async function setupDatabase(database: sqlite3.Database) {
  const users = [
    {
      id: 1,
      name: "Alice",
      password: "admin",
      role: "admin",
    },
    {
      id: 2,
      name: "Bob",
      password: "manager",
      role: "manager",
    },
    {
      id: 3,
      name: "Jean",
      password: "reader",
      role: "reader",
    },
  ];

  await new Promise<void>((resolve, reject) => {
    database.serialize(async () => {
      try {
        database.run(`PRAGMA foreign_keys = OFF`);
        database.run(`DELETE FROM users`);
        database.run(`DELETE FROM projects`);
        database.run(`DELETE FROM project_access`);
        database.run(`DELETE FROM analyses`);
        database.run(`PRAGMA foreign_keys = ON`);

        database.run(`INSERT INTO projects (id, name, owner_id) VALUES 
          (1, 'Project admin', 1),
          (2, 'Project manager', 2)`);

        database.run(
          `INSERT INTO project_access (project_id, user_id) VALUES (1, 3)`
        );

        for (const user of users) {
          const hashed = await hashPassword(user.password);
          await new Promise<void>((res, rej) => {
            database.run(
              "INSERT INTO users (id, name, password, role) VALUES (?, ?, ?, ?)",
              [user.id, user.name, hashed, user.role],
              (err) => (err ? rej(err) : res())
            );
          });
        }

        resolve();
      } catch (err) {
        reject(err);
      }
    });
  });
}

beforeAll(async () => {
  db = new sqlite3.Database(":memory:");

  db.run("CREATE TABLE users (id INT, name TEXT, password TEXT, role TEXT)");
  db.run("CREATE TABLE projects (id INT, name TEXT, owner_id INT)");
  db.run("CREATE TABLE project_access (project_id INT, user_id INT)");
  db.run(
    "CREATE TABLE analyses (id INT, name TEXT, content TEXT, project_id INT, created_by TEXT)"
  );

  app = new Hono();

  app.use("*", async (c, next) => {
    c.set("db", db);
    await next();
  });

  app.route("/auth", authRoutes);
  app.route("/protected", protectedRoutes);

  await new Promise<void>((resolve) => {
    server = serve({ fetch: app.fetch, port: 0 }, (info) => {
      baseUrl = `http://127.0.0.1:${(info as any).port}`;
      console.log(`Test server running at ${baseUrl}`);
      resolve();
    });
  });

  // wait server start
  await new Promise((r) => setTimeout(r, 100));
});

afterAll(async () => {
  db.close();
  server.close();
});
