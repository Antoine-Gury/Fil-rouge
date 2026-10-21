# NexusOps

Cockpit de supervision frontend développé avec React, TypeScript et Vite. Les données sont fournies par une API locale simulée avec `json-server`.

## Installation

```bash
npm install
```

## Lancement

Lancer l’API simulée dans un terminal :

```bash
npm run api
```

L’API est disponible à `http://localhost:3001`. Les collections utilisées sont `/equipments`, `/incidents` et `/users`.

Dans un second terminal, lancer le frontend :

```bash
npm run dev
```

Ouvrir l’URL affichée par Vite (par défaut `http://localhost:5173`).

## Parcours disponibles

- `/` : tableau de bord avec des indicateurs calculés à partir de l’API.
- `/equipements` : liste des équipements et de leur statut.
- `/incidents` : liste des incidents et formulaire contrôlé pour en créer un.
- `/utilisateurs` : liste des utilisateurs, e-mails et rôles.

La recherche en haut de page filtre les données visibles sur chaque écran. Les pages Équipements, Incidents et Utilisateurs permettent de créer, modifier et supprimer les entrées ; une confirmation est demandée avant chaque suppression. Les modifications sont enregistrées par l’API json-server dans `db.json`.

Les vues affichent un chargement pendant les requêtes, un message explicite et une action de nouvelle tentative en cas d’erreur. Le formulaire d’incident envoie un `POST /incidents` ; json-server conserve la création dans `db.json`.

## Vérifications

```bash
npm run build
npm run lint
```

Le projet ne contient ni backend applicatif, ni authentification réelle, ni base de données.
