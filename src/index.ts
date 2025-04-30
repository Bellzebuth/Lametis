import { serve } from "@hono/node-server";
import { Hono } from "hono";
import authRoutes from "./routes/auth.js";
import sqlite3 from "sqlite3";

import initDb from "./db/schema.js";
import initSeed from "./db/data.js";
import protectedRoutes from "./routes/analyses.js";

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
  return c.json({
    message: "Bienvenue sur l'API La Mètis 🔐",
    description:
      "Cette API permet de gérer des projets et des analyses avec un système de rôles (admin, manager, reader).",
    endpoints: [
      {
        method: "POST",
        path: "/auth/login",
        description: "Connexion utilisateur (via nom uniquement)",
      },
      {
        method: "POST",
        path: "/auth/logout",
        description: "Déconnexion utilisateur",
      },
      {
        method: "GET",
        path: "/protected/projects",
        description: "Liste les projets accessibles à l'utilisateur connecté",
      },
      {
        method: "POST",
        path: "/protected/projects",
        description: "Crée un nouveau projet (admin et manager uniquement)",
      },
      {
        method: "GET",
        path: "/protected/projects/:id",
        description: "Récupère un projet spécifique",
      },
      {
        method: "GET",
        path: "/protected/projects/:id/analysis",
        description: "Liste les analyses d’un projet accessible",
      },
      {
        method: "POST",
        path: "/protected/projects/:id/analyses",
        description: "Crée une nouvelle analyse (admin et manager uniquement)",
      },
      {
        method: "GET",
        path: "/protected/projects/:id/analyses/:analysisId",
        description: "Récupère une analyse spécifique accessible",
      },
    ],
    accessRules: {
      admin: [
        "Peut créer des projets",
        "Peut accéder à tous les projets",
        "Peut créer des analyses sur n'importe quel projet",
        "Peut consulter toutes les analyses des projets",
      ],
      manager: [
        "Peut créer des projets",
        "Peut accéder à tous les projets",
        "Peut créer des analyses sur n'importe quel projet",
        "Peut consulter toutes les analyses de ces projets",
      ],
      reader: [
        "Ne peut pas créer de projets ni d’analyses",
        "Peut uniquement consulter les projets",
        "Peut uniquement consulter les analyses accessibles via la table project_access",
      ],
    },
    note: "Toutes les routes protégées nécessitent un cookie `session_token` valide. Utilisez /auth/login pour en obtenir un.",
  });
});

const port = 3000;
console.log(`Server is running on http://localhost:${port}`);

serve({
  fetch: app.fetch,
  port,
});
