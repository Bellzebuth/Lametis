import { beforeAll, describe, expect, it } from "vitest";
import { signToken } from "../utils/jwt.js";
import { hashPassword } from "../utils/hash.js";
import { setupDatabase } from "./setup.js";
import { baseUrl } from "./setup.js";
import { db } from "./setup.js";

describe("Protected routes as Admin", () => {
  let token: string;
  let cookie: string;

  beforeAll(async () => {
    await setupDatabase(db);

    token = await signToken({
      id: 1,
      name: "Alice",
      password: await hashPassword("admin"),
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
