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
  watchDebounceMs: 300, // Increased debounce for better performance
  // Performance optimizations
  performance: {
    enableDocGeneration: true, // Can be disabled in development
    maxFilesToProcess: 1000, // Safety limit
    enableIncrementalUpdates: true,
    cacheExpiryMs: 5 * 60 * 1000, // 5 minutes cache
  },
  // HTTP method mapping based on function name prefixes
  httpMethods: {
    GET: [
      'get', 'fetch', 'find', 'list', 'show', 'read', 'retrieve', 'search', 
      'query', 'view', 'display', 'load', 'check', 'verify', 'validate',
      'count', 'exists', 'has', 'is', 'can'
    ],
    POST: [
      'create', 'add', 'insert', 'post', 'submit', 'send', 'upload', 
      'register', 'login', 'signup', 'authenticate', 'authorize', 'process',
      'execute', 'run', 'perform', 'handle', 'trigger', 'invoke', 'call',
      'generate', 'build', 'make', 'produce', 'sync', 'import', 'export'
    ],
    PUT: [
      'update', 'edit', 'modify', 'change', 'set', 'put', 'replace', 
      'toggle', 'switch', 'enable', 'disable', 'activate', 'deactivate',
      'publish', 'unpublish', 'approve', 'reject', 'accept', 'decline',
      'assign', 'unassign', 'move', 'transfer', 'migrate', 'restore',
      'reset', 'refresh', 'renew', 'reorder', 'sort', 'merge'
    ],
    PATCH: [
      'patch', 'partial', 'increment', 'decrement', 'append', 'prepend',
      'adjust', 'tweak', 'fine', 'tune'
    ],
    DELETE: [
      'delete', 'remove', 'destroy', 'clear', 'clean', 'purge', 'drop',
      'erase', 'wipe', 'cancel', 'revoke', 'withdraw', 'uninstall',
      'detach', 'disconnect', 'unlink', 'archive', 'trash'
    ]
  }
};

// ---------- Performance cache ----------

const fileCache = new Map<string, { mtime: number; exports: ModuleExports }>();
const generatedFiles = new Set<string>();
const docCache = new Map<string, any>();
let lastFullScan = 0;
const backendToGenerated = new Map<string, Set<string>>();
const deletedFiles = new Set<string>();

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

// Incremental processing for changed files only
const changedFiles = new Set<string>();

function markFileChanged(filePath: string): void {
  changedFiles.add(filePath);
  fileCache.delete(filePath); // Invalidate cache
  
  // Also invalidate doc cache since it depends on all files
  docCache.clear();
}

function shouldRegenerateEverything(): boolean {
  const now = Date.now();
  const timeSinceLastScan = now - lastFullScan;
  const hasChangedFiles = changedFiles.size > 0;
  const cacheExpired = timeSinceLastScan > CONFIG.performance.cacheExpiryMs;
  
  return hasChangedFiles || cacheExpired || fileCache.size === 0;
}

// ---------- HTTP Method Detection ----------

