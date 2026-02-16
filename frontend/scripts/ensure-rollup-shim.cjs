#!/usr/bin/env node
const fs = require('node:fs')
const path = require('node:path')
const isMac = process.platform === 'darwin'
if (isMac) process.exit(0)
const projectRoot = path.resolve(__dirname, '..')
const nodeModulesDir = path.join(projectRoot, 'node_modules')
const shimDir = path.join(nodeModulesDir, '@rollup', 'rollup-linux-x64-gnu')
const nativeFile = path.join(shimDir, 'dist', 'native.js')
try {
  fs.rmSync(shimDir, { recursive: true, force: true })
  const wasmPackageJson = require('@rollup/wasm-node/package.json')
  fs.mkdirSync(path.dirname(nativeFile), { recursive: true })
  const pkgJsonPath = path.join(shimDir, 'package.json')
  fs.writeFileSync(pkgJsonPath, JSON.stringify({
    name: '@rollup/rollup-linux-x64-gnu',
    version: wasmPackageJson.version,
    main: 'dist/native.js',
    module: 'dist/native.js',
    types: 'dist/native.d.ts',
  }, null, 2))
  const shimSource = `const wasm = require('@rollup/wasm-node/dist/native.js')
module.exports = {
  parse: wasm.parse,
  parseAsync: wasm.parseAsync || (async (...args) => wasm.parse(...args)),
  xxhashBase64Url: wasm.xxhashBase64Url,
  xxhashBase36: wasm.xxhashBase36,
  xxhashBase16: wasm.xxhashBase16,
}
`
  fs.writeFileSync(nativeFile, shimSource)
  fs.writeFileSync(path.join(shimDir, 'dist', 'native.d.ts'), `import type * as Wasm from '@rollup/wasm-node/dist/native.js';
export const parse: typeof Wasm.parse;
export const parseAsync: typeof Wasm.parseAsync;
export const xxhashBase64Url: typeof Wasm.xxhashBase64Url;
export const xxhashBase36: typeof Wasm.xxhashBase36;
export const xxhashBase16: typeof Wasm.xxhashBase16;
`)
} catch (err) {
  console.warn('[rollup-shim] Failed:', err.message)
}
process.exit(0)
