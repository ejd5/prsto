/**
 * PRSTO Copilot Background — Orchestrator
 * 
 * Responsibilities:
 * - Listen for content script extraction reports
 * - Route streaming IA requests from sidepanel to backend
 * - Manage long-running port connections for streaming
 * - Side panel activation on detected job sites
 * - Context menu integration
 */

import { getSettings } from "../lib/storage";
import { JobOffer } from "../lib/types";

// ─── Types ─────────────────────────────────────────

interface StreamRequest {
  cmd: "analyze" | "chat";
  payload: {
    offer?: JobOffer;
    message?: string;
    history?: { role: string; content: string }[];
  };
}

interface StreamResponse {
  type: "open" | "delta" | "done" | "error";
  content?: string;
  full?: string;
  error?: string;
  meta?: {
    score?: any;
    latencyMs?: number;
    tokens?: number;
  };
}

// ─── Message Routing ──────────────────────────────

chrome.runtime.onMessage.addListener((msg, sender, respond) => {
  if (msg?.type === "prsto:offerExtracted") {
    handleOfferExtracted(msg.data as JobOffer, respond);
    return true;
  }
  if (msg?.type === "prsto:getOffer") {
    handleGetOffer(respond);
    return true;
  }
  if (msg?.type === "prsto:saveOffer") {
    handleSaveOffer(msg.data as JobOffer, respond);
    return true;
  }
  return false;
});

// ─── Side Panel Activation ────────────────────────

chrome.runtime.onMessage.addListener((msg, sender) => {
  if (msg?.type === "prsto:openSidePanel") {
    chrome.sidePanel.open({ tabId: sender.tab?.id } as any).catch(() => {});
  }
  return false;
});

// ─── Long-lived streaming port ────────────────────

chrome.runtime.onConnect.addListener((port) => {
  if (port.name !== "prsto-stream") return;

  const streamRequests: StreamRequest[] = [];
  let currentAborter: AbortController | null = null;

  port.onMessage.addListener((msg: StreamRequest) => {
    streamRequests.push(msg);
    if (streamRequests.length === 1) processNextStreamRequest();
  });

  async function processNextStreamRequest() {
    while (streamRequests.length > 0) {
      const req = streamRequests[0];
      currentAborter = new AbortController();

      try {
        await streamToPort(req, port, currentAborter.signal);
      } catch (err: any) {
        if (err.name !== "AbortError") {
          port.postMessage({ type: "error", error: err.message || "Stream error" } as StreamResponse);
        }
      }

      streamRequests.shift();
      currentAborter = null;
    }
  }

  port.onDisconnect.addListener(() => {
    if (currentAborter) currentAborter.abort();
  });
});

