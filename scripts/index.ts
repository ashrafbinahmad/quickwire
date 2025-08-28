#!/usr/bin/env node

// Main entry point for quickwire package
export { CONFIG } from './config';
export type { QuickwireConfig } from './config';
export { analyzeModuleExports, detectHttpMethod } from './ast';
export { fileCache, getCachedExports, setCachedExports } from './cache';
export { 
  generateQuickwireFile, 
  generateApiRoutesForFile, 
  scanAllBackendFunctions,
  processBackendFile,
  markFileChanged,
  getGenerationStats
} from './generator';
export type { ExportedFunction, ExportedType, ModuleExports } from './types';
export { pascalToKebab, shouldProcessFile, sanitizeFilePath } from './utils/utils';

// Re-export utility functions that users might need
export * from './utils/index';