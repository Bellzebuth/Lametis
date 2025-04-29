import { Hono } from "hono";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { serve } from "@hono/node-server"; // simple pour démarrer un vrai serveur
import sqlite3 from "sqlite3";
import { signToken } from "../utils/jwt.js";
import authRoutes from "../routes/auth.js";
import protectedRoutes from "../routes/routes.js";

let app: Hono;
let db: sqlite3.Database;
let server: ReturnType<typeof serve>;
let baseUrl: string;

async function setupDatabase(database: sqlite3.Database) {
  await new Promise<void>((resolve, reject) => {
    database.serialize(() => {
      database.run(`DROP TABLE IF EXISTS users`);
      database.run(`DROP TABLE IF EXISTS projects`);
      database.run(`DROP TABLE IF EXISTS project_access`);
      database.run(`DROP TABLE IF EXISTS analyses`);

      database.run(`CREATE TABLE users (id INT, name TEXT, role TEXT)`);
      database.run(`CREATE TABLE projects (id INT, name TEXT, owner_id INT)`);
      database.run(`CREATE TABLE project_access (project_id INT, user_id INT)`);
      database.run(
        `CREATE TABLE analyses (id INT, name TEXT, content TEXT, project_id INT, created_by TEXT)`,
        (err) => {
          if (err) reject(err);
        }
      );

      database.run(`INSERT INTO users (id, name, role) VALUES 
        (1, 'Alice', 'admin'), 
        (2, 'Bob', 'manager'),
        (3, 'Jean', 'reader')`);
      database.run(`INSERT INTO projects (id, name, owner_id) VALUES 
        (1, 'Project admin', 1),
        (2, 'Project manager', 2)`);
      database.run(
        `INSERT INTO project_access (project_id, user_id) VALUES (1, 3)`,
        (err) => {
          if (err) reject(err);
          resolve();
        }
      );
    });
  });
}

beforeAll(async () => {
  db = new sqlite3.Database(":memory:");

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

describe("Auth routes", () => {
  beforeAll(async () => {
    setupDatabase(db);
  });

  it("should login successfully", async () => {
    const res = await fetch(`${baseUrl}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Alice" }),
    });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(res.headers.get("set-cookie")).toBeTruthy();
  });

  it("should fail login with invalid user", async () => {
    const res = await fetch(`${baseUrl}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Unknown" }),
    });
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.error).toBe("User not found");
  });

  it("should logout successfully", async () => {
    const res = await fetch(`${baseUrl}/auth/logout`, {
      method: "POST",
    });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
  });
});

describe("Protected routes as Admin", () => {
  let token: string;
  let cookie: string;

  beforeAll(async () => {
    setupDatabase(db);

    token = await signToken({
      id: 1,
      name: "Alice",
      role: "admin",
    });

    cookie = `session_token=${token}`;
  });

  it("should list projects", async () => {
    const res = await fetch(`${baseUrl}/protected/projects`, {
      headers: {
        Cookie: cookie,
      },
    });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.length).toBe(2);
  });

  it("should get a specific project", async () => {
    const res = await fetch(`${baseUrl}/protected/projects/1`, {
      headers: {
        Cookie: cookie,
      },
    });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.id).toBe(1);
  });

  it("should create a project", async () => {
    const res = await fetch(`${baseUrl}/protected/projects`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: cookie,
      },
      body: JSON.stringify({
        id: 3,
        name: "Project 3",
      }),
    });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
  });

  it("should list analyses (no analyses yet)", async () => {
    const res = await fetch(`${baseUrl}/protected/projects/1/analyses`, {
      headers: {
        Cookie: cookie,
      },
    });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(Array.isArray(body)).toBe(true);
    expect(body.length).toBe(0);
  });

  it("should create an analyses", async () => {
    const res = await fetch(`${baseUrl}/protected/projects/1/analyses`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: cookie,
      },
      body: JSON.stringify({
        id: 1,
        name: "First analyses",
        content: "This is content",
      }),
    });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
  });

  it("should get the created analyses", async () => {
    const res = await fetch(`${baseUrl}/protected/projects/1/analyses/1`, {
      headers: {
        Cookie: cookie,
      },
    });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.id).toBe(1);
    expect(body.content).toBe("This is content");
  });
});

