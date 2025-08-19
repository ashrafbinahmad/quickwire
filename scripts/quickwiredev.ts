import fs from "fs";
import path from "path";
import chokidar from "chokidar";
import ts from "typescript";

const backendDir = path.join(process.cwd(), "src", "backend");
const apiDir = path.join(process.cwd(), "src", "app", "api", "(quickwired)");
const quickwireDir = path.join(process.cwd(), "quickwire");

const CONFIG = {
  supportedExtensions: [".ts", ".js"],
  apiRouteTemplate: "route.ts",
  excludePatterns: ["*.test.ts", "*.spec.ts", "*.d.ts", "node_modules", ".git"],
  compilerOptions: {
    target: ts.ScriptTarget.Latest,
    module: ts.ModuleKind.ESNext,
    strict: true,
    esModuleInterop: true,
    skipLibCheck: true,
    forceConsistentCasingInFileNames: true,
    moduleResolution: ts.ModuleResolutionKind.Bundler,
  } as ts.CompilerOptions,
  watchDebounceMs: 100,
};

// ---------- Performance cache ----------

const fileCache = new Map<string, { mtime: number; exports: ModuleExports }>();
const generatedFiles = new Set<string>();

function getFileMtime(filePath: string): number {
  try {
    return fs.statSync(filePath).mtimeMs;
  } catch {
    return 0;
  }
}

function getCachedExports(filePath: string): ModuleExports | null {
  const mtime = getFileMtime(filePath);
  const cached = fileCache.get(filePath);

  if (cached && cached.mtime === mtime) {
    return cached.exports;
  }

  return null;
}

function setCachedExports(filePath: string, exports: ModuleExports): void {
  const mtime = getFileMtime(filePath);
  fileCache.set(filePath, { mtime, exports });
}

// ---------- Utility functions ----------

function pascalToKebab(str: string): string {
  return str.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase();
}

function shouldProcessFile(filePath: string): boolean {
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

function sanitizeFilePath(filePath: string): string {
  return path.normalize(filePath).replace(/\\/g, "/");
}

// ---------- TypeScript AST analysis ----------

interface ExportedFunction {
  name: string;
  type: "function" | "arrow" | "variable";
  parameters: { name: string; type: string; optional?: boolean }[];
  returnType?: string;
  isAsync?: boolean;
  node: ts.Node;
}

interface ExportedType {
  name: string;
  type: "interface" | "type" | "enum" | "class";
  declaration: string;
  node: ts.Node;
}

interface ModuleExports {
  functions: ExportedFunction[];
  types: ExportedType[];
  imports: string[];
}

function analyzeModuleExports(filePath: string): ModuleExports {
  // Check cache first
  const cached = getCachedExports(filePath);
  if (cached) return cached;

  let content: string;
  try {
    content = fs.readFileSync(filePath, "utf-8");
  } catch (error) {
    console.warn(`⚠️ Failed to read file ${filePath}:`, error);
    return { functions: [], types: [], imports: [] };
  }

  const sourceFile = ts.createSourceFile(
    filePath,
    content,
    CONFIG.compilerOptions.target!,
    true,
    ts.ScriptKind.TS
  );

  const functions: ExportedFunction[] = [];
  const types: ExportedType[] = [];
  const imports: string[] = [];

  function visit(node: ts.Node) {
    try {
      if (ts.isImportDeclaration(node)) {
        imports.push(node.getText().trim());
      }

      if (hasExportModifier(node)) {
        if (ts.isFunctionDeclaration(node) && node.name) {
          functions.push(analyzeFunctionDeclaration(node));
        } else if (ts.isVariableStatement(node)) {
          functions.push(...analyzeVariableStatement(node));
        } else {
          const exportedType = analyzeTypeDeclaration(node);
          if (exportedType) types.push(exportedType);
        }
      }

      ts.forEachChild(node, visit);
    } catch (error) {
      console.warn(`⚠️ Error analyzing node in ${filePath}:`, error);
    }
  }

  visit(sourceFile);

  const result = { functions, types, imports };
  setCachedExports(filePath, result);
  return result;
}

function hasExportModifier(node: ts.Node): boolean {
  return (
    (ts.canHaveModifiers(node) &&
      ts
        .getModifiers(node)
        ?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword)) ||
    false
  );
}

