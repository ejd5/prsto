/**
 * ELTON OS — Post-Apply Confirmation Detector
 * Détecte qu'une candidature a été envoyée après action manuelle de l'utilisateur.
 * AUCUN auto-submit. Détection passive uniquement après navigation vers page de confirmation.
 */

const POST_APPLY_SIGNALS = {
  indeed: {
    urlPatterns: ["/post-apply", "smartapply.indeed.com", "indeedapply"],
    confirmationTexts: [
      "Votre candidature a bien été envoyée",
      "candidature a bien été envoyée",
      "Vous recevrez un email de confirmation",
      "Your application has been submitted",
      "application has been submitted",
      "You will receive a confirmation email",
      "Votre candidature a été envoyée",
      "votre candidature a été soumise",
    ],
  },
  linkedin: {
    urlPatterns: ["linkedin.com/jobs", "easyapply"],
    confirmationTexts: [
      "Votre candidature a été envoyée",
      "Application submitted",
      "Your application was sent",
      "Candidature envoyée avec succès",
      "Votre candidature a été soumise",
    ],
  },
  apec: {
    urlPatterns: ["apec.fr"],
    confirmationTexts: [
      "Votre candidature a bien été transmise",
      "Candidature envoyée",
      "Votre candidature a été prise en compte",
      "Candidature transmise avec succès",
    ],
  },
  generic_ats: {
    urlPatterns: [],
    confirmationTexts: [
      "Thank you for applying",
      "Merci pour votre candidature",
      "Application submitted",
      "Your application has been received",
      "Thank you for your application",
      "Votre candidature a bien été reçue",
      "Nous avons bien reçu votre candidature",
      "Your resume has been submitted",
    ],
  },
};

// Mots isolés à ne JAMAIS utiliser seuls pour la détection
const LOW_CONFIDENCE_WORDS = ["merci", "thanks", "thank you", "envoyé", "submitted", "reçu", "received"];

/**
 * Detect if the current page is a post-apply confirmation page.
 * @param {string} pageUrl - Current page URL
 * @param {string} pageText - Visible text content of the page
 * @returns {object} Detection result
 */
function detectPostApplyConfirmation(pageUrl, pageText) {
  if (!pageUrl || !pageText) {
    return { detected: false, platform: null, confidence: "low", confirmationText: "", pageUrl: pageUrl || "", detectedAt: new Date().toISOString() };
  }

  const urlLower = pageUrl.toLowerCase();
  const textLower = pageText.toLowerCase();
  let bestMatch = null;

  for (const [platform, signals] of Object.entries(POST_APPLY_SIGNALS)) {
    const urlMatch = signals.urlPatterns.some(pattern => urlLower.includes(pattern.toLowerCase()));
    let textMatch = null;

    for (const confirmation of signals.confirmationTexts) {
      if (textLower.includes(confirmation.toLowerCase())) {
        textMatch = confirmation;
        break;
      }
    }

    if (textMatch) {
      let confidence = "medium";
      if (urlMatch) {
        confidence = "high"; // URL + texte = haute confiance
      }
      if (!urlMatch && platform === "generic_ats") {
        confidence = "low"; // Texte générique sans URL spécifique
      }
      // Vérifier que ce n'est pas juste un mot isolé
      const isOnlyIsolatedWord = LOW_CONFIDENCE_WORDS.some(w => {
        return textMatch.toLowerCase().trim() === w.toLowerCase() && !urlMatch;
      });
      if (isOnlyIsolatedWord) continue;

      if (!bestMatch || (confidence === "high" && bestMatch.confidence !== "high")) {
        bestMatch = { platform, confidence, confirmationText: textMatch };
      }
    }
  }

  if (!bestMatch) {
    return { detected: false, platform: null, confidence: "low", confirmationText: "", pageUrl, detectedAt: new Date().toISOString() };
  }

  return {
    detected: true,
    platform: bestMatch.platform,
    confidence: bestMatch.confidence,
    confirmationText: bestMatch.confirmationText,
    pageUrl,
    detectedAt: new Date().toISOString(),
  };
}

// Export for use in popup.js and content scripts
if (typeof module !== "undefined" && module.exports) {
  module.exports = { detectPostApplyConfirmation, POST_APPLY_SIGNALS };
}
