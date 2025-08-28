import fs from "fs";
import { ModuleExports } from "./types";

const fileCache = new Map<string, { mtime: number; exports: ModuleExports }>();

export function getFileMtime(filePath: string): number {
  try {
    return fs.statSync(filePath).mtimeMs;
  } catch {
    return 0;
  }
}

export function getCachedExports(filePath: string): ModuleExports | null {
  const mtime = getFileMtime(filePath);
  const cached = fileCache.get(filePath);

  if (cached && cached.mtime === mtime) {
    return cached.exports;
  }

  return null;
}

export function setCachedExports(filePath: string, exports: ModuleExports): void {
  const mtime = getFileMtime(filePath);
  fileCache.set(filePath, { mtime, exports });
}

export { fileCache };