# NexusOps

Cockpit de supervision développé avec React, TypeScript et Vite. Les données du cockpit sont fournies par `json-server`, et les comptes sont gérés par une API PHP et une base MySQL locale.

## Installation

```bash
npm install
```

## Lancement

### Base MySQL et authentification

1. Démarrer **Apache** et **MySQL** dans le panneau XAMPP.
2. Ouvrir [http://localhost/phpmyadmin](http://localhost/phpmyadmin), choisir **Importer**, sélectionner `database/schema.sql`, puis lancer l’import. Le script crée la base `nexusops` et sa table `users`.
3. Dans un terminal à la racine du projet, démarrer l’API PHP :

```bash
npm run auth:api
```

Le script utilise le PHP installé dans `C:\xampp\php` et écoute uniquement sur `127.0.0.1:8000`. La configuration XAMPP par défaut (`root` sans mot de passe, base `nexusops`) est utilisée. Pour un autre compte MySQL, définir `NEXUSOPS_DB_HOST`, `NEXUSOPS_DB_PORT`, `NEXUSOPS_DB_NAME`, `NEXUSOPS_DB_USER` et `NEXUSOPS_DB_PASSWORD` dans l’environnement avant de démarrer le serveur. Ne pas placer le mot de passe dans le code ou dans le dépôt.

L’inscription crée un compte avec le rôle `viewer` et le connecte automatiquement. Les mots de passe sont hachés côté PHP et la session est conservée dans un cookie HTTP-only.

Pour activer le premier administrateur : crée un compte dans l’application, puis exécute dans l’onglet **SQL** de phpMyAdmin :

```sql
UPDATE nexusops.users
SET role = 'admin'
WHERE email = 'ton-adresse@example.com';
```

Reconnecte-toi ensuite avec ce compte. Le lien **Administration** donne accès à la gestion des comptes, équipements et incidents. Les opérations d’administration sont vérifiées côté PHP ; le dernier compte administrateur ne peut pas être supprimé ni rétrogradé. La suppression d’un équipement associé à des incidents est également refusée.

### API des données de supervision

Lancer l’API simulée dans un autre terminal :

```bash
npm run api
```

L’API est disponible à `http://localhost:3001`. Les collections utilisées sont `/equipments`, `/incidents` et `/users`.

Dans un troisième terminal, lancer le frontend :

```bash
npm run dev
```

Ouvrir l’URL affichée par Vite (par défaut `http://localhost:5173`).

## Parcours disponibles

- `/login` : inscription ou connexion ; les pages du cockpit redirigent vers cette page si aucune session n’est ouverte.
- `/` : tableau de bord avec des indicateurs calculés à partir de l’API.
- `/equipements` : liste des équipements et de leur statut.
- `/incidents` : liste des incidents et formulaire contrôlé pour en créer un.
- `/utilisateurs` : liste des utilisateurs, e-mails et rôles.
- `/admin` : administration des comptes, équipements et incidents (rôle `admin` requis).

La barre de recherche du bandeau filtre les résultats affichés sur la page en cours. La page `/login` permet de créer un compte ou de se connecter avec un compte enregistré dans MySQL.

Les pages Équipements et Incidents permettent de créer, modifier et supprimer leurs entrées ; une confirmation est demandée avant chaque suppression. Les comptes visibles dans Utilisateurs proviennent de MySQL et leur gestion est réservée au panel `/admin`.

Les vues affichent un chargement pendant les requêtes, un message explicite et une action de nouvelle tentative en cas d’erreur. Les données de supervision sont enregistrées par json-server dans `db.json`.

## Vérifications

```bash
npm run build
npm run lint
```

Le backend PHP d’authentification se trouve dans `backend/public/auth.php`. Les comptes sont conservés dans MySQL ; les données de supervision restent fournies par `json-server`.