function analyzeFunctionDeclaration(
  node: ts.FunctionDeclaration
): ExportedFunction {
  const name = node.name!.text;
  const parameters = node.parameters.map((p) => ({
    name: (p.name as ts.Identifier).text,
    type: p.type?.getText() || "any",
    optional: !!p.questionToken,
  }));

  const returnType = node.type?.getText();
  const isAsync =
    node.modifiers?.some((m) => m.kind === ts.SyntaxKind.AsyncKeyword) || false;

  return { name, type: "function", parameters, returnType, isAsync, node };
}

function analyzeVariableStatement(
  node: ts.VariableStatement
): ExportedFunction[] {
  const funcs: ExportedFunction[] = [];

  for (const decl of node.declarationList.declarations) {
    if (ts.isIdentifier(decl.name) && decl.initializer) {
      let funcNode: ts.ArrowFunction | ts.FunctionExpression | null = null;
      let type: "arrow" | "variable" = "variable";

      if (ts.isArrowFunction(decl.initializer)) {
        funcNode = decl.initializer;
        type = "arrow";
      } else if (ts.isFunctionExpression(decl.initializer)) {
        funcNode = decl.initializer;
        type = "variable";
      }

      if (funcNode) {
        const parameters = funcNode.parameters.map((p) => ({
          name: (p.name as ts.Identifier).text,
          type: p.type?.getText() || "any",
          optional: !!p.questionToken,
        }));

        const returnType = funcNode.type?.getText();
        const isAsync =
          funcNode.modifiers?.some(
            (m) => m.kind === ts.SyntaxKind.AsyncKeyword
          ) || false;

        funcs.push({
          name: decl.name.text,
          type,
          parameters,
          returnType,
          isAsync,
          node: decl,
        });
      }
    }
  }

  return funcs;
}

function analyzeTypeDeclaration(node: ts.Node): ExportedType | null {
  try {
    if (ts.isInterfaceDeclaration(node)) {
      return {
        name: node.name.text,
        type: "interface",
        declaration: node.getText().trim(),
        node,
      };
    }
    if (ts.isTypeAliasDeclaration(node)) {
      return {
        name: node.name.text,
        type: "type",
        declaration: node.getText().trim(),
        node,
      };
    }
    if (ts.isEnumDeclaration(node)) {
      return {
        name: node.name.text,
        type: "enum",
        declaration: node.getText().trim(),
        node,
      };
    }
    if (ts.isClassDeclaration(node) && node.name) {
      return {
        name: node.name.text,
        type: "class",
        declaration: node.getText().trim(),
        node,
      };
    }
  } catch (error) {
    console.warn(`⚠️ Error analyzing type declaration:`, error);
  }

  return null;
}

// ---------- Parameter type generation ----------

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
    
    // If it's object destructured, keep it as is
    if (isObjectDestructured(param)) {
      return {
        parameterType: param.type,
        callSignature: `(${param.name}${param.optional ? "?" : ""}: ${param.type}) =>`,
        parameterUsage: param.name,
      };
    }
    
    // For single non-object parameters, support both original and object calling styles
    const originalParamType = param.type;
    const objectParamType = `{ ${param.name}${param.optional ? "?" : ""}: ${param.type} }`;
    
    return {
      parameterType: `${originalParamType} | ${objectParamType}`,
      callSignature: `(${param.name}${param.optional ? "?" : ""}: ${originalParamType} | ${objectParamType}) =>`,
      parameterUsage: `typeof ${param.name} === 'object' && '${param.name}' in ${param.name} ? ${param.name} : { ${param.name}: ${param.name} }`,
    };
  }

  // Multiple parameters - only object style
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

// ---------- Quickwire utils creation ----------

