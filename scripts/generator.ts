import fs from "fs";
import path from "path";
import { CONFIG } from "./config";
import {
  sanitizeFilePath,
  pascalToKebab,
  shouldProcessFile,
} from "./utils/utils";
import { analyzeModuleExports } from "./ast";
import { fileCache } from "./cache";
import { ExportedFunction, ModuleExports } from "./types";

// Enhanced file tracking with metadata
interface FileMetadata {
  generatedAt: number;
  sourceFile: string;
  checksum: string;
}

export const generatedFiles = new Map<string, FileMetadata>();
export const docCache = new Map<string, any>();
export const backendToGenerated = new Map<string, Set<string>>();
export const deletedFiles = new Set<string>();
export const changedFiles = new Set<string>();
export const fileOperationQueue = new Set<() => Promise<void>>();

let lastFullScan = 0;
let isProcessing = false;

// Utility functions for better file management
function calculateFileChecksum(filePath: string): string {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    // Simple checksum using content hash
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(16);
  } catch (error) {
    console.warn(`⚠️ Failed to calculate checksum for ${filePath}:`, error);
    return Date.now().toString();
  }
}

function ensureDirectoryExists(dirPath: string): boolean {
  try {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
      console.log(`📁 Created directory: ${path.relative(process.cwd(), dirPath)}`);
    }
    return true;
  } catch (error) {
    console.error(`❌ Failed to create directory ${dirPath}:`, error);
    return false;
  }
}