async function streamToPort(
  req: StreamRequest,
  port: chrome.runtime.Port,
  signal: AbortSignal,
) {
  const settings = await getSettings();

  const body: Record<string, unknown> = {};

  if (req.cmd === "analyze" && req.payload.offer) {
    body.action = "analyze";
    body.offer = req.payload.offer;
    body.history = req.payload.history || [];
  } else if (req.cmd === "chat" && req.payload.message) {
    body.action = "chat";
    body.message = req.payload.message;
    body.offer = req.payload.offer;
    body.history = req.payload.history || [];
  } else {
    port.postMessage({ type: "error", error: "Invalid stream request" } as StreamResponse);
    return;
  }

  port.postMessage({ type: "open" } as StreamResponse);

  const startTime = Date.now();

  try {
    const fetchRes = await fetch(`${settings.baseUrl}/api/extension/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal,
    });

    if (!fetchRes.ok) {
      const errText = await fetchRes.text().catch(() => "");
      port.postMessage({
        type: "error",
        error: `Backend error ${fetchRes.status}: ${errText.slice(0, 150)}`,
      } as StreamResponse);
      return;
    }

    const reader = fetchRes.body?.getReader();
    if (!reader) {
      port.postMessage({ type: "error", error: "No response stream" } as StreamResponse);
      return;
    }

    const decoder = new TextDecoder();
    let fullText = "";
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith("data:")) continue;
        const raw = trimmed.slice(5).trim();

        if (raw === "[DONE]") {
          port.postMessage({
            type: "done",
            full: fullText,
            meta: { latencyMs: Date.now() - startTime },
          } as StreamResponse);
          return;
        }

        try {
          const parsed = JSON.parse(raw) as { delta?: string; score?: any; tokens?: number };
          if (parsed.delta) {
            fullText += parsed.delta;
            port.postMessage({
              type: "delta",
              content: parsed.delta,
              full: fullText,
              meta: { score: parsed.score, tokens: parsed.tokens },
            } as StreamResponse);
          } else if (parsed.score) {
            port.postMessage({
              type: "delta",
              content: fullText,
              full: fullText,
              meta: { score: parsed.score, tokens: parsed.tokens },
            } as StreamResponse);
          }
        } catch {
          // Non-JSON line — skip silently
        }
      }
    }

    if (buffer.trim()) {
      try {
        const parsed = JSON.parse(buffer.trim());
        if (parsed.delta) {
          fullText += parsed.delta;
          port.postMessage({ type: "delta", content: parsed.delta, full: fullText } as StreamResponse);
        }
      } catch {}
    }

    port.postMessage({
      type: "done",
      full: fullText,
      meta: { latencyMs: Date.now() - startTime },
    } as StreamResponse);
  } catch (err: any) {
    if (err.name !== "AbortError") {
      port.postMessage({ type: "error", error: err.message || "Network error" } as StreamResponse);
    }
  }
}

// ─── Content script injection ─────────────────────

async function handleOfferExtracted(offer: JobOffer, respond: (result: any) => void) {
  try {
    const settings = await getSettings();

    // Persist in storage
    await chrome.storage.local.set({ ["prsto:lastOffer"]: offer });

    // Open sidepanel with context
    chrome.sidePanel.open({} as any).catch(() => {});

    respond({ success: true });

    // Send to backend for fast scoring
    try {
      const scoreRes = await fetch(`${settings.baseUrl}/api/extension/score`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ offer }),
      });

      if (scoreRes.ok) {
        const scoreData = await scoreRes.json();
        // Broadcast to sidepanel if open
        chrome.runtime.sendMessage({
          type: "prsto:scoreReady",
          data: { offer, score: scoreData },
        }).catch(() => {});
      }
    } catch {}
  } catch (err: any) {
    respond({ success: false, error: err.message });
  }
}

async function handleGetOffer(respond: (result: any) => void) {
  const raw = await chrome.storage.local.get("prsto:lastOffer");
  respond(raw["prsto:lastOffer"] || null);
}

async function handleSaveOffer(offer: JobOffer, respond: (result: any) => void) {
  await chrome.storage.local.set({ ["prsto:lastOffer"]: offer });
  respond({ success: true });
}

// ─── Context menu ──────────────────────────────────

chrome.runtime.onInstalled.addListener(() => {
  const _menus = {
    contextMenus: chrome.contextMenus as any,
  };

  _menus.contextMenus?.create?.({
    id: "prsto-analyze",
    title: "Analyser avec PRSTO Copilot",
    contexts: ["page"],
    documentUrlPatterns: [
      "https://*.linkedin.com/*",
      "https://*.indeed.com/*",
      "https://*.indeed.fr/*",
      "https://www.apec.fr/*",
      "https://www.cadremploi.fr/*",
      "https://www.welcometothejungle.com/*",
    ],
  });
});

chrome.contextMenus?.onClicked?.addListener((info, tab) => {
  if (info.menuItemId === "prsto-analyze" && tab?.id) {
    chrome.sidePanel.open({ tabId: tab.id });
    chrome.tabs.sendMessage(tab.id, { type: "prsto:extractOffer" }).catch(() => {});
  }
});

// ─── Side panel set behavior ──────────────────────

try {
  chrome.sidePanel?.setPanelBehavior?.({ openPanelOnActionClick: true }).catch(() => {});
} catch {}

export {};