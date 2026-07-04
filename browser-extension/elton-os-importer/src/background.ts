/**
 * ELTON OS — Background Service Worker
 * Configure l'extension pour ouvrir le panneau latéral au clic sur l'icône,
 * et écoute les changements d'offres (changement d'URL/onglet) pour mettre à jour le Side Panel.
 */

chrome.sidePanel
  .setPanelBehavior({ openPanelOnActionClick: true })
  .catch((error) => console.error("Error setting panel behavior:", error));

// Écoute les changements d'URL sur le même onglet (ex: navigation split-view LinkedIn)
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.url) {
    chrome.runtime.sendMessage({
      type: "TAB_URL_CHANGED",
      url: changeInfo.url,
      tabId: tabId
    }).catch(() => {
      // Ignorer l'erreur si le panneau latéral est fermé (aucun listener actif)
    });
  }
});

// Écoute les changements d'onglets actifs
chrome.tabs.onActivated.addListener((activeInfo) => {
  chrome.tabs.get(activeInfo.tabId, (tab) => {
    if (tab && tab.url) {
      chrome.runtime.sendMessage({
        type: "TAB_URL_CHANGED",
        url: tab.url,
        tabId: activeInfo.tabId
      }).catch(() => {
        // Ignorer
      });
    }
  });
});
