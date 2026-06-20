export interface ExtractedExperience {
  id: string;
  company: string | null;
  title: string | null;
  startDate: string | null;
  endDate: string | null;
  location: string | null;
  country: string | null;
  sector: string | null;
  description: string;
  achievements: string[];
  tools: string[];
  teamSize: string | null;
  revenue: string | null;
  budget: string | null;
  confidenceScore: number;
  warnings: string[];
  sourceText: string;
}

let counter = 0;
function nextId(): string {
  return `extracted-${++counter}`;
}
export function resetIdCounter() {
  counter = 0;
}

const SECTION_HEADERS =
  /(?:^|\n)(?:RÉSUMÉ\s*EXÉCUTIF|EXPÉRIENCES?\s*(?:PROFESSIONNELLES?|ANTÉRIEURES?|CLÉS?|PASSÉES?)|PARCOURS|CARRIÈRE|FORMATION|CERTIFICATIONS?|COMPÉTENCES|LANGUES|LANGUE|ÉDUCATION|AUTRES?\s*(?:EXPÉRIENCES|ACTIVITÉS)|PROJETS?\s*(?:CLÉS?|MAJEURS?)|INFORMATIQUE|CENTRES?\s*D'INTÉRÊT|INTÉRÊTS|DIVERS|RÉFÉRENCES|PUBLICATIONS|BREVETS?|PRIX|DISTINCTIONS)/gi;

const MONTH_CHARS = "[A-Za-zéèêëàâùûüôöîïçÉÈÊËÀÂÙÛÜÔÖÎÏÇ]";

const DATE_RANGE_PATTERNS = [
  // "Sept. 2025 - Fév. 2026" or "Jan. 2018 - présent"
  new RegExp(`(${MONTH_CHARS}{3,})\\.?\\s+(\\d{4})\\s*[-–—]\\s*(${MONTH_CHARS}{3,})\\.?\\s+(\\d{4}|présent|present|aujourd'hui?|ce jour|maintenant)`, "i"),
  /(\d{4})\s*[-–—]\s*(\d{4}|présent|present|aujourd'hui?|ce? jour|maintenant)/i,
  /(\d{4})\s*[-–—]\s*/,
  /depuis\s+(\d{4})/i,
  /(\d{1,2})\/(\d{4})\s*[-–—]\s*(\d{1,2}\/\d{4}|présent|present)/i,
  /(\d{1,2})\/(\d{4})\s*[-–—]\s*/,
];

const DATE_PAREN_PATTERN = /\((\d{4}(?:\s*[-–—]\s*(?:\d{4}|présent|present|aujourd'hui?))?)\)/i;
const DATE_YEAR_ALONE = /^(\d{4})$/;

const COMPANY_KNOWN_WORDS =
  /\b(?:SAS|SA|SARL|EURL|SASU|GmbH|Ltd|Inc|LLC|Corp|Group|Partners|Consulting|Solutions|Technologies|Systems|Services|International|Global|Corporate|Associés?|Frères)\b/i;

const TOOL_PATTERNS =
  /\b(?:Salesforce|SAP|Oracle|HubSpot|Power[-\s]?BI|Tableau|Excel|CRM|ERP|AWS|Azure|GCP|Python|R\b|SQL|Tableau|Jira|Confluence|Slack|Teams|Office\s*365|SharePoint|Dynamics|Marketo|Pardot|LinkedIn\s*Sales\s*Navigator)\b/gi;

const REVENUE_PATTERNS =
  /(?:CA|chiffre\s*d'affaires|revenue|revenu|chiffre)\s*(?::|de|d'|)\s*(\d+[.,]?\d*\s*[kK]?[€$£M])|(\d+[.,]?\d*\s*[kKMG]?[€$£])\s*(?:de\s*)?(?:CA|chiffre\s*d'affaires|revenue)/gi;

const TEAM_PATTERNS =
  /(?:équipe|team|effectifs?|collaborateurs?|managers?\s*directs?|report[s]?)\s*(?::|de|d')\s*(\d+)\s*(?:personnes?|collaborateurs?|managers?|membres?|salariés?|employés?)?/gi;

const BUDGET_PATTERNS =
  /\b(?:budget|P&L|P&L|PL|profit\s*(?:and|&)\s*loss)\s*(?::|de|d'|)\s*(\d+[.,]?\d*\s*[kK]?[€$£M])|(\d+[.,]?\d*\s*[kKMG]?[€$£])\s*(?:de\s*)?(?:budget|P&L)/gi;

function normalizeText(text: string): string {
  return text.replace(/\r\n/g, "\n").replace(/\r/g, "\n").trim();
}

function splitIntoSections(text: string): { header: string; body: string }[] {
  const lines = text.split("\n");
  const sections: { header: string; body: string[] }[] = [];
  let current: { header: string; body: string[] } | null = null;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      if (current) current.body.push("");
      continue;
    }
    if (SECTION_HEADERS.test(trimmed)) {
      SECTION_HEADERS.lastIndex = 0;
      if (current) sections.push(current);
      current = { header: trimmed, body: [] };
    } else {
      if (!current) current = { header: "", body: [] };
      current.body.push(trimmed);
    }
  }
  if (current) sections.push(current);

  return sections.map((s) => ({
    header: s.header,
    body: s.body.join("\n"),
  }));
}

function findExperienceSection(text: string): string | null {
  const sections = splitIntoSections(text);
  for (const s of sections) {
    if (/expérience|parcours|carrière|professionnelle/i.test(s.header)) {
      return s.body;
    }
  }
  return null;
}

function splitIntoExperienceBlocks(sectionBody: string): string[] {
  const lines = sectionBody.split("\n");
  const blocks: string[] = [];
  let current: string[] = [];
  let consecutiveEmpty = 0;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      consecutiveEmpty++;
      if (consecutiveEmpty >= 2 && current.length > 0) {
        blocks.push(current.join("\n"));
        current = [];
      }
      continue;
    }
    consecutiveEmpty = 0;

    // A line that looks like a new experience header (has a known company word
    // or date pattern or is short and not a bullet)
    const isBullet = /^[-–—•*]\s+/.test(trimmed);
    const isShort = trimmed.length < 120 && !isBullet;

    if (isShort && current.length > 0 && !isBullet) {
      const hasDate = DATE_RANGE_PATTERNS.some((p) =>
        p.test(trimmed)
      );
      const hasCompanyWord = COMPANY_KNOWN_WORDS.test(trimmed);
      const hasParenDate = DATE_PAREN_PATTERN.test(trimmed);

      if (hasDate || hasCompanyWord || hasParenDate) {
        // Multi-line header: if current has 1 short line without its own
        // company/date, merge instead of split (title + company across lines)
        if (current.length === 1) {
          const cur = current[0];
          const curHasDate = DATE_RANGE_PATTERNS.some((p) => p.test(cur));
          const curHasCompany = COMPANY_KNOWN_WORDS.test(cur);
          if (!curHasDate && !curHasCompany) {
            current.push(trimmed);
            continue;
          }
        }
        blocks.push(current.join("\n"));
        current = [];
      }
    }

    current.push(trimmed);
  }
  if (current.length > 0) blocks.push(current.join("\n"));
  return blocks;
}

export function normalizeDateRange(text: string): { startDate: string | null; endDate: string | null; confidence: number; warnings: string[] } {
  const warnings: string[] = [];

  // Try parenthetical dates first: "Company (2019-2024)"
  const parenMatch = DATE_PAREN_PATTERN.exec(text);
  if (parenMatch) {
    const inner = parenMatch[1];
    const parts = inner.split(/[-–—]/).map((s) => s.trim());
    if (parts.length === 2) {
      const start = normalizeDate(parts[0]);
      const end = parts[1].match(/présent|present|aujourd'hui|ce jour|maintenant/i)
        ? ""
        : normalizeDate(parts[1]);
      if (start) {
        return {
          startDate: start,
          endDate: end || null,
          confidence: end !== null ? 90 : 85,
          warnings: [],
        };
      }
    } else if (parts.length === 1) {
      const start = normalizeDate(parts[0]);
      if (start) {
        return { startDate: start, endDate: null, confidence: 70, warnings: ["Année seule trouvée, mois inconnu"] };
      }
    }
  }

  // Try inline date ranges
  for (const pattern of DATE_RANGE_PATTERNS) {
    const m = pattern.exec(text);
    if (m) {
      // Check if we have a month-year pattern
      if (m[3] && m[4]) {
        // "Jan 2020 - Juin 2024" or "01/2020 - 06/2024"
        const start = normalizeDate(m[1] && m[2] ? `${m[1]} ${m[2]}` : m[0]);
        const endRaw = m[3] && m[4] ? `${m[3]} ${m[4]}` : m[0];
        const end = /présent|present|aujourd'hui|ce jour|maintenant/i.test(endRaw)
          ? ""
          : normalizeDate(endRaw);
        if (start || end) {
          return {
            startDate: start || null,
            endDate: end || null,
            confidence: 85,
            warnings: [],
          };
        }
      }
      // Full range: "2019 - 2024" or "2019 - présent"
      if (m[1] && m[2]) {
        const start = normalizeDate(m[1]);
        const endRaw = m[2];
        const end = /présent|present|aujourd'hui|ce jour|maintenant/i.test(endRaw)
          ? ""
          : normalizeDate(endRaw);
        if (start) {
          warnings.push(end === null ? "Date de fin non standard" : "");
          return {
            startDate: start,
            endDate: end || null,
            confidence: end !== null ? 90 : 80,
            warnings: warnings.filter(Boolean),
          };
        }
      }
      // Open range: "Depuis 2021"
      if (m[1] && !m[2]) {
        const start = normalizeDate(m[1]);
        if (start) {
          return { startDate: start, endDate: null, confidence: 70, warnings: ["Date de début seule"] };
        }
      }
    }
  }

  return { startDate: null, endDate: null, confidence: 0, warnings: ["Aucune date détectée"] };
}

function normalizeDate(raw: string): string | null {
  raw = raw.trim();

  // Just a year: "2019" → "2019-01"
  if (DATE_YEAR_ALONE.test(raw)) {
    return `${raw}-01`;
  }

  // French month + year: "Janvier 2020" → "2020-01"
  const monthMap: Record<string, string> = {
    janvier: "01", janv: "01", fév: "02", février: "02", mars: "03", avril: "04", avr: "04",
    mai: "05", juin: "06", juillet: "07", juil: "07", août: "08", aout: "08",
    septembre: "09", sept: "09", octobre: "10", novembre: "11", décembre: "12", déc: "12",
    jan: "01", feb: "02", mar: "03", apr: "04", may: "05", jun: "06",
    jul: "07", aug: "08", sep: "09", oct: "10", nov: "11", dec: "12",
  };
  const monthYearMatch = raw.match(/^([A-Za-zéèêëàâùûüôöîïçÉÈÊËÀÂÙÛÜÔÖÎÏÇ]+)\s+(\d{4})$/i);
  if (monthYearMatch) {
    const rawMonth = monthYearMatch[1].toLowerCase();
    const month = monthMap[rawMonth] || monthMap[rawMonth.slice(0, 3)];
    if (month) return `${monthYearMatch[2]}-${month}`;
  }

  // "01/2020" → "2020-01"
  const slashMatch = raw.match(/^(\d{1,2})\/(\d{4})$/);
  if (slashMatch) {
    return `${slashMatch[2]}-${slashMatch[1].padStart(2, "0")}`;
  }

  // "2020-01" already normalized
  if (/^\d{4}-\d{2}$/.test(raw)) return raw;

  return null;
}

export function detectCompanyAndTitle(headerLine: string): { company: string | null; title: string | null; warnings: string[] } {
  const warnings: string[] = [];
  let company: string | null = null;
  let title: string | null = null;

  // Remove date parentheses for cleaner parsing
  let clean = headerLine.replace(DATE_PAREN_PATTERN, "").trim();
  // Also clean any trailing date-like patterns
  clean = clean.replace(/[-–—]\s*(?:depuis\s+)?\d{4}.*$/i, "").trim();

  // Pattern 1: "Title — Company" (em-dash / en-dash only, not regular hyphen)
  const emDashMatch = clean.match(/^(.+?)\s*[–—]\s*(.+)$/);
  if (emDashMatch) {
    title = emDashMatch[1].trim();
    company = emDashMatch[2].trim();
    if (!title || !company) warnings.push("Titre ou entreprise vides");
    return { company, title, warnings };
  }

  // Pattern 2: "Title | Company" or "Company | Notes" (pipe)
  const pipeMatch = clean.match(/^(.+?)\s*\|\s*(.+)$/);
  if (pipeMatch) {
    const left = pipeMatch[1].trim();
    const right = pipeMatch[2].trim();
    // Heuristic: if left looks like a company (known entity words) or right
    // looks like a job type (CDI, management de transition, etc.), swap
    const rightIsRole = /CDI|CDD|Freelance|Management|Contract|Contractuel|Indépendant|consulting|Stage|Alternance|Interim/i.test(right);
    if (COMPANY_KNOWN_WORDS.test(left) || rightIsRole) {
      company = left;
      title = right;
    } else {
      title = left;
      company = right;
    }
    return { company, title, warnings };
  }

  // Pattern 3: "Company - Title" (dash, many companies have known entity words)
  const dashMatch = clean.match(/^(.+?)\s*[-–]\s*(.+)$/);
  if (dashMatch) {
    const left = dashMatch[1].trim();
    const right = dashMatch[2].trim();
    // If left has known company words, it's likely "Company - Title"
    if (COMPANY_KNOWN_WORDS.test(left)) {
      company = left;
      title = right;
    } else {
      // Heuristic: if left contains "directeur|manager|head|vp|president|lead|chef|responsable"
      // it's likely "Title - Company" or "Title - Location"
      if (/directeur|manager|head\s*of|vp\s*|president|lead|chef|responsable|chargé|consultant|ingénieur/i.test(left)) {
        title = left;
        company = right;
      } else {
        // "Company - Title" default assumption
        company = left;
        title = right;
      }
    }
    return { company, title, warnings };
  }

  // Pattern 4: "Title, Company" (comma)
  const commaMatch = clean.match(/^(.+?),\s*(.+)$/);
  if (commaMatch) {
    title = commaMatch[1].trim();
    company = commaMatch[2].trim();
    return { company, title, warnings };
  }

  // Fallback: try to find company-like words or treat whole line as title
  if (COMPANY_KNOWN_WORDS.test(clean)) {
    company = clean;
    warnings.push("Titre non détecté");
  } else {
    title = clean;
    warnings.push("Entreprise non détectée");
  }

  return { company, title, warnings };
}

export function detectAchievements(block: string): string[] {
  const achievements: string[] = [];
  const lines = block.split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    // Lines starting with bullet points or dashes
    if (/^[-–—•*]\s+/.test(trimmed)) {
      achievements.push(trimmed.replace(/^[-–—•*]\s+/, "").trim());
    }
    // Short lines that look like quantified achievements (no bullet but starts with number or contains %/€/$)
    // These could be continuation lines
  }
  return achievements;
}

export function detectTools(text: string): string[] {
  const tools: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = TOOL_PATTERNS.exec(text)) !== null) {
    if (!tools.includes(m[0])) tools.push(m[0]);
  }
  return tools;
}

export function detectCountryOrLocation(block: string): { location: string | null; country: string | null } {
  const countryMapping: Record<string, string> = {
    france: "FR", suisse: "CH", belgique: "BE", luxembourg: "LU",
    allemagne: "DE", autriche: "AT", espagne: "ES", italie: "IT",
    portugal: "PT", paysbas: "NL", "pays-bas": "NL", royaumeuni: "GB",
    "royaume-uni": "GB", angleterre: "GB", UK: "GB", US: "US",
    "états-unis": "US", "États-Unis": "US", canada: "CA",
    singapour: "SG", hongkong: "HK", "hong kong": "HK", chine: "CN",
    japon: "JP", australie: "AU", brésil: "BR", inde: "IN",
    maroc: "MA", tunisie: "TN", algérie: "DZ", sénégal: "SN",
    "côte d'ivoire": "CI", "cote d'ivoire": "CI",
  };
  const matched = Object.entries(countryMapping).find(
    ([name]) => new RegExp(`\\b${name.replace(/[-\s]/g, "[\\s-]")}\\b`, "i").test(block)
  );
  if (matched) {
    return { location: matched[0], country: matched[1] };
  }
  return { location: null, country: null };
}

export function scoreExperienceConfidence(exp: ExtractedExperience): { score: number; warnings: string[] } {
  const warnings: string[] = [];
  let score = 0;

  if (exp.company) score += 25;
  else warnings.push("Entreprise non détectée");

  if (exp.title) score += 25;
  else warnings.push("Titre non détecté");

  if (exp.startDate) score += 15;
  else warnings.push("Date de début non détectée");

  if (exp.endDate !== undefined) score += 5; // presence of range info

  if (exp.achievements.length > 0) score += 15;
  else warnings.push("Aucune réalisation détectée");

  if (exp.description.length > 50) score += 10;
  if (exp.tools.length > 0) score += 5;

  return { score, warnings };
}

function extractValues(text: string, patterns: RegExp[]): string[] {
  const results: string[] = [];
  for (const pattern of patterns) {
    let m: RegExpExecArray | null;
    while ((m = pattern.exec(text)) !== null) {
      const val = m[1] || m[2] || m[0];
      if (!results.includes(val)) results.push(val);
    }
  }
  return results;
}

export function extractExperiencesFromResumeText(resumeText: string): ExtractedExperience[] {
  const text = normalizeText(resumeText);
  const sectionBody = findExperienceSection(text);
  if (!sectionBody) return [];

  const rawBlocks = splitIntoExperienceBlocks(sectionBody);
  const experiences: ExtractedExperience[] = [];

  for (const block of rawBlocks) {
    const lines = block.split("\n");
    const headerLine = lines[0] || "";

    // Detect company, title, dates from header
    const detected = detectCompanyAndTitle(headerLine);
    let { company, title } = detected;
    const { warnings: headerWarnings } = detected;
    let dateResult = normalizeDateRange(headerLine);

    // Multi-line header: if no company/date on line 0, try next non-bullet line
    if (!company && lines.length > 1 && !/^[-–—•*]\s+/.test(lines[1])) {
      const line1Info = detectCompanyAndTitle(lines[1]);
      if (line1Info.company) {
        company = line1Info.company;
        if (!title) title = line1Info.title;
      }
      if (!dateResult.startDate) {
        dateResult = normalizeDateRange(lines[1]);
      }
    }
    const achievements = detectAchievements(block);
    const tools = detectTools(block);
    const { location, country } = detectCountryOrLocation(block);
    const revenueMatches = extractValues(block, [REVENUE_PATTERNS]);
    const teamMatches = extractValues(block, [TEAM_PATTERNS]);
    const budgetMatches = extractValues(block, [BUDGET_PATTERNS]);

    const description = achievements.length > 0
      ? achievements.join("\n")
      : block.split("\n").slice(1).join("\n").trim();

    const exp: ExtractedExperience = {
      id: nextId(),
      company,
      title,
      startDate: dateResult.startDate,
      endDate: dateResult.endDate,
      location,
      country,
      sector: null,
      description,
      achievements,
      tools,
      teamSize: teamMatches[0] || null,
      revenue: revenueMatches[0] || null,
      budget: budgetMatches[0] || null,
      confidenceScore: 50, // will be recalculated
      warnings: [...headerWarnings, ...dateResult.warnings],
      sourceText: block.slice(0, 500),
    };

    const { score, warnings } = scoreExperienceConfidence(exp);
    exp.confidenceScore = score;
    exp.warnings = Array.from(new Set([...exp.warnings, ...warnings]));

    // Only include if at least company or title detected
    if (exp.company || exp.title) {
      experiences.push(exp);
    }
  }

  return experiences;
}

export function detectDuplicateExperience(
  candidate: ExtractedExperience,
  existing: { company: string; title: string; startDate: string; endDate: string }[]
): { isDuplicate: boolean; confidence: number; matchedIndex: number } {
  for (let i = 0; i < existing.length; i++) {
    const ex = existing[i];
    if (!candidate.company || !candidate.title) continue;

    const sameCompany = ex.company.toLowerCase().trim() === candidate.company.toLowerCase().trim();
    const sameTitle = ex.title.toLowerCase().trim() === candidate.title.toLowerCase().trim();
    const sameStartDate = !!candidate.startDate && ex.startDate === candidate.startDate;
    const sameEndDate = !!candidate.endDate && ex.endDate === candidate.endDate;

    if (sameCompany && sameTitle && sameStartDate && sameEndDate) {
      return { isDuplicate: true, confidence: 95, matchedIndex: i };
    }
    if (sameCompany && sameTitle && sameStartDate) {
      return { isDuplicate: true, confidence: 80, matchedIndex: i };
    }
    if (sameCompany && sameTitle) {
      return { isDuplicate: true, confidence: 60, matchedIndex: i };
    }
  }
  return { isDuplicate: false, confidence: 0, matchedIndex: -1 };
}
