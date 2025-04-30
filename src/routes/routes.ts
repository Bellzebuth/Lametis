import { Hono } from "hono";
import { authMiddleware } from "../middlewares/auth.js";
import { hasProjectAccess, READ, WRITE } from "../utils/access.js";

export const protectedRoutes = new Hono();

// list projects
protectedRoutes.get("/projects", authMiddleware, (c) => {
  const db = c.get("db");
  return new Promise((resolve) => {
    db.all(`SELECT * FROM projects`, [], (err, rows) => {
      if (err) return resolve(c.json({ error: err.message }, 500));
      resolve(c.json(rows));
    });
  });
});

// get project
protectedRoutes.get("/projects/:projectId", authMiddleware, (c) => {
  const { projectId } = c.req.param();
  const db = c.get("db");

  return new Promise((resolve) => {
    db.get(
      `SELECT * FROM projects WHERE id = ?`,
      [projectId],
      (err, project) => {
        if (err) return resolve(c.json({ error: err.message }, 500));
        if (!project) return resolve(c.json({ error: "Not found" }, 404));
        resolve(c.json(project));
      }
    );
  });
});

// create project
protectedRoutes.post("/projects", authMiddleware, async (c) => {
  const { id, name } = await c.req.json();
  const user = c.get("user");
  const db = c.get("db");

  if (user.role === "reader") {
    return c.json({ error: "Forbidden" }, 403);
  }

  return new Promise((resolve) => {
    db.run(
      `INSERT INTO projects (id, name, owner_id) VALUES (?, ?, ?)`,
      [id, name, user.id],
      (err) => {
        if (err) return resolve(c.json({ error: err.message }, 500));
        resolve(c.json({ success: true }));
      }
    );
  });
});

// list project's analyses
protectedRoutes.get(
  "/projects/:projectId/analyses",
  authMiddleware,
  async (c) => {
    const { projectId } = c.req.param();
    const user = c.get("user");
    const db = c.get("db");

    const access = await hasProjectAccess(
      db,
      user.id,
      user.role,
      projectId,
      READ
    );
    if (!access) return c.json({ error: "Forbidden" }, 403);

    return new Promise((resolve) => {
      db.all(
        `SELECT * FROM analyses WHERE project_id = ?`,
        [projectId],
        (err, rows) => {
          if (err) return resolve(c.json({ error: err.message }, 500));
          resolve(c.json(rows));
        }
      );
    });
  }
);

// get analyses
protectedRoutes.get(
  "/projects/:projectId/analyses/:analysesId",
  authMiddleware,
  async (c) => {
    const { projectId, analysesId } = c.req.param();
    const user = c.get("user");
    const db = c.get("db");

    const access = await hasProjectAccess(
      db,
      user.id,
      user.role,
      projectId,
      READ
    );
    if (!access) return c.json({ error: "Forbidden" }, 403);

    return new Promise((resolve) => {
      db.get(
        `SELECT * FROM analyses WHERE id = ? AND project_id = ?`,
        [analysesId, projectId],
        (err, row) => {
          if (err) return resolve(c.json({ error: err.message }, 500));
          if (!row) return resolve(c.json({ error: "Not found" }, 404));
          resolve(c.json(row));
        }
      );
    });
  }
);

// create analyses
protectedRoutes.post(
  "/projects/:projectId/analyses",
  authMiddleware,
  async (c) => {
    const { projectId } = c.req.param();
    const { id, name, content } = await c.req.json();
    const user = c.get("user");
    const db = c.get("db");

    const access = await hasProjectAccess(
      db,
      user.id,
      user.role,
      projectId,
      WRITE
    );
    if (!access) return c.json({ error: "Forbidden" }, 403);

    return new Promise((resolve) => {
      db.run(
        `INSERT INTO analyses (id, name, content, project_id, created_by) VALUES (?, ?, ?, ?, ?)`,
        [id, name, content, projectId, user.id],
        (err) => {
          if (err) return resolve(c.json({ error: err.message }, 500));
          resolve(c.json({ success: true }));
        }
      );
    });
  }
);

export default protectedRoutes;
