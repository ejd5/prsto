import { describe, it, expect } from "vitest";
import { fieldsToMap, getBlockedFieldKeys, countAutofillableFields } from "@/lib/actions/autofill-utils";
import type { AutofillField } from "@/lib/actions/autofill";
import { normalizeCompensationTarget } from "@/lib/cv-render/normalize-compensation";

// ─── Helpers ───────────────────────────────

function makeField(overrides: Partial<AutofillField> = {}): AutofillField {
  return { key: "email", label: "Email", type: "email", value: "test@test.com", source: "profile", ...overrides };
}

/**
 * Réplique pure de detectFieldKeyFromLabel() du popup.js pour tests unitaires.
 */
function detectFieldKeyFromLabel(label: string): string | null {
  const l = (label || "").toLowerCase().replace(/[*:]/g, "").trim();
  if (/^(first|prénom|prenom|given|first name|firstname|forename)/i.test(l)) return "firstName";
  if (/^(last|nom|name|last name|lastname|surname|family|family name)/i.test(l)) return "lastName";
  if (/^(full name|nom complet|fullname|candidat|your name)/i.test(l)) return "fullName";
  if (/^(email|courriel|e-mail|mail|email address)/i.test(l)) return "email";
  if (/^(phone|tel|téléphone|telephone|mobile|portable|mobile phone|contact number|phone number)/i.test(l)) return "phone";
  if (/^(address|adresse|street)/i.test(l)) return "address";
  if (/^(city|ville|location|localisation|lieu|where are you|current location|located)/i.test(l)) return "location";
  if (/^(linkedin|linked in|linkedin url|linkedin profile|linkedin profile url)/i.test(l)) return "linkedin";
  if (/^(years of|années d|years exp|how many years|total years|years of experience|experience.*years)/i.test(l)) return "yearsOfExperience";
  if (/^(current|actuel|title|poste actuel|current role|current position|most recent|most recent job|what is your current)/i.test(l)) return "currentTitle";
  if (/^(salary|salaire|remuneration|rémunération|compensation|pretentions|prétentions|expected salary|desired salary|salary expectation|compensation expectation|comp expectations|what are your salary|what is your desired)/i.test(l)) return "salaryExpectations";
  if (/^(availability|disponibilité|disponibilite|notice|préavis|preavis|start date|when can you|available from|notice period|earliest start|when are you available)/i.test(l)) return "availability";
  if (/^(cover letter|lettre|motivation|cover note|additional|why are you|why do you|tell us|message|comments|anything else|what else)/i.test(l)) return "coverLetter";
  if (/^(what|why|describe|explain|how|tell)/i.test(l) && l.length > 20) return "atsAnswer";
  if (/^(resume|cv|curriculum|upload|attach|file|document|attach resume|upload resume|pièce jointe|piece jointe|attach cv|upload cv)/i.test(l)) return "resumeUpload";
  if (/^(website|portfolio|github|url|blog|personal website)/i.test(l)) return "website";
  return null;
}

// ─── fieldsToMap ────────────────────────────

describe("fieldsToMap", () => {
  it("converts active fields to key-value map", () => {
    const fields: AutofillField[] = [
      makeField({ key: "firstName", value: "Elton" }),
      makeField({ key: "email", value: "elt@test.com" }),
      makeField({ key: "phone", value: "+33", blocked: true }),
    ];
    const map = fieldsToMap(fields);
    expect(map.firstName).toBe("Elton");
    expect(map.email).toBe("elt@test.com");
    expect(map.phone).toBeUndefined();
  });

  it("skips empty values", () => {
    const fields: AutofillField[] = [
      makeField({ key: "firstName", value: "" }),
      makeField({ key: "email", value: "elt@test.com" }),
    ];
    const map = fieldsToMap(fields);
    expect(Object.keys(map)).toHaveLength(1);
  });

  it("returns empty object for no fields", () => {
    expect(fieldsToMap([])).toEqual({});
  });
});

// ─── getBlockedFieldKeys ────────────────────

describe("getBlockedFieldKeys", () => {
  it("returns keys of blocked fields", () => {
    const fields: AutofillField[] = [
      makeField({ key: "a", blocked: true }),
      makeField({ key: "b", blocked: false }),
      makeField({ key: "c", blocked: true }),
    ];
    expect(getBlockedFieldKeys(fields)).toEqual(["a", "c"]);
  });

  it("returns empty for no blocked fields", () => {
    expect(getBlockedFieldKeys([makeField(), makeField()])).toEqual([]);
  });
});

