# ELTON OS — Troubleshooting Runtime

**Date :** 2026-06-21 | **Version :** V2.5.4

---

## Stale Prisma Client après changement schema.prisma

### Symptôme

Erreur runtime dans le navigateur ou dans la console serveur :

```
Runtime SyntaxError: The string did not match the expected pattern.
```

### Cause

Le serveur Next.js dev utilise un Prisma Client généré **avant** un changement dans `prisma/schema.prisma` (nouvelle relation, nouveau champ, etc.). L'API Next.js retourne une erreur Prisma au lieu d'un JSON valide, ce qui fait échouer `.json()` côté client.

Exemple concret (V2.5.3) : ajout de la relation `ApplicationDraft.contact` → le vieux client ne connaît pas `include: { contact: ... }` → l'API retourne une stack trace Prisma au lieu de `{"success": true, ...}`.

### Diagnostic

```bash
curl http://localhost:3000/api/jobs/application-pipeline
```

Si la réponse contient une erreur Prisma (ex: `Unknown field contact for include statement on model ApplicationDraft`), le Prisma Client est stale.

### Correction

```bash
npx prisma generate          # régénère le client dans ./app/generated/prisma
kill <pid-du-serveur-dev>    # arrêter le serveur Next.js existant
npm run dev                  # ou npx next dev
```

Ou utiliser le script combiné :

```bash
npm run dev:fresh            # prisma generate + next dev
```

Vérifier ensuite :

```bash
npm run smoke:pipeline-api   # curl + validation JSON
```

---

## Checklist après toute modification Prisma

1. `npx prisma generate` (ou `npm run prisma:refresh`)
2. `npx prisma db push` (si SQLite) ou `npx prisma migrate dev` (si migration)
3. Redémarrer le serveur Next.js (`npm run dev:fresh`)
4. Curl rapide sur les routes touchées (`npm run smoke:pipeline-api`)
5. Lancer la suite de tests (`npm test`)
