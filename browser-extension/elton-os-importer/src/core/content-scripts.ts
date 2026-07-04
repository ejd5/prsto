// ─── Content scripts (injected into page) ─────

export function setNativeValueFn(el: any, value: string) {
  var nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value");
  if (nativeSetter && nativeSetter.set) { nativeSetter.set.call(el, value); }
  else { el.value = value; }
  el.dispatchEvent(new Event("input", { bubbles: true }));
  el.dispatchEvent(new Event("change", { bubbles: true }));
  el.dispatchEvent(new Event("blur", { bubbles: true }));
}

export function detectFormFieldsFn(): any[] {
  var fields: any[] = [];
  var selectors = [
    "input:not([type=hidden]):not([type=submit]):not([type=button]):not([type=password]):not([type=file]):not([type=checkbox]):not([type=radio])",
    "textarea", "select"
  ];
  selectors.forEach(function(sel) {
    document.querySelectorAll(sel).forEach(function(el) {
      if ((el as any).disabled || (el as any).readOnly) return;
      if (!(el as any).checkVisibility || (el as any).checkVisibility()) {
        var label = "";
        if ((el as any).id) { var lbl = document.querySelector("label[for='" + CSS.escape((el as any).id) + "']"); if (lbl) label = (lbl.textContent || (lbl as any).innerText || "").trim(); }
        if (!label) label = (el as any).getAttribute("aria-label") || "";
        if (!label) label = (el as any).placeholder || "";
        if (!label) label = (el as any).name || "";
        var autocomplete = (el as any).getAttribute("autocomplete") || "";
        var dataLabel = (el as any).getAttribute("data-label") || (el as any).getAttribute("data-testid") || "";
        fields.push({
          tag: el.tagName.toLowerCase(), type: (el as any).type || "text", name: (el as any).name || "", id: (el as any).id || "",
          placeholder: (el as any).placeholder || "", autocomplete: autocomplete, dataLabel: dataLabel,
          label: cleanLabel(label).slice(0, 120), currentValue: (el as any).value || "",
        });
      }
    });
  });
  return fields;
  function cleanLabel(s: string): string { return (s || "").replace(/\s+/g, " ").replace(/[*:]/g, "").trim(); }
}

export function fillDetectedFieldsFn(mapping: any[]): { filled: number; skipped: number } {
  var nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value");
  var textareaSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, "value");
  var selectors = [
    "input:not([type=hidden]):not([type=submit]):not([type=button]):not([type=password]):not([type=file]):not([type=checkbox]):not([type=radio])",
    "textarea", "select"
  ];
  var allInputs: any[] = [];
  selectors.forEach(function(sel) {
    var nodes = document.querySelectorAll(sel);
    for (var i = 0; i < nodes.length; i++) allInputs.push(nodes[i]);
  });
  var filled = 0, skipped = 0;
  for (var i = 0; i < mapping.length; i++) {
    var m = mapping[i];
    var el = allInputs[m.idx];
    if (!el || el.disabled || el.readOnly) { skipped++; continue; }
    if (el.tagName === "SELECT") {
      var found = false;
      for (var j = 0; j < el.options.length; j++) {
        if (el.options[j].text.toLowerCase().includes(m.value.toLowerCase()) || m.value.toLowerCase().includes(el.options[j].text.toLowerCase())) {
          el.selectedIndex = j;
          el.dispatchEvent(new Event("change", { bubbles: true }));
          filled++; found = true; break;
        }
      }
      if (!found) skipped++;
      continue;
    }
    if (el.tagName === "TEXTAREA") {
      if (textareaSetter && textareaSetter.set) { textareaSetter.set.call(el, m.value); }
      else { el.value = m.value; }
    } else {
      if (nativeSetter && nativeSetter.set) { nativeSetter.set.call(el, m.value); }
      else { el.value = m.value; }
    }
    el.dispatchEvent(new Event("input", { bubbles: true }));
    el.dispatchEvent(new Event("change", { bubbles: true }));
    filled++;
  }
  return { filled: filled, skipped: skipped };
}

export function detectFileInputsFn(): any[] {
  var inputs = document.querySelectorAll("input[type=file]");
  var results: any[] = [];
  for (var i = 0; i < inputs.length; i++) {
    var el = inputs[i];
    if (el.disabled) continue;
    if ((el as any).checkVisibility && !(el as any).checkVisibility()) continue;

    var accept = el.getAttribute("accept") || "";
    var label = "";

    if (el.id) {
      var lbl = document.querySelector("label[for='" + CSS.escape(el.id) + "']");
      if (lbl) label = (lbl.textContent || (lbl as any).innerText || "").trim();
    }
    if (!label) label = el.getAttribute("aria-label") || "";
    if (!label) label = el.name || "";

    results.push({
      idx: i,
      accept: accept,
      label: label.slice(0, 200),
      classification: classifyUploadField(accept, label)
    });
  }
  return results;

  function classifyUploadField(accept: string, labelText: string): string {
    var l = (labelText || "").toLowerCase();
    var a = (accept || "").toLowerCase();
    if (/\b(cv|resume|résumé|curriculum|vitae|cv pdf)\b/i.test(l)) return "cv";
    if (a.includes(".pdf") && /\b(cv|resume|résumé|curriculum)\b/i.test(l)) return "cv";
    if (/\b(lettre|cover letter|coverletter|motivation|letter|message|lm)\b/i.test(l)) return "coverLetter";
    if (a.includes(".pdf") && /\b(cover|letter|lettre|motivation)\b/i.test(l)) return "coverLetter";
    if (/\b(document|attachment|pièce jointe|piece jointe|fichier|file|upload)\b/i.test(l)) return "genericDocuments";
    return "genericDocuments";
  }
}

