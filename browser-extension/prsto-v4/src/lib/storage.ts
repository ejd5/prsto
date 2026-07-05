/**
 * Wrapper chrome.storage.local — promises + types
 */

import { ExtensionSettings, DEFAULT_SETTINGS, JobOffer, ChatMessage } from "./types";

const STORAGE_KEYS = {
  settings: "prsto:settings",
  lastOffer: "prsto:lastOffer",
  conversation: "prsto:conversation",
  history: "prsto:history",
} as const;

export async function getSettings(): Promise<ExtensionSettings> {
  const raw = await chrome.storage.local.get(STORAGE_KEYS.settings);
  const stored = raw[STORAGE_KEYS.settings] as Partial<ExtensionSettings> | undefined;
  return { ...DEFAULT_SETTINGS, ...(stored || {}) };
}

export async function saveSettings(settings: ExtensionSettings): Promise<void> {
  await chrome.storage.local.set({ [STORAGE_KEYS.settings]: settings });
}

export async function patchSettings(patch: Partial<ExtensionSettings>): Promise<ExtensionSettings> {
  const current = await getSettings();
  const next = { ...current, ...patch };
  await saveSettings(next);
  return next;
}

export async function getLastOffer(): Promise<JobOffer | null> {
  const raw = await chrome.storage.local.get(STORAGE_KEYS.lastOffer);
  return (raw[STORAGE_KEYS.lastOffer] as JobOffer | undefined) || null;
}

export async function setLastOffer(offer: JobOffer): Promise<void> {
  await chrome.storage.local.set({ [STORAGE_KEYS.lastOffer]: offer });
}

export async function getConversation(): Promise<ChatMessage[]> {
  const raw = await chrome.storage.local.get(STORAGE_KEYS.conversation);
  return (raw[STORAGE_KEYS.conversation] as ChatMessage[] | undefined) || [];
}

export async function saveConversation(messages: ChatMessage[]): Promise<void> {
  await chrome.storage.local.set({ [STORAGE_KEYS.conversation]: messages });
}

export async function appendHistory(entry: { offer: JobOffer; action: string; at: string }): Promise<void> {
  const raw = await chrome.storage.local.get(STORAGE_KEYS.history);
  const history = (raw[STORAGE_KEYS.history] as Array<typeof entry> | undefined) || [];
  history.unshift({ ...entry });
  await chrome.storage.local.set({ [STORAGE_KEYS.history]: history.slice(0, 50) });
}

export function generateId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}
