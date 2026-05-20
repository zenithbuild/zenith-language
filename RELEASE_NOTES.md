# 🚀 @zenithbuild/language v0.9.2

## [0.9.2] - 2026-05-20

### Fixed

- Removed the obsolete `zenith.componentScripts` setting from the standalone
  VS Code/Cursor extension package.
- Packaged `@zenithbuild/compiler` metadata for the installed extension runtime
  while excluding local-only native compiler platform artifacts.
- Documented the clean `ZENITH-COMPILER-UNAVAILABLE` fallback when the native
  compiler package is unavailable; completion and hover remain available.
- Kept LSP script-mode policy out of the extension layer and left compiler
  diagnostics as the source of truth.
- Added package tests for compiler dependency packaging and stale configuration
  removal.

### Verified

- `bun run build:server`
- `bun run compile`
- `npm test` — 24 tests pass.
- `npm run verify:pack`
- `bun run build:marketplace`
- `npm pack --dry-run`
- `git diff --check`

## 📦 Installation

```bash
bun add @zenithbuild/language@0.9.2
```

*or with npm:*

```bash
npm install @zenithbuild/language@0.9.2
```

---
*Prepared for next-only publish*
