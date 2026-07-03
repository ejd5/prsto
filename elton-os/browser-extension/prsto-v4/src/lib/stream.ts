/**
 * Streaming fetch bridge — stub (not used in current build)
 * Real streaming is handled via chrome.runtime.connect in CopilotChat.tsx
 */

export interface StreamChunk {
  type: "open" | "delta" | "done" | "error";
  content?: string;
  full?: string;
  error?: string;
}