function safeWriteFile(filePath: string, content: string, sourceFile: string): boolean {
  try {
    const dirPath = path.dirname(filePath);
    if (!ensureDirectoryExists(dirPath)) {
      return false;
    }

    // Create temporary file first
    const tempPath = `${filePath}.tmp`;
    fs.writeFileSync(tempPath, content, "utf8");
    
    // Atomic move
    fs.renameSync(tempPath, filePath);
    
    // Track the generated file
    const metadata: FileMetadata = {
      generatedAt: Date.now(),
      sourceFile,
      checksum: calculateFileChecksum(filePath)
    };
    generatedFiles.set(filePath, metadata);
    
    console.log(`✅ Generated: ${path.relative(process.cwd(), filePath)}`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to write file ${filePath}:`, error);
    
    // Clean up temp file if it exists
    try {
      const tempPath = `${filePath}.tmp`;
      if (fs.existsSync(tempPath)) {
        fs.unlinkSync(tempPath);
      }
    } catch (cleanupError) {
      console.warn(`⚠️ Failed to cleanup temp file:`, cleanupError);
    }
    
    return false;
  }
}

function safeRemoveFile(filePath: string): boolean {
  try {
    if (fs.existsSync(filePath)) {
      // Check if it's actually a generated file
      const stat = fs.statSync(filePath);
      if (!stat.isFile()) {
        console.warn(`⚠️ Skipping removal of non-file: ${filePath}`);
        return false;
      }

      fs.unlinkSync(filePath);
      console.log(`🗑️ Removed: ${path.relative(process.cwd(), filePath)}`);
    }
    
    generatedFiles.delete(filePath);
    return true;
  } catch (error) {
    console.error(`❌ Failed to remove file ${filePath}:`, error);
    return false;
  }
}

function safeRemoveDirectory(dirPath: string): boolean {
  try {
    if (!fs.existsSync(dirPath)) return true;
    
    const entries = fs.readdirSync(dirPath);
    if (entries.length === 0) {
      fs.rmdirSync(dirPath);
      console.log(`🗑️ Removed empty directory: ${path.relative(process.cwd(), dirPath)}`);
      return true;
    }
    return false;
  } catch (error) {
    console.warn(`⚠️ Failed to remove directory ${dirPath}:`, error);
    return false;
  }
}

export function markFileChanged(filePath: string): void {
  if (isProcessing) {
    console.log(`⏸️ Queueing change for ${path.relative(process.cwd(), filePath)} (processing in progress)`);
  }
  
  changedFiles.add(filePath);
  fileCache.delete(filePath); // Invalidate cache
  
  // Remove from deleted files if it was marked as deleted
  deletedFiles.delete(filePath);
}

export function markFileDeleted(filePath: string): void {
  deletedFiles.add(filePath);
  changedFiles.delete(filePath);
  fileCache.delete(filePath);
  
  console.log(`🗑️ Marked for deletion: ${path.relative(process.cwd(), filePath)}`);
}

function shouldRegenerateEverything(): boolean {
  const now = Date.now();
  const timeSinceLastScan = now - lastFullScan;
  const hasChanges = changedFiles.size > 0 || deletedFiles.size > 0;
  const cacheExpired = timeSinceLastScan > CONFIG.performance.cacheExpiryMs;
  const tooManyChanges = changedFiles.size > CONFIG.performance.maxFilesToProcess * 0.5;

  // Log the reason for regeneration
  console.log(
    `🔍 Regeneration check: Changes: ${hasChanges} (${changedFiles.size} files), ` +
    `Cache expired: ${cacheExpired}, Too many changes: ${tooManyChanges}`
  );

  if (hasChanges && changedFiles.size > 0) {
    const recentChanges = Array.from(changedFiles)
      .slice(0, 5)
      .map(f => path.relative(process.cwd(), f))
      .join(", ");
    console.log(`   Recent changes: ${recentChanges}${changedFiles.size > 5 ? '...' : ''}`);
  }

  if (deletedFiles.size > 0) {
    const deletedList = Array.from(deletedFiles)
      .slice(0, 3)
      .map(f => path.relative(process.cwd(), f))
      .join(", ");
    console.log(`   Deleted: ${deletedList}${deletedFiles.size > 3 ? '...' : ''}`);
  }

  return hasChanges || cacheExpired || tooManyChanges;
}

function isObjectDestructured(param: ExportedFunction["parameters"][0]): boolean {
  return param.type.startsWith("{") && param.type.endsWith("}");
}

function generateFunctionSignature(func: ExportedFunction): {
  parameterType: string;
  callSignature: string;
  parameterUsage: string;
} {
  if (func.parameters.length === 0) {
    return {
      parameterType: "void",
      callSignature: "() =>",
      parameterUsage: "",
    };
  }

  if (func.parameters.length === 1) {
    const param = func.parameters[0];

    if (isObjectDestructured(param)) {
      return {
        parameterType: param.type,
        callSignature: `(${param.name}${param.optional ? "?" : ""}: ${param.type}) =>`,
        parameterUsage: param.name,
      };
    }

    const originalParamType = param.type;
    const objectParamType = `{ ${param.name}${param.optional ? "?" : ""}: ${param.type} }`;

    return {
      parameterType: `${originalParamType} | ${objectParamType}`,
      callSignature: `(${param.name}${param.optional ? "?" : ""}: ${originalParamType} | ${objectParamType}) =>`,
      parameterUsage: `typeof ${param.name} === 'object' && '${param.name}' in ${param.name} ? ${param.name} : { ${param.name}: ${param.name} }`,
    };
  }

  const paramStrings = func.parameters.map(
    (p) => `${p.name}${p.optional ? "?" : ""}: ${p.type}`
  );
  const objectType = `{ ${paramStrings.join("; ")} }`;

  return {
    parameterType: objectType,
    callSignature: `(params: ${objectType}) =>`,
    parameterUsage: "params",
  };
}

export function generateQuickwireFile(
  filePath: string,
  endpoints: Record<string, { route: string; method: string }>
): boolean {
  try {
    const relativePath = sanitizeFilePath(path.relative(CONFIG.backendDir, filePath));
    const moduleExports = analyzeModuleExports(filePath);

    if (moduleExports.functions.length === 0) {
      console.log(`⏭️ Skipping ${relativePath} - no exported functions`);
      return false;
    }

    const quickwireFilePath = path.join(CONFIG.quickwireDir, relativePath);

    const lines: string[] = [
      "// Auto-generated by Quickwire",
      "// Do not edit manually - changes will be overwritten",
      `// Generated from: ${relativePath}`,
      `// Generated at: ${new Date().toISOString()}`,
      "",
      "type UnwrapPromise<T> = T extends Promise<infer U> ? U : T;",
      "",
    ];

    lines.push(`import { makeQuickwireRequest } from "quickwire/utils";`);
    lines.push(`import { convertToFormData } from "quickwire/utils";`);
    lines.push("");

    const backendImportPath = `@/backend/${relativePath.replace(/\.[tj]s$/, "")}`;
    const functionImports = moduleExports.functions
      .map((func) => `${func.name} as ${func.name}Internal`)
      .join(", ");

    if (functionImports) {
      lines.push(`import { ${functionImports} } from "${backendImportPath}";`);
      lines.push("");
    }

    moduleExports.types.forEach((type) => {
      lines.push(type.declaration);
      lines.push("");
    });

    let functionsGenerated = 0;

    moduleExports.functions.forEach((func) => {
      const endpointInfo = endpoints[func.name];
      if (!endpointInfo) {
        console.warn(`⚠️ No endpoint info for function ${func.name} in ${relativePath}`);
        return;
      }

      let route = endpointInfo.route;
      const method = endpointInfo.method;

      if (!route.startsWith("/api")) {
        route = `/api${route}`;
      }

      const signature = generateFunctionSignature(func);

      function typeStringHasFile(typeStr: string): boolean {
        if (!typeStr) return false;
        const type = typeStr.toLowerCase();
        return (
          type === "file" ||
          type === "file[]" ||
          type === "blob" ||
          type === "blob[]" ||
          type === "formdata" ||
          type.includes("file") ||
          type.includes("blob") ||
          type.includes("formdata") ||
          /\bfile\b/i.test(typeStr) ||
          /\bblob\b/i.test(typeStr) ||
          /\bformdata\b/i.test(typeStr)
        );
      }

      const hasFileParam = func.parameters.some((p) => typeStringHasFile(p.type));

      if (method === "GET" || method === "DELETE") {
        if (func.parameters.length === 1 && isObjectDestructured(func.parameters[0])) {
          // Single object parameter - use the object type
          const param = func.parameters[0];
          lines.push(`export const ${func.name} = (${param.name}${param.optional ? "?" : ""}: ${param.type}) => {`);
          lines.push(`  const query = new URLSearchParams();`);
          // For object destructured params, we need to iterate over the object properties
          lines.push(`  if (${param.name}) {`);
          lines.push(`    Object.entries(${param.name}).forEach(([key, value]) => {`);
          lines.push(`      if (value !== undefined && value !== null) query.append(key, String(value));`);
          lines.push(`    });`);
          lines.push(`  }`);
        } else {
          // Multiple parameters or simple parameters
          const paramDeclarations = func.parameters.map(p => 
            `${p.name}${p.optional ? "?" : ""}: ${p.type}`
          ).join(", ");
          lines.push(`export const ${func.name} = (${paramDeclarations}) => {`);
          lines.push(`  const query = new URLSearchParams();`);
          func.parameters.forEach((p) => {
            lines.push(
              `  if (${p.name} !== undefined) query.append("${p.name}", String(${p.name}));`
            );
          });
        }
        lines.push(
          `  return makeQuickwireRequest<UnwrapPromise<ReturnType<typeof ${func.name}Internal>>>(\`${route}?\${query.toString()}\`, "${method}");`
        );
        lines.push("};");
      } else if (hasFileParam) {
        lines.push(
          `export const ${func.name} = (params: ${signature.parameterType}) => {`
        );
        lines.push(`  const formData = convertToFormData(params);`);
        lines.push(
          `  return makeQuickwireRequest<UnwrapPromise<ReturnType<typeof ${func.name}Internal>>>(\`${route}\`, "${method}", formData);`
        );
        lines.push("};");
      } else {
        const allOptional = func.parameters.every((p) => p.optional);
        const optionalModifier =
          allOptional && !signature.parameterType.includes("|") ? "?" : "";

        const paramDecl =
          func.parameters.length === 1 && !isObjectDestructured(func.parameters[0])
            ? `${func.parameters[0].name}${optionalModifier}: ${signature.parameterType}`
            : `params${optionalModifier}: ${signature.parameterType}`;

        const paramUsage =
          func.parameters.length === 1 && !isObjectDestructured(func.parameters[0])
            ? signature.parameterUsage
            : signature.parameterUsage || "params";

        lines.push(`export const ${func.name} = (${paramDecl}) => {`);
        lines.push(
          `  return makeQuickwireRequest<UnwrapPromise<ReturnType<typeof ${func.name}Internal>>>(\`${route}\`, "${method}", ${paramUsage});`
        );
        lines.push("};");
      }

      lines.push("");
      functionsGenerated++;
    });

    const success = safeWriteFile(quickwireFilePath, lines.join("\n"), filePath);
    
    if (success) {
      console.log(`✅ Generated quickwire file with ${functionsGenerated} functions: ${path.relative(process.cwd(), quickwireFilePath)}`);
    }
    
    return success;
  } catch (error) {
    console.error(`❌ Failed to generate quickwire file for ${filePath}:`, error);
    return false;
  }
}

