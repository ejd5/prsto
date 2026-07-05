// ─── Pro Extractors (injected into page) ─────

export function checkLoginCaptchaFn(): boolean {
  var text = (document.body ? document.body.innerText : "").slice(0, 3000);
  var patterns = [/sign in to view/i, /log in to apply/i, /connectez-vous/i, /identifiez-vous/i, /captcha/i, /recaptcha/i, /verify you are human/i, /just a moment/i, /checking your browser/i];
  for (var i = 0; i < patterns.length; i++) {
    if (patterns[i].test(text)) return true;
  }
  return false;
}

export function extractLinkedInJobFn(): any {
  var url = window.location.href;
  function cleanText(s: string): string {
    return (s || "").replace(/\s+/g, " ")
      .replace(/[\n\r]+/g, " ")
      .trim();
  }
  function isNoiseText(t: string): boolean {
    return /^(Promu|promoted|sponsored|recruiting|recruteur|top applicant|candidature simplifiée|easy apply|postuler|save|voir l'offre)/i.test(t) ||
           /utile/i.test(t) ||
           /résultat/i.test(t) ||
           /propos/i.test(t) ||
           /exigence/i.test(t) ||
           /recherche/i.test(t) ||
           /correspond/i.test(t) ||
           /sélectionné/i.test(t) ||
           /contacter/i.test(t) ||
           /personne/i.test(t) ||
           /conseil/i.test(t) ||
           /similaire/i.test(t) ||
           /activité/i.test(t);
  }

  var container: Element | null = null;
  var detailsSelectors = [
    ".jobs-search__job-details",
    ".jobs-search-two-pane__details",
    ".jobs-details",
    ".jobs-details__main-content",
    ".job-view-layout",
    "article",
    "div[class*='jobs-search__job-details']",
    "div[class*='jobs-search-two-pane__details']",
    "div[class*='jobs-details']",
    "div[class*='job-details']"
  ];
  for (var ci = 0; ci < detailsSelectors.length; ci++) {
    var el = document.querySelector(detailsSelectors[ci]);
    if (el) {
      container = el;
      break;
    }
  }

  if (!container) {
    var applyBtn: Element | null = null;
    var allButtons = document.querySelectorAll("button, a, span");
    for (var bi = 0; bi < allButtons.length; bi++) {
      var txt = (allButtons[bi].textContent || "").trim().toLowerCase();
      if (txt === "candidature simplifiée" || txt === "easy apply" || txt === "postuler" || txt === "apply" || txt === "postuler sur le site de l'entreprise") {
        if ((allButtons[bi] as HTMLElement).offsetWidth > 0 || (allButtons[bi] as HTMLElement).offsetHeight > 0) {
          applyBtn = allButtons[bi];
          break;
        }
      }
    }
    if (applyBtn) {
      var p = applyBtn.parentElement;
      while (p && p !== document.body) {
        var headings = p.querySelectorAll("h1, h2");
        if (headings.length > 0) {
          container = p;
          break;
        }
        p = p.parentElement;
      }
      if (!container) {
        container = applyBtn.parentElement ? applyBtn.parentElement.parentElement : null;
      }
    }
  }

  if (!container) {
    container = document.body;
  }

  var topCard = container.querySelector("[class*='jobs-unified-top-card']") ||
                container.querySelector("[class*='job-details-jobs-unified-top-card']") ||
                container.querySelector("[class*='top-card']") ||
                container.querySelector("[class*='topcard']") ||
                container;

  var title = "";
  var titleSels = [
    ".job-details-jobs-unified-top-card__job-title",
    ".jobs-unified-top-card__job-title",
    "[class*='job-title']",
    "[class*='top-card__job-title']",
    "h1.t-24",
    "h2.jobs-unified-top-card__job-title",
    ".jobs-details-top-card__job-title",
    "h1",
    "h2",
    "h3"
  ];
  for (var i = 0; i < titleSels.length && !title; i++) {
    var elements = topCard.querySelectorAll(titleSels[i]);
    for (var j = 0; j < elements.length; j++) {
      var t = cleanText(elements[j].textContent || "");
      if (t.length > 2 && !isNoiseText(t) && !/^\d+/.test(t)) {
        title = t;
        break;
      }
    }
  }
  if (!title && document.title) {
    title = cleanText(document.title.replace(/\s*[-|]\s*LinkedIn.*/i, ""));
  }

  var company = "";
  var companyEl = topCard.querySelector("a[href*='/company/']");
  if (companyEl) {
    company = cleanText(companyEl.textContent || "");
  }
  if (!company) {
    var coSels = [
      ".job-details-jobs-unified-top-card__company-name",
      ".jobs-unified-top-card__company-name",
      "[class*='company-name']",
      "[class*='top-card__company-name']",
      ".topcard__org-name-link",
      ".jobs-details-top-card__company-url",
      "[class*='org-name']"
    ];
    for (var cs = 0; cs < coSels.length && !company; cs++) {
      var cel = topCard.querySelector(coSels[cs]);
      if (cel) {
        var co = cleanText(cel.textContent || "");
        if (co.length > 0 && !isNoiseText(co)) {
          company = co;
        }
      }
    }
  }
  if (company) {
    if (company.includes("   ")) company = company.split("   ")[0];
    var words = company.split(" ");
    if (words.length >= 2 && words.length % 2 === 0) {
      var half = words.length / 2;
      var firstHalf = words.slice(0, half).join(" ");
      var secondHalf = words.slice(half).join(" ");
      if (firstHalf === secondHalf) {
        company = firstHalf;
      }
    }
  }

  var location = "";
  var locSels = [
    ".job-details-jobs-unified-top-card__bullet",
    ".jobs-unified-top-card__bullet",
    "[class*='top-card__bullet']",
    "[class*='topcard__bullet']",
    "[class*='primary-description-container']",
    ".jobs-unified-top-card__company-name + span",
    ".topcard__location",
    ".jobs-details-top-card__bullet",
    "[class*='bullet']",
    "[class*='location']"
  ];
  for (var ls = 0; ls < locSels.length && !location; ls++) {
    var lel = topCard.querySelector(locSels[ls]);
    if (lel) {
      var locRaw = cleanText(lel.textContent || "");
      if (locRaw) {
        var parts = locRaw.split(/·|•/);
        var firstPart = parts[0].trim();
        if (firstPart.length > 0 && !isNoiseText(firstPart)) {
          if (company && firstPart.toLowerCase() === company.toLowerCase() && parts[1]) {
            firstPart = parts[1].trim();
          }
          location = firstPart;
        }
      }
    }
  }

  if (!location) {
    var bullets = topCard.querySelectorAll("span, li");
    for (var bi = 0; bi < bullets.length && !location; bi++) {
      var bTxt = cleanText(bullets[bi].textContent || "");
      if (bTxt.includes("France") || bTxt.includes("Paris") || bTxt.includes("Hybride") || bTxt.includes("distance") || bTxt.includes("Temps plein")) {
        var pParts = bTxt.split(/·|•/);
        var fP = pParts[0].trim();
        if (fP && fP.length > 2 && !isNoiseText(fP)) {
          location = fP;
        }
      }
    }
  }

  if (location) {
    var locLower = location.toLowerCase();
    if (company && locLower.indexOf(company.toLowerCase()) === 0) {
      location = location.slice(company.length).trim();
      locLower = location.toLowerCase();
    }
    if (title && locLower.indexOf(title.toLowerCase()) === 0) {
      location = location.slice(title.length).trim();
    }
    location = location.replace(/^[\s·•,:\-]+/, "").replace(/[\s·•,:\-]+$/, "").trim();
  }

  if (title && company) {
    var titleLower = title.toLowerCase();
    var coLower = company.toLowerCase();
    var idx = titleLower.lastIndexOf(coLower);
    if (idx !== -1 && idx + coLower.length === titleLower.length) {
      title = title.slice(0, idx).trim();
    }
    var escapedCompany = company.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    title = title.replace(new RegExp("\\s*[\\-\\|–—]\\s*" + escapedCompany + "\\s*$", "i"), "");
    title = title.replace(/[\s·•,:\-|–—]+$/, "").trim();
  }

  var desc = "";
  var descEl = container.querySelector(".jobs-description__content") || 
               container.querySelector("#job-details") ||
               document.querySelector(".jobs-description__content");
  if (descEl) desc = cleanText((descEl as HTMLElement).textContent || (descEl as any).innerText || "");

  return {
    platform: "linkedin", sourceUrl: url,
    title: title.slice(0, 200), company: company.slice(0, 200), location: location.slice(0, 200),
    description: desc.slice(0, 5000),
    extractionConfidence: { score: (title ? 35 : 0) + (company ? 25 : 0) + (desc.length > 40 ? 15 : 0) + (location ? 10 : 0), details: { title: !!title, company: !!company, description: desc.length > 40 } }
  };
}

export function extractIndeedJobFn(): any {
  function cleanLoc(rawLoc: string, co?: string): string {
    if (!rawLoc) return "";
    var c = rawLoc.trim();
    if (co) c = c.replace(new RegExp("^" + co.replace(/[.*+?^${}()|[\]\\]/g,"\\$&") + "\\s*","i"), "");
    return c.trim();
  }

  var titleEl = document.querySelector('[data-testid="jobsearch-JobInfoHeader-title"]') || 
                document.querySelector('.jobsearch-JobInfoHeader-title') || 
                document.querySelector('.jobsearch-JobInfoHeader-title-container h1') ||
                document.querySelector('h1.is-title') ||
                document.querySelector('h1');
  var title = titleEl ? (titleEl.textContent || "").trim() : "";

  var coEl = document.querySelector('[data-testid="inlineHeader-companyName"]') || 
             document.querySelector('.jobsearch-CompanyInfoContainer span') ||
             document.querySelector('.jobsearch-InlineCompanyRating div') ||
             document.querySelector('[class*="InlineCompanyRating"]');
  var company = coEl ? (coEl.textContent || "").trim() : "";

  var locEl = document.querySelector('[data-testid="job-location"]') || 
              document.querySelector('.jobsearch-JobInfoHeader-subtitle') ||
              document.querySelector('.jobsearch-JobInfoHeader-companyLocation') ||
              document.querySelector('[class*="jobsearch-JobInfoHeader-companyLocation"]') ||
              document.querySelector('[class*="companyLocation"]');
  var location = locEl ? (locEl.textContent || "").trim() : "";
  location = cleanLoc(location, company);

  var descEl = document.querySelector('#jobDescriptionText') || 
               document.querySelector('.jobsearch-jobDescriptionText') ||
               document.querySelector('[class*="jobDescriptionText"]');
  var desc = descEl ? (descEl.textContent || "").trim() : "";

  var score = (title ? 35 : 0) + (company ? 25 : 0) + (desc.length > 40 ? 15 : 0) + (location ? 10 : 0);

  return {
    platform: "indeed", sourceUrl: window.location.href,
    title: title.slice(0, 200), company: company.slice(0, 200), location: location.slice(0, 200),
    description: desc.slice(0, 5000),
    extractionConfidence: { score: score, details: { title: !!title, company: !!company, description: desc.length > 40 } }
  };
}

export function extractApecJobFn(): any {
  var title = "";
  var h1 = document.querySelector("h1");
  if (h1) title = (h1.textContent || "").trim();

  // JSON-LD backup detection
  var jsonLdEl = document.querySelector('script[type="application/ld+json"]');
  var jsonLdData: any = null;
  if (jsonLdEl) {
    try {
      var parsed = JSON.parse(jsonLdEl.textContent || "");
      if (parsed["@type"] === "JobPosting" || parsed["type"] === "JobPosting") {
        jsonLdData = parsed;
      }
    } catch(e) {}
  }

  var company = jsonLdData?.hiringOrganization?.name || "";
  var coEls = document.querySelectorAll(".card-text");
  if (!company && coEls[0]) company = (coEls[0].textContent || "").trim();

  var location = jsonLdData?.jobLocation?.address?.addressLocality || "";
  if (!location && coEls[1]) location = (coEls[1].textContent || "").trim();

  var descEl = document.querySelector(".block-description");
  var desc = descEl ? (descEl.textContent || "").trim() : (jsonLdData?.description || "");

  return {
    platform: "apec", sourceUrl: window.location.href,
    title: (title || jsonLdData?.title || "").slice(0, 200), company: company.slice(0, 200), location: location.slice(0, 200),
    description: desc.slice(0, 5000),
    extractionConfidence: { score: title ? 90 : 20, details: { title: !!title, company: !!company, description: desc.length > 40 } }
  };
}

export function extractGenericJobFn(): any {
  var title = document.title || "";
  var h1 = document.querySelector("h1");
  if (h1) title = (h1.textContent || "").trim();

  // JSON-LD backup
  var jsonLdEl = document.querySelector('script[type="application/ld+json"]');
  var jsonLdData: any = null;
  if (jsonLdEl) {
    try {
      var parsed = JSON.parse(jsonLdEl.textContent || "");
      if (parsed["@type"] === "JobPosting" || parsed["type"] === "JobPosting") {
        jsonLdData = parsed;
      }
    } catch(e) {}
  }

  var company = jsonLdData?.hiringOrganization?.name || "";
  var location = jsonLdData?.jobLocation?.address?.addressLocality || "";
  var desc = jsonLdData?.description || (document.body ? document.body.innerText : "");

  return {
    platform: "generic", sourceUrl: window.location.href,
    title: (title || jsonLdData?.title || "").slice(0, 200), 
    company: company.slice(0, 200), 
    location: location.slice(0, 200),
    description: desc.slice(0, 5000),
    extractionConfidence: { score: title ? 60 : 10, details: { title: !!title, company: !!company, description: desc.length > 40 } }
  };
}

export function extractVisibleJobCardsFn(): any[] {
  var cards: any[] = [];
  var selectors = [".jobs-search-results__list-item", ".job-card-container", "li.css-1ac2h1w"];
  var seen = new Set<string>();
  for (var s = 0; s < selectors.length && cards.length < 10; s++) {
    var items = document.querySelectorAll(selectors[s]);
    for (var i = 0; i < items.length && cards.length < 10; i++) {
      var el = items[i];
      var text = (el.textContent || "").trim();
      if (text.length < 10 || seen.has(text.slice(0, 50))) continue;
      seen.add(text.slice(0, 50));
      var titleEl = el.querySelector("h2, a, [class*='title']");
      var title = titleEl ? (titleEl.textContent || "").trim() : "";
      var coEl = el.querySelector("[class*='company']");
      var company = coEl ? (coEl.textContent || "").trim() : "";
      var locEl = el.querySelector("[class*='location']");
      var location = locEl ? (locEl.textContent || "").trim() : "";
      var link = el.querySelector("a[href]");
      var url = link ? (link as HTMLAnchorElement).href : "";
      if (title && title.length > 2) {
        cards.push({ title: title.slice(0, 200), company: company.slice(0, 200), location: location.slice(0, 200), url: url });
      }
    }
  }
  return cards;
}

// ═══════════════════════════════════════════════
// RECRUTEUR — Extracteurs Profil Candidat
// ═══════════════════════════════════════════════

export function extractLinkedInProfileFn(): any {
  var url = window.location.href;
  function cleanText(s: string): string {
    return (s || "").replace(/\s+/g, " ").replace(/[\n\r]+/g, " ").trim();
  }

  // Name
  var name = "";
  var nameEl = document.querySelector("h1") || document.querySelector("h1.text-heading-xlarge") || document.querySelector("[class*='pv-top-card'] h1");
  if (nameEl) name = cleanText(nameEl.textContent || "");

  // Title
  var title = "";
  var titleEl = document.querySelector("div.text-body-medium") || document.querySelector("[class*='pv-top-card--experience-list']") || document.querySelector("[class*='text-body-medium']");
  if (titleEl) title = cleanText(titleEl.textContent || "");

  // Location
  var location = "";
  var locEl = document.querySelector("span.text-body-small.inline") || document.querySelector("[class*='pv-top-card--list-bullet']") || document.querySelector("[class*='location']");
  if (locEl) location = cleanText(locEl.textContent || "");

  // About/Sommaire
  var about = "";
  var aboutSection = document.querySelector("#about") || document.querySelector("[class*='pv-about-section']");
  if (aboutSection) {
    var aboutText = aboutSection.querySelector("[class*='inline-show-more-text']") || aboutSection.querySelector("span[aria-hidden='true']") || aboutSection.querySelector("p");
    if (aboutText) about = cleanText(aboutText.textContent || "").slice(0, 2000);
  }

  // Experiences
  var experiences: Array<{ title: string; company: string; dates: string }> = [];
  var expSection = document.querySelector("#experience") || document.querySelector("[class*='pv-experience-section']");
  if (expSection) {
    var expItems = expSection.querySelectorAll("li");
    expItems.forEach(function(li) {
      var titleEl = li.querySelector("[class*='t-bold']") || li.querySelector("h3") || li.querySelector("strong");
      var companyEl = li.querySelector("[class*='t-normal']") || li.querySelector("span");
      var dateEl = li.querySelector("[class*='t-black--light']") || li.querySelector("[class*='date-range']");
      var t = titleEl ? cleanText(titleEl.textContent || "") : "";
      var c = companyEl ? cleanText(companyEl.textContent || "").replace(/^\u2022\s*/, "") : "";
      var d = dateEl ? cleanText(dateEl.textContent || "") : "";
      if (t.length > 1) experiences.push({ title: t, company: c, dates: d });
    });
  }

  // Skills
  var skills: string[] = [];
  var skillSection = document.querySelector("#skills") || document.querySelector("[class*='pv-skills-section']");
  if (skillSection) {
    var skillItems = skillSection.querySelectorAll("[class*='pv-skill-category-entity'] span[aria-hidden='true'], [class*='skill-name']");
    skillItems.forEach(function(s) {
      var sk = cleanText(s.textContent || "");
      if (sk.length > 1) skills.push(sk);
    });
  }

  return {
    type: "candidate",
    platform: "linkedin",
    url: url,
    name: name.slice(0, 150),
    title: title.slice(0, 200),
    location: location.slice(0, 150),
    about: about.slice(0, 3000),
    experiences: experiences.slice(0, 5),
    skills: skills.slice(0, 20),
    confidence: name.length > 0 ? 90 : 40,
  };
}

export function extractLinkedInSearchFn(): any {
  var profiles: any[] = [];
  var searchResults = document.querySelector(".reusable-search__entity-result-list, .search-results-container");
  if (!searchResults) searchResults = document.querySelector("[class*='search-results']");
  if (!searchResults) searchResults = document;

  var items = searchResults.querySelectorAll("li.reusable-search__result-container, li[class*='entity-result'], div[class*='search-result']");
  items.forEach(function(item) {
    var nameEl = item.querySelector("[class*='entity-result__title-text'] a, .actor-name, h3 a, [class*='t-bold']");
    var name = nameEl ? (nameEl.textContent || "").trim().split("\n")[0].trim().slice(0, 150) : "";

    var titleEl = item.querySelector("[class*='entity-result__primary-subtitle'], .subtitle, [class*='t-normal']");
    var title = titleEl ? (titleEl.textContent || "").trim().slice(0, 200) : "";

    var locEl = item.querySelector("[class*='entity-result__secondary-subtitle'], .location, [class*='t-black--light']");
    var location = locEl ? (locEl.textContent || "").trim().slice(0, 150) : "";

    var linkEl = item.querySelector("a.app-aware-link, a[href*='/in/']");
    var url = linkEl ? (linkEl as HTMLAnchorElement).href : "";

    if (name.length > 1) profiles.push({ name: name, title: title, location: location, url: url });
  });

  return {
    type: "candidate_search",
    platform: "linkedin",
    url: window.location.href,
    profiles: profiles.slice(0, 25),
    count: Math.min(profiles.length, 25),
  };
}

export function extractGitHubProfileFn(): any {
  function cleanText(s: string): string { return (s || "").replace(/\s+/g, " ").trim(); }

  var name = "";
  var nameEl = document.querySelector("span.p-name.vcard-fullname") || document.querySelector("h1 span.p-name");
  if (nameEl) name = cleanText(nameEl.textContent || "");

  var bio = "";
  var bioEl = document.querySelector("div.p-note.user-profile-bio") || document.querySelector("div[class*='user-profile-bio']");
  if (bioEl) bio = cleanText(bioEl.textContent || "");

  var location = "";
  var locEl = document.querySelector("li[itemprop='homeLocation'] span") || document.querySelector("[class*='vcard-detail'] span");
  if (locEl) location = cleanText(locEl.textContent || "");

  var langEls = document.querySelectorAll("[itemprop='programmingLanguage']");
  var languages: string[] = [];
  langEls.forEach(function(el) { languages.push(cleanText(el.textContent || "")); });

  return {
    type: "candidate",
    platform: "github",
    url: window.location.href,
    name: name.slice(0, 150),
    title: bio.slice(0, 300),
    location: location.slice(0, 150),
    about: bio.slice(0, 2000),
    skills: languages.slice(0, 15),
    confidence: name.length > 0 ? 80 : 30,
  };
}

export function extractGenericProfileFn(): any {
  function cleanText(s: string): string { return (s || "").replace(/\s+/g, " ").trim(); }

  var name = cleanText(document.title || "").split(" - ")[0].split(" | ")[0].slice(0, 100);

  var h1 = document.querySelector("h1");
  var titleEl = document.querySelector("h2");
  var title = "";
  if (h1) title = cleanText(h1.textContent || "").slice(0, 200);
  else if (titleEl) title = cleanText(titleEl.textContent || "").slice(0, 200);

  var metaDesc = document.querySelector("meta[name='description']");
  var about = metaDesc ? metaDesc.getAttribute("content") || "" : "";

  var bodyText = document.body ? document.body.innerText.slice(0, 5000) : "";

  return {
    type: "candidate",
    platform: "generic",
    url: window.location.href,
    name: name,
    title: title,
    location: "",
    about: about.slice(0, 2000),
    rawTextPreview: bodyText.slice(0, 3000),
    confidence: name.length > 1 ? 50 : 20,
  };
}
