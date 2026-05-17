/**
 * Acceptance tests: grammar and snippets contain expected tokens/prefixes.
 * No VS Code required. Runs in CI.
 */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const childProcess = require('node:child_process');

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

test('package.json contributes legacy zen alias mapped to zenith grammar', () => {
  const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));

  const languages = pkg.contributes?.languages || [];
  const zenLang = languages.find((l) => l.id === 'zen');
  assert.ok(zenLang, 'zen language id must be contributed as a back-compat alias');
  assert.equal(zenLang?.configuration, './language-configuration.json');

  const grammars = pkg.contributes?.grammars || [];
  const zenGrammar = grammars.find((g) => g.language === 'zen');
  assert.ok(zenGrammar, 'zen language must have a grammar contribution');
  assert.equal(zenGrammar?.scopeName, 'text.html.zenith', 'zen alias must reuse the zenith TextMate scope');
  assert.equal(zenGrammar?.path, './syntaxes/zenith.tmLanguage.json', 'zen alias must point at the same grammar file');

  const snippets = pkg.contributes?.snippets || [];
  const zenSnippets = snippets.find((s) => s.language === 'zen');
  assert.ok(zenSnippets, 'zen language must receive the same snippets contribution');
  assert.equal(zenSnippets?.path, './snippets/zenith.code-snippets');

  const activationEvents = pkg.activationEvents || [];
  assert.ok(
    activationEvents.includes('onLanguage:zen'),
    'onLanguage:zen activation event must be registered for the alias'
  );
});

test('package metadata and README describe VS Code role without standalone server drift', () => {
  const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));
  const readme = fs.readFileSync(path.join(ROOT, 'README.md'), 'utf8');

  assert.match(pkg.description, /VS Code language-server integration/);
  assert.equal(pkg.repository.url, 'https://github.com/zenithbuild/zenith-language.git');
  assert.equal(pkg.homepage, 'https://github.com/zenithbuild/zenith-language#readme');
  assert.equal(pkg.bugs.url, 'https://github.com/zenithbuild/zenith-language/issues');

  assert.match(readme, /This package is the VS Code extension/);
  assert.match(readme, /@zenithbuild\/language-server/);
  assert.match(readme, /zenith-language-server/);
  assert.match(readme, /no full TypeScript semantic completion or typechecking/);
});

test('Neovim runtime files provide Zenith filetype and syntax fallback', () => {
  const ftdetect = fs.readFileSync(path.join(ROOT, 'ftdetect', 'zenith.vim'), 'utf8');
  const filetypeLua = fs.readFileSync(path.join(ROOT, 'filetype.lua'), 'utf8');
  const plugin = fs.readFileSync(path.join(ROOT, 'plugin', 'zenith.lua'), 'utf8');
  const afterFtdetect = fs.readFileSync(path.join(ROOT, 'after', 'ftdetect', 'zenith.vim'), 'utf8');
  const syntax = fs.readFileSync(path.join(ROOT, 'syntax', 'zenith.vim'), 'utf8');
  const readme = fs.readFileSync(path.join(ROOT, 'README.md'), 'utf8');

  assert.match(ftdetect, /\*\.zen/);
  assert.match(ftdetect, /\*\.zen\.html/);
  assert.match(ftdetect, /\*\.zenx/);
  assert.match(ftdetect, /filetype=zenith/);
  assert.match(filetypeLua, /vim\.filetype\.add/);
  assert.match(filetypeLua, /zenith/);
  assert.match(plugin, /vim\.filetype\.add/);
  assert.match(plugin, /filetype = "zenith"/);
  assert.match(plugin, /BufEnter/);
  assert.match(plugin, /BufWinEnter/);
  assert.match(plugin, /current_syntax/);
  assert.match(plugin, /syntax = "zenith"/);
  assert.match(afterFtdetect, /filetype=zenith/);
  assert.match(syntax, /zenithEventBinding/);
  assert.match(syntax, /zenithScript/);
  assert.match(syntax, /syntax\/typescript\.vim/);
  assert.match(readme, /runtimepath/);
  assert.match(readme, /no semantic tokens yet/);
});

test('Neovim runtime smoke detects filetype and syntax when nvim is available', { skip: !hasNeovim() }, () => {
  const fixture = path.join(ROOT, 'test', 'fixtures', 'grammar-test.zen');
  const cleanHome = fs.mkdtempSync(path.join(require('node:os').tmpdir(), 'zenith-nvim-home-'));
  const script = [
    'filetype on',
    'syntax enable',
    `edit ${fixture.replace(/\\/g, '\\\\').replace(/ /g, '\\ ')}`,
    'lua print("ft=" .. vim.bo.filetype)',
    'lua print("syntax=" .. vim.fn.synIDattr(vim.fn.synID(1, 2, 1), "name"))',
    'qa!'
  ];
  const result = childProcess.spawnSync('nvim', [
    '--headless',
    '-u',
    'NONE',
    '-n',
    '--cmd',
    `set runtimepath^=${ROOT.replace(/\\/g, '\\\\').replace(/ /g, '\\ ')}`,
    ...script.map((cmd) => `+${cmd}`)
  ], {
    encoding: 'utf8',
    env: { ...process.env, XDG_CONFIG_HOME: cleanHome, XDG_DATA_HOME: cleanHome }
  });

  assert.equal(result.status, 0, result.stderr);
  const output = `${result.stdout}\n${result.stderr}`;
  assert.match(output, /ft=zenith/);
  assert.match(output, /syntax=.+/);
});

function hasNeovim() {
  const result = childProcess.spawnSync('nvim', ['--version'], { encoding: 'utf8' });
  return result.status === 0;
}