export function generateApiRoutesForFile(
  filePath: string
): Record<string, { route: string; method: string }> {
  const relativePath = sanitizeFilePath(path.relative(CONFIG.backendDir, filePath));
  const moduleExports = analyzeModuleExports(filePath);
  const endpoints: Record<string, { route: string; method: string }> = {};

  if (moduleExports.functions.length === 0) {
    return endpoints;
  }

  moduleExports.functions.forEach((func) => {
    try {
      const route = `/${relativePath.replace(/\.[tj]s$/, "")}/${pascalToKebab(func.name)}`;
      const method = func.httpMethod || "POST";
      endpoints[func.name] = { route, method };

      const apiFilePath = path.join(CONFIG.apiDir, route, CONFIG.apiRouteTemplate);

      let parameterHandling = "";
      let functionCallParams: string[] = [];

      const fileParams = func.parameters.filter((p) => {
        const type = p.type.toLowerCase();
        return (
          type === "file" ||
          type === "file[]" ||
          type === "blob" ||
          type === "blob[]" ||
          type === "formdata" ||
          type.includes("file") ||
          type.includes("blob") ||
          type.includes("formdata") ||
          /\bfile\b/i.test(p.type) ||
          /\bblob\b/i.test(p.type) ||
          /\bformdata\b/i.test(p.type)
        );
      });

      if (["GET", "DELETE"].includes(method)) {
        parameterHandling = `
  const { searchParams } = new URL(req.url);
${func.parameters
  .map((p) => `  const ${p.name} = searchParams.get("${p.name}");`)
  .join("\n")}
        `.trim();

        functionCallParams = func.parameters.map((p) => p.name);
      } else if (fileParams.length > 0) {
        parameterHandling = `
  function parseNestedValue(value: string): any {
    // Try to parse as JSON for nested objects/arrays
    if (value.startsWith('{') || value.startsWith('[')) {
      try {
        return JSON.parse(value);
      } catch {
        return value;
      }
    }
    // Try to parse as boolean
    if (value === 'true') return true;
    if (value === 'false') return false;
    // Try to parse as number
    if (!isNaN(Number(value)) && value !== '') {
      return Number(value);
    }
    return value;
  }

  function assignDeep(obj: any, keyPath: string, value: any): void {
    const keys = keyPath.replace(/\\]/g, '').split(/[\\[.]/);
    let current = obj;
    
    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i];
      if (!key) continue; // Skip empty keys from split
      
      if (!current[key]) {
        // Check if next key is a number (array index)
        const nextKey = keys[i + 1];
        current[key] = !isNaN(Number(nextKey)) ? [] : {};
      }
      current = current[key];
    }
    
    const lastKey = keys[keys.length - 1];
    if (lastKey) {
      current[lastKey] = value instanceof File ? value : parseNestedValue(value.toString());
    }
  }

  function formDataToObject(formData: FormData): any {
    const obj: any = {};
    
    for (const [key, value] of formData.entries()) {
      assignDeep(obj, key, value);
    }
    
    return obj;
  }

  let formData: FormData;
  try {
    const contentType = req.headers.get('content-type');
    if (!contentType || !contentType.includes('multipart/form-data')) {
      throw new Error('Expected multipart/form-data');
    }
    formData = await req.formData();
    
    console.log('FormData entries:');
    for (const [key, value] of formData.entries()) {
      console.log(\`  \${key}: \${value instanceof File ? \`File(\${value.name})\` : value}\`);
    }
  } catch (error) {
    throw new Error(\`Invalid file upload: \${error instanceof Error ? error.message : 'Unknown error'}\`);
  }
  
  const params = formDataToObject(formData);
  console.log('Parsed params:', JSON.stringify(params, (key, value) => 
    value instanceof File ? \`File(\${value.name})\` : value, 2));
`;

        if (func.parameters.length === 1 && isObjectDestructured(func.parameters[0])) {
          functionCallParams = ["params"];
        } else {
          functionCallParams = func.parameters.map((p) => `params["${p.name}"]`);
        }
      } else {
        parameterHandling = `
  let body: any;
  try {
    const contentType = req.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      body = await req.json();
    } else {
      const textBody = await req.text();
      body = textBody ? JSON.parse(textBody) : {};
    }
  } catch (error) {
    body = {};
  }
`;

        if (func.parameters.length === 1 && isObjectDestructured(func.parameters[0])) {
          functionCallParams = ["body"];
        } else {
          functionCallParams = func.parameters.map((p) => `body["${p.name}"]`);
        }
      }

      const functionCall = `${func.isAsync ? "await " : ""}${func.name}(${functionCallParams.join(", ")})`;

      const handlerCode = `import { ${func.name} } from "@/backend/${relativePath.replace(/\.[tj]s$/, "")}";
import { NextResponse } from "next/server";

export async function ${method}(req: Request) {
  try {
${parameterHandling}
    const result = ${functionCall};
    return NextResponse.json(result ?? null);
  } catch (error) {
    console.error("API Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
`;

      const success = safeWriteFile(apiFilePath, handlerCode, filePath);
      
      if (!success) {
        console.error(`❌ Failed to generate API route for ${func.name}`);
      }
    } catch (error) {
      console.error(`❌ Error generating API route for ${func.name}:`, error);
    }
  });

  return endpoints;
}

