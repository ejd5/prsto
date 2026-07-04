// ─── Activity Log helper ─────────────────────
import { esc } from "./helpers";

export function addLog(action: string, details: string) {
  chrome.storage.local.get(["activityLogs"], function(result) {
    var logs: any[] = result.activityLogs || [];
    logs.unshift({
      timestamp: new Date().toISOString(),
      action: action,
      details: details
    });
    if (logs.length > 50) logs = logs.slice(0, 50);
    chrome.storage.local.set({ activityLogs: logs } as any, function() {
      loadActivityLogs();
    });
  });
}

export function loadActivityLogs() {
  chrome.storage.local.get(["activityLogs"], function(result) {
    var container = document.getElementById("ai-action-log-container");
    if (!container) return;
    var logs: any[] = result.activityLogs || [];
    if (logs.length === 0) {
      container.innerHTML = '<div style="color:#666;font-style:italic;">Aucune action enregistrée.</div>';
      return;
    }
    var html = "";
    logs.forEach(function(l: any) {
      var date = new Date(l.timestamp).toLocaleTimeString("fr-FR");
      html += '<div style="margin-bottom:4px;border-bottom:1px solid #111;padding-bottom:2px;">' +
        '<span style="color:#c8a64e;margin-right:4px;">[' + date + ']</span>' +
        '<strong style="color:#eee;">' + esc(l.action) + '</strong><br>' +
        '<span style="color:#777;">' + esc(l.details) + '</span>' +
        '</div>';
    });
    container.innerHTML = html;
  });
}
