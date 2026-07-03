// ─── Search Health & Diagnostics (Post-Apply tab) ──

export function runSearchDiagnostics(tabUrl: string) {
  var keywordQuality = "Optimale (95%)";
  var locationQuality = "Ciblée (IDF / PACA)";
  var showExplainer = false;
  var explainerText = "";

  var urlLower = (tabUrl || "").toLowerCase();
  if (urlLower.includes("linkedin.com") || urlLower.includes("indeed.com") || urlLower.includes("apec.fr")) {
    if (urlLower.includes("keywords=") || urlLower.includes("q=") || urlLower.includes("recherche")) {
      var urlObj: URL | null = null;
      try { urlObj = new URL(tabUrl); } catch(e){}
      if (urlObj) {
        var q = urlObj.searchParams.get("keywords") || urlObj.searchParams.get("q") || urlObj.searchParams.get("p");
        if (q) {
          if (q.length > 40) {
            keywordQuality = "Trop restrictif (Filtres longs)";
            showExplainer = true;
            explainerText = "Mots-clés très longs détectés. Simplifiez votre recherche (ex: 'Directeur Commercial' au lieu de phrases complexes).";
          } else if (q.length < 3) {
            keywordQuality = "Faible (Trop court)";
          }
        }
        var loc = urlObj.searchParams.get("location") || urlObj.searchParams.get("l");
        if (loc) {
          if (loc.toLowerCase().includes("paris") || loc.toLowerCase().includes("paca") || loc.toLowerCase().includes("france")) {
            locationQuality = "Idéale (Zone ciblée)";
          } else {
            locationQuality = "Élargie (Hors priorités)";
            showExplainer = true;
            explainerText = "Zone géographique hors PACA/IDF. Assurez-vous d'avoir configuré votre mobilité correspondante dans ELTON OS.";
          }
        }
      }
    }
  }

  var kwEl = document.getElementById("health-keyword-quality");
  var locEl = document.getElementById("health-location-quality");
  var explainerEl = document.getElementById("no-result-explainer");
  var explainerTxtEl = document.getElementById("no-result-text");

  if (kwEl) kwEl.textContent = keywordQuality;
  if (locEl) locEl.textContent = locationQuality;
  
  if (showExplainer && explainerEl && explainerTxtEl) {
    explainerEl.style.display = "block";
    explainerTxtEl.textContent = explainerText;
  } else if (explainerEl) {
    explainerEl.style.display = "none";
  }
}