// ... [Rest of the API documentation functions remain the same] ...

function cleanupOrphanedFiles(): void {
  console.log("🧹 Starting cleanup of orphaned files...");
  
  const cleanupDirs = [CONFIG.quickwireDir, CONFIG.apiDir];
  let removedCount = 0;

  for (const dir of cleanupDirs) {
    if (!fs.existsSync(dir)) continue;

    try {
      removedCount += walkAndCleanup(dir);
    } catch (error) {
      console.warn(`⚠️ Failed to cleanup directory ${dir}:`, error);
    }
  }

  console.log(`🧹 Cleanup completed: removed ${removedCount} orphaned files`);
}

function walkAndCleanup(dir: string): number {
  let removedCount = 0;
  
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        removedCount += walkAndCleanup(fullPath);
        
        // Try to remove empty directory
        try {
          const isEmpty = fs.readdirSync(fullPath).length === 0;
          if (isEmpty && safeRemoveDirectory(fullPath)) {
            // Directory was removed, don't count in removedCount as it's not a file
          }
        } catch {
          // Directory not empty or other error, ignore
        }
      } else if (entry.isFile()) {
        // Only remove TypeScript/JavaScript files that we didn't generate
        if (
          (fullPath.endsWith(".ts") || fullPath.endsWith(".js")) &&
          !generatedFiles.has(fullPath)
        ) {
          // Additional safety: check if file contains generated marker
          try {
            const content = fs.readFileSync(fullPath, 'utf8');
            if (content.includes('Auto-generated by Quickwire')) {
              if (safeRemoveFile(fullPath)) {
                removedCount++;
              }
            }
          } catch (error) {
            console.warn(`⚠️ Could not read file for cleanup check ${fullPath}:`, error);
          }
        }
      }
    }
  } catch (error) {
    console.warn(`⚠️ Error during cleanup walk in ${dir}:`, error);
  }

  return removedCount;
}

export function processBackendFile(filePath: string): boolean {
  if (!shouldProcessFile(filePath, CONFIG) || !fs.existsSync(filePath)) {
    return false;
  }

  try {
    // Clean up old generated files for this backend file
    const oldSet = backendToGenerated.get(filePath);
    if (oldSet) {
      console.log(`🧹 Cleaning up ${oldSet.size} old files for ${path.relative(process.cwd(), filePath)}`);
      
      for (const oldFile of oldSet) {
        safeRemoveFile(oldFile);
      }
      backendToGenerated.delete(filePath);
    }

    const moduleExports = analyzeModuleExports(filePath);
    if (moduleExports.functions.length === 0) {
      console.log(`⏭️ No functions found in ${path.relative(process.cwd(), filePath)}`);
      return false;
    }

    const beforeSize = generatedFiles.size;

    const endpoints = generateApiRoutesForFile(filePath);
    const quickwireSuccess = generateQuickwireFile(filePath, endpoints);

    if (!quickwireSuccess) {
      console.warn(`⚠️ Failed to generate quickwire file for ${filePath}`);
      return false;
    }

    // Track newly generated files for this backend file
    const newFiles = new Set<string>();
    for (const [filePath, metadata] of generatedFiles) {
      if (metadata.sourceFile === filePath) {
        newFiles.add(filePath);
      }
    }

    if (newFiles.size > 0) {
      backendToGenerated.set(filePath, newFiles);
      console.log(`📊 Generated ${newFiles.size} files from ${path.relative(process.cwd(), filePath)}`);
    }

    return true;
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error);
    return false;
  }
}

