// ─── Autofill field mapping helpers ───────────

export function detectFieldKeyFromLabel(label: string): string | null {
  var l = (label || "").toLowerCase().replace(/[*:]/g, "").trim();
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

export function matchAtsQuestionToAnswer(question: string, atsAnswersText: string): string | null {
  if (!atsAnswersText) return null;
  var lowerQ = question.toLowerCase();
  var pairs: { q: string; a: string }[] = [];
  var blocks = atsAnswersText.split(/\n\n+/);
  for (var i = 0; i < blocks.length; i++) {
    var qMatch = blocks[i].match(/^Q:\s*(.+)/);
    var aMatch = blocks[i].match(/R:\s*([\s\S]+)/);
    if (qMatch && aMatch) pairs.push({ q: qMatch[1].toLowerCase(), a: aMatch[1].trim() });
  }
  for (var j = 0; j < pairs.length; j++) {
    var qWords = pairs[j].q.split(/\s+/).filter(function(w) { return w.length > 3; });
    var matchCount = qWords.filter(function(w) { return lowerQ.includes(w); }).length;
    if (matchCount >= 2) return pairs[j].a;
  }
  return null;
}

export function mapDetectedFieldToAutofillValue(field: any, autofillList: any[], existingValue: string, atsAnswersText: string, overwriteExisting: boolean): any {
  var detectedKey = field.key || detectFieldKeyFromLabel(field.label) || detectFieldKeyFromLabel(field.name || "") || detectFieldKeyFromLabel(field.placeholder || "");
  if (!detectedKey) return null;
  var af: any = null;
  for (var i = 0; i < autofillList.length; i++) {
    if (autofillList[i].key === detectedKey) { af = autofillList[i]; break; }
  }
  if (!af) return null;
  if (existingValue && existingValue.trim().length > 2 && !overwriteExisting && detectedKey !== "resumeUpload") {
    return { key: af.key, value: existingValue, status: "skipped_existing", warning: "Champ déjà rempli" };
  }
  if (af.blocked) return { key: af.key, value: "", status: "blocked", warning: "Désactivé" };
  if (detectedKey === "resumeUpload") return { key: af.key, value: "", status: "manual_required", warning: "Uploader manuellement" };
  if (detectedKey === "salaryExpectations" && (!af.value || af.warning)) return { key: af.key, value: af.value || "", status: "skipped", warning: af.warning || "Rémunération à vérifier" };
  if (detectedKey === "atsAnswer") {
    var match = matchAtsQuestionToAnswer(field.label, atsAnswersText);
    if (match) return { key: "atsAnswers", value: match, status: "ready" };
    var coverAF: any = null;
    for (var j = 0; j < autofillList.length; j++) { if (autofillList[j].key === "coverLetter" && autofillList[j].value) { coverAF = autofillList[j]; break; } }
    if (coverAF) return { key: "atsAnswers", value: coverAF.value.slice(0, 600), status: "uncertain", warning: "Vérifier la pertinence" };
    return { key: "atsAnswers", value: "", status: "skipped", warning: "Pas de réponse ATS" };
  }
  if (!af.value) return { key: af.key, value: "", status: "skipped", warning: "Valeur vide" };
  return { key: af.key, value: af.value, status: "ready" };
}
