# ELTON OS — Public Launch Checklist

> Dernière mise à jour : 2026-06-19 · V2.0

## Prérequis environnement

| Variable | Description | Obligatoire |
|----------|-------------|-------------|
| `DATABASE_URL` | Chemin SQLite (ex: `file:./dev.db`) | ✅ Oui |
| `NEXT_PUBLIC_ELTON_DEMO_MODE` | Active mode démo global (`true`/`false`) | Non |

## Commandes

```bash
npm run build        # Build production
npx vitest run       # Tests unitaires (349)
npm run lint         # Lint check
SMOKE_API_BASE=http://localhost:3000 npm run smoke:demo  # Smoke test demo
```

## Checklist pré-lancement

### Build & Tests
- [ ] `npm run build` passe sans erreur
- [ ] `npx vitest run` → 349/349
- [ ] `npm run lint` → stable (pas de nouveaux warnings)

### Mode démo
- [ ] `/dashboard/jobs?demo=true` affiche uniquement les données `[DEMO]`
- [ ] `/dashboard/jobs` (normal) exclut les données `[DEMO]`
- [ ] Pipeline démo : 8 colonnes, 1+ carte chacune
- [ ] Analytics démo : KPIs + Insights + Alertes
- [ ] `npm run smoke:demo` → 10/10

### Landing publique
- [ ] `/elton-os` (public) sans sidebar, accessible directement
- [ ] Formulaire "Accès fondateur" fonctionnel
- [ ] CTA "Voir la démo" pointe vers `/dashboard/jobs?demo=true`
- [ ] Microcopy "Données fictives. Aucune action réelle."

### Sécurité
- [ ] Aucun envoi automatique de candidature
- [ ] Aucun envoi automatique d'email
- [ ] Aucun Browser Agent lancé automatiquement (login manuel requis)
- [ ] `deleteDemoData()` ne supprime que les données `[DEMO]`
- [ ] Mode normal n'affiche jamais de données `[DEMO]`

### Conformité wording
- [ ] Aucune mention "emploi garanti"
- [ ] Aucune mention "entretien garanti"
- [ ] Aucune mention "postule automatiquement"
- [ ] Aucune mention "bypass LinkedIn" ou "contourne"
- [ ] Aucune mention "zéro risque"
- [ ] Formulations utilisées : "aide à", "assiste", "prépare", "l'utilisateur valide"

### Routes clés
- [ ] `GET /api/demo` → status OK
- [ ] `POST /api/demo {action:"create"}` → crée dataset
- [ ] `POST /api/demo {action:"delete"}` → supprime dataset
- [ ] `POST /api/elton-os/lead` → accepte formulaire
- [ ] `GET /api/jobs/application-pipeline?demo=true` → pipeline démo
- [ ] `GET /api/jobs/application-analytics?demo=true` → analytics démo

### Post-lancement
- [ ] Vérifier `prisma.contactLead` pour nouveaux leads
- [ ] Pas de tracking tiers actif
- [ ] Pas de cookies marketing
- [ ] Serveur stable
