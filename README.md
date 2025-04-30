# La Mètis – API REST sécurisée

Une API REST construite avec [Hono](https://hono.dev/) et [SQLite](https://www.sqlite.org/) permettant de gérer des projets et des analyses, avec un système de rôles (Administrateur, Manageur, Lecteur) et des règles d'accès strictes.

---

## ✨ Endpoints

### Authentification

| Méthode | Endpoint       | Description                 |
| ------: | -------------- | --------------------------- |
|  `POST` | `/auth/login`  | Authentifie un utilisateur. |
|  `POST` | `/auth/logout` | Déconnecte l’utilisateur.   |

---

### Projets

| Méthode | Endpoint        | Description                        | Rôles autorisés    |
| ------: | --------------- | ---------------------------------- | ------------------ |
|   `GET` | `/projects`     | Liste tous les projets accessibles | `admin`, `manager` |
|   `GET` | `/projects/:id` | Récupère un projet spécifique      | `admin`, `manager` |
|  `POST` | `/projects`     | Crée un nouveau projet             | `admin`, `manager` |

---

### Analyses

| Méthode | Endpoint                            | Description                  | Rôles autorisés |
| ------: | ----------------------------------- | ---------------------------- | --------------- |
|   `GET` | `/projects/:projectId/analyses`     | Liste les analyses du projet | `admin`         |
|   `GET` | `/projects/:projectId/analyses/:id` | Récupère une analyse         | `admin`         |
|  `POST` | `/projects/:projectId/analyses`     | Crée une nouvelle analyse    | `admin`         |

---

## 🧩 Schéma de la base de données

```sql
-- Utilisateurs
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role TEXT CHECK(role IN ('admin', 'manager', 'reader')) NOT NULL
);

-- Projets
CREATE TABLE projects (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT
);

-- Droits d'accès aux projets
CREATE TABLE project_access (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  project_id INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (project_id) REFERENCES projects(id)
);

-- Analyses
CREATE TABLE analyses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  project_id INTEGER NOT NULL,
  FOREIGN KEY (project_id) REFERENCES projects(id)
);
```

---

## 🔐 Règles de gestion des droits d'accès

- **Admin** :

  - Peut accéder à tous les projets et analyses.
  - Peut créer des projets et des analyses.
  - Peut voir tous les projets sans limitation d'accès.

- **Manager** :

  - Peut accéder uniquement aux projets auxquels il a un accès explicite (`project_access`).
  - Peut voir et créer des projets.
  - Ne peut pas voir ni créer d’analyses.

- **Reader** :
  - Pas d’accès autorisé aux routes `/projects` ou `/analyses`.

---

## 🚀 Lancer l’application

### 1. Installation

```bash
npm install
```

### 2. Lancement de l’API

```bash
npm run dev
```

Le serveur s’exécutera sur `http://localhost:3000`.

---

## ✅ Exécuter les tests

```bash
npm test
```

Les tests utilisent [Vitest](https://vitest.dev/) et incluent des tests d'intégration avec initialisation/reset de la base de données.

> ⚠️ Assurez-vous que rien d'autre n'utilise le port utilisé par le serveur de test.

---

## 📁 Structure du projet

```
├── src/
│   ├── db/               # Initialisation et accès à SQLite
│   ├── middlewares/       # Middleware d'authentification et d'autorisation
│   ├── routes/           # Routes de l’API
│   └── tests/            # Tests d'intégration
├── vitest.config.ts
├── sqlite.db             # Base de données locale (créée automatiquement)
```

---

## 👥 Utilisateurs de test

Les utilisateurs suivants sont disponibles après `data.ts` :

| Nom d’utilisateur | Rôle    |
| ----------------- | ------- |
| `admin`           | admin   |
| `manager`         | manager |
| `reader`          | reader  |

---

## 🧪 Initialiser les données

```bash
npm run seed
```

Cela initialise la base de données avec des utilisateurs, projets et accès.

---

## 🛠 Dépendances clés

- [Hono](https://hono.dev/) – Framework web minimaliste pour TypeScript.
- [SQLite](https://www.sqlite.org/) – Base de données légère.
- [Drizzle ORM](https://orm.drizzle.team/) – ORM TypeScript pour SQLite.
- [Vitest](https://vitest.dev/) – Framework de test rapide et moderne.

```

---

```
