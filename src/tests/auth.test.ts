import { beforeAll, describe, expect, it } from "vitest";
import { setupDatabase } from "./setup.js";
import { baseUrl } from "./setup.js";
import { db } from "./setup.js";

describe("Auth routes", () => {
  beforeAll(async () => {
    await setupDatabase(db);
  });

  it("should login successfully", async () => {
    const res = await fetch(`${baseUrl}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Bob",
        password: "manager",
      }),
    });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(res.headers.get("set-cookie")).toBeTruthy();
  }, 10000);

  it("should fail login with invalid user", async () => {
    const res = await fetch(`${baseUrl}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Alice", password: "unknown" }),
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
