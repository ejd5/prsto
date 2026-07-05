import { describe, it, expect } from "vitest";
import {
  isExportable,
  getExportBlockedMessage,
  generateExportFilename,
  generateDossierZipName,
  renderTxtExport,
  renderAtsExport,
  renderPrintHtml,
  renderMarkdownExport,
  buildDossierFiles,
} from "@/lib/exports/engine";

describe("isExportable", () => {
  it("APPROVED est exportable", () => {
    expect(isExportable("APPROVED")).toBe(true);
  });

  it("DRAFT n'est pas exportable", () => {
    expect(isExportable("DRAFT")).toBe(false);
  });

  it("NEEDS_REVIEW n'est pas exportable", () => {
    expect(isExportable("NEEDS_REVIEW")).toBe(false);
  });

  it("REJECTED n'est pas exportable", () => {
    expect(isExportable("REJECTED")).toBe(false);
  });
});

describe("getExportBlockedMessage", () => {
  it("APPROVED n'a pas de message de blocage", () => {
    expect(getExportBlockedMessage("APPROVED")).toBe("");
  });

  it("DRAFT retourne un message de blocage", () => {
    expect(getExportBlockedMessage("DRAFT")).toContain("bloqué");
  });

  it("NEEDS_REVIEW mentionne la validation humaine", () => {
    expect(getExportBlockedMessage("NEEDS_REVIEW").toLowerCase()).toContain("validez");
  });

  it("REJECTED mentionne le rejet", () => {
    expect(getExportBlockedMessage("REJECTED").toLowerCase()).toContain("rejeté");
  });
});

describe("generateExportFilename", () => {
  it("génère un nom de fichier standard", () => {
    const name = generateExportFilename("cv_fr", "TechCorp", "Directeur Commercial", "pdf");
    expect(name).toContain("CV_FR");
    expect(name).toContain("TechCorp");
    expect(name).toContain(".pdf");
  });

  it("gère les titres sans entreprise", () => {
    const name = generateExportFilename("lettre_fr", null, "Country Manager", "txt");
    expect(name).toContain("Lettre_FR");
    expect(name).toContain("Country_Manager");
    expect(name).toContain(".txt");
  });

  it("n'inclut pas l'entreprise si vide", () => {
    const name = generateExportFilename("cv_en", "", "", "pdf");
    expect(name).toContain("CV_EN");
    expect(name).toContain(".pdf");
    // Should not have dangling underscores before date
  });

  it("termine par l'extension fournie", () => {
    const formats = ["pdf", "docx", "txt", "md"];
    for (const fmt of formats) {
      const name = generateExportFilename("cv_fr", "Corp", "Title", fmt);
      expect(name.endsWith("." + fmt)).toBe(true);
    }
  });

  it("nettoie les caractères spéciaux du nom de base", () => {
    const name = generateExportFilename("cv_fr", "Tech@Corp!", "Dir./Commercial", "pdf");
    expect(name).not.toContain("@");
    expect(name).not.toContain("!");
    expect(name).not.toContain("/");
    const basePart = name.replace(/\.pdf$/, "");
    expect(basePart).not.toContain(".");
  });
});

describe("generateDossierZipName", () => {
  it("génère un nom de ZIP standardisé", () => {
    const name = generateDossierZipName("TechCorp", "Directeur Commercial France");
    expect(name).toContain("ELTON_OS_Candidature");
    expect(name).toContain("TechCorp");
    expect(name).toContain(".zip");
  });

  it("fonctionne sans entreprise ni titre", () => {
    const name = generateDossierZipName(null, null);
    expect(name).toContain("ELTON_OS_Candidature");
    expect(name).toContain(".zip");
    expect(name).not.toContain("null");
  });
});

describe("renderTxtExport", () => {
  it("ajoute un en-tête ELTON OS", () => {
    const result = renderTxtExport("Contenu du document", "cv_fr");
    expect(result).toContain("ELTON OS");
    expect(result).toContain("Contenu du document");
  });

  it("ajoute watermark BROUILLON si demandé", () => {
    const result = renderTxtExport("Contenu test", "cv_fr", { watermark: true });
    expect(result).toContain("BROUILLON");
    expect(result).toContain("Ne pas envoyer");
  });

  it("n'ajoute pas de watermark par défaut", () => {
    const result = renderTxtExport("Contenu test", "cv_fr");
    expect(result).not.toContain("BROUILLON");
  });
});

describe("renderAtsExport", () => {
  it("supprime les accents pour compatibilité ATS", () => {
    const result = renderAtsExport("Directeur Général — Expérience professionnelle");
    expect(result).not.toContain("é");
    expect(result).not.toContain("è");
    expect(result).not.toContain("—");
  });

  it("remplace les puces décoratives par des tirets", () => {
    const result = renderAtsExport("• Réalisation 1\n● Réalisation 2\n○ Réalisation 3");
    expect(result).not.toContain("•");
    expect(result).not.toContain("●");
    expect(result).not.toContain("○");
    expect(result).toContain("-");
  });

  it("conserve le contenu principal", () => {
    const result = renderAtsExport("Expérience chez TechCorp");
    expect(result).toContain("Experience");
    expect(result).toContain("TechCorp");
  });

  it("normalise les sauts de ligne", () => {
    const result = renderAtsExport("Ligne 1\n\n\n\nLigne 2");
    expect(result).not.toContain("\n\n\n");
  });

  it("nettoie les guillemets courbes", () => {
    const result = renderAtsExport("Mission : “excellente” performance");
    expect(result).not.toContain("“");
    expect(result).not.toContain("”");
  });
});

