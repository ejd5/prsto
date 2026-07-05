import type { ImportedJob } from "../types";

export function parseJsonLdJobPosting(html: string, sourceName?: string): ImportedJob[] {
  const results: ImportedJob[] = [];
  const regex = /<script\s+type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi;
  let m: RegExpExecArray | null;

  while ((m = regex.exec(html)) !== null) {
    try {
      const parsed = JSON.parse(m[1].trim());
      const items = Array.isArray(parsed) ? parsed : [parsed];

      for (const item of items) {
        if (item["@type"] !== "JobPosting") continue;

        const hiringOrg = item.hiringOrganization as Record<string, unknown> || {};
        const loc = (item.jobLocation as Record<string, unknown>) || {};
        const addr = (loc.address as Record<string, unknown>) || {};
        const salary = (item.baseSalary as Record<string, unknown>) || {};
        const salaryVal = (salary.value as Record<string, unknown>) || {};
        const employmentType = item.employmentType as string || "";
        const title = (item.title as string) || "";
        const company = (hiringOrg.name as string) || "";
        if (!title || title.length < 5) continue;

        results.push({
          source: sourceName || "jsonld",
          sourceUrl: (item.url as string) || "",
          externalId: `jsonld::${(item.url as string) || title + company}`,
          title,
          company: company || undefined,
          location: (addr.addressLocality as string) || (loc.addressLocality as string) || undefined,
          contractType: /FULL_TIME|CDI|PERMANENT/i.test(employmentType) ? "CDI" :
            /CONTRACTOR|CDD/i.test(employmentType) ? "CDD" : employmentType || undefined,
          remotePolicy: /REMOTE|TELECOMMUTE/i.test(employmentType) ? "remote" : undefined,
          salaryMin: salaryVal.minValue as number || undefined,
          salaryMax: salaryVal.maxValue as number || undefined,
          currency: (salary.currency as string) || "EUR",
          description: ((item.description as string) || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 3000),
          publishedAt: (item.datePosted as string) || undefined,
          canonicalUrl: (item.url as string) || undefined,
        });
      }
    } catch { /* ignore malformed JSON */ }
  }

  return results;
}