// ─── countAutofillableFields ────────────────

describe("countAutofillableFields", () => {
  it("counts non-blocked fields with values", () => {
    const fields: AutofillField[] = [
      makeField({ blocked: false, value: "yes" }),
      makeField({ blocked: true, value: "no" }),
      makeField({ blocked: false, value: "" }),
      makeField({ blocked: false, value: "yes2" }),
    ];
    expect(countAutofillableFields(fields)).toBe(2);
  });
});

// ─── detectFieldKeyFromLabel (V2.2) ─────

describe("detectFieldKeyFromLabel", () => {
  it("maps Prénom → firstName", () => { expect(detectFieldKeyFromLabel("Prénom")).toBe("firstName"); });
  it("maps First Name → firstName", () => { expect(detectFieldKeyFromLabel("First Name")).toBe("firstName"); });
  it("maps Nom → lastName", () => { expect(detectFieldKeyFromLabel("Nom")).toBe("lastName"); });
  it("maps Last Name → lastName", () => { expect(detectFieldKeyFromLabel("Last Name")).toBe("lastName"); });
  it("maps Email → email", () => { expect(detectFieldKeyFromLabel("Email")).toBe("email"); });
  it("maps Téléphone → phone", () => { expect(detectFieldKeyFromLabel("Téléphone")).toBe("phone"); });
  it("maps Phone → phone", () => { expect(detectFieldKeyFromLabel("Phone")).toBe("phone"); });
  it("maps Adresse → address", () => { expect(detectFieldKeyFromLabel("Adresse")).toBe("address"); });
  it("maps Ville → location", () => { expect(detectFieldKeyFromLabel("Ville")).toBe("location"); });
  it("maps Location → location", () => { expect(detectFieldKeyFromLabel("Location")).toBe("location"); });
  it("maps LinkedIn URL → linkedin", () => { expect(detectFieldKeyFromLabel("LinkedIn URL")).toBe("linkedin"); });
  it("maps Years of Experience → yearsOfExperience", () => { expect(detectFieldKeyFromLabel("Years of Experience")).toBe("yearsOfExperience"); });
  it("maps Current Title → currentTitle", () => { expect(detectFieldKeyFromLabel("Current Title")).toBe("currentTitle"); });
  it("maps Salary Expectations → salaryExpectations", () => { expect(detectFieldKeyFromLabel("Salary Expectations")).toBe("salaryExpectations"); });
  it("maps Rémunération → salaryExpectations", () => { expect(detectFieldKeyFromLabel("Rémunération")).toBe("salaryExpectations"); });
  it("maps Prétentions salariales → salaryExpectations", () => { expect(detectFieldKeyFromLabel("Prétentions salariales")).toBe("salaryExpectations"); });
  it("maps Disponibilité → availability", () => { expect(detectFieldKeyFromLabel("Disponibilité")).toBe("availability"); });
  it("maps Lettre de motivation → coverLetter", () => { expect(detectFieldKeyFromLabel("Lettre de motivation")).toBe("coverLetter"); });
  it("maps Cover Letter → coverLetter", () => { expect(detectFieldKeyFromLabel("Cover Letter")).toBe("coverLetter"); });
  it("maps Why are you interested → coverLetter", () => { expect(detectFieldKeyFromLabel("Why are you interested in this role?")).toBe("coverLetter"); });
  it("maps CV → resumeUpload", () => { expect(detectFieldKeyFromLabel("CV")).toBe("resumeUpload"); });
  it("maps Resume → resumeUpload", () => { expect(detectFieldKeyFromLabel("Resume")).toBe("resumeUpload"); });
  it("maps Upload your CV → resumeUpload", () => { expect(detectFieldKeyFromLabel("Upload your CV")).toBe("resumeUpload"); });
  it("returns null for unknown label", () => { expect(detectFieldKeyFromLabel("Favorite Color")).toBeNull(); });
  it("returns null for empty label", () => { expect(detectFieldKeyFromLabel("")).toBeNull(); });
});

// ─── Hardening V2.3.3: nouveaux synonymes ──

