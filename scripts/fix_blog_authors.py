#!/usr/bin/env python3
"""Corrige les auteurs des articles existants et enleève les traits d'union excessifs."""
import re

# ─── Nouveaux auteurs internationaux (prénom only, pas de PRSTO) ───
NEW_AUTHORS = {
    "david": {
        "name": "Alejandro",
        "role": "Board Advisor & Executive Coach",
        "avatar": "/branding/portraits/boardmanager-david/david-01.png",
        "bio": "Ancien DG d'un groupe industriel de 2000 personnes, il a siégé à 15 conseils d'administration. Il accompagne les dirigeants dans leurs transitions C level et leurs stratégies de Comex.",
    },
    "catherine": {
        "name": "Méi",
        "role": "Headhunter Senior, ex cabinet top tier",
        "avatar": "/branding/portraits/drh-ingrid/ingrid-01.png",
        "bio": "Pendant 18 ans, elle a mené des missions de chasse pour les plus grands groupes du CAC 40. Elle connaît les coulisses des process de recrutement de dirigeants mieux que personne.",
    },
    "marc": {
        "name": "Rajiv",
        "role": "Ex CFO devenu Executive Coach",
        "avatar": "/branding/portraits/cto-john/john-01.png",
        "bio": "Ancien DAF de deux licornes européennes, il a négocié son propre package à 7 reprises. Il forme les dirigeants à la maîtrise financière et à la négociation de packages C level.",
    },
    "sophie": {
        "name": "Aaliyah",
        "role": "VP HR, ex grand groupe international",
        "avatar": "/branding/portraits/dirmarketing-sabrina/sabrina-01.png",
        "bio": "DRH de division dans deux multinationales pendant 12 ans, elle a recruté et accompagné plus de 80 cadres dirigeants. Elle partage ses insights sur l'évaluation des talents C level.",
    },
    # Auteurs originaux (aussi corrigés : prénom only, pas PRSTO)
    "paul": {
        "name": "Thiago",
        "role": "Fondateur & Executive Coach",
        "avatar": "/branding/portraits/ceo-paul/paul-01.png",
        "bio": "Ancien DRH d'un groupe du CAC 40 et chasseur de têtes pendant 15 ans, il a accompagné plus de 200 cadres dirigeants dans leur recherche d'emploi.",
    },
    "sabrina": {
        "name": "Yuki",
        "role": "Consultante Personal Branding",
        "avatar": "/branding/portraits/dirmarketing-sabrina/sabrina-01.png",
        "bio": "Spécialiste du personal branding pour cadres dirigeants, elle a piloté la stratégie de marque de 40+ dirigeants du CAC 40 et licornes.",
    },
    "john": {
        "name": "Kwame",
        "role": "Data Scientist & Strategy Advisor",
        "avatar": "/branding/portraits/cto-john/john-01.png",
        "bio": "Ancien lead data scientist chez une licorne européenne, il a conçu des algorithmes de scoring qui analysent 50 000+ offres cadre par mois.",
    },
    "ingrid": {
        "name": "Priya",
        "role": "Conseil en organisation & RH",
        "avatar": "/branding/portraits/drh-ingrid/ingrid-01.png",
        "bio": "DRH pendant 12 ans dans des groupes internationaux, elle a négocié plus de 300 packages de direction. Elle connaît chaque rouage de la négociation salariale.",
    },
}

# ─── Corrections de traits d'union excessifs ───
HYPHEN_FIXES = [
    # Patterns à remplacer (ancienn → nouveau)
    ("100-jours", "100 jours"),
    ("C-level", "C level"),
    ("top-tier", "top tier"),
    ("mid-tier", "mid tier"),
    ("bolt-on", "bolt on"),
    ("co-investissement", "co investissement"),
    ("tag-along", "tag along"),
    ("change-of-control", "change of control"),
    ("cash-flow", "cash flow"),
    ("best-case", "best case"),
    ("post-acquisition", "post acquisition"),
    ("build-up", "build up"),
    ("pre-read", "pre read"),
    ("non-linéaire", "non linéaire"),
    ("day value", "day value"),
    ("C-level", "C level"),
    ("co investissement", "co investissement"),
    ("bad leaver", "bad leaver"),  # garde tel quel (terme juridique)
    ("good leaver", "good leaver"),  # garde tel quel
]

