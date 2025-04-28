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

beforeAll(async () => {
  db = new sqlite3.Database(":memory:");

  await new Promise<void>((resolve, reject) => {
    db.serialize(() => {
      db.run(`CREATE TABLE users (id TEXT, name TEXT, role TEXT)`);
      db.run(`CREATE TABLE projects (id TEXT, name TEXT, owner_id TEXT)`);
      db.run(`CREATE TABLE project_access (project_id TEXT, user_id TEXT)`);
      db.run(
        `CREATE TABLE analyses (id TEXT, name TEXT, content TEXT, project_id TEXT, created_by TEXT)`,
        (err) => {
          if (err) reject(err);
          resolve();
        }
      );
    });
  });

  await new Promise<void>((resolve, reject) => {
    db.serialize(() => {
      db.run(
        `INSERT INTO users (id, name, role) VALUES ('user1', 'Alice', 'admin')`
      );
      db.run(
        `INSERT INTO users (id, name, role) VALUES ('user2', 'Bob', 'manager')`
      );
      db.run(
        `INSERT INTO projects (id, name, owner_id) VALUES ('proj1', 'Project 1', 'user1')`,
        (err) => {
          if (err) reject(err);
          resolve();
        }
      );
    });
  });

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

describe("Protected routes", () => {
  let token: string;
  let cookie: string;

  beforeAll(async () => {
    token = await signToken({
      id: "user1",
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
    expect(body.length).toBeGreaterThan(0);
  });

  it("should get a specific project", async () => {
    const res = await fetch(`${baseUrl}/protected/projects/proj1`, {
      headers: {
        Cookie: cookie,
      },
    });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.id).toBe("proj1");
  });

  it("should create a project", async () => {
    const res = await fetch(`${baseUrl}/protected/projects`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: cookie,
      },
      body: JSON.stringify({
        id: "proj2",
        name: "Project 2",
      }),
    });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
  });

  it("should list analyses (no analyses yet)", async () => {
    const res = await fetch(`${baseUrl}/protected/projects/proj1/analyses`, {
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
    const res = await fetch(`${baseUrl}/protected/projects/proj1/analyses`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: cookie,
      },
      body: JSON.stringify({
        id: "analyses1",
        name: "First analyses",
        content: "This is content",
      }),
    });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
  });

  it("should get the created analyses", async () => {
    const res = await fetch(
      `${baseUrl}/protected/projects/proj1/analyses/analyses1`,
      {
        headers: {
          Cookie: cookie,
        },
      }
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.id).toBe("analyses1");
    expect(body.content).toBe("This is content");
  });
});
