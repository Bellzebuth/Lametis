import type { Database } from "sqlite3";

export const READ = "read";
export const WRITE = "write";

// check access rights to a project
export async function hasProjectAccess(
  db: Database,
  userId: string,
  userRole: string,
  projectId: string,
  action: string
): Promise<boolean> {
  return new Promise((resolve) => {
    if (userRole === "admin") return resolve(true);
    if (userRole === "manager" && action === WRITE) return resolve(true);
    if (userRole === "reader" && action === WRITE) return resolve(false);

    db.get(
      `SELECT * FROM projects WHERE id = ? AND owner_id = ?`,
      [projectId, userId],
      (err, project) => {
        if (err) return resolve(false);
        if (project) return resolve(true);

        db.get(
          `SELECT * FROM project_access WHERE project_id = ? AND user_id = ?`,
          [projectId, userId],
          (err, access) => {
            if (err) return resolve(false);
            resolve(!!access);
          }
        );
      }
    );
  });
}