function ensureQuickwireUtils(): void {
  const utilsPath = path.join(quickwireDir, "utils");
  if (!fs.existsSync(utilsPath)) {
    fs.mkdirSync(utilsPath, { recursive: true });
  }

  const requestFile = path.join(utilsPath, "request.ts");
  if (!fs.existsSync(requestFile)) {
    const requestContent = `export async function makeQuickwireRequest<T>(
  endpoint: string, 
  params?: any
): Promise<T> {
  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: params ? JSON.stringify(params) : undefined,
    });
    
    if (!res.ok) {
      let errorMessage = \`HTTP \${res.status}: \${res.statusText}\`;
      try {
        const errorData = await res.json();
        errorMessage = errorData.error || errorData.message || errorMessage;
      } catch {
        // Fallback to status text if JSON parsing fails
      }
      throw new Error(errorMessage);
    }
    
    return await res.json();
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error(\`Request failed: \${String(error)}\`);
  }
}

export type QuickwireFunction<TParams = void, TReturn = any> = {
  endpoint: string;
  call: TParams extends void 
    ? () => Promise<TReturn>
    : (params: TParams) => Promise<TReturn>;
};
`;

    fs.writeFileSync(requestFile, requestContent, "utf8");
  }
  generatedFiles.add(requestFile);
}

// ---------- Generate Quickwire client ----------

function generateQuickwireFile(
  filePath: string,
  endpoints: Record<string, string>
): void {
  ensureQuickwireUtils();

  const relativePath = sanitizeFilePath(path.relative(backendDir, filePath));
  const moduleExports = analyzeModuleExports(filePath);

  if (moduleExports.functions.length === 0) return; // Skip files with no exported functions

  const quickwireFilePath = path.join(quickwireDir, relativePath);
  const quickwireDirPath = path.dirname(quickwireFilePath);

  const lines: string[] = [
    "// Auto-generated by Quickwire",
    "// Do not edit manually - changes will be overwritten",
    `// Generated from: ${relativePath}`,
    "",
    "// Utility type to unwrap Promise types",
    "type UnwrapPromise<T> = T extends Promise<infer U> ? U : T;",
    "",
  ];

  // Relative import path to request.ts
  const utilsPath = path.join(quickwireDir, "utils", "request.ts");
  let requestImportPath = path
    .relative(quickwireDirPath, utilsPath)
    .replace(/\\/g, "/");
  if (!requestImportPath.startsWith(".")) {
    requestImportPath = "./" + requestImportPath;
  }
  requestImportPath = requestImportPath.replace(/\.ts$/, "");

  lines.push(`import { makeQuickwireRequest } from "${requestImportPath}";`);
  lines.push("");

  // Import backend functions
  const backendImportPath = `@/backend/${relativePath.replace(/\.[tj]s$/, "")}`;
  const functionImports = moduleExports.functions
    .map((func) => `${func.name} as ${func.name}Internal`)
    .join(", ");

  if (functionImports) {
    lines.push(`import { ${functionImports} } from "${backendImportPath}";`);
    lines.push("");
  }

  // Export types
  moduleExports.types.forEach((type) => {
    lines.push(type.declaration);
    lines.push("");
  });

  // Generate function exports
  moduleExports.functions.forEach((func) => {
    let route = endpoints[func.name];
    if (!route) return;

    // Ensure /api prefix
    if (!route.startsWith("/api")) {
      route = `/api${route}`;
    }

    const signature = generateFunctionSignature(func);

    if (signature.parameterType === "void") {
      // No parameters
      lines.push(`export const ${func.name} = () =>`);
      lines.push(
        `  makeQuickwireRequest<UnwrapPromise<ReturnType<typeof ${func.name}Internal>>>("${route}");`
      );
    } else {
      // Has parameters - generate flexible signature
      const allOptional = func.parameters.every((p) => p.optional);
      const optionalModifier = allOptional && !signature.parameterType.includes("|") ? "?" : "";
      
      lines.push(`export const ${func.name} = (${func.parameters.length === 1 && !isObjectDestructured(func.parameters[0]) 
        ? `${func.parameters[0].name}${optionalModifier}: ${signature.parameterType}`
        : `params${optionalModifier}: ${signature.parameterType}`
      }) =>`);

      const paramUsage = func.parameters.length === 1 && !isObjectDestructured(func.parameters[0])
        ? signature.parameterUsage
        : (signature.parameterUsage || "params");

      lines.push(
        `  makeQuickwireRequest<UnwrapPromise<ReturnType<typeof ${func.name}Internal>>>("${route}", ${paramUsage});`
      );
    }

    lines.push("");
  });

  try {
    fs.mkdirSync(quickwireDirPath, { recursive: true });
    fs.writeFileSync(quickwireFilePath, lines.join("\n"), "utf8");
    generatedFiles.add(quickwireFilePath);
  } catch (error) {
    console.error(
      `❌ Failed to write quickwire file ${quickwireFilePath}:`,
      error
    );
  }
}

