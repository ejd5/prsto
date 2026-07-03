"use server";

import { prisma } from "@/lib/prisma";
import { normalizeCompensationTarget } from "@/lib/cv-render/normalize-compensation";

/* ─── Types ───────────────────────────────── */

export type AutofillFieldType =
  | "text"
  | "email"
  | "tel"
  | "url"
  | "textarea"
  | "select"
  | "number"
  | "date";

export interface AutofillField {
  key: string;                    // "firstName", "email", "coverLetter"...
  label: string;                  // "Prénom"
  type: AutofillFieldType;
  value: string;                  // valeur pré-remplie
  placeholder?: string;
  required?: boolean;
  blocked?: boolean;              // champ bloqué — ne pas remplir
  warning?: string;               // avertissement (ex: "⚠️ Upload manuel requis")
  source: "profile" | "draft" | "computed" | "manual";
}

export interface AutofillFormData {
  draftId: string;
  jobTitle: string;
  company: string;
  fields: AutofillField[];        // ordonnés pour un formulaire type
  warnings: string[];             // avertissements globaux
  timestamp: string;
}

export interface AutofillPreferences {
  enabled: boolean;
  autoFillName: boolean;
  autoFillEmail: boolean;
  autoFillPhone: boolean;
  autoFillLinkedIn: boolean;
  autoFillLocation: boolean;
  autoFillSalary: boolean;
  autoFillResumeUploadWarning: boolean;
  autoFillCoverLetter: boolean;
  autoFillAtsAnswers: boolean;
  maxFieldsPerSession: number;
  blockedFields: string[];
}

/* ─── Helpers ─────────────────────────────── */

function splitFullName(fullName: string): { first: string; last: string } {
  const parts = (fullName || "").trim().split(/\s+/);
  if (parts.length === 0) return { first: "", last: "" };
  if (parts.length === 1) return { first: parts[0], last: "" };
  return { first: parts[0], last: parts.slice(1).join(" ") };
}

/* ─── Fonction principale ─────────────────── */

/**
 * Construit un objet AutofillFormData à partir d'un ApplicationDraft
 * et du profil utilisateur. Ne remplit rien — retourne juste les champs.
 *
 * Règles :
 * - draft status "sent" → refusé (message clair)
 * - cvIncludeLinkedIn=false → linkedin non inclus sauf préférence
 * - targetSalary invalide → warning, non inclus
 * - photo/upload = warning "Upload manuel requis"
 */
