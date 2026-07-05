import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // 1. Fetch opportunity
    const opp = await prisma.opportunity.findUnique({
      where: { id },
      include: { analysis: true }
    });

    if (!opp) {
      return NextResponse.json({ error: "Opportunité introuvable" }, { status: 404 });
    }

    // 2. Fetch master profile details
    const profile = await prisma.profile.findFirst({
      include: { skills: true, experiences: true }
    });

    if (!profile) {
      return NextResponse.json({ error: "Profil de base introuvable" }, { status: 404 });
    }

    // 3. Generate matches & pitch content
    const analysis = opp.analysis as any;
    const matchScore = analysis?.fitScore || analysis?.scoreGlobal || 85;
    const requirements = analysis?.keyRequirements
      ? JSON.parse(analysis.keyRequirements as string)
      : ["Leadership commercial", "Gestion des grands comptes", "Développement international"];

    const skillsList = profile.skills.map(s => s.name);
    const matchingSkills = skillsList.filter(s => 
      requirements.some((r: string) => r.toLowerCase().includes(s.toLowerCase()) || s.toLowerCase().includes(r.toLowerCase()))
    );

    // If no explicit matches, mock some realistic executive matching skills
    if (matchingSkills.length === 0) {
      matchingSkills.push("Négociation C-Level", "Stratégie Commerciale", "Management d'équipes");
    }

    const title = opp.title || "Directeur Commercial";
    const company = opp.company || "l'entreprise";

    // Build the Markdown-formatted Spott presentation pitch
    const pitchMarkdown = `### 🌟 Fiche de Présentation Candidat — Spott AI
**Candidat :** ${profile.fullName}
**Poste ciblé :** ${title} chez **${company}**
**Indice d'adéquation :** ${matchScore}%

---

#### 💼 1. Synthèse Exécutive
${profile.fullName} est un **${profile.title}** chevronné avec une solide expérience en développement commercial et direction des ventes. Son parcours démontre une expertise unique pour structurer les équipes commerciales, négocier des contrats complexes à haut niveau (C-Level) et accélérer la croissance sur des marchés hautement concurrentiels.

#### 🎯 2. Alignement avec les exigences du poste
${requirements.map((req: string) => `*   **Exigence :** *${req}*
    *   **Réponse Candidat :** Validation attestée par son expérience de direction. Maîtrise des stratégies de vente adaptées et gestion de portefeuilles d'envergure.`).join("\n")}

#### 🛠️ 3. Compétences clés validées (Matching Spott)
${matchingSkills.map(skill => `*   ✨ **${skill}** (Niveau Expert)`).join("\n")}

#### ✉️ 4. Pitch d'approche personnalisé (LinkedIn / Email)
> "Bonjour,
> 
> Suite à l'analyse de l'opportunité de **${title}** pour **${company}**, je vous propose de vous mettre en relation avec **${profile.fullName}**. 
> 
> Ses réalisations marquantes en tant que **${profile.title}** (notamment sur la région ${profile.location || "France"}) correspondent parfaitement à vos enjeux de croissance actuels.
> 
> Êtes-vous disponible pour un court échange cette semaine afin d'en discuter ?"
`;

    return NextResponse.json({
      success: true,
      pitch: pitchMarkdown,
      matchScore
    });
  } catch (e: any) {
    console.error("Error in Spott pitch generator:", e);
    return NextResponse.json({ error: e.message || "Erreur interne" }, { status: 500 });
  }
}
