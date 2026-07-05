#!/usr/bin/env bash
# Smoke test — vérifie que l'API Pipeline retourne du JSON valide
# Détecte un Prisma Client stale après changement schema.prisma
set -euo pipefail

PORT="${1:-3000}"
URL="http://localhost:${PORT}/api/jobs/application-pipeline"

echo "=== Smoke Pipeline API ==="
echo "→ GET $URL"
echo ""

RESPONSE=$(curl -s "$URL" 2>&1) || {
  echo "❌ ÉCHEC — le serveur ne répond pas sur le port ${PORT}."
  echo "   Lancez npm run dev d'abord."
  exit 1
}

# Vérifier que la réponse est du JSON valide avec success=true
if echo "$RESPONSE" | python3 -c "import sys,json; json.load(sys.stdin)" 2>/dev/null; then
  SUCCESS=$(echo "$RESPONSE" | python3 -c "import sys,json; print(json.load(sys.stdin).get('success',False))" 2>/dev/null)
  if [ "$SUCCESS" = "True" ]; then
    echo "✅ API Pipeline OK — JSON valide, success=true"
    echo "   Prisma Client est à jour."
    exit 0
  else
    echo "⚠️  API répond en JSON mais success n'est pas true."
    echo "   Réponse: $(echo "$RESPONSE" | head -c 200)"
    exit 1
  fi
else
  # Vérifier si c'est une erreur Prisma stale
  if echo "$RESPONSE" | grep -q "Unknown field\|Invalid.*prisma\|PrismaClient"; then
    echo "❌ PRISMA CLIENT STALE DÉTECTÉ"
    echo "   L'API retourne une erreur Prisma, pas du JSON valide."
    echo "   → Cause probable: schema.prisma modifié sans prisma generate."
    echo "   → Correction:"
    echo "       npm run prisma:refresh"
    echo "       redémarrer le serveur Next.js (npm run dev:fresh)"
    echo ""
    echo "   Réponse brute:"
    echo "$RESPONSE" | head -c 500
    exit 2
  else
    echo "❌ ÉCHEC — réponse non-JSON."
    echo "   Réponse brute:"
    echo "$RESPONSE" | head -c 500
    exit 1
  fi
fi