// ---------- API route generation ----------

function generateApiRoutesForFile(filePath: string): Record<string, string> {
  const relativePath = sanitizeFilePath(path.relative(backendDir, filePath));
  const moduleExports = analyzeModuleExports(filePath);
  const endpoints: Record<string, string> = {};

  moduleExports.functions.forEach((func) => {
    // Route is just based on backend path, no /api prefix
    const route = `/${relativePath.replace(/\.[tj]s$/, "")}/${pascalToKebab(func.name)}`;
    endpoints[func.name] = route;

    const apiFilePath = path.join(apiDir, route, CONFIG.apiRouteTemplate);
    const apiDirPath = path.dirname(apiFilePath);

    try {
      fs.mkdirSync(apiDirPath, { recursive: true });

      const hasParams = func.parameters.length > 0;
      
      // Generate parameter handling code for the API route
      let parameterHandling = "";
      let functionCall = "";
      
      if (!hasParams) {
        functionCall = `${func.name}()`;
      } else if (func.parameters.length === 1 && !isObjectDestructured(func.parameters[0])) {
        // Single non-object parameter - handle both calling styles
        const param = func.parameters[0];
        parameterHandling = `const body = await req.json();
    // Support both direct value and object-wrapped parameter styles
    const ${param.name} = typeof body === 'object' && '${param.name}' in body ? body.${param.name} : body;`;
        functionCall = `${func.name}(${param.name})`;
      } else {
        // Multiple parameters or single object parameter
        parameterHandling = `const body = await req.json();`;
        functionCall = func.parameters.length === 1 
          ? `${func.name}(body)` 
          : `${func.name}(body)`;
      }

      const handlerCode = `import { ${func.name} } from "@/backend/${relativePath.replace(
        /\.[tj]s$/,
        ""
      )}";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    ${parameterHandling}
    const result = ${func.isAsync ? "await " : ""}${functionCall};
    return NextResponse.json(result ?? null);
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
`;

      fs.writeFileSync(apiFilePath, handlerCode, "utf8");
      generatedFiles.add(apiFilePath);
    } catch (error) {
      console.error(`❌ Failed to generate API route ${apiFilePath}:`, error);
    }
  });

  return endpoints;
}

// ---------- Cleanup utilities ----------

function cleanupOrphanedFiles(): void {
  const cleanupDirs = [quickwireDir, apiDir];

  for (const dir of cleanupDirs) {
    if (!fs.existsSync(dir)) continue;

    try {
      walkAndCleanup(dir);
    } catch (error) {
      console.warn(`⚠️ Failed to cleanup directory ${dir}:`, error);
    }
  }
}

function walkAndCleanup(dir: string): void {
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      walkAndCleanup(fullPath);
      // Remove empty directories
      try {
        const isEmpty = fs.readdirSync(fullPath).length === 0;
        if (isEmpty) {
          fs.rmdirSync(fullPath);
        }
      } catch {
        // Directory not empty or other error
      }
    } else if (entry.isFile()) {
      // Remove files that are no longer generated
      if (
        !generatedFiles.has(fullPath) &&
        (fullPath.endsWith(".ts") || fullPath.endsWith(".js"))
      ) {
        try {
          fs.unlinkSync(fullPath);
          console.log(
            `🗑️ Removed orphaned file: ${path.relative(
              process.cwd(),
              fullPath
            )}`
          );
        } catch (error) {
          console.warn(`⚠️ Failed to remove file ${fullPath}:`, error);
        }
      }
    }
  }
}

