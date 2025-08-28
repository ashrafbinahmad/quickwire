import fs from "fs";
import path from "path";
import ts from "typescript";

export interface QuickwireConfig {
  backendDir: string;
  apiDir: string;
  quickwireDir: string;
  supportedExtensions: string[];
  apiRouteTemplate: string;
  excludePatterns: string[];
  compilerOptions: ts.CompilerOptions;
  watchDebounceMs: number;
  performance: {
    enableDocGeneration: boolean;
    maxFilesToProcess: number;
    enableIncrementalUpdates: boolean;
    cacheExpiryMs: number;
  };
  httpMethods: Record<string, string[]>;
}

const defaultConfig: QuickwireConfig = {
  backendDir: path.join(process.cwd(), "src", "backend"),
  apiDir: path.join(process.cwd(), "src", "app", "api", "(quickwired)"),
  quickwireDir: path.join(process.cwd(), "quickwired"),
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
  },
  watchDebounceMs: 300,
  performance: {
    enableDocGeneration: true,
    maxFilesToProcess: 1000,
    enableIncrementalUpdates: true,
    cacheExpiryMs: 30 * 60 * 1000, // Increased to 30 minutes
  },
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

function loadConfig(): QuickwireConfig {
  // Look for config in multiple locations
  const configPaths = [
    path.join(process.cwd(), "quickwire.config.json"),
    path.join(process.cwd(), "scripts", "quickwire.config.json"),
    path.join(process.cwd(), ".quickwire", "config.json"),
  ];
  
  for (const configPath of configPaths) {
    if (fs.existsSync(configPath)) {
      try {
        const configContent = fs.readFileSync(configPath, "utf-8");
        const userConfig = JSON.parse(configContent);
        console.log(`📄 Loaded config from: ${path.relative(process.cwd(), configPath)}`);
        return { ...defaultConfig, ...userConfig };
      } catch (error) {
        console.warn(`⚠️ Failed to load config from ${configPath}: ${error}`);
      }
    }
  }
  
  console.log(`📄 Using default configuration`);
  return defaultConfig;
}

export const CONFIG = loadConfig();