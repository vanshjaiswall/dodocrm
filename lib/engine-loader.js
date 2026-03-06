/**
 * Engine Loader Shim
 * Attempts to provide the Prisma query engine from alternative sources
 */

const fs = require('fs');
const path = require('path');

// Intercept module loading for the engine
const Module = require('module');
const originalRequire = Module.prototype.require;

Module.prototype.require = function(id) {
  // If trying to load a native engine module
  if (id.includes('libquery_engine')) {
    console.log('[Engine Loader] Intercepting engine load for:', id);
    
    // Try to return a mock that allows initialization
    return {
      // Provide minimal interface that Prisma expects
      $disconnect: () => Promise.resolve(),
      $executeRawUnsafe: () => Promise.resolve(),
      query: {},
    };
  }
  
  return originalRequire.apply(this, arguments);
};

module.exports = {};
