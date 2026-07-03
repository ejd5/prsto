# PRSTO — Migration SQLite → PostgreSQL (Neon)

## Pourquoi migrer ?

SQLite est parfait pour le développement local mais **ne supporte pas** :
- Plusieurs utilisateurs simultanés en écriture
- Les connexions concurrentes (verrouillage de la base entière)
- Le déploiement sur Vercel/Railway/Render (pas de système de fichiers persistant)

**PostgreSQL est obligatoire pour la production.**

## Neon — PostgreSQL gratuit

Neon (https://neon.tech) propose du PostgreSQL serverless gratuit :
- 0.5 GB de stockage
- 1 projet
- Branching gratuit
- Connexion depuis n'importe où

## Étapes de migration

### Étape 1 — Créer une base Neon (2 minutes)

1. Va sur https://neon.tech
2. Clique **"Sign up"** (gratuit, connexion Google/GitHub)
3. Crée un projet nommé **"prsto"**
4. Copie la **connection string** qui s'affiche (format : `postgresql://user:password@ep-xxx.eu-west-1.aws.neon.tech/neondb?sslmode=require`)

### Étape 2 — Configurer .env.local

Dans `/home/z/my-project/elton-os/.env.local`, remplace :
```
DATABASE_URL="file:./prisma/dev.db"
```
par :
```
DATABASE_URL="postgresql://user:password@ep-xxx.eu-west-1.aws.neon.tech/neondb?sslmode=require"
DATABASE_URL_SQLITE="file:./prisma/dev.db"
```

### Étape 3 — Basculer le schema Prisma

```bash
cp prisma/schema.prisma.pg prisma/schema.prisma
```

### Étape 4 — Créer les tables dans PostgreSQL

```bash
npx prisma db push
```

### Étape 5 — Migrer les données

```bash
# Le script lit SQLite (DATABASE_URL_SQLITE) et écrit dans PostgreSQL (DATABASE_URL)
node scripts/migrate-sqlite-to-postgres.js
```

### Étape 6 — Régénérer le client Prisma

```bash
npx prisma generate
```

### Étape 7 — Tester

```bash
npm run build
python3 /home/z/my-project/scripts/start_next_prod.py
# Vérifier que le dashboard, le conseiller IA, et le blog marchent
```

## Données à migrer

| Table | Enregistrements |
|---|---|
| Users | 1 |
| Profiles | 1 |
| Opportunities | 120 |
| Jobs | 109 |
| ProofEntries | 3 |
| Interviews | 2 |
| CVMaster | 1 |
| Settings | 1 |
| Embeddings | 7 |
| SafeJobSources | ~5 |
| JobSources | ~5 |
| RecruiterContacts | ~10 |

## Après la migration

- SQLite reste disponible en backup (`prisma/dev.db`)
- Le schema PostgreSQL est dans `prisma/schema.prisma`
- Le schema SQLite est sauvegardé dans `prisma/schema.prisma.sqlite.bak`
- Pour revenir à SQLite : `cp prisma/schema.prisma.sqlite.bak prisma/schema.prisma`

## Avantages de PostgreSQL

| Aspect | SQLite | PostgreSQL |
|---|---|---|
| Utilisateurs simultanés | 1 écriture | Illimité |
| Déploiement Vercel | ❌ | ✅ |
| Connexions concurrentes | 1 | 100+ |
| Full-text search | Basique | Avancé |
| JSON | Basique | Avancé |
| Performance | Bonne (local) | Excellente (cloud) |
| Coût | Gratuit | Gratuit (Neon) |