export async function scanAllBackendFunctions(): Promise<void> {
  if (isProcessing) {
    console.log("⏸️ Scan already in progress, skipping...");
    return;
  }

  isProcessing = true;
  
  try {
    const now = Date.now();
    const isFullRegen = shouldRegenerateEverything();
    const hasChanges = changedFiles.size > 0 || deletedFiles.size > 0;

    if (!hasChanges && !isFullRegen) {
      console.log("⚡ No changes detected, skipping regeneration");
      return;
    }

    if (isFullRegen) {
      console.log("🔄 Performing full regeneration...");
      
      // Clear tracking maps but keep file metadata for cleanup
      const oldGenerated = new Map(generatedFiles);
      generatedFiles.clear();
      backendToGenerated.clear();
      
      if (now - lastFullScan > CONFIG.performance.cacheExpiryMs) {
        fileCache.clear();
        console.log("🗑️ Cleared file cache due to expiry");
      }
    }

    console.log("🔍 Scanning backend functions...");
    const startTime = Date.now();

    // Process deleted files first
    for (const deletedPath of deletedFiles) {
      const genSet = backendToGenerated.get(deletedPath);
      if (genSet) {
        console.log(`🗑️ Cleaning up ${genSet.size} files for deleted source: ${path.relative(process.cwd(), deletedPath)}`);
        
        for (const f of genSet) {
          safeRemoveFile(f);
        }
        backendToGenerated.delete(deletedPath);
      }
      fileCache.delete(deletedPath);
    }
    deletedFiles.clear();

    let processedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    async function walk(dir: string): Promise<void> {
      if (!fs.existsSync(dir)) return;

      let entries: fs.Dirent[];
      try {
        entries = fs.readdirSync(dir, { withFileTypes: true });
      } catch (error) {
        console.warn(`⚠️ Failed to read directory ${dir}:`, error);
        return;
      }

      for (const entry of entries) {
        const filePath = path.join(dir, entry.name);

        if (processedCount + skippedCount + errorCount > CONFIG.performance.maxFilesToProcess) {
          console.warn(`⚠️ Reached maximum file limit (${CONFIG.performance.maxFilesToProcess}), stopping scan`);
          return;
        }

        if (entry.isDirectory()) {
          if (!["node_modules", ".git", ".next", "dist", "build"].includes(entry.name)) {
            await walk(filePath);
          }
        } else if (entry.isFile()) {
          // Check if we need to process this file
          if (!isFullRegen && !changedFiles.has(filePath)) {
            skippedCount++;
            continue;
          }

          try {
            console.log(`🔧 Processing: ${path.relative(process.cwd(), filePath)}`);
            
            if (processBackendFile(filePath)) {
              processedCount++;
            } else {
              skippedCount++;
            }
          } catch (error) {
            console.error(`❌ Error processing ${filePath}:`, error);
            errorCount++;
          }
        }
      }
    }

    await walk(CONFIG.backendDir);

    // Generate documentation if enabled
    if (CONFIG.performance.enableDocGeneration && (isFullRegen || hasChanges)) {
      try {
        generateDocumentationFiles();
      } catch (error) {
        console.error("❌ Failed to generate documentation:", error);
      }
    }

    // Cleanup orphaned files
    cleanupOrphanedFiles();

    const endTime = Date.now();
    const duration = endTime - startTime;

    console.log(
      `✅ Scan completed: ${processedCount} processed, ${skippedCount} skipped, ${errorCount} errors (${duration}ms)`
    );

    if (isFullRegen) {
      lastFullScan = now;
    }
    changedFiles.clear();

    // Performance summary
    if (processedCount > 0) {
      console.log("📊 Performance Summary:");
      console.log(`   Generated files: ${generatedFiles.size}`);
      console.log(`   Cache entries: ${fileCache.size}`);
      console.log(`   Processing time: ${duration}ms`);
      console.log(`   Avg per file: ${Math.round(duration / Math.max(processedCount, 1))}ms`);

      // Count HTTP methods
      const methodCounts: Record<string, number> = {};
      for (const [filePath] of generatedFiles) {
        if (filePath.includes("/api/") && !filePath.includes("quickwire-docs")) {
          try {
            const content = fs.readFileSync(filePath, "utf-8");
            const methodMatch = content.match(/export async function (GET|POST|PUT|PATCH|DELETE)/);
            if (methodMatch) {
              const method = methodMatch[1];
              methodCounts[method] = (methodCounts[method] || 0) + 1;
            }
          } catch {
            // Ignore read errors
          }
        }
      }

      if (Object.keys(methodCounts).length > 0) {
        console.log("📊 HTTP Method Distribution:");
        Object.entries(methodCounts)
          .sort(([,a], [,b]) => b - a)
          .forEach(([method, count]) => {
            console.log(`   ${method}: ${count} endpoints`);
          });
      }
    }
  } catch (error) {
    console.error("❌ Fatal error during scan:", error);
  } finally {
    isProcessing = false;
  }
}