export function attachFileToInputFn(idx: number, fileBytes: number[], fileName: string, mimeType: string): { success: boolean; reason?: string } {
  try {
    var inputs = document.querySelectorAll("input[type=file]");
    if (idx < 0 || idx >= inputs.length) return { success: false, reason: "Index hors limites" };

    var input = inputs[idx];
    if (!input || input.disabled) return { success: false, reason: "Champ inactif ou introuvable" };

    var bytes = new Uint8Array(fileBytes);
    var file = new File([bytes], fileName, { type: mimeType || "application/pdf" });
    var dt = new DataTransfer();
    dt.items.add(file);
    input.files = dt.files;

    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.dispatchEvent(new Event("change", { bubbles: true }));
    input.dispatchEvent(new FocusEvent("blur", { bubbles: true }));

    return { success: true };
  } catch (e: any) {
    return { success: false, reason: e.message };
  }
}

export function detectIndeedResumeSelection(): any {
  var text = (document.body ? document.body.innerText : "").toLowerCase();
  var hasFileInput = !!document.querySelector("input[type=file]");
  var hasSubmitButton = !!document.querySelector("button[type=submit], input[type=submit]");
  var matched = text.includes("utiliser votre cv indeed") || text.includes("importer un autre fichier");
  return {
    platform: "indeed",
    flow: "indeed_smartapply_resume",
    hasFileInput: hasFileInput,
    hasSubmitButton: hasSubmitButton,
    matched: matched
  };
}

export function detectLinkedInEasyApplyResumeStepFn(): any {
  var text = (document.body ? document.body.innerText : "").toLowerCase();
  var hasPostuler = text.includes("postuler chez") || text.includes("apply to") || text.includes("easily apply");
  var hasTelecharger = text.includes("télécharger le cv") || text.includes("upload resume") || text.includes("upload cv") || text.includes("importer votre cv");
  var hasSuivant = !!Array.from(document.querySelectorAll("button, span")).find(function(el) {
    var txt = (el.textContent || "").trim();
    return /^(Suivant|Next|Continuer)$/i.test(txt);
  });
  var fileInput = document.querySelector("input[type=file]");
  var hasAccessibleFileInput = fileInput && fileInput.getAttribute("accept");
  return {
    platform: "linkedin",
    flow: "easy_apply_resume_step",
    hasPostuler: hasPostuler,
    hasTelecharger: hasTelecharger,
    hasSuivant: hasSuivant,
    hasAccessibleFileInput: !!hasAccessibleFileInput
  };
}

export function fillLetterTextarea(text: string): { success: boolean; reason?: string } {
  try {
    var textareas = document.querySelectorAll("textarea");
    var target: HTMLTextAreaElement | null = null;
    for (var i = 0; i < textareas.length; i++) {
      var el = textareas[i];
      var lbl = "";
      if (el.id) {
        var labelEl = document.querySelector("label[for='" + CSS.escape(el.id) + "']");
        if (labelEl) lbl = (labelEl.textContent || (labelEl as any).innerText || "");
      }
      if (!lbl) lbl = el.getAttribute("aria-label") || "";
      if (!lbl) lbl = el.name || "";
      if (!lbl) lbl = el.placeholder || "";
      
      if (/cover\s*letter|lettre|motivation/i.test(lbl)) {
        target = el;
        break;
      }
    }
    if (!target && textareas.length > 0) target = textareas[0];
    if (!target) return { success: false, reason: "Aucun textarea trouvé" };
    
    var nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, "value");
    if (nativeSetter && nativeSetter.set) {
      nativeSetter.set.call(target, text);
    } else {
      target.value = text;
    }
    target.dispatchEvent(new Event("input", { bubbles: true }));
    target.dispatchEvent(new Event("change", { bubbles: true }));
    return { success: true };
  } catch(e: any) {
    return { success: false, reason: e.message };
  }
}

export function copyToClipboard(text: string) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text);
  } else {
    var textarea = document.createElement("textarea");
    textarea.value = text;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand("copy");
    document.body.removeChild(textarea);
  }
}
