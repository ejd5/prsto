// ─── Helpers ───────────────────────────────

export function esc(s: string): string {
  var d = document.createElement("div");
  d.textContent = s || "";
  return d.innerHTML;
}

export function show(state: string) {
  var names = [
    "import-main", "import-preview", "import-sent",
    "documents-main", "documents-found", "documents-not-found",
    "autofill-main", "autofill-detect", "autofill-done",
    "loading", "error", "settings", "blocked"
  ];
  names.forEach(function(s) {
    var el = document.getElementById("state-" + s);
    if (el) (el as HTMLElement).style.display = "none";
  });
  var target = document.getElementById("state-" + state);
  if (target) (target as HTMLElement).style.display = "block";
}

export function detectPlatform(url: string): string {
  var host = (url || "").toLowerCase();
  if (host.includes("linkedin.com")) return "linkedin";
  if (host.includes("indeed.com")) return "indeed";
  if (host.includes("apec.fr")) return "apec";
  if (host.includes("greenhouse.io")) return "greenhouse";
  if (host.includes("lever.co")) return "lever";
  if (host.includes("ashbyhq.com")) return "ashby";
  if (host.includes("smartrecruiters.com")) return "smartrecruiters";
  if (host.includes("workable.com")) return "workable";
  if (host.includes("cadremploi.fr")) return "cadremploi";
  if (host.includes("hellowork.com")) return "hellowork";
  if (host.includes("welcometothejungle.com")) return "wttj";
  return "generic";
}

export function platformLabel(id: string): string {
  var map: Record<string, string> = { linkedin:"LinkedIn", indeed:"Indeed", apec:"APEC", greenhouse:"Greenhouse", lever:"Lever", ashby:"Ashby", smartrecruiters:"SmartRecruiters", workable:"Workable", generic:"Page carrière" };
  return map[id] || id;
}

export function isAssistedPlatform(id: string): boolean {
  return id === "linkedin" || id === "indeed" || id === "apec";
}