describe("detectFieldKeyFromLabel — hardening V2.3.3", () => {
  it("maps Given Name → firstName", () => { expect(detectFieldKeyFromLabel("Given Name")).toBe("firstName"); });
  it("maps Family Name → lastName", () => { expect(detectFieldKeyFromLabel("Family Name")).toBe("lastName"); });
  it("maps Surname → lastName", () => { expect(detectFieldKeyFromLabel("Surname")).toBe("lastName"); });
  it("maps Mobile Phone → phone", () => { expect(detectFieldKeyFromLabel("Mobile Phone")).toBe("phone"); });
  it("maps Contact Number → phone", () => { expect(detectFieldKeyFromLabel("Contact Number")).toBe("phone"); });
  it("maps Email Address → email", () => { expect(detectFieldKeyFromLabel("Email Address")).toBe("email"); });
  it("maps City → location", () => { expect(detectFieldKeyFromLabel("City")).toBe("location"); });
  it("maps Current Location → location", () => { expect(detectFieldKeyFromLabel("Current Location")).toBe("location"); });
  it("maps Notice Period → availability", () => { expect(detectFieldKeyFromLabel("Notice Period")).toBe("availability"); });
  it("maps Available From → availability", () => { expect(detectFieldKeyFromLabel("Available From")).toBe("availability"); });
  it("maps Expected Salary → salaryExpectations", () => { expect(detectFieldKeyFromLabel("Expected Salary")).toBe("salaryExpectations"); });
  it("maps Compensation Expectations → salaryExpectations", () => { expect(detectFieldKeyFromLabel("Compensation Expectations")).toBe("salaryExpectations"); });
  it("maps LinkedIn Profile URL → linkedin", () => { expect(detectFieldKeyFromLabel("LinkedIn Profile URL")).toBe("linkedin"); });
  // "Why do you want to work here?" matches coverLetter first (opens with "why do you"),
  // then ATS matching happens at the value-mapping level (matchAtsQuestionToAnswer in popup.js)
  it("maps 'Why do you want to work here?' → coverLetter", () => { expect(detectFieldKeyFromLabel("Why do you want to work here?")).toBe("coverLetter"); });
  // "What..." without "what else" → falls through to atsAnswer (starts with what, >20 chars)
  it("maps 'What are your strengths?' → atsAnswer", () => { expect(detectFieldKeyFromLabel("What are your greatest strengths?")).toBe("atsAnswer"); });
});

// ─── Hardening V2.3.3: champs ignorés ──────

describe("detectFieldKeyFromLabel — champs ignorés", () => {
  it("returns null for Password", () => { expect(detectFieldKeyFromLabel("Password")).toBeNull(); });
  it("returns null for Confirm Password", () => { expect(detectFieldKeyFromLabel("Confirm Password")).toBeNull(); });
  it("returns null for Submit", () => { expect(detectFieldKeyFromLabel("Submit")).toBeNull(); });
});

// ─── Hardening V2.3.3: upload CV manual ─────

describe("detectFieldKeyFromLabel — upload CV toujours manuel", () => {
  it("Upload your CV → resumeUpload", () => { expect(detectFieldKeyFromLabel("Upload your CV")).toBe("resumeUpload"); });
  it("Attach Resume → resumeUpload", () => { expect(detectFieldKeyFromLabel("Attach Resume")).toBe("resumeUpload"); });
  it("Pièce jointe → resumeUpload", () => { expect(detectFieldKeyFromLabel("Pièce jointe")).toBe("resumeUpload"); });
  it("Attach CV → resumeUpload", () => { expect(detectFieldKeyFromLabel("Attach CV")).toBe("resumeUpload"); });
});

// ─── Hardening V2.3.3: questions ATS ────────

describe("detectFieldKeyFromLabel — questions ATS", () => {
  it("long question → atsAnswer", () => {
    expect(detectFieldKeyFromLabel("Describe your experience in sales leadership")).toBe("atsAnswer");
  });
  it("long explain → atsAnswer", () => {
    expect(detectFieldKeyFromLabel("Explain how you would drive revenue growth")).toBe("atsAnswer");
  });
  it("short What → null (too short)", () => {
    expect(detectFieldKeyFromLabel("What")).toBeNull();
  });
  it("short Why → null (too short)", () => {
    expect(detectFieldKeyFromLabel("Why")).toBeNull();
  });
});

// ─── Règles métier: rémunération ─────────

describe("normalizeCompensationTarget — autofill integration", () => {
  it("invalid salary returns warning", () => {
    const r = normalizeCompensationTarget("800-180K€ + variable 30%");
    expect(r.isValid).toBe(false);
    expect(r.warning).toBeDefined();
  });

  it("valid salary is accepted", () => {
    const r = normalizeCompensationTarget("120-180K€ + variable 30%");
    expect(r.isValid).toBe(true);
  });

  it("empty salary is valid", () => {
    const r = normalizeCompensationTarget("");
    expect(r.isValid).toBe(true);
    expect(r.min).toBeNull();
  });
});
