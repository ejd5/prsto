const FORBIDDEN = /[\/\\:*?"<>|]/g;
const MAX_PART = 80;

function stripAccents(s: string): string {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "");
}

export function sanitizeFilenamePart(value: string): string {
  return stripAccents(value)
    .replace(FORBIDDEN, "")
    .replace(/\s+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "")
    .slice(0, MAX_PART)
    .replace(/_+$/g, "") || "Inconnu";
}

export function buildApplicationDocumentFilename(
  firstName: string,
  lastName: string,
  company: string,
  title: string,
  docType: "CV" | "Lettre",
): string {
  const parts = [
    "PRSTO",
    sanitizeFilenamePart(lastName),
    sanitizeFilenamePart(firstName),
    sanitizeFilenamePart(company || "Entreprise"),
    sanitizeFilenamePart(title || "Poste"),
    docType,
  ];
  return parts.join("_") + ".pdf";
}

export function buildApplicationZipFilename(
  firstName: string,
  lastName: string,
  company: string,
  title: string,
): string {
  const parts = [
    "PRSTO",
    sanitizeFilenamePart(lastName),
    sanitizeFilenamePart(firstName),
    sanitizeFilenamePart(company || "Entreprise"),
    sanitizeFilenamePart(title || "Poste"),
    "Pack",
  ];
  return parts.join("_") + ".zip";
}
