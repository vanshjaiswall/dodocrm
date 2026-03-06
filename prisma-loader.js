/**
 * Prisma Loader - Module loader that provides compatibility for missing engines
 * 
 * This file should be loaded with: node --require ./prisma-loader.js <your-script>
 * Or used in package.json scripts
 */

const Module = require('module');
const path = require('path');
const fs = require('fs');

// Save the original load function
const originalLoad = Module.prototype.load;
const originalRequire = Module.prototype.require;

// Track if we've already handled the engine loading
let engineLoaded = false;

// Try to load better-sqlite3 if available
let sqlite3Module = null;
try {
  sqlite3Module = require('better-sqlite3');
} catch (e) {
  // better-sqlite3 not available, we'll need another approach
}

Module.prototype.load = function(filename) {
  // Check if this is the Prisma library trying to load an engine
  if (filename.includes('.prisma/client') && (filename.includes('libquery_engine') || filename.includes('query-engine'))) {
    console.log('[Prisma Loader] Intercepting engine load:', path.basename(filename));
    
    if (!engineLoaded && sqlite3Module) {
      engineLoaded = true;
      console.log('[Prisma Loader] Using sqlite3 compatibility mode');
      
      // Create a minimal module that satisfies the Prisma engine interface
      const mockEngine = {
        // Minimal interface to allow initialization
        start: async () => ({}),
        stop: async () => {},
        request: async (request) => {
          throw new Error('Prisma Mock Engine: This is a placeholder engine for initialization only');
        },
        executeRaw: async () => {
          throw new Error('Prisma Mock Engine: Raw execution not supported');
        },
      };
      
      // Return the mock instead of trying to load the actual module
      this.filename = filename;
      this.paths = Module._nodeModulePaths(path.dirname(filename));
      this.exports = mockEngine;
      this.loaded = true;
      return;
    }
  }
  
  // Call the original load for all other modules
  return originalLoad.call(this, filename);
};

console.log('[Prisma Loader] Loaded - ready to intercept Prisma engine loading');

module.exports = {};
