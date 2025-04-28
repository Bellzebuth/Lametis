import { serve } from "@hono/node-server";
import { Hono } from "hono";
import authRoutes from "./routes/auth.js";
import sqlite3 from "sqlite3";

import initDb from "./db/schema.js";
import initSeed from "./db/data.js";
import protectedRoutes from "./routes/routes.js";

sqlite3.verbose();

/**
 * @see https://github.com/TryGhost/node-sqlite3/wiki/API
 */
const db = new sqlite3.Database("db.sqlite3", (error) => {
  if (error === null) {
    return;
  }
  console.error(error);
});

initDb(db);
initSeed(db);

/**
 * @see https://hono.dev/
 */
const app = new Hono();

app.use("*", async (c, next) => {
  c.set("db", db);
  await next();
});

app.route("/auth", authRoutes);
app.route("/protected", protectedRoutes);

app.get("/", (c) => {
  return c.text("Hello Hono!");
});

const port = 3000;
console.log(`Server is running on http://localhost:${port}`);

serve({
  fetch: app.fetch,
  port,
});