describe("Protected routes as Manager", () => {
  let token: string;
  let cookie: string;

  beforeAll(async () => {
    setupDatabase(db);

    token = await signToken({
      id: 2,
      name: "Bob",
      role: "manager",
    });

    cookie = `session_token=${token}`;
  });

  it("should list projects", async () => {
    const res = await fetch(`${baseUrl}/protected/projects`, {
      headers: {
        Cookie: cookie,
      },
    });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.length).toBe(2);
  });

  it("should get a specific project", async () => {
    const res = await fetch(`${baseUrl}/protected/projects/1`, {
      headers: {
        Cookie: cookie,
      },
    });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.id).toBe(1);
  });

  it("should create a project", async () => {
    const res = await fetch(`${baseUrl}/protected/projects`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: cookie,
      },
      body: JSON.stringify({
        id: 3,
        name: "Project 3",
      }),
    });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
  });

  it("should not list analyses", async () => {
    const res = await fetch(`${baseUrl}/protected/projects/1/analyses`, {
      headers: {
        Cookie: cookie,
      },
    });
    const body = await res.json();

    expect(res.status).toBe(403);
    expect(body.error).toBe("Forbidden");
  });

  it("should list analyses (no analyses yet)", async () => {
    const res = await fetch(`${baseUrl}/protected/projects/2/analyses`, {
      headers: {
        Cookie: cookie,
      },
    });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(Array.isArray(body)).toBe(true);
    expect(body.length).toBe(0);
  });

  it("should create an analyses on non-owned project", async () => {
    const res = await fetch(`${baseUrl}/protected/projects/1/analyses`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: cookie,
      },
      body: JSON.stringify({
        id: 1,
        name: "First analyses",
        content: "This is content",
      }),
    });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
  });

  it("shouldn't get the created analyses", async () => {
    const res = await fetch(`${baseUrl}/protected/projects/1/analyses/1`, {
      headers: {
        Cookie: cookie,
      },
    });
    const body = await res.json();

    expect(res.status).toBe(403);
    expect(body.error).toBe("Forbidden");
  });

  it("should get analyse", async () => {
    var res = await fetch(`${baseUrl}/protected/projects/2/analyses`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: cookie,
      },
      body: JSON.stringify({
        id: 1,
        name: "First analyses",
        content: "This is content",
      }),
    });
    var body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);

    res = await fetch(`${baseUrl}/protected/projects/2/analyses/1`, {
      headers: {
        Cookie: cookie,
      },
    });
    body = await res.json();

    expect(res.status).toBe(200);
    expect(body.id).toBe(1);
  });
});

describe("Protected routes as Reader", () => {
  let token: string;
  let cookie: string;

  beforeAll(async () => {
    setupDatabase(db);

    token = await signToken({
      id: 3,
      name: "Jean",
      role: "reader",
    });

    cookie = `session_token=${token}`;
  });

  it("should list projects", async () => {
    const res = await fetch(`${baseUrl}/protected/projects`, {
      headers: {
        Cookie: cookie,
      },
    });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.length).toBe(2);
  });

  it("should get a specific project", async () => {
    const res = await fetch(`${baseUrl}/protected/projects/1`, {
      headers: {
        Cookie: cookie,
      },
    });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.id).toBe(1);
  });

  it("shouldn't create a project", async () => {
    const res = await fetch(`${baseUrl}/protected/projects`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: cookie,
      },
      body: JSON.stringify({
        id: 3,
        name: "Project 3",
      }),
    });
    const body = await res.json();

    expect(res.status).toBe(403);
    expect(body.error).toBe("Forbidden");
  });

  it("should list analyses because of project_access", async () => {
    const res = await fetch(`${baseUrl}/protected/projects/1/analyses`, {
      headers: {
        Cookie: cookie,
      },
    });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(Array.isArray(body)).toBe(true);
    expect(body.length).toBe(0);
  });

  it("should not list analyses", async () => {
    const res = await fetch(`${baseUrl}/protected/projects/2/analyses`, {
      headers: {
        Cookie: cookie,
      },
    });
    const body = await res.json();

    expect(res.status).toBe(403);
    expect(body.error).toBe("Forbidden");
  });

  it("shouldn't create an analyses", async () => {
    const res = await fetch(`${baseUrl}/protected/projects/1/analyses`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: cookie,
      },
      body: JSON.stringify({
        id: 1,
        name: "First analyses",
        content: "This is content",
      }),
    });
    const body = await res.json();

    expect(res.status).toBe(403);
    expect(body.error).toBe("Forbidden");
  });
});
