import type { MiddlewareHandler } from "hono";
import { getCookie } from "hono/cookie";
import { verifyToken } from "../utils/jwt.js";

export const authMiddleware: MiddlewareHandler = async (c, next) => {
  const token = getCookie(c, "session_token");

  if (!token) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  try {
    const payload = await verifyToken(token);
    c.set("user", payload);
    await next();
  } catch (e) {
    return c.json({ error: "Invalid token" }, 401);
  }
};
