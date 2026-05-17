# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.7.14] - 2026-05-17

### 🐛 Bug Fixes

- ****editor**: syntax alias, API truth gates, and publish hardening (0.7.13)** (6946222)
  > Add zen language-id alias, canonical snippets/API truth gates, pack verification, and next-only publish policy. Closes #4.

## [0.7.13] - 2026-05-17

### Added

- `zen` legacy language id alias mapped to the canonical `zenith` grammar and
  snippets. Activation event `onLanguage:zen` is now registered, so user
  settings such as `"files.associations": { "*.zen": "zen" }` still load the
  Zenith TextMate grammar instead of falling back to plain text.
- Soft warning at activation when an opened `.zen`/`.zenx`/`.zen.html` buffer
  is associated with a non-Zenith language id.
- Context-aware forbidden-pattern truth gates (`test/api-truth.spec.js`) for
  snippets, README canonical examples, manual verification doc examples,
  and grammar-test fixtures. Stale framework idioms such as Vue `.value`,
  React `useState`, Solid `createSignal`, Svelte `$:` and `{#if}/{#each}`,
  vanilla `onclick=`, React `onClick=`, and Vue `@click=` are blocked from
  editor-facing surfaces.
- `signal counter`, `signal read`, and `signal write` snippets demonstrating
  the canonical `.get()` / `.set()` API.
- Manual Cursor verification checklist (`docs/manual-cursor-verification.md`).
- Release + dist-tag policy doc (`docs/release-and-dist-tags.md`).
- Pack-payload assertion script (`scripts/assert-pack-payload.mjs`) and a
  `verify:pack` npm script.
- `prepublishOnly` lifecycle that builds the server + extension, runs the
  full test suite, and asserts the npm payload before publish.

### Changed

- Grammar test fixture (`test/fixtures/grammar-test.zen`) now demonstrates
  canonical `state count = 0`, `on:click={handler}`, and `zenMount(() => ...)`
  instead of the previous `onClick={() => increment()}` and `zenOnMount`
  patterns.
- README troubleshooting section calls out the `files.associations` and
  duplicate-extension failure modes and the difference between `npm i -g
  @zenithbuild/language` (Neovim runtime files only) and installing the VS
  Code extension.
- CI release workflow publishes under `--tag next` instead of moving `latest`
  automatically. `latest` may only be promoted by a human after the Cursor
  and Neovim verification checklists pass on the published tarball.

### Added

- Neovim runtime filetype detection and Vim syntax fallback for `.zen`, `.zen.html`, and `.zenx` files.
- Real-project Neovim smoke script and manual verification checklist.
- Explicit npm package payload for editor runtime files and built extension artifacts.

## [0.7.11] - 2026-05-14

### Changed

- Clarified the package role as the VS Code language extension.
- Pointed Neovim and plain LSP users to `@zenithbuild/language-server`.
- Updated package metadata for the standalone repository.
- Fixed VS Code client startup subscription handling.

### Added

- README and package metadata truth coverage.

## [0.6.0] - 2026-02-28

### Added

- Grammar: canonical primitives (ref, signal, state, zenOn, zenMount, zenWindow, zenDocument)
- Grammar: `on:event` with handler expression highlighted as TypeScript
- Grammar: legacy `@click` / `onclick` scoped as legacy
- Snippets for canonical primitives (consistent ctx.cleanup style)
- `zenith.strictDomLints` setting contribution

## [0.5.0-beta.2.19] - 2026-02-04

### ✨ Features

- ****dev-server**: implement Phase 6 - Zero-Copy Dev Server Integration** (c5f68e2)
  > Implement a high-performance, in-memory development server architecture for the Zenith Framework.
  > 
  > - Phase 6 integration of Dev Server and AssetStore.
  > - NAPI Controller and HMR loop implementation.
  > - Workspace-wide alignment for Phase 6 completion.

### 📝 Other Changes

- **
6b09f56bc93f88c257d3438cef248d3ed2cbded2** ()
  > chore(release): improve release notes legibility and synchronize workflows
- **
4e9d6996c8bf6cca78950f2eca32a2f6043b4144** ()
  > chore: bump version to 0.4.6
- **
bc616575385b6ad29ee674df2f76dc5d66f9ada0** ()
  > chore: bump version to 0.4.5
- **
a2918a92a8b0d918bfa5516efe65796decf4e988** ()
  > ci: fix release workflow and apply updates
- **
0371750a7043e02cb8386199c3369bed3943de9f** ()
  > chore: update zenith-language
- **** ()

## [0.4.7] - 2026-01-26

### 📝 Other Changes

- **** ()

## [0.4.0] - 2026-01-16

### ✨ Features

- **language**: update syntax grammar for new directives and reactive bindings (cb65c98)

### 🐛 Bug Fixes

- **release**: use appendFileSync for GitHub Actions output (c953f51)

### 📝 Other Changes

- 
c1aa285dac910ec64f2240c849ff6c0d18b7cd2e ()
- 
dc90df4092e298ffdce221f8127ae87b0aeed45c ()
- 
18982c541782091455f32bb5c354e66a06c2938a ()
- 
5a5046880d2afbc7df70abce0062c6a4be21859e ()
- 
8627c68faf8cd28521675a6216dc7462c7deb2b2 ()
- 
e06fdd9e3167f30671c559e98c3fb75088c7e1b6 ()
- 0.2.9 (de391df)
- 
e0ad1cd02292af51ac321e7580ae9e534abd6c1b ()
- 
e4ca2b1d2af81e1cf9876b0932cd3178b7d1bf7e ()
- 
cff8202737008d97c6527703f51783583eae7e6f ()
- 
645d159ba240aec6cb6cab5bf332743f6eed4fcd ()
- 
52507461378cb8f2d87245b84924790a191879ad ()
-  ()