// Utility function to get generation statistics
export function getGenerationStats(): {
  totalGenerated: number;
  bySourceFile: Record<string, number>;
  oldestFile: { path: string; age: number } | null;
  newestFile: { path: string; age: number } | null;
} {
  const bySourceFile: Record<string, number> = {};
  let oldestFile: { path: string; age: number } | null = null;
  let newestFile: { path: string; age: number } | null = null;
  const now = Date.now();

  for (const [filePath, metadata] of generatedFiles) {
    const sourceRelative = path.relative(process.cwd(), metadata.sourceFile);
    bySourceFile[sourceRelative] = (bySourceFile[sourceRelative] || 0) + 1;

    const age = now - metadata.generatedAt;
    
    if (!oldestFile || age > oldestFile.age) {
      oldestFile = { path: path.relative(process.cwd(), filePath), age };
    }
    
    if (!newestFile || age < newestFile.age) {
      newestFile = { path: path.relative(process.cwd(), filePath), age };
    }
  }

  return {
    totalGenerated: generatedFiles.size,
    bySourceFile,
    oldestFile,
    newestFile,
  };
}

// Enhanced API documentation generation functions
interface ApiEndpointDoc {
  path: string;
  method: string;
  summary: string;
  description: string;
  tags: string[];
  parameters?: any[];
  requestBody?: any;
  responses: any;
  operationId: string;
}

function generateParameterSchema(parameters: ExportedFunction["parameters"]): any {
  if (parameters.length === 0) {
    return null;
  }

  if (parameters.length === 1) {
    const param = parameters[0];
    if (isObjectDestructured(param)) {
      return parseTypeToSchema(param.type);
    }

    const directSchema = parseTypeToSchema(param.type);
    const wrappedSchema = {
      type: "object",
      properties: {
        [param.name]: directSchema,
      },
      required: param.optional ? [] : [param.name],
    };

    return {
      oneOf: [directSchema, wrappedSchema],
    };
  }

  const properties: any = {};
  const required: string[] = [];

  parameters.forEach((param) => {
    properties[param.name] = parseTypeToSchema(param.type);
    if (!param.optional) {
      required.push(param.name);
    }
  });

  return {
    type: "object",
    properties,
    required: required.length > 0 ? required : undefined,
  };
}

function parseTypeToSchema(typeStr: string): any {
  const type = typeStr.trim();

  // Basic types
  if (type === "string") return { type: "string" };
  if (type === "number") return { type: "number" };
  if (type === "boolean") return { type: "boolean" };
  if (type === "any") return {};
  if (type === "unknown") return {};
  if (type === "void") return null;
  if (type === "File") return { type: "string", format: "binary" };
  if (type === "Blob") return { type: "string", format: "binary" };
  if (type === "FormData") return { type: "object" };

  // Array types
  if (type.endsWith("[]")) {
    const itemType = type.slice(0, -2);
    return {
      type: "array",
      items: parseTypeToSchema(itemType),
    };
  }

  const arrayMatch = type.match(/^Array<(.+)>$/);
  if (arrayMatch) {
    return {
      type: "array",
      items: parseTypeToSchema(arrayMatch[1]),
    };
  }

  // Promise types
  const promiseMatch = type.match(/^Promise<(.+)>$/);
  if (promiseMatch) {
    return parseTypeToSchema(promiseMatch[1]);
  }

  // Union types
  if (type.includes("|")) {
    const unionTypes = type.split("|").map((t) => t.trim());
    return {
      oneOf: unionTypes.map((t) => parseTypeToSchema(t)),
    };
  }

  // Object types
  if (type.startsWith("{") && type.endsWith("}")) {
    const properties: any = {};
    const required: string[] = [];

    const content = type.slice(1, -1).trim();
    if (content) {
      const props = splitObjectProperties(content);

      props.forEach((prop) => {
        const colonIndex = prop.indexOf(":");
        if (colonIndex > 0) {
          let key = prop.substring(0, colonIndex).trim();
          const optional = key.endsWith("?");
          if (optional) {
            key = key.slice(0, -1).trim();
          }
          const valueType = prop.substring(colonIndex + 1).trim();

          properties[key] = parseTypeToSchema(valueType);
          if (!optional) {
            required.push(key);
          }
        }
      });
    }

    return {
      type: "object",
      properties,
      required: required.length > 0 ? required : undefined,
    };
  }

  // Custom/unknown types
  return {
    type: "object",
    description: `Custom type: ${type}`,
  };
}

function splitObjectProperties(content: string): string[] {
  const props: string[] = [];
  let current = "";
  let braceCount = 0;
  let inString = false;
  let stringChar = "";

  for (let i = 0; i < content.length; i++) {
    const char = content[i];

    if (!inString && (char === '"' || char === "'")) {
      inString = true;
      stringChar = char;
    } else if (inString && char === stringChar && content[i - 1] !== "\\") {
      inString = false;
    } else if (!inString) {
      if (char === "{") braceCount++;
      else if (char === "}") braceCount--;
      else if ((char === ";" || char === ",") && braceCount === 0) {
        if (current.trim()) props.push(current.trim());
        current = "";
        continue;
      }
    }

    current += char;
  }

  if (current.trim()) props.push(current.trim());
  return props;
}

function generateFunctionTags(filePath: string, functionName: string): string[] {
  const relativePath = sanitizeFilePath(path.relative(CONFIG.backendDir, filePath));
  const pathParts = relativePath.replace(/\.[tj]s$/, "").split("/");
  return pathParts.map((part) => part.charAt(0).toUpperCase() + part.slice(1));
}