function detectHttpMethod(functionName: string): string {
  const lowerName = functionName.toLowerCase();
  
  for (const [method, prefixes] of Object.entries(CONFIG.httpMethods)) {
    for (const prefix of prefixes) {
      if (lowerName.startsWith(prefix)) {
        return method;
      }
    }
  }
  
  // Default to POST for unrecognized patterns
  return 'POST';
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
  httpMethod?: string;
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
          const func = analyzeFunctionDeclaration(node);
          func.httpMethod = detectHttpMethod(func.name);
          functions.push(func);
        } else if (ts.isVariableStatement(node)) {
          const funcs = analyzeVariableStatement(node);
          funcs.forEach(func => {
            func.httpMethod = detectHttpMethod(func.name);
          });
          functions.push(...funcs);
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
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' = 'POST',
  params?: any
): Promise<T> {
  try {
    let requestBody: string | undefined;

    // All methods send parameters in request body if params exist
    if (params) {
      requestBody = JSON.stringify(params);
    }

    const headers: Record<string, string> = {
      "Accept": "application/json",
    };

    // Add Content-Type when sending a body
    if (requestBody) {
      headers["Content-Type"] = "application/json";
    }

    const res = await fetch(endpoint, {
      method,
      headers,
      body: requestBody,
    });
    
    if (!res.ok) {
      let errorMessage = \`HTTP \${res.status}: \${res.statusText}\`;
      let errorDetails: any = null;
      
      try {
        const contentType = res.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const errorData = await res.json();
          errorDetails = errorData;
          errorMessage = errorData.error || errorData.message || errorData.detail || errorMessage;
        } else {
          const textError = await res.text();
          if (textError) {
            errorMessage = textError;
          }
        }
      } catch (parseError) {
        // Fallback to status text if parsing fails
        console.warn('Failed to parse error response:', parseError);
      }
      
      const error = new Error(errorMessage) as Error & { 
        status: number; 
        statusText: string; 
        details?: any; 
      };
      error.status = res.status;
      error.statusText = res.statusText;
      if (errorDetails) {
        error.details = errorDetails;
      }
      
      throw error;
    }
    
    // Handle different response types
    const contentType = res.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return await res.json();
    } else if (contentType && contentType.startsWith('text/')) {
      return await res.text() as unknown as T;
    } else {
      // For other content types, try JSON first, then text
      try {
        return await res.json();
      } catch {
        return await res.text() as unknown as T;
      }
    }
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error(\`Request failed: \${String(error)}\`);
  }
}

export type QuickwireFunction<TParams = void, TReturn = any> = {
  endpoint: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
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
  endpoints: Record<string, { route: string; method: string }>
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
    const endpointInfo = endpoints[func.name];
    if (!endpointInfo) return;

    let route = endpointInfo.route;
    const method = endpointInfo.method;

    // Ensure /api prefix
    if (!route.startsWith("/api")) {
      route = `/api${route}`;
    }

    const signature = generateFunctionSignature(func);

    if (signature.parameterType === "void") {
      // No parameters
      lines.push(`export const ${func.name} = () =>`);
      lines.push(
        `  makeQuickwireRequest<UnwrapPromise<ReturnType<typeof ${func.name}Internal>>>("${route}", "${method}");`
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
        `  makeQuickwireRequest<UnwrapPromise<ReturnType<typeof ${func.name}Internal>>>("${route}", "${method}", ${paramUsage});`
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

function generateApiRoutesForFile(filePath: string): Record<string, { route: string; method: string }> {
  const relativePath = sanitizeFilePath(path.relative(backendDir, filePath));
  const moduleExports = analyzeModuleExports(filePath);
  const endpoints: Record<string, { route: string; method: string }> = {};

  moduleExports.functions.forEach((func) => {
    // Route is just based on backend path, no /api prefix
    const route = `/${relativePath.replace(/\.[tj]s$/, "")}/${pascalToKebab(func.name)}`;
    const method = func.httpMethod || 'POST';
    endpoints[func.name] = { route, method };

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
      } else {
        // All methods handle parameters the same way - from request body
        if (func.parameters.length === 1 && !isObjectDestructured(func.parameters[0])) {
          const param = func.parameters[0];
          parameterHandling = `let body;
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
    
    // Support both direct value and object-wrapped parameter styles
    const ${param.name} = typeof body === 'object' && body !== null && '${param.name}' in body ? body.${param.name} : body;`;
          functionCall = `${func.name}(${param.name})`;
        } else {
          parameterHandling = `let body;
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
    }`;
          functionCall = func.parameters.length === 1 
            ? `${func.name}(body)` 
            : `${func.name}(body)`;
        }
      }

      const handlerCode = `import { ${func.name} } from "@/backend/${relativePath.replace(
        /\.[tj]s$/,
        ""
      )}";
import { NextResponse } from "next/server";

export async function ${method}(req: Request) {
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

// ---------- Documentation generation ----------

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
      // Parse object type to extract properties
      return parseTypeToSchema(param.type);
    }
    
    // Single parameter - support both direct and wrapped styles
    const directSchema = parseTypeToSchema(param.type);
    const wrappedSchema = {
      type: "object",
      properties: {
        [param.name]: directSchema
      },
      required: param.optional ? [] : [param.name]
    };

    return {
      oneOf: [
        directSchema,
        wrappedSchema
      ]
    };
  }

  // Multiple parameters - object style only
  const properties: any = {};
  const required: string[] = [];

  parameters.forEach(param => {
    properties[param.name] = parseTypeToSchema(param.type);
    if (!param.optional) {
      required.push(param.name);
    }
  });

  return {
    type: "object",
    properties,
    required: required.length > 0 ? required : undefined
  };
}

