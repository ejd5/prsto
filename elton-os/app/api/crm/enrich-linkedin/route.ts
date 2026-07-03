import { NextResponse } from "next/server";

// Dynamic mockup database of recruiters tailored to Elton's target sectors (Tech, SaaS, Luxury, Consulting)
const RECRUITER_TEMPLATES = [
  {
    fullName: "Sandra Berthier",
    firstName: "Sandra",
    lastName: "Berthier",
    roleTitle: "Partner — Executive Search SaaS & Tech",
    companyName: "SaasTalents",
    firmName: "SaasTalents Executive",
    email: "sandra.berthier@saastalents.com",
    phone: "+33 6 12 84 92 01",
    location: "Paris, Île-de-France",
    contactType: "headhunter",
    notes: "[AI Spott Enrichment] Sandra est Partner chez SaasTalents, spécialisée dans le recrutement de directeurs commerciaux et VP Sales en Europe. Profil idéal pour les opportunités SaaS C-Level.",
    tagsJson: JSON.stringify(["SaaS", "VP Sales", "Executive Search", "Paris"]),
    relationshipStrength: "new"
  },
  {
    fullName: "Marc-Antoine de Villeneuve",
    firstName: "Marc-Antoine",
    lastName: "de Villeneuve",
    roleTitle: "Managing Director - Executive Recruiting",
    companyName: "Korn Ferry",
    firmName: "Korn Ferry France",
    email: "ma.villeneuve@kornferry.com",
    phone: "+33 6 82 44 93 10",
    location: "Paris / Marseille",
    contactType: "headhunter",
    notes: "[AI Spott Enrichment] Executive Search specialist chez Korn Ferry. Focus sur la mobilité nationale et les directeurs de filiales. Connexions fortes avec le CAC 40.",
    tagsJson: JSON.stringify(["Executive", "CAC 40", "Paris", "Marseille"]),
    relationshipStrength: "new"
  },
  {
    fullName: "Julie Castelli",
    firstName: "Julie",
    lastName: "Castelli",
    roleTitle: "Talent Acquisition Manager Europe",
    companyName: "PayNext",
    firmName: undefined,
    email: "j.castelli@paynext.io",
    phone: "+33 7 45 92 11 88",
    location: "Aix-en-Provence, PACA",
    contactType: "hiring_manager",
    notes: "[AI Spott Enrichment] Julie gère les recrutements stratégiques pour PayNext (Fintech). Intérêt pour les profils ayant une forte expérience en transformation commerciale.",
    tagsJson: JSON.stringify(["Fintech", "Scaleup", "PACA"]),
    relationshipStrength: "new"
  },
  {
    fullName: "Thomas Roche",
    firstName: "Thomas",
    lastName: "Roche",
    roleTitle: "VP Human Resources",
    companyName: "Maison Héritage",
    firmName: undefined,
    email: "t.roche@maison-heritage.fr",
    phone: "+33 6 55 90 23 14",
    location: "Marseille, PACA",
    contactType: "hr",
    notes: "[AI Spott Enrichment] VP HR de Maison Héritage. Très axé sur le développement à l'international et la structuration des équipes de vente.",
    tagsJson: JSON.stringify(["Luxury", "Marseille", "HR"]),
    relationshipStrength: "new"
  }
];

export async function POST(request: Request) {
  try {
    const { linkedinUrl } = await request.json();
    if (!linkedinUrl) {
      return NextResponse.json({ error: "URL LinkedIn requise" }, { status: 400 });
    }

    // Simulate network delay / AI processing
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Choose a template based on the URL hash or length to make it deterministic but diverse
    const hash = linkedinUrl.split("").reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0);
    const template = RECRUITER_TEMPLATES[hash % RECRUITER_TEMPLATES.length];

    // Return the enriched contact data
    return NextResponse.json({
      success: true,
      contact: {
        ...template,
        linkedinUrl
      }
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Erreur interne" }, { status: 500 });
  }
}
