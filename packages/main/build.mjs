import { build } from 'esbuild'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const rootNodeModules = resolve(__dirname, '..', '..', 'node_modules')

// Build main process — with native module resolver
await build({
  entryPoints: ['src/main.ts'],
  bundle: true,
  platform: 'node',
  target: 'node18',
  format: 'cjs',
  outdir: 'dist',
  external: ['electron', 'better-sqlite3', 'sharp'],
  sourcemap: true,
  banner: {
    js: `
      const _origResolve = module.constructor._resolveFilename;
      module.constructor._resolveFilename = function(request, parent, isMain, options) {
        if (['better-sqlite3', 'sharp'].includes(request) || request.startsWith('sharp/') || request.startsWith('better-sqlite3/')) {
          try {
            return _origResolve.call(this, request, parent, isMain, options);
          } catch {
            const rootPath = ${JSON.stringify(rootNodeModules)};
            const Module = require('module');
            const m = new Module('');
            m.paths = [rootPath, ...Module._nodeModulePaths(rootPath)];
            return Module._resolveFilename(request, m, isMain, options);
          }
        }
        return _origResolve.call(this, request, parent, isMain, options);
      };
    `,
  },
})

// Build preload separately — NO banner, minimal bundle
await build({
  entryPoints: ['src/preload.ts'],
  bundle: true,
  platform: 'node',
  target: 'node18',
  format: 'cjs',
  outdir: 'dist',
  external: ['electron'],
  sourcemap: true,
})

console.log('Main process built successfully')