function parseTypeToSchema(typeStr: string): any {
  // Remove whitespace
  const type = typeStr.trim();

  // Handle basic types
  if (type === 'string') return { type: 'string' };
  if (type === 'number') return { type: 'number' };
  if (type === 'boolean') return { type: 'boolean' };
  if (type === 'any') return {};
  if (type === 'unknown') return {};
  if (type === 'void') return null;

  // Handle arrays
  if (type.endsWith('[]')) {
    const itemType = type.slice(0, -2);
    return {
      type: 'array',
      items: parseTypeToSchema(itemType)
    };
  }

  // Handle Array<T>
  const arrayMatch = type.match(/^Array<(.+)>$/);
  if (arrayMatch) {
    return {
      type: 'array',
      items: parseTypeToSchema(arrayMatch[1])
    };
  }

  // Handle Promise<T>
  const promiseMatch = type.match(/^Promise<(.+)>$/);
  if (promiseMatch) {
    return parseTypeToSchema(promiseMatch[1]);
  }

  // Handle union types (basic support)
  if (type.includes('|')) {
    const unionTypes = type.split('|').map(t => t.trim());
    return {
      oneOf: unionTypes.map(t => parseTypeToSchema(t))
    };
  }

  // Handle object types
  if (type.startsWith('{') && type.endsWith('}')) {
    const properties: any = {};
    const required: string[] = [];
    
    // Simple parsing of object type
    const content = type.slice(1, -1).trim();
    if (content) {
      // Split by semicolon or comma, handling nested objects
      const props = splitObjectProperties(content);
      
      props.forEach(prop => {
        const colonIndex = prop.indexOf(':');
        if (colonIndex > 0) {
          let key = prop.substring(0, colonIndex).trim();
          const optional = key.endsWith('?');
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
      type: 'object',
      properties,
      required: required.length > 0 ? required : undefined
    };
  }

  // For custom types or unknown types, return a generic object
  return { 
    type: 'object',
    description: `Custom type: ${type}`
  };
}

function splitObjectProperties(content: string): string[] {
  const props: string[] = [];
  let current = '';
  let braceCount = 0;
  let inString = false;
  let stringChar = '';

  for (let i = 0; i < content.length; i++) {
    const char = content[i];
    
    if (!inString && (char === '"' || char === "'")) {
      inString = true;
      stringChar = char;
    } else if (inString && char === stringChar && content[i-1] !== '\\') {
      inString = false;
    } else if (!inString) {
      if (char === '{') braceCount++;
      else if (char === '}') braceCount--;
      else if ((char === ';' || char === ',') && braceCount === 0) {
        if (current.trim()) props.push(current.trim());
        current = '';
        continue;
      }
    }
    
    current += char;
  }
  
  if (current.trim()) props.push(current.trim());
  return props;
}

function generateFunctionTags(filePath: string, functionName: string): string[] {
  const relativePath = sanitizeFilePath(path.relative(backendDir, filePath));
  const pathParts = relativePath.replace(/\.[tj]s$/, '').split('/');
  return pathParts.map(part => part.charAt(0).toUpperCase() + part.slice(1));
}

function generateFunctionSummary(functionName: string, httpMethod: string): string {
  const methodActions: Record<string, string> = {
    GET: 'Retrieve',
    POST: 'Create or process',
    PUT: 'Update or replace',
    PATCH: 'Partially update',
    DELETE: 'Delete or remove'
  };
  
  const action = methodActions[httpMethod] || 'Execute';
  const readableName = functionName
    .replace(/([A-Z])/g, ' $1')
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
      } else if (entry.isFile() && shouldProcessFile(filePath)) {
        const moduleExports = analyzeModuleExports(filePath);
        const relativePath = sanitizeFilePath(path.relative(backendDir, filePath));
        
        moduleExports.functions.forEach(func => {
          const route = `/${relativePath.replace(/\.[tj]s$/, "")}/${pascalToKebab(func.name)}`;
          const method = func.httpMethod || 'POST';
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
                    schema: func.returnType ? parseTypeToSchema(func.returnType) : { type: "object" }
                  }
                }
              },
              "400": {
                description: "Bad Request",
                content: {
                  "application/json": {
                    schema: {
                      type: "object",
                      properties: {
                        error: { type: "string" }
                      }
                    }
                  }
                }
              },
              "500": {
                description: "Internal Server Error",
                content: {
                  "application/json": {
                    schema: {
                      type: "object",
                      properties: {
                        error: { type: "string" }
                      }
                    }
                  }
                }
              }
            }
          };

          if (requestBodySchema) {
            doc.requestBody = {
              required: true,
              content: {
                "application/json": {
                  schema: requestBodySchema
                }
              }
            };
          }

          docs.push(doc);
        });
      }
    }
  }

  walkDir(backendDir);

  // Generate OpenAPI specification
  const openApiSpec = {
    openapi: "3.0.0",
    info: {
      title: "Quickwire API Documentation",
      description: "Auto-generated API documentation for Quickwire endpoints",
      version: "1.0.0",
      contact: {
        name: "Quickwire Generator",
      }
    },
    servers: [
      {
        url: process.env.NODE_ENV === 'production' ? 'https://your-domain.com' : 'http://localhost:3000',
        description: process.env.NODE_ENV === 'production' ? 'Production server' : 'Development server'
      }
    ],
    paths: {} as any,
    tags: [] as any[]
  };

  // Group endpoints by tags and build paths
  const tagSet = new Set<string>();
  
  docs.forEach(doc => {
    // Add to paths
    if (!openApiSpec.paths[doc.path]) {
      openApiSpec.paths[doc.path] = {};
    }
    
    openApiSpec.paths[doc.path][doc.method] = {
      summary: doc.summary,
      description: doc.description,
      tags: doc.tags,
      operationId: doc.operationId,
      requestBody: doc.requestBody,
      responses: doc.responses
    };

    // Collect tags
    doc.tags.forEach(tag => tagSet.add(tag));
  });

  // Add tags to spec
  openApiSpec.tags = Array.from(tagSet).map(tag => ({
    name: tag,
    description: `Operations for ${tag}`
  }));

  return openApiSpec;
}

