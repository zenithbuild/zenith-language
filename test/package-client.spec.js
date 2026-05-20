/**
 * VS Code/Cursor client packaging gates.
 *
 * These tests catch activation regressions where the TextMate grammar ships
 * correctly but the extension host cannot start the Zenith language client.
 */

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const childProcess = require('node:child_process');

const ROOT = path.resolve(__dirname, '..');
const PACKAGE_JSON_PATH = path.join(ROOT, 'package.json');
const EXTENSION_BUNDLE_PATH = path.join(ROOT, 'out', 'extension.js');
const SERVER_BUNDLE_PATH = path.join(ROOT, 'out', 'server.js');

function readPackageJson() {
  return JSON.parse(fs.readFileSync(PACKAGE_JSON_PATH, 'utf8'));
}

test('package contributes Zenith language ids and activation events', () => {
  const manifest = readPackageJson();
  const languageIds = new Set((manifest.contributes?.languages || []).map((language) => language.id));
  assert.ok(languageIds.has('zenith'), 'package must contribute language id "zenith"');
  assert.ok(languageIds.has('zen'), 'package must contribute legacy language id "zen"');

  const activationEvents = new Set(manifest.activationEvents || []);
  assert.ok(activationEvents.has('onLanguage:zenith'), 'package must activate on zenith documents');
  assert.ok(activationEvents.has('onLanguage:zen'), 'package must activate on legacy zen documents');
});

test('extension bundle is self-contained for the language client runtime', () => {
  assert.ok(fs.existsSync(EXTENSION_BUNDLE_PATH), 'run bun run compile before tests');
  const bundle = fs.readFileSync(EXTENSION_BUNDLE_PATH, 'utf8');

  assert.doesNotMatch(
    bundle,
    /require\(["']vscode-languageclient\/node["']\)/,
    'out/extension.js must not require vscode-languageclient/node at runtime'
  );
  assert.doesNotMatch(
    bundle,
    /require\(["']vscode-(jsonrpc|languageserver-protocol|languageserver-types)(\/[^"']*)?["']\)/,
    'out/extension.js must not require unshipped vscode-languageclient dependencies at runtime'
  );
  assert.match(
    bundle,
    /BaseLanguageClient|createProtocolConnection|LanguageClient/,
    'out/extension.js must include bundled language-client implementation code'
  );
});

test('bundled server keeps branded completion ranking metadata', () => {
  assert.ok(fs.existsSync(SERVER_BUNDLE_PATH), 'run bun run compile after building language-server');
  const bundle = fs.readFileSync(SERVER_BUNDLE_PATH, 'utf8');
  assert.doesNotMatch(
    bundle,
    /require\(["'](vscode-languageserver|vscode-languageserver-textdocument|vscode-jsonrpc|vscode-languageserver-protocol|vscode-languageserver-types)(\/[^"']*)?["']\)/,
    'out/server.js must bundle LSP runtime dependencies needed by the VSIX'
  );
  assert.match(bundle, /Zenith Signal\.set/, 'bundled server must include branded Signal.set detail');
  assert.match(bundle, /zenithSortText/, 'bundled server must include ranking helper');
  assert.match(bundle, /completion-branding/, 'bundled server must include completion-branding module marker');
});

test('neovim-installed-smoke.mjs parses as valid ECMAScript', () => {
  const script = path.join(ROOT, 'scripts', 'neovim-installed-smoke.mjs');
  const result = childProcess.spawnSync(process.execPath, ['--check', script], {
    encoding: 'utf8'
  });
  assert.equal(result.status, 0, result.stderr || result.stdout);
});