function generateFunctionSummary(functionName: string, httpMethod: string): string {
  const methodActions: Record<string, string> = {
    GET: "Retrieve",
    POST: "Create or process",
    PUT: "Update or replace",
    PATCH: "Partially update",
    DELETE: "Delete or remove",
  };

  const action = methodActions[httpMethod] || "Execute";
  const readableName = functionName
    .replace(/([A-Z])/g, " $1")
    .toLowerCase()
    .trim();

  return `${action} ${readableName}`;
}

function generateApiDocumentation(): any {
  const docs: ApiEndpointDoc[] = [];

  function walkDir(dir: string): void {
    if (!fs.existsSync(dir)) return;

    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const filePath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        if (!["node_modules", ".git", ".next", "dist", "build"].includes(entry.name)) {
          walkDir(filePath);
        }
      } else if (entry.isFile() && shouldProcessFile(filePath, CONFIG)) {
        try {
          const moduleExports = analyzeModuleExports(filePath);
          const relativePath = sanitizeFilePath(path.relative(CONFIG.backendDir, filePath));

          moduleExports.functions.forEach((func) => {
            const route = `/${relativePath.replace(/\.[tj]s$/, "")}/${pascalToKebab(func.name)}`;
            const method = func.httpMethod || "POST";
            const apiPath = `/api${route}`;

            const requestBodySchema = generateParameterSchema(func.parameters);
            const tags = generateFunctionTags(filePath, func.name);
            const summary = generateFunctionSummary(func.name, method);

            const doc: ApiEndpointDoc = {
              path: apiPath,
              method: method.toLowerCase(),
              summary,
              description: `${summary} - Auto-generated from ${relativePath}`,
              tags,
              operationId: `${func.name}`,
              responses: {
                "200": {
                  description: "Successful response",
                  content: {
                    "application/json": {
                      schema: func.returnType
                        ? parseTypeToSchema(func.returnType)
                        : { type: "object" },
                    },
                  },
                },
                "400": {
                  description: "Bad Request",
                  content: {
                    "application/json": {
                      schema: {
                        type: "object",
                        properties: {
                          error: { type: "string" },
                        },
                      },
                    },
                  },
                },
                "500": {
                  description: "Internal Server Error",
                  content: {
                    "application/json": {
                      schema: {
                        type: "object",
                        properties: {
                          error: { type: "string" },
                        },
                      },
                    },
                  },
                },
              },
            };

            if (requestBodySchema) {
              doc.requestBody = {
                required: true,
                content: {
                  "application/json": {
                    schema: requestBodySchema,
                  },
                },
              };
            }

            docs.push(doc);
          });
        } catch (error) {
          console.warn(`⚠️ Failed to analyze ${filePath} for documentation:`, error);
        }
      }
    }
  }

  walkDir(CONFIG.backendDir);

  const openApiSpec = {
    openapi: "3.0.0",
    info: {
      title: "Quickwire API Documentation",
      description: "Auto-generated API documentation for Quickwire endpoints",
      version: "1.0.0",
      contact: {
        name: "Quickwire Generator",
      },
      "x-generated-at": new Date().toISOString(),
    },
    servers: [
      {
        url: process.env.NODE_ENV === "production" 
          ? process.env.NEXT_PUBLIC_API_URL || "https://your-domain.com" 
          : "http://localhost:3000",
        description: process.env.NODE_ENV === "production" 
          ? "Production server" 
          : "Development server",
      },
    ],
    paths: {} as any,
    tags: [] as any[],
  };

  // Deduplicate docs based on operationId and path
  const uniqueDocs = new Map<string, ApiEndpointDoc>();
  docs.forEach((doc) => {
    const key = `${doc.operationId}_${doc.path}_${doc.method}`;
    uniqueDocs.set(key, doc);
  });

  uniqueDocs.forEach((doc) => {
    if (!openApiSpec.paths[doc.path]) {
      openApiSpec.paths[doc.path] = {};
    }
    
    openApiSpec.paths[doc.path][doc.method] = {
      summary: doc.summary,
      description: doc.description,
      tags: doc.tags,
      operationId: doc.operationId,
      requestBody: doc.requestBody,
      responses: doc.responses,
    };

    doc.tags.forEach((tag) => {
      if (!openApiSpec.tags.find(t => t.name === tag)) {
        openApiSpec.tags.push({ 
          name: tag, 
          description: `Operations for ${tag}` 
        });
      }
    });
  });

  return openApiSpec;
}

