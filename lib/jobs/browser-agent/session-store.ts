import path from "path";
import fs from "fs";
import os from "os";
import type { BrowserPlatform, PlatformSessionPaths } from "./types";

const SESSION_ROOT = path.join(os.homedir(), ".elton", "browser-sessions");

function ensureDir(dir: string): void {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

export function getSessionPaths(platform: BrowserPlatform): PlatformSessionPaths {
  const sessionDir = path.join(SESSION_ROOT, platform);
  return {
    sessionDir,
    storageFile: path.join(sessionDir, "storage-state.json"),
  };
}

export function sessionExists(platform: BrowserPlatform): boolean {
  const { storageFile } = getSessionPaths(platform);
  return fs.existsSync(storageFile);
}

export function getSessionAge(platform: BrowserPlatform): number | null {
  const { storageFile } = getSessionPaths(platform);
  if (!fs.existsSync(storageFile)) return null;
  const stats = fs.statSync(storageFile);
  return Date.now() - stats.mtimeMs;
}

export function saveStorageState(platform: BrowserPlatform, storageState: Record<string, unknown>): void {
  const { sessionDir, storageFile } = getSessionPaths(platform);
  ensureDir(sessionDir);
  fs.writeFileSync(storageFile, JSON.stringify(storageState, null, 2), "utf-8");
  // Permissions restrictives (optionnel — peut échouer sur certains FS)
  try { fs.chmodSync(storageFile, 0o600); } catch { /* ignore */ }
}

export function loadStorageState(platform: BrowserPlatform): Record<string, unknown> | null {
  const { storageFile } = getSessionPaths(platform);
  if (!fs.existsSync(storageFile)) return null;
  try {
    const raw = fs.readFileSync(storageFile, "utf-8");
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function deleteSession(platform: BrowserPlatform): void {
  const { storageFile } = getSessionPaths(platform);
  if (fs.existsSync(storageFile)) fs.unlinkSync(storageFile);
}

export function getSessionRoot(): string {
  ensureDir(SESSION_ROOT);
  return SESSION_ROOT;
}

/** Vérifie que .gitignore contient .elton/ */
export function ensureGitIgnore(): void {
  const gitignorePath = path.join(process.cwd(), ".gitignore");
  if (!fs.existsSync(gitignorePath)) {
    fs.writeFileSync(gitignorePath, ".elton/\n", "utf-8");
    return;
  }
  const content = fs.readFileSync(gitignorePath, "utf-8");
  if (!content.includes(".elton/")) {
    fs.appendFileSync(gitignorePath, "\n# Sessions navigateur PRSTO\n.elton/\n");
  }
}
