import type { Database } from "sqlite3";

declare module "hono" {
  interface ContextVariableMap {
    db: Database;
    user: User;
  }
}