function generateDocumentationFiles(): void {
  const apiDocSpec = generateApiDocumentation();
  
  // Create docs directory
  const docsDir = path.join(apiDir, "quickwire-docs");
  fs.mkdirSync(docsDir, { recursive: true });
  
  // Generate API route for serving the docs
  const docsRouteFile = path.join(docsDir, "route.ts");
  const docsRouteContent = `import { NextResponse } from "next/server";

const openApiSpec = ${JSON.stringify(apiDocSpec, null, 2)};

export async function GET() {
  const html = \`<!DOCTYPE html>
<html>
  <head>
    <title>Quickwire API Documentation</title>
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
    </style>
  </head>
  <body>
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
            // Add any custom headers or modifications here
            req.headers['Accept'] = 'application/json';
            return req;
          },
          onComplete: function() {
            console.log('Quickwire API Documentation loaded successfully');
          }
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

  fs.writeFileSync(docsRouteFile, docsRouteContent, "utf8");
  generatedFiles.add(docsRouteFile);

  // Generate spec endpoint
  const specDir = path.join(docsDir, "spec");
  fs.mkdirSync(specDir, { recursive: true });
  
  const specRouteFile = path.join(specDir, "route.ts");
  const specRouteContent = `import { NextResponse } from "next/server";

const openApiSpec = ${JSON.stringify(apiDocSpec, null, 2)};

export async function GET() {
  return NextResponse.json(openApiSpec);
}
`;

  fs.writeFileSync(specRouteFile, specRouteContent, "utf8");
  generatedFiles.add(specRouteFile);

  console.log("📚 Generated API documentation at /api/quickwire-docs");
}

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
    // Remove old generated files for this backend file
    const oldSet = backendToGenerated.get(filePath);
    if (oldSet) {
      for (const oldFile of oldSet) {
        try {
          if (fs.existsSync(oldFile)) {
            fs.unlinkSync(oldFile);
          }
          generatedFiles.delete(oldFile);
        } catch (error) {
          console.warn(`⚠️ Failed to remove old file ${oldFile}:`, error);
        }
      }
      backendToGenerated.delete(filePath);
    }

    const moduleExports = analyzeModuleExports(filePath);
    if (moduleExports.functions.length === 0) return false;

    const beforeNew = new Set(generatedFiles);

    const endpoints = generateApiRoutesForFile(filePath);
    generateQuickwireFile(filePath, endpoints);

    // Collect new generated files for this backend file
    const newSet = new Set<string>();
    for (const f of generatedFiles) {
      if (!beforeNew.has(f)) {
        newSet.add(f);
      }
    }

    if (newSet.size > 0) {
      backendToGenerated.set(filePath, newSet);
    }

    return true;
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error);
    return false;
  }
}

function scanAllBackendFunctions(): void {
  const now = Date.now();
  const isFullRegen = fileCache.size === 0 || (now - lastFullScan > CONFIG.performance.cacheExpiryMs);
  const hasChanges = changedFiles.size > 0 || deletedFiles.size > 0;

  if (!hasChanges && !isFullRegen) {
    console.log("⚡ No changes detected, skipping regeneration");
    return;
  }

  if (isFullRegen) {
    generatedFiles.clear();
    backendToGenerated.clear();
    if (now - lastFullScan > CONFIG.performance.cacheExpiryMs) {
      fileCache.clear();
    }
  }

  console.log("🔍 Scanning backend functions...");
  const startTime = Date.now();

  // Handle deletions
  for (const deletedPath of deletedFiles) {
    const genSet = backendToGenerated.get(deletedPath);
    if (genSet) {
      for (const f of genSet) {
        try {
          if (fs.existsSync(f)) {
            fs.unlinkSync(f);
            console.log(`🗑️ Removed generated file: ${path.relative(process.cwd(), f)}`);
          }
          generatedFiles.delete(f);
        } catch (error) {
          console.warn(`⚠️ Failed to remove ${f}:`, error);
        }
      }
      backendToGenerated.delete(deletedPath);
    }
    fileCache.delete(deletedPath);
  }
  deletedFiles.clear();

  let processedCount = 0;
  let skippedCount = 0;

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

      // Safety check to prevent runaway processing
      if (processedCount + skippedCount > CONFIG.performance.maxFilesToProcess) {
        console.warn(`⚠️ Reached maximum file limit (${CONFIG.performance.maxFilesToProcess}), stopping scan`);
        return;
      }

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
        if (!isFullRegen && !changedFiles.has(filePath)) {
          skippedCount++;
          continue;
        }

        if (processBackendFile(filePath)) {
          processedCount++;
        } else {
          skippedCount++;
        }
      }
    }
  }

  walk(backendDir);

  // Generate API documentation only if needed
  if (CONFIG.performance.enableDocGeneration && 
      (isFullRegen || hasChanges || docCache.size === 0)) {
    generateDocumentationFiles();
  }

  // Cleanup orphaned files
  cleanupOrphanedFiles();

  const endTime = Date.now();
  const duration = endTime - startTime;
  
  console.log(`✅ Processed ${processedCount} files, skipped ${skippedCount} files (${duration}ms)`);
  
  // Update tracking variables
  if (isFullRegen) {
    lastFullScan = now;
  }
  changedFiles.clear();
  
  // Log performance metrics
  if (processedCount > 0) {
    console.log("📊 Performance Summary:");
    console.log(`   Cache hits: ${fileCache.size} files`);
    console.log(`   Processing time: ${duration}ms`);
    console.log(`   Avg per file: ${Math.round(duration / Math.max(processedCount, 1))}ms`);
    
    // Log HTTP method summary
    const methodCounts: Record<string, number> = {};
    generatedFiles.forEach(file => {
      if (file.includes('api') && !file.includes('quickwire-docs')) {
        try {
          const content = fs.readFileSync(file, 'utf-8');
          const methodMatch = content.match(/export async function (GET|POST|PUT|PATCH|DELETE)/);
          if (methodMatch) {
            const method = methodMatch[1];
            methodCounts[method] = (methodCounts[method] || 0) + 1;
          }
        } catch (error) {
          // Ignore read errors
        }
      }
    });
    
    if (Object.keys(methodCounts).length > 0) {
      console.log("📊 HTTP Method Distribution:");
      Object.entries(methodCounts).forEach(([method, count]) => {
        console.log(`   ${method}: ${count} endpoints`);
      });
    }
  }
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
  console.log("🔧 HTTP Method Detection Enabled:");
  Object.entries(CONFIG.httpMethods).forEach(([method, prefixes]) => {
    console.log(`   ${method}: ${prefixes.slice(0, 5).join(', ')}${prefixes.length > 5 ? ', ...' : ''}`);
  });

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
      markFileChanged(filePath);
      debouncedScan();
    })
    .on("change", (filePath) => {
      console.log(`📝 Changed: ${path.relative(process.cwd(), filePath)}`);
      markFileChanged(filePath);
      debouncedScan();
    })
    .on("unlink", (filePath) => {
      console.log(`🗑️ Removed: ${path.relative(process.cwd(), filePath)}`);
      if (shouldProcessFile(filePath)) {
        deletedFiles.add(filePath);
      }
      markFileChanged(filePath);
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