describe("renderPrintHtml", () => {
  it("produit du HTML valide", () => {
    const html = renderPrintHtml({
      content: "Test content",
      type: "cv_fr",
      candidateName: "Jean Dupont",
      offerTitle: "Directeur",
      offerCompany: "TechCorp",
    });
    expect(html).toContain("<!DOCTYPE html>");
    expect(html).toContain("</html>");
    expect(html).toContain("Jean Dupont");
    expect(html).toContain("TechCorp");
  });

  it("inclut les règles d'impression", () => {
    const html = renderPrintHtml({
      content: "Test",
      type: "cv_fr",
    });
    expect(html).toContain("@page");
    expect(html).toContain("@media print");
    expect(html).toContain("A4");
  });

  it("échappe le contenu HTML", () => {
    const html = renderPrintHtml({
      content: "<script>alert('xss')</script>",
      type: "cv_fr",
    });
    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
  });
});

describe("renderMarkdownExport", () => {
  it("produit du markdown basique", () => {
    const result = renderMarkdownExport("Contenu test", "cv_fr");
    expect(result).toContain("#");
    expect(result).toContain("ELTON OS");
    expect(result).toContain("Contenu test");
  });
});

describe("buildDossierFiles", () => {
  const sampleDocs = [
    { id: "1", type: "cv_fr", content: "CV FR content", status: "APPROVED", opportunityTitle: "Directeur", opportunityCompany: "TechCorp" },
    { id: "2", type: "lettre_fr", content: "Lettre FR content", status: "DRAFT", opportunityTitle: null, opportunityCompany: null },
    { id: "3", type: "email_fr", content: "Email content", status: "APPROVED", opportunityTitle: null, opportunityCompany: null },
    { id: "4", type: "linkedin_fr", content: "LinkedIn msg", status: "NEEDS_REVIEW", opportunityTitle: null, opportunityCompany: null },
  ];

  it("contient un fichier stratégie", () => {
    const files = buildDossierFiles({
      documents: sampleDocs,
      opportunityId: "opp-1",
      opportunityTitle: "Directeur Commercial",
      opportunityCompany: "TechCorp",
    });
    const strategy = files.find(f => f.name === "00_Resume_strategie.txt");
    expect(strategy).toBeDefined();
    expect(strategy!.content).toContain("ELTON OS");
    expect(strategy!.content).toContain("Directeur Commercial");
  });

  it("inclut l'analyse si fournie", () => {
    const files = buildDossierFiles({
      documents: sampleDocs,
      opportunityId: "opp-1",
      opportunityTitle: "Directeur",
      opportunityCompany: null,
      analysisText: "Score global: 85/100",
    });
    const analysis = files.find(f => f.name.includes("Analyse"));
    expect(analysis).toBeDefined();
  });

  it("n'inclut pas l'analyse si absente", () => {
    const files = buildDossierFiles({
      documents: sampleDocs,
      opportunityId: "opp-1",
      opportunityTitle: "Directeur",
      opportunityCompany: null,
    });
    const analysis = files.find(f => f.name.includes("Analyse"));
    expect(analysis).toBeUndefined();
  });

  it("groupe les CV dans le dossier CV/", () => {
    const files = buildDossierFiles({
      documents: sampleDocs,
      opportunityId: "opp-1",
      opportunityTitle: "Dir",
      opportunityCompany: null,
    });
    const cvFile = files.find(f => f.name.startsWith("CV/"));
    expect(cvFile).toBeDefined();
  });

  it("groupe les lettres dans le dossier Lettres/", () => {
    const files = buildDossierFiles({
      documents: sampleDocs,
      opportunityId: "opp-1",
      opportunityTitle: "Dir",
      opportunityCompany: null,
    });
    const lettreFile = files.find(f => f.name.startsWith("Lettres/"));
    expect(lettreFile).toBeDefined();
  });

  it("groupe les emails dans le dossier Emails/", () => {
    const files = buildDossierFiles({
      documents: sampleDocs,
      opportunityId: "opp-1",
      opportunityTitle: "Dir",
      opportunityCompany: null,
    });
    const emailFile = files.find(f => f.name.startsWith("Emails/"));
    expect(emailFile).toBeDefined();
  });

  it("groupe les messages LinkedIn dans LinkedIn/", () => {
    const files = buildDossierFiles({
      documents: sampleDocs,
      opportunityId: "opp-1",
      opportunityTitle: "Dir",
      opportunityCompany: null,
    });
    const linkedinFile = files.find(f => f.name.startsWith("LinkedIn/"));
    expect(linkedinFile).toBeDefined();
  });

  it("tous les documents sont présents", () => {
    const files = buildDossierFiles({
      documents: sampleDocs,
      opportunityId: "opp-1",
      opportunityTitle: "Dir",
      opportunityCompany: null,
    });
    // Strategy (1) + 4 docs + no analysis = 5
    expect(files.length).toBe(5);
  });

  it("ajoute BROUILLON_ aux documents non approuvés", () => {
    const files = buildDossierFiles({
      documents: sampleDocs,
      opportunityId: "opp-1",
      opportunityTitle: "Dir",
      opportunityCompany: null,
    });
    const draftFile = files.find(f => f.name.includes("BROUILLON_"));
    expect(draftFile).toBeDefined();
  });

  it("les documents approuvés n'ont pas le préfixe BROUILLON", () => {
    const files = buildDossierFiles({
      documents: [sampleDocs[0]], // APPROVED CV
      opportunityId: "opp-1",
      opportunityTitle: "Dir",
      opportunityCompany: null,
    });
    const cvFile = files.find(f => f.name.startsWith("CV/"));
    expect(cvFile!.name).not.toContain("BROUILLON");
  });
});
