# Release And Dist-Tag Policy

This document defines the rule for moving the npm `latest` dist-tag for
`@zenithbuild/language` and `@zenithbuild/language-server`. The rule is
non-automatic by design.

## Why `latest` is not auto-moved

Stale completions and snippets ship under the same version surface as
syntax-highlighting changes. A broken extension can teach `count.value`,
`useState(`, or other framework-foreign idioms even when the grammar is
correct. To prevent silent regression we publish under `next` and require
real installed-editor verification before promoting `latest`.

## Release sequence

1. Run release tooling to bump versions, commit, tag, and publish:
   ```bash
   bun run release
   ```
   The CI workflow publishes both packages under `--tag next` only.
2. Inspect tags:
   ```bash
   npm dist-tag ls @zenithbuild/language
   npm dist-tag ls @zenithbuild/language-server
   ```
   `next` should now match the freshly published version. `latest` may
   still point at the previous good version.
3. Run installed-editor verification (both checklists must pass on the
   published tarball, not just the local repo):
   - [Cursor / VS Code verification](manual-cursor-verification.md)
   - [Neovim verification](manual-neovim-verification.md)
4. Capture verification evidence (VSIX path, extension id, language mode,
   token inspector screenshots, completion screenshots showing no
   `count.value`, LSP attached, diagnostic round-trip).
5. Only after evidence is recorded, promote `latest`:
   ```bash
   npm dist-tag add @zenithbuild/language@<X.Y.Z> latest
   npm dist-tag add @zenithbuild/language-server@<X.Y.Z> latest
   ```
6. Re-run `npm dist-tag ls` on each package and capture the post-state.

## Quick failure modes

- Forgetting to install the local `.vsix` before checking completions →
  Cursor is still using the previously installed extension. Disable older
  versions first; then install the candidate `.vsix`.
- Confusing `npm i -g @zenithbuild/language` with “Cursor extension
  installed.” The npm global install only places Neovim runtime files on
  disk; Cursor still needs the VSIX or Marketplace install.
- Promoting `latest` based on repo tests alone. The repo test suite is a
  necessary but insufficient gate.
