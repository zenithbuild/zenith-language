# Installed Editor Verification — 2026-05-17

Verification run for the chore/editor-syntax-and-api-truth branch of
`@zenithbuild/language` and the chore/editor-api-truth branch of
`@zenithbuild/language-server`. This is the gating run before any npm
`latest` promotion.

## Test machine

- macOS 25.5 (darwin arm64)
- Cursor 3.4.20 (commit 0cf8b06883f54e26bb4f0fb8647c9500ccb43310, arm64)
- Neovim 0.10+
- Node 24.15.0, npm 11.6.1

## Cursor

- VSIX source: local build, `bun run build:marketplace`
  - Path: `/Users/judahsullivan/Personal/zenith-language/zenith-language-vscode-marketplace.vsix`
  - Size: 814 KB, 34 files
- Extension id installed: `zenithbuild.zenith-language`
- Extension version: `0.7.12`
- Older extensions present before run: `0.2.7`, `0.3.0`, plus a duplicate `0.7.12-universal` directory.
- Older extensions removed during run.
- Final `files.associations` in
  `~/Library/Application Support/Cursor/User/settings.json`:
  ```json
  "files.associations": { "*.zen": "zenith" }
  ```
- Patched extension package.json content (verified via `unzip -p VSIX extension/package.json`):
  - `contributes.languages`: `['zenith', 'zen']`
  - `contributes.grammars`: `['zenith', 'zen']`
  - `activationEvents` includes `onLanguage:zenith` and `onLanguage:zen`.
- Language mode on `framework/site/src/pages/index.zen`: `Zenith`.
- Token inspector evidence required for manual run (Cursor cannot be driven
  headless from this environment); use the
  [Cursor verification checklist](../manual-cursor-verification.md) to capture:
  - one tag scope (`entity.name.tag.zenith`)
  - one attribute or event-binding scope
  - one expression scope (`meta.embedded.inline.typescript`)
  - one script token scope (`source.ts`)

## Neovim

Headless smoke against the real `framework/site/src/pages/index.zen` using the
installed package root path on `runtimepath` (`scripts/neovim-installed-smoke.mjs`):

```json
{
  "ok": true,
  "filetype": "zenith",
  "syntax": { "first": "zenithTag", "later": "typescriptObjectLiteral" },
  "attachedClients": 1,
  "activeClients": 1,
  "bufferClients": 1,
  "completionRequestReturned": true,
  "hoverRequestReturned": true,
  "diagnostic": {
    "source": "zenith-contract",
    "code": "zenith.event.binding.syntax",
    "message": "Invalid event binding syntax. Use on:click={handler}.",
    "lnum": 0,
    "col": 8
  }
}
```

Interpretation:
- `filetype=zenith` confirms ftdetect runtime is loaded.
- `syntax.first=zenithTag` confirms TextMate-equivalent Vim syntax is active.
- `syntax.later=typescriptObjectLiteral` confirms TypeScript scopes apply
  inside `<script lang="ts">` regions.
- `activeClients=1` and `bufferClients=1` confirm the standalone language
  server attached to the buffer.
- `completionRequestReturned=true` and `hoverRequestReturned=true` confirm
  the LSP responds to completion / hover requests.
- The diagnostic round-trips for a contract violation; clears on restore.

## LSP completion truth (stdio-installed)

Run via `bun run test:unit` in `zenith-language-server` over the same stdio
shim that Cursor and Neovim use:

- `script-context completions only teach canonical signal/state/ref API`:
  - `signal` insertText calls `signal(...)`, teaches `.set(...)` and `.get()`,
    contains no `.value`.
  - `state` insertText is declarative `state ${1:name} = ...`.
  - No `count.value` in any label or insertText.
  - No `zenOnMount`, `zenOnDestroy`, `zenOnUpdate`, `zenRef`, `zenState`, or
    `useFetch` in the completion list.
- `script-context hover for \`signal\` returns canonical .get()/.set() API docs`:
  - Hover content includes `signal`, `.get()`, and `.set(`.

## Repo gates

- `zenith-language` `npm test` — 14/14 pass (grammar, snippets, API truth,
  Neovim runtime, headless nvim smoke, zen alias contract).
- `zenith-language` `npm run verify:pack` — 23 files, all required assets
  present (grammar, language config, snippets, Neovim runtime, docs,
  compiled extension output).
- `zenith-language-server` `bun run test:unit` — 30/30 pass (contracts,
  diagnostics, completion+hover smoke, stdio bin, Neovim attach, project
  root, API truth, completion/hover canonical assertions).
- `zenith-language-server` `npm run verify:pack` — 6 files, all required
  assets present (bin shim, dist/server.js, docs, README, LICENSE).

## Status

- Cursor extension VSIX: built, installed, language id + grammar + activation
  confirmed for both `zenith` and `zen` ids.
- Neovim runtime + LSP: confirmed working against the real project file.
- LSP completion + hover: confirmed canonical and stale-pattern-free over
  actual stdio.
- `latest` dist-tag promotion: NOT performed. Must remain on the previous
  stable until a human completes the Cursor token-inspector portion of
  [manual-cursor-verification.md](../manual-cursor-verification.md) and
  records the screenshots / scopes there.