// ---------- Scan and build ----------

function processBackendFile(filePath: string): boolean {
  if (!shouldProcessFile(filePath) || !fs.existsSync(filePath)) {
    return false;
  }

  try {
    const moduleExports = analyzeModuleExports(filePath);
    if (moduleExports.functions.length > 0) {
      const endpoints = generateApiRoutesForFile(filePath);
      generateQuickwireFile(filePath, endpoints);
      return true;
    }
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error);
  }

  return false;
}

function scanAllBackendFunctions(): void {
  generatedFiles.clear();
  let processedCount = 0;

  function walk(dir: string): void {
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

      if (entry.isDirectory()) {
        // Skip common directories that shouldn't be processed
        if (
          !["node_modules", ".git", ".next", "dist", "build"].includes(
            entry.name
          )
        ) {
          walk(filePath);
        }
      } else if (entry.isFile()) {
        if (processBackendFile(filePath)) {
          processedCount++;
        }
      }
    }
  }

  console.log("🔍 Scanning backend functions...");
  walk(backendDir);

  // Cleanup orphaned files
  cleanupOrphanedFiles();

  console.log(`✅ Processed ${processedCount} files with exported functions`);
}

// ---------- Watch mode ----------

let watchTimeout: NodeJS.Timeout | null = null;

function debouncedScan(): void {
  if (watchTimeout) {
    clearTimeout(watchTimeout);
  }

  watchTimeout = setTimeout(() => {
    console.log("🔄 Files changed, regenerating...");
    scanAllBackendFunctions();
  }, CONFIG.watchDebounceMs);
}

function runWatch(): void {
  console.log("🚀 Quickwire watch mode started...");
  console.log(`📂 Watching: ${backendDir}`);

  // Initial scan
  scanAllBackendFunctions();

  const watcher = chokidar.watch(backendDir, {
    ignoreInitial: true,
    ignored: [
      ...CONFIG.excludePatterns.map((p) => `**/${p}`),
      "**/node_modules/**",
      "**/.git/**",
      "**/.next/**",
      "**/dist/**",
      "**/build/**",
    ],
    persistent: true,
    awaitWriteFinish: {
      stabilityThreshold: 100,
      pollInterval: 50,
    },
  });

  watcher
    .on("add", (filePath) => {
      console.log(`📄 Added: ${path.relative(process.cwd(), filePath)}`);
      debouncedScan();
    })
    .on("change", (filePath) => {
      console.log(`📝 Changed: ${path.relative(process.cwd(), filePath)}`);
      // Invalidate cache for changed file
      fileCache.delete(filePath);
      debouncedScan();
    })
    .on("unlink", (filePath) => {
      console.log(`🗑️ Removed: ${path.relative(process.cwd(), filePath)}`);
      // Clear cache for removed file
      fileCache.delete(filePath);
      debouncedScan();
    })
    .on("error", (error) => {
      console.error("❌ Watch error:", error);
    });

  // Graceful shutdown
  process.on("SIGINT", () => {
    console.log("\n🛑 Shutting down Quickwire watch mode...");
    watcher.close();
    process.exit(0);
  });

  process.on("SIGTERM", () => {
    console.log("\n🛑 Terminating Quickwire watch mode...");
    watcher.close();
    process.exit(0);
  });
}

// ---------- CLI ----------

function main(): void {
  try {
    // Ensure directories exist
    fs.mkdirSync(backendDir, { recursive: true });
    fs.mkdirSync(apiDir, { recursive: true });
    fs.mkdirSync(quickwireDir, { recursive: true });

    if (process.argv.includes("--watch")) {
      runWatch();
    } else {
      console.log("🔧 Running Quickwire generation...");
      scanAllBackendFunctions();
      console.log("✅ Quickwire generation complete");
    }
  } catch (error) {
    console.error("❌ Fatal error:", error);
    process.exit(1);
  }
}

// Handle uncaught exceptions
process.on("uncaughtException", (error) => {
  console.error("❌ Uncaught exception:", error);
  process.exit(1);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("❌ Unhandled rejection at:", promise, "reason:", reason);
  process.exit(1);
});

main();