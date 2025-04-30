import { Hono } from "hono";
import { signToken } from "../utils/jwt.js";
import type { User } from "../types.js";
import { deleteCookie, setCookie } from "hono/cookie";
import { hashPassword } from "../utils/hash.js";

const auth = new Hono();

auth.post("/login", async (c) => {
  const db = c.get("db");
  const { name, password } = await c.req.json();

  return new Promise((resolve) => {
    db.get(
      "SELECT * FROM users WHERE name = ?",
      [name],
      async (err, user: User) => {
        if (err || !user) {
          return resolve(c.json({ error: "User not found" }, 401));
        }

        const hashed = await hashPassword(password);
        if (user.password !== hashed) {
          return c.json({ error: "Invalid credentials" }, 401);
        }

        const token = await signToken({
          id: user.id,
          name: user.name,
          role: user.role,
        });

        setCookie(c, "session_token", token, {
          path: "/",
          secure: process.env.NODE_ENV === "production",
          httpOnly: true,
          expires: new Date(Date.now() + 60 * 60 * 1000), // expires in 1 hour
          sameSite: "Strict",
        });
        resolve(c.json({ success: true, message: "Logged in" }));
      }
    );
  });
});

auth.post("/logout", (c) => {
  deleteCookie(c, "session_token", {
    path: "/",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "Strict",
  });

  return c.json({ success: true, message: "Logged out" });
});

export default auth;
