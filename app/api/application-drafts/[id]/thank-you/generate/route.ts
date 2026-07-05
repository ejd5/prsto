import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateWithDeepSeek } from "@/lib/ai/deepseek";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  try {
    const draft = await prisma.applicationDraft.findUnique({
      where: { id },
      include: { job: true },
    });
    if (!draft || !draft.job) return NextResponse.json({ success: false, error: "Dossier introuvable" }, { status: 404 });

    const profile = await prisma.profile.findFirst();
    const candidateName = profile?.fullName || "Candidat";
    const job = draft.job;

    const prompt = `Tu es un expert en recrutement de cadres dirigeants. Tu aides un candidat à rédiger un email de remerciement après un entretien.

Contexte :
- Poste : ${job.title}
- Entreprise : ${job.company || "N/A"}
- Localisation : ${job.location || "N/A"}
- Candidat : ${candidateName}

Génère un email de remerciement professionnel en français, à envoyer après un entretien.

RÈGLES :
- Ton humble, classique, professionnel — pas de flatterie excessive
- 1 paragraphe (4-6 phrases max)
- Remercie pour le temps accordé
- Rappelle 1-2 points forts du candidat EN RAPPORT avec le poste (compétences clés, expérience sectorielle, réalisations)
- Exprime l'intérêt pour le poste sans insister
- Propose de répondre à toute question complémentaire
- N'invente RIEN sur le candidat — reste général si pas d'info spécifique
- Format : retourne UNIQUEMENT le texte de l'email, prêt à copier-coller
- Signature : ${candidateName}
- Pas de sujet d'email
- Pas d'objet
- Commence directement par la formule de politesse`;
    let email = "";

    const result = await generateWithDeepSeek({
      systemPrompt: "Tu es un assistant de rédaction d'emails professionnels pour cadres dirigeants. Retourne UNIQUEMENT le texte de l'email, sans sujet ni objet.",
      userPrompt: prompt,
      temperature: 0.5,
      maxTokens: 1500,
    });

    if (result.success && result.content) {
      email = result.content.trim();
    }

    // Fallback local
    if (!email) {
      const entreprise = job.company || "votre entreprise";
      email = `Bonjour,

Je tenais à vous remercier pour le temps que vous m'avez accordé lors de notre entretien pour le poste de ${job.title} au sein de ${entreprise}. J'ai beaucoup apprécié nos échanges et la vision que vous m'avez partagée sur les enjeux du poste.

Je reste très intéressé par cette opportunité et je suis convaincu que mon parcours et mes compétences pourraient apporter une contribution significative à votre équipe.

Je me tiens à votre disposition pour toute information complémentaire.

Dans l'attente de votre retour, je vous adresse mes sincères salutations.

${candidateName}`;
    }

    return NextResponse.json({ success: true, email });
  } catch (e: unknown) {
    const err = e as Error;
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