export async function mapDraftToFormFields(
  draftId: string,
  prefs?: Partial<AutofillPreferences>,
): Promise<AutofillFormData | { error: string }> {
  const draft = await prisma.applicationDraft.findUnique({
    where: { id: draftId },
    include: { job: { select: { title: true, company: true } } },
  });

  if (!draft) return { error: "ApplicationDraft introuvable." };

  // Règle stricte : refuser tout autofill pour les dossiers envoyés
  if (draft.pipelineStatus === "sent" || draft.status === "sent") {
    return {
      error: "Ce dossier a déjà été envoyé. Par sécurité, l'autofill est désactivé pour les candidatures déjà soumises.",
    };
  }

  const profile = await prisma.profile.findFirst();
  if (!profile) return { error: "Profil introuvable." };

  const p = prefs || {};
  const fields: AutofillField[] = [];
  const warnings: string[] = [];

  // 1. Prénom / Nom
  const { first, last } = splitFullName(profile.fullName || "");
  const blockName = p.autoFillName === false || (p.blockedFields || []).some((f) => f === "firstName" || f === "lastName" || f === "fullName");

  fields.push({
    key: "firstName", label: "Prénom", type: "text",
    value: blockName ? "" : first,
    source: "profile", blocked: blockName,
    required: true,
  });
  fields.push({
    key: "lastName", label: "Nom", type: "text",
    value: blockName ? "" : last,
    source: "profile", blocked: blockName,
    required: true,
  });
  fields.push({
    key: "fullName", label: "Nom complet", type: "text",
    value: blockName ? "" : (profile.fullName || ""),
    source: "profile", blocked: blockName,
  });

  // 2. Email
  const blockEmail = p.autoFillEmail === false || (p.blockedFields || []).includes("email");
  fields.push({
    key: "email", label: "Email", type: "email",
    value: blockEmail ? "" : (profile.email || ""),
    source: "profile", blocked: blockEmail,
    required: true,
  });

  // 3. Téléphone
  const blockPhone = p.autoFillPhone === false || (p.blockedFields || []).includes("phone");
  fields.push({
    key: "phone", label: "Téléphone", type: "tel",
    value: blockPhone ? "" : (profile.phone || ""),
    source: "profile", blocked: blockPhone,
  });

  // 4. LinkedIn
  const includeLinkedIn = profile.cvIncludeLinkedIn || (p.autoFillLinkedIn === true);
  const blockLinkedIn = (p.blockedFields || []).includes("linkedin") || !includeLinkedIn;
  fields.push({
    key: "linkedin", label: "LinkedIn URL", type: "url",
    value: blockLinkedIn ? "" : (profile.linkedin || ""),
    source: "profile", blocked: blockLinkedIn || !profile.linkedin,
    warning: !profile.linkedin ? "Aucun LinkedIn dans le profil" : undefined,
  });

  // 5. Localisation
  const blockLocation = p.autoFillLocation === false || (p.blockedFields || []).includes("location");
  fields.push({
    key: "location", label: "Localisation", type: "text",
    value: blockLocation ? "" : (profile.location || ""),
    source: "profile", blocked: blockLocation,
  });

  // 6. Rémunération
  const blockSalary = p.autoFillSalary === false || (p.blockedFields || []).includes("salary");
  const salaryNorm = profile.targetSalary ? normalizeCompensationTarget(profile.targetSalary) : null;
  let salaryValue = "";
  let salaryWarning: string | undefined;
  if (profile.targetSalary && salaryNorm?.isValid) {
    salaryValue = profile.targetSalary;
  } else if (profile.targetSalary && salaryNorm && !salaryNorm.isValid) {
    salaryWarning = salaryNorm.warning || "Rémunération à vérifier dans le profil";
  }

  fields.push({
    key: "salaryExpectations", label: "Rémunération attendue", type: "text",
    value: blockSalary ? "" : salaryValue,
    source: "profile", blocked: blockSalary,
    warning: salaryWarning,
    placeholder: "ex: 120-180K€ + variable 30%",
  });

  // 7. Années d'expérience
  fields.push({
    key: "yearsOfExperience", label: "Années d'expérience", type: "number",
    value: String(profile.yearsExp || ""),
    source: "profile",
  });

  // 8. Titre actuel
  fields.push({
    key: "currentTitle", label: "Poste actuel", type: "text",
    value: profile.title || "",
    source: "profile",
  });

  // 9. Disponibilité
  fields.push({
    key: "availability", label: "Disponibilité", type: "text",
    value: "",
    source: "manual",
    placeholder: "ex: 1 mois, immédiate, 3 mois…",
  });

  // 10. Upload CV (⚠️ avertissement)
  const showResumeWarning = p.autoFillResumeUploadWarning !== false;
  fields.push({
    key: "resumeUpload", label: "CV (upload)", type: "text",
    value: "",
    source: "manual",
    blocked: true,
    warning: showResumeWarning ? "⚠️ L'upload de fichier ne peut pas être automatisé. Uploadez votre CV manuellement depuis /documents." : undefined,
  });

  // 11. Lettre de motivation
  const blockCover = p.autoFillCoverLetter === false || (p.blockedFields || []).includes("coverLetter");
  fields.push({
    key: "coverLetter", label: "Lettre de motivation", type: "textarea",
    value: blockCover ? "" : (draft.motivationLetterLong || draft.motivationLetterShort || ""),
    source: "draft", blocked: blockCover,
    warning: !draft.motivationLetterLong && !draft.motivationLetterShort ? "Aucune lettre générée pour ce dossier" : undefined,
  });

  // 12. Message recruteur
  fields.push({
    key: "recruiterMessage", label: "Message au recruteur", type: "textarea",
    value: draft.recruiterMessage || "",
    source: "draft",
  });

  // 13. Réponses ATS
  const blockAts = p.autoFillAtsAnswers === false || (p.blockedFields || []).includes("atsAnswers");
  let atsAnswersText = "";
  try {
    const ats = JSON.parse(draft.atsFormAnswers || "[]");
    if (Array.isArray(ats)) {
      atsAnswersText = ats.map((a: { question: string; answer: string }) => `Q: ${a.question}\nR: ${a.answer}`).join("\n\n");
    }
  } catch { /* ignore */ }
  fields.push({
    key: "atsAnswers", label: "Réponses ATS", type: "textarea",
    value: blockAts ? "" : atsAnswersText,
    source: "draft", blocked: blockAts,
    warning: !atsAnswersText ? "Aucune réponse ATS générée pour ce dossier" : undefined,
  });

  // Warnings globaux
  if (!profile.email) warnings.push("Email manquant dans le profil — les champs email seront vides.");
  if (!profile.phone) warnings.push("Téléphone manquant dans le profil.");
  if (salaryNorm && !salaryNorm.isValid) warnings.push(salaryNorm.warning || "Rémunération cible à vérifier dans le profil.");
  if (draft.status === "draft") warnings.push("Ce dossier est en brouillon. Vérifiez le contenu avant de postuler.");
  if (draft.status !== "approved" && draft.status !== "ready_to_review") warnings.push("Pensez à approuver le dossier avant de l'envoyer.");

  return {
    draftId,
    jobTitle: draft.job.title,
    company: draft.job.company || "",
    fields,
    warnings,
    timestamp: new Date().toISOString(),
  };
}

/* ─── Utilitaires (importés depuis autofill-utils.ts) ─── */
// Les utilitaires fieldsToMap, getBlockedFieldKeys, countAutofillableFields
// sont dans ./autofill-utils.ts (pas de "use server", importables côté client)
