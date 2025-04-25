# La mètis - Dev Full-Stack - Test technique - v20250215

## Contexte
Dans le cadre de l'évolution de notre plateforme, nous souhaitons mettre en place une API qui gère des projets et des analyses avec une gestion fine des droits d'accès.

## Objectif du test
Sécuriser une API REST qui permet de créer et de consulter des projets et des analyses, en implémentant une gestion des droits d'accès basée sur des rôles et des accès spécifiques.

## Endpoints de l'API
L'API expose les endpoints suivants :

- **Projets**
  - `GET /projects/`  
    Lire tous les projets accessibles à l'utilisateur authentifié.
  
  - `GET /projects/:projectId`  
    Lire un projet spécifique accessible à l'utilisateur authentifié.
  
  - `POST /projects/`  
    Créer un nouveau projet.

- **Analyses**
  - `GET /projects/:projectId/analyses/`  
    Lire toutes les analyses d'un projet donné, accessibles à l'utilisateur.
  
  - `GET /projects/:projectId/analyses/:analysisId`  
    Lire une analyse spécifique, accessible à l'utilisateur.
  
  - `POST /projects/:projectId/analyses/`  
    Créer une nouvelle analyse pour un projet donné.

## Environnement Technique
- **Framework** : [Hono](https://hono.dev/)
- **Base de Données** : SQLite
- **Langage** : TypeScript

Une API basique est proposée sans implémentation de la partie base de données.
Vous pouvez lancer le serveur en local via les commandes suivantes :
```
npm install
npm run dev

open http://localhost:3000
```

## Fonctionnalités à implémenter

### Modélisation des données
Créer et implémenter les modèles de données nécessaires.  
Intégrer SQLite dans le squelette d'API et mettre en place le schéma créé.

### Gestion des droits d'accès
Les accès aux ressources doivent être contrôlés en fonction du rôle de l'utilisateur. Trois rôles doivent être gérés :

- **Administrateur**
  - Peut créer des projets et des analyses.
  - Peut accéder à tous les projets et analyses des autres utilisateurs.

- **Manageur**
  - Peut créer des projets.
  - Peut créer des analyses uniquement sur les projets dont il est propriétaire.
  - Peut lire uniquement les projets et analyses dont il est propriétaire ou pour lesquels un accès lui a été explicitement accordé.

- **Lecteur**
  - Peut uniquement lire les projets et analyses pour lesquels un accès lui a été accordé.

**Précisions sur la création des ressources :**

- **Création d'un Projet (`POST /projects/`)**  
  Le corps de la requête devra contenir :
  - Un **nom** de projet.
  - Une **liste d'identifiants d'utilisateurs** qui auront accès à ce projet.  
    *Le créateur du projet n'est pas obligé de partager son projet avec d'autres utilisateurs.*

- **Création d'une Analyse (`POST /projects/:projectId/analyses/`)**  
  Le corps de la requête devra contenir :
  - L'**identifiant du projet** associé.
  - Un **nom** pour l'analyse.

### Authentification simplifiée
Pour simplifier la mise en place du test, l'authentification est simulée. Chaque requête devra inclure l'identifiant de l'utilisateur (via un header, un paramètre ou tout autre mécanisme) permettant d'identifier l'utilisateur et de déterminer ses droits d'accès.

### Gestion d'erreurs et logging (optionnel)
Implémenter une gestion centralisée des erreurs et un mécanisme de logging pour faciliter le suivi en production.

## Exigences Techniques

- **Intégration de la base de données**  
  Créer le schéma de la base de données pour les entités définies.  
  Implémenter l'intégration de SQLite dans le squelette d'API fourni.

- **Architecture & Structuration**  
  Organisez votre projet de manière modulaire et appliquez les bonnes pratiques de développement.

- **Tests**  
  Implémentez des tests unitaires et/ou d'intégration pour démontrer la robustesse de votre API et la bonne gestion des droits d'accès.

- **Documentation**  
  Fournissez une documentation claire de l'API incluant :
  - La description des endpoints.
  - Le schéma de la base de données.
  - Les règles de gestion des droits d'accès.
  - Les instructions pour lancer l'application et exécuter les tests.

Vous êtes libre d'installer les dépendances supplémentaires que vous jugerez utiles (à l'exception des bibliothèques de gestion des droits d'accès).

## Livrables
- Le code source de l'API dans un dépôt Git (GitHub, GitLab, etc.).
- Un fichier `README.md` détaillant :
  - Les instructions pour lancer l'application et les tests.
  - Vos choix techniques et architecturaux.
  - La documentation de l'API.

## Critères d'Évaluation
- **Fonctionnalités** : L'API doit respecter les endpoints définis et appliquer correctement les règles de gestion des droits d'accès.
- **Qualité du Code** : Le code doit être propre, structuré et respecter les bonnes pratiques.
- **Tests** : La présence de tests unitaires et/ou d'intégration pour valider les fonctionnalités et la gestion des droits.
- **Documentation** : Une documentation claire et complète qui facilite la compréhension et la maintenance de l'API.
- **Innovation** : Les propositions de fonctionnalités additionnelles seront appréciées.

Bonne chance et bon développement !
