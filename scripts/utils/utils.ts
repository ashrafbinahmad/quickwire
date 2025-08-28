import path from "path";

export function pascalToKebab(str: string): string {
  return str.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase();
}

export function shouldProcessFile(filePath: string, CONFIG: any): boolean {
  const ext = path.extname(filePath);
  if (!CONFIG.supportedExtensions.includes(ext)) return false;

  const fileName = path.basename(filePath);
  const relativePath = path.relative(process.cwd(), filePath);

  // Check exclude patterns
  for (const pattern of CONFIG.excludePatterns) {
    if (
      fileName.match(pattern.replace("*", ".*")) ||
      relativePath.includes(pattern.replace("*", ""))
    ) {
      return false;
    }
  }

  return true;
}

export function sanitizeFilePath(filePath: string): string {
  return path.normalize(filePath).replace(/\\/g, "/");
}