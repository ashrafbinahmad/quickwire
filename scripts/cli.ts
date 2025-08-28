#!/usr/bin/env node

import fs from "fs";
import path from "path";
import chokidar from "chokidar";
import { CONFIG } from "./config";
import { markFileChanged, scanAllBackendFunctions } from "./generator";
import { shouldProcessFile } from "./utils/utils";

const args = process.argv.slice(2);
const isWatchMode = args.includes("--watch") || args.includes("-w");
const isVersionMode = args.includes("--version") || args.includes("-v");
const isHelpMode = args.includes("--help") || args.includes("-h");

if (isVersionMode) {
  const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, "../package.json"), "utf-8"));
  console.log(`quickwire v${packageJson.version}`);
  process.exit(0);
}

if (isHelpMode) {
  console.log(`
🚀 Quickwire - Automatic API Generator for Next.js

Usage:
  quickwire [options]

Options:
  --watch, -w      Watch for file changes and regenerate automatically
  --version, -v    Show version number
  --help, -h       Show this help message

Examples:
  quickwire                 # Generate API routes once
  quickwire --watch         # Watch for changes and regenerate
  quickwire -w              # Short form of watch mode

Configuration:
  Place a quickwire.config.json file in your scripts/ directory to customize settings.

For more information, visit: https://github.com/quickwire/quickwire
  `);
  process.exit(0);
}

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
  console.log(`📂 Watching: ${CONFIG.backendDir}`);
  console.log("🔧 HTTP Method Detection Enabled:");
  Object.entries(CONFIG.httpMethods).forEach(([method, prefixes]) => {
    console.log(`   ${method}: ${prefixes.slice(0, 5).join(', ')}${prefixes.length > 5 ? ', ...' : ''}`);
  });

  // Initial scan without debouncing
  console.log("🔍 Performing initial scan...");
  scanAllBackendFunctions();

  const watcher = chokidar.watch(CONFIG.backendDir, {
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
      if (shouldProcessFile(filePath, CONFIG)) {
        // Handle file deletion
        markFileChanged(filePath);
      }
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

function main(): void {
  try {
    // Ensure directories exist
    fs.mkdirSync(CONFIG.backendDir, { recursive: true });
    fs.mkdirSync(CONFIG.apiDir, { recursive: true });
    fs.mkdirSync(CONFIG.quickwireDir, { recursive: true });

    if (isWatchMode) {
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