function generateDocumentationFiles(): void {
  try {
    console.log("📚 Generating API documentation...");
    
    const apiDocSpec = generateApiDocumentation();
    const docsDir = path.join(CONFIG.apiDir, "quickwire-docs");
    
    if (!ensureDirectoryExists(docsDir)) {
      console.error("❌ Failed to create documentation directory");
      return;
    }

    // Main documentation route
    const docsRouteFile = path.join(docsDir, "route.ts");
    const docsRouteContent = `import { NextResponse } from "next/server";

export const openApiSpec = ${JSON.stringify(apiDocSpec, null, 2)};

export async function GET() {
  const html = \`<!DOCTYPE html>
<html>
  <head>
    <title>Quickwire API Documentation</title>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <link rel="stylesheet" type="text/css" href="https://unpkg.com/swagger-ui-dist@5.10.3/swagger-ui.css" />
    <style>
      body { 
        margin: 0; 
        padding: 0; 
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      }
      .swagger-ui .topbar { display: none; }
      .swagger-ui .info { margin: 20px 0; }
      .swagger-ui .info .title { 
        font-size: 2.5rem; 
        color: #3b4151;
      }
      .swagger-ui .scheme-container {
        background: #f7f7f7;
        padding: 15px;
        margin: 20px 0;
        border-radius: 4px;
      }
      .custom-header {
        background: #1f2937;
        color: white;
        padding: 1rem;
        text-align: center;
      }
    </style>
  </head>
  <body>
    <div class="custom-header">
      <h1>🚀 Quickwire API Documentation</h1>
      <p>Generated at: ${new Date().toISOString()}</p>
    </div>
    <div id="swagger-ui"></div>
    <script src="https://unpkg.com/swagger-ui-dist@5.10.3/swagger-ui-bundle.js"></script>
    <script src="https://unpkg.com/swagger-ui-dist@5.10.3/swagger-ui-standalone-preset.js"></script>
    <script>
      window.onload = function() {
        SwaggerUIBundle({
          url: '/api/quickwire-docs/spec',
          dom_id: '#swagger-ui',
          deepLinking: true,
          presets: [
            SwaggerUIBundle.presets.apis,
            SwaggerUIStandalonePreset
          ],
          plugins: [
            SwaggerUIBundle.plugins.DownloadUrl
          ],
          layout: "StandaloneLayout",
          tryItOutEnabled: true,
          requestInterceptor: function(req) {
            req.headers['Accept'] = 'application/json';
            req.headers['Content-Type'] = 'application/json';
            return req;
          },
          responseInterceptor: function(res) {
            return res;
          },
          onComplete: function() {
            console.log('Quickwire API Documentation loaded successfully');
          },
          docExpansion: 'list',
          defaultModelRendering: 'model'
        });
      };
    </script>
  </body>
</html>\`;

  return new Response(html, {
    headers: {
      'Content-Type': 'text/html',
    },
  });
}
`;

    const success1 = safeWriteFile(docsRouteFile, docsRouteContent, "documentation");

    // Spec endpoint
    const specDir = path.join(docsDir, "spec");
    if (!ensureDirectoryExists(specDir)) {
      console.error("❌ Failed to create spec directory");
      return;
    }

    const specRouteFile = path.join(specDir, "route.ts");
    const specRouteContent = `import { NextResponse } from "next/server";
import { openApiSpec } from "../route";

export async function GET() {
  return NextResponse.json(openApiSpec, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
`;

    const success2 = safeWriteFile(specRouteFile, specRouteContent, "documentation");

    if (success1 && success2) {
      console.log("✅ Generated API documentation at /api/quickwire-docs");
      console.log(`📊 Documentation includes ${Object.keys(apiDocSpec.paths).length} endpoints`);
    } else {
      console.error("❌ Failed to generate some documentation files");
    }
  } catch (error) {
    console.error("❌ Error generating documentation:", error);
  }
}

// Health check and recovery functions
export function validateGeneratedFiles(): { valid: number; invalid: number; missing: number } {
  let valid = 0;
  let invalid = 0;
  let missing = 0;

  for (const [filePath, metadata] of generatedFiles) {
    try {
      if (!fs.existsSync(filePath)) {
        missing++;
        console.warn(`⚠️ Missing generated file: ${path.relative(process.cwd(), filePath)}`);
        continue;
      }

      const currentChecksum = calculateFileChecksum(filePath);
      if (currentChecksum !== metadata.checksum) {
        invalid++;
        console.warn(`⚠️ Modified generated file detected: ${path.relative(process.cwd(), filePath)}`);
      } else {
        valid++;
      }
    } catch (error) {
      invalid++;
      console.warn(`⚠️ Error validating ${filePath}:`, error);
    }
  }

  return { valid, invalid, missing };
}

export function recoverFromCorruption(): boolean {
  try {
    console.log("🔧 Attempting to recover from file corruption...");
    
    const validation = validateGeneratedFiles();
    console.log(`📊 Validation results: ${validation.valid} valid, ${validation.invalid} invalid, ${validation.missing} missing`);

    if (validation.invalid > 0 || validation.missing > 0) {
      console.log("🔄 Forcing full regeneration to recover...");
      
      // Clear all tracking and force regeneration
      generatedFiles.clear();
      backendToGenerated.clear();
      changedFiles.clear();
      deletedFiles.clear();
      lastFullScan = 0;
      
      // Add all backend files as changed to trigger regeneration
      function addAllBackendFiles(dir: string): void {
        if (!fs.existsSync(dir)) return;
        
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
          const filePath = path.join(dir, entry.name);
          
          if (entry.isDirectory()) {
            if (!["node_modules", ".git", ".next", "dist", "build"].includes(entry.name)) {
              addAllBackendFiles(filePath);
            }
          } else if (entry.isFile() && shouldProcessFile(filePath, CONFIG)) {
            changedFiles.add(filePath);
          }
        }
      }
      
      addAllBackendFiles(CONFIG.backendDir);
      console.log(`📝 Marked ${changedFiles.size} backend files for regeneration`);
      
      return true;
    }

    console.log("✅ No corruption detected, no recovery needed");
    return true;
  } catch (error) {
    console.error("❌ Recovery failed:", error);
    return false;
  }
}

// Re-export utility functions
// export { makeQuickwireRequest } from "./utils/request";

// Export additional utility functions for external use
export {
  ensureDirectoryExists,
  safeWriteFile,
  safeRemoveFile,
  calculateFileChecksum,
  // markFileDeleted,
  // validateGeneratedFiles,
  // recoverFromCorruption,
};