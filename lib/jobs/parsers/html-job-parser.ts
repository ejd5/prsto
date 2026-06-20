import type { ImportedJob } from "../types";

export function parseHtmlJobPage(html: string, sourceUrl?: string): ImportedJob | null {
  const clean = html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const titleMatch = clean.match(/(?:job|poste|titre|title)[:\s]*([^\n]{5,80})/i);
  const companyMatch = clean.match(/(?:entreprise|company|société)[:\s]*([^\n]{5,60})/i);
  const locationMatch = clean.match(/(?:localisation|location|lieu|ville)[:\s]*([^\n]{5,60})/i);
  const salaryMatch = clean.match(/([€$]\s*\d{2,6}[\s,-]*\d{0,6}\s*[€$]?)/);
  const contractMatch = clean.match(/\b(CDI|CDD|Freelance|Stage|Alternance|Intérim)\b/i);

  // Extraction du titre depuis le <title>
  const titleTag = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  let title = titleTag?.[1]?.replace(/ - .*/, "").replace(/.*\||.*:|\s*\|.*/, "").trim() || "";
  if (!title && titleMatch) title = titleMatch[1].trim().slice(0, 100);
  if (!title || title.length < 5) return null;

  return {
    source: "html",
    sourceUrl: sourceUrl || "",
    title,
    company: companyMatch?.[1]?.trim().slice(0, 80) || undefined,
    location: locationMatch?.[1]?.trim().slice(0, 80) || undefined,
    salaryMin: salaryMatch ? parseInt(salaryMatch[1].replace(/[^0-9]/g, "")) : undefined,
    salaryMax: salaryMatch ? parseInt(salaryMatch[1].split("-")[1]?.replace(/[^0-9]/g, "") || "") : undefined,
    contractType: contractMatch?.[1] || undefined,
    description: clean.slice(0, 3000),
  };
}

export function extractJobCards(html: string): string[] {
  // Extrait les blocs HTML qui contiennent probablement des offres
  const cards: string[] = [];
  const patterns = [
    /<div[^>]*class="[^"]*(?:job|offer|card|posting|result)[^"]*"[^>]*>[\s\S]{100,3000}?<\/div>/gi,
    /<article[^>]*>[\s\S]{200,4000}?<\/article>/gi,
    /<li[^>]*class="[^"]*(?:job|offer)[^"]*"[^>]*>[\s\S]{100,2000}?<\/li>/gi,
  ];

  for (const pattern of patterns) {
    let m: RegExpExecArray | null;
    while ((m = pattern.exec(html)) !== null) {
      cards.push(m[0]);
    }
  }

  return cards;
}
