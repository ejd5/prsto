#!/bin/bash
# Régénère toutes les images du blog avec des prompts spécifiant
# "European and American business executives, no Asian faces"

BLOG_DIR="/home/z/my-project/elton-os/public/blog"

# Tableau associatif slug → prompt (sans personnages asiatiques)
declare -A PROMPTS

PROMPTS["plan-100-jours-nouveau-dg"]="European male CEO presenting strategic plan in modern boardroom, confident Caucasian executive, dark green and gold premium tones, editorial business photography, wide angle, no Asian faces"
PROMPTS["naviguer-entretien-fonds-private-equity"]="European and American investors in luxury boardroom, Caucasian businessman evaluating candidate, financial charts, dark elegant office, gold accents, editorial photography, no Asian faces"
PROMPTS["negocier-package-350k-mlf-series-b"]="European male executive negotiating compensation package, handshake across desk, Caucasian businesspeople, premium office, warm lighting, no Asian faces"
PROMPTS["linkedin-cadres-dirigeants-2026"]="Caucasian male executive looking at LinkedIn on laptop, modern European office, networking concept, green and gold color scheme, no Asian faces"
PROMPTS["marche-cache-dirigeants-2026"]="European executives networking at exclusive event, Caucasian businesspeople in elegant suits, dark setting, gold lighting, no Asian faces"
PROMPTS["echec-recherche-emploi-dirigeant"]="Caucasian male executive looking determined despite challenges, rain through office window, dramatic lighting, European setting, no Asian faces"
PROMPTS["due-diligence-dirigeant-avant-signer"]="European male executive asking tough questions in board meeting, Caucasian board members, financial documents, serious atmosphere, no Asian faces"
PROMPTS["equity-vesting-clauses-pieges"]="Golden keys opening a vault with legal documents, equity concept, financial growth chart, premium dark green tones, no people, no Asian faces"
PROMPTS["gouvernance-comex-cadres-dirigeants"]="European executive committee in modern boardroom, Caucasian diverse team debating strategy, collaborative decision making, premium editorial, no Asian faces"
PROMPTS["transition-vers-conseil-administration"]="Caucasian male executive walking through doorway into boardroom, golden light, transformation concept, European setting, no Asian faces"
PROMPTS["marche-cache-cadres-dirigeants-2026"]="European executives in confidential meeting, Caucasian businesspeople, exclusive private club setting, warm lighting, no Asian faces"
PROMPTS["cv-directeurs-ats-scoring"]="Executive CV being scanned by AI technology, modern European office, ATS concept, blue and green tones, no people visible, no Asian faces"
PROMPTS["cinq-minutes-package-negociation"]="Caucasian male executive confident handshake, salary negotiation, premium European office, warm tones, no Asian faces"
PROMPTS["chasseurs-tetes-reseaux-secrets"]="European headhunter in confidential meeting, Caucasian executives, exclusive setting, dark elegant, no Asian faces"
PROMPTS["transformation-digitale-dg-2026"]="European male CEO leading digital transformation, Caucasian executive with technology, circuit board overlay, modern blue tones, no Asian faces"
PROMPTS["imposter-syndrome-dirigeants"]="Caucasian male executive looking in mirror, reflection shows confidence emerging from doubt, European office, dramatic lighting, no Asian faces"
PROMPTS["reseautage-dirigeants-international"]="European and American executives networking, Caucasian and Latino businesspeople shaking hands, global map, blue and gold, no Asian faces"
PROMPTS["crise-communication-dirigeant"]="Caucasian male CEO in crisis management, press conference, serious European executive, dramatic newsroom lighting, no Asian faces"
PROMPTS["delegation-art-dirigeant"]="European male executive delegating tasks to team, Caucasian managers, chess pieces concept, strategic, warm tones, no Asian faces"
PROMPTS["package-dirigeant-international"]="International compensation comparison, European and American flags with financial charts, world map, premium business style, no people, no Asian faces"
PROMPTS["lettre-motivation-dirigeant-morte"]="Old cover letter replaced by modern executive pitch deck, transformation concept, European office desk, editorial, no people, no Asian faces"
PROMPTS["emotional-intelligence-comex"]="Caucasian male executive connecting with team emotionally, European boardroom, warm empathetic tones, brain and heart concept, no Asian faces"
PROMPTS["exit-strategy-dirigeant-fondateur"]="European male executive walking away from corporate building into sunset, new chapter, golden hour, no Asian faces"
PROMPTS["ma-fusion-acquisition-dirigeant"]="Corporate merger concept, two European company buildings, puzzle pieces, business editorial, no people, no Asian faces"
PROMPTS["culture-entreprise-transformation"]="European diverse team collaborating, organizational culture growth, Caucasian and Latino professionals, green tones, no Asian faces"
PROMPTS["preparation-retirement-dirigeant"]="Caucasian male executive looking at horizon, retirement planning, peaceful golden tones, European countryside, no Asian faces"
PROMPTS["entretien-annuel-evaluation-dg"]="European male executive presenting results to board, Caucasian board members, charts and graphs, professional setting, no Asian faces"
PROMPTS["burnout-dirigeant-signes-solutions"]="Caucasian male executive sitting alone in dark European office, exhaustion, dramatic shadows, editorial photography, no Asian faces"
PROMPTS["remuneration-variable-dirigeant"]="Executive compensation structure, financial charts, golden coins, growth graph, dark green premium tones, no people, no Asian faces"

# Régénérer toutes les images
count=0
total=${#PROMPTS[@]}

for slug in "${!PROMPTS[@]}"; do
  count=$((count + 1))
  echo "[$count/$total] Régénération: $slug"
  rm -f "$BLOG_DIR/${slug}.png"
  z-ai image -p "${PROMPTS[$slug]}" -o "$BLOG_DIR/${slug}.png" -s 1344x768 2>&1 | tail -1
done

echo ""
echo "=== Terminé : $total images régénérées ==="
ls "$BLOG_DIR/" | wc -l
echo "images au total"
