/**
 * Acceptance tests: grammar and snippets contain expected tokens/prefixes.
 * No VS Code required. Runs in CI.
 */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');

const CANONICAL_PRIMITIVES = [
  'state',
  'signal',
  'ref',
  'zenMount',
  'zenWindow',
  'zenDocument',
  'zenOn',
  'zenResize',
  'collectRefs'
];

const SNIPPET_PREFIXES = [
  'zenOn',
  'zenResize',
  'zenWindow',
  'zenMount',
  'ref',
  'state',
  'signal',
  'on:click',
  'collectRefs'
];

test('grammar includes canonical primitives', () => {
  const grammarPath = path.join(ROOT, 'syntaxes', 'zenith.tmLanguage.json');
  const grammar = JSON.parse(fs.readFileSync(grammarPath, 'utf8'));

  const repo = grammar.repository || {};
  const grammarStr = JSON.stringify(grammar);

  for (const prim of CANONICAL_PRIMITIVES) {
    assert.ok(
      grammarStr.includes(prim),
      `Grammar should include "${prim}"`
    );
  }

  assert.ok(grammar.scopeName === 'text.html.zenith', 'Scope should be text.html.zenith');
  assert.ok(grammar.fileTypes?.includes('zen'), 'File types should include .zen');
});

test('snippets include expected prefixes', () => {
  const snippetsPath = path.join(ROOT, 'snippets', 'zenith.code-snippets');
  const snippets = JSON.parse(fs.readFileSync(snippetsPath, 'utf8'));
  const snippetStr = JSON.stringify(snippets);

  for (const prefix of SNIPPET_PREFIXES) {
    assert.ok(
      snippetStr.includes(prefix),
      `Snippets should include "${prefix}"`
    );
  }
});

test('package.json contributes single grammar for zenith', () => {
  const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));
  const grammars = pkg.contributes?.grammars || [];
  const zenithGrammars = grammars.filter((g) => g.language === 'zenith');
  assert.equal(zenithGrammars.length, 1, 'Exactly one grammar for zenith');
  assert.equal(zenithGrammars[0]?.scopeName, 'text.html.zenith');
});