def fix_hyphens(text):
    """Remplace les traits d'union excessifs qui font 'ChatGPT style'."""
    for old, new in HYPHEN_FIXES:
        text = text.replace(old, new)
    return text

# Lecture du fichier new-articles.ts
with open("/home/z/my-project/elton-os/lib/blog/new-articles.ts", "r") as f:
    content = f.read()

# 1. Remplacer les auteurs
for key, author in NEW_AUTHORS.items():
    # Remplacer le nom
    old_name = None
    if key == "david":
        old_name = "David Marchand"
    elif key == "catherine":
        old_name = "Catherine Lefort"
    elif key == "marc":
        old_name = "Marc Vidal"
    elif key == "sophie":
        old_name = "Sophie Nguyen"
    
    if old_name:
        content = content.replace(f'name: "{old_name}"', f'name: "{author["name"]}"')
        content = content.replace(f'role: "{author["role"]}"', f'role: "{author["role"]}"')
        content = content.replace(f'bio: "{author["bio"]}"', f'bio: "{author["bio"]}"')

# 2. Remplacer les citations d'auteurs dans pullQuote
for key, author in NEW_AUTHORS.items():
    old_names = {
        "david": "David Marchand",
        "catherine": "Catherine Lefort",
        "marc": "Marc Vidal",
        "sophie": "Sophie Nguyen",
    }
    old = old_names.get(key)
    if old:
        content = content.replace(f'author: "{old}"', f'author: "{author["name"]}"')

# 3. Corriger les auteurs originaux dans data.ts aussi
with open("/home/z/my-project/elton-os/lib/blog/data.ts", "r") as f:
    data_content = f.read()

for key, author in NEW_AUTHORS.items():
    old_names = {
        "paul": "Paul Elton",
        "sabrina": "Sabrina Moreau",
        "john": "John Devaux",
        "ingrid": "Ingrid Vasseur",
    }
    old = old_names.get(key)
    if old:
        data_content = data_content.replace(f'name: "{old}"', f'name: "{author["name"]}"')
    
    # Enlever "PRSTO" des roles
    data_content = data_content.replace(", PRSTO", "")
    data_content = data_content.replace(" PRSTO", "")
    data_content = data_content.replace("PRSTO", "")

# Enlever "Fondateur & CEO, " qui référençait PRSTO
data_content = data_content.replace("Fondateur & CEO, ", "Fondateur & ")
data_content = data_content.replace("Directrice Marketing & Branding, ", "Consultante ")
data_content = data_content.replace("CTO & Data Scientist, ", "")
data_content = data_content.replace("DRH & Conseil en organisation, ", "")

# 4. Appliquer les fixes de traits d'union sur les deux fichiers
content = fix_hyphens(content)
data_content = fix_hyphens(data_content)

with open("/home/z/my-project/elton-os/lib/blog/new-articles.ts", "w") as f:
    f.write(content)
print("✅ new-articles.ts corrigé")

with open("/home/z/my-project/elton-os/lib/blog/data.ts", "w") as f:
    f.write(data_content)
print("✅ data.ts corrigé")

# Vérifier
print("\n=== Auteurs dans new-articles.ts ===")
import re
names = re.findall(r'name: "([^"]+)"', content)
for n in names:
    print(f"  - {n}")

print("\n=== Auteurs dans data.ts ===")
names2 = re.findall(r'name: "([^"]+)"', data_content)
for n in names2:
    print(f"  - {n}")
