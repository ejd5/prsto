// ─── Custom Toast Notification System ────────
export function showNotification(msg: string, type?: string) {
  var toast = document.getElementById("custom-toast");
  var messageEl = document.getElementById("toast-message");
  var iconEl = document.getElementById("toast-icon");
  if (!toast || !messageEl) return;

  messageEl.textContent = msg;

  if (type === "error") {
    (iconEl as HTMLElement).textContent = "✗";
    (iconEl as HTMLElement).style.background = "rgba(220,38,38,0.15)";
    (iconEl as HTMLElement).style.color = "#dc2626";
    (toast as HTMLElement).style.borderColor = "#dc2626";
  } else if (type === "warning") {
    (iconEl as HTMLElement).textContent = "⚠";
    (iconEl as HTMLElement).style.background = "rgba(245,158,11,0.15)";
    (iconEl as HTMLElement).style.color = "#f59e0b";
    (toast as HTMLElement).style.borderColor = "#f59e0b";
  } else {
    (iconEl as HTMLElement).textContent = "✓";
    (iconEl as HTMLElement).style.background = "rgba(139,92,246,0.15)";
    (iconEl as HTMLElement).style.color = "#8b5cf6";
    (toast as HTMLElement).style.borderColor = "#8b5cf6";
  }

  (toast as HTMLElement).style.display = "flex";

  if ((window as any).toastTimeout) clearTimeout((window as any).toastTimeout);
  (window as any).toastTimeout = setTimeout(function() {
    (toast as HTMLElement).style.display = "none";
  }, 4000);
}

export function bindCloseToast() {
  var closeToastBtn = document.getElementById("btn-close-toast");
  if (closeToastBtn) {
    closeToastBtn.addEventListener("click", function() {
      var toast = document.getElementById("custom-toast");
      if (toast) (toast as HTMLElement).style.display = "none";
    });
  }
}

// Override default window.alert to use the premium toast instead
export function customAlert(msg: string) {
  var type = "info";
  var lower = (msg || "").toLowerCase();
  if (lower.includes("erreur") || lower.includes("impossible") || lower.includes("manquant") || lower.includes("invalide") || lower.includes("échoué") || lower.includes("introuvable")) {
    type = "error";
  } else if (lower.includes("succès") || lower.includes("réussi") || lower.includes("copié") || lower.includes("injecté") || lower.includes("prêt") || lower.includes("généré")) {
    type = "success";
  }
  showNotification(msg, type);
}
