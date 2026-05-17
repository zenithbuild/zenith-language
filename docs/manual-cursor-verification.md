# Manual Cursor / VS Code Verification

Use this checklist against the installed extension and a real Zenith project,
not only a packaged fixture. This complements the Neovim verification doc.

## 1. Confirm the installed extension state

1. Run the command `Extensions: Show Installed Extensions`.
2. Confirm `Zenith Language Support` (`zenithbuild.zenith-language`) is
   installed and enabled.
3. Disable or uninstall older copies (for example
   `zenithbuild.zenith-language-0.2.x` / `0.3.x`). Multiple installed
   versions race for the `zenith` language id and grammar scope.
4. Inspect the extension page to record:
   - Extension version (must match the version under test)
   - Whether the source is Marketplace, Open VSX, or a local `.vsix`
   - Whether older versions are still listed

## 2. Confirm `files.associations`

1. Open `Command Palette` → `Preferences: Open User Settings (JSON)`.
2. Verify there is **no** entry such as:
   ```json
   "files.associations": { "*.zen": "zen" }
   ```
   pointing `.zen` at a language id that no installed extension contributes.
3. Recommended: either omit the entry entirely (the extension already binds
   `.zen` to `zenith`) or set:
   ```json
   "files.associations": { "*.zen": "zenith" }
   ```
   The Zenith extension also accepts the legacy id `zen` as an alias, so a
   stray `"*.zen": "zen"` will still activate the grammar.
4. Record the final `files.associations` value for the verification log.

## 3. Verify language mode on a real `.zen` file

1. Open a real authored Zen file, for example
   `framework/site/src/pages/index.zen`.
2. The status bar should display the language mode `Zenith`.
3. Run `Command Palette` → `Change Language Mode` and confirm `Zenith` is
   listed as an installed option.

## 4. Capture token inspector evidence

Run `Command Palette` → `Developer: Inspect Editor Tokens and Scopes`,
then hover the following positions and record the reported scopes:

| Location | Required scope (substring) |
|----------|---------------------------|
| A component tag name (for example `<DefaultLayout`) | `entity.name.tag.zenith` |
| An attribute or `on:` event binding | `entity.other.attribute-name` (or `.event.canonical.zenith`) |
| A `{expression}` block in markup | `meta.embedded.inline.typescript` |
| Identifier inside `<script lang="ts">` | `source.ts` |

Save screenshots of at least one tag, one event/attribute, one expression,
and one script token.

## 5. Confirm completion content (no stale framework syntax)

1. Inside `<script lang="ts">`, type `count.` after declaring
   `const count = signal(0);`.
2. Confirm the completion popup offers `get`, `set`, `subscribe`.
3. Confirm the completion popup does **not** offer `value` as a Zenith
   member of `count` (Vue-style `.value` is not part of the API).
4. Type `on:c` inside markup. Completions or snippets should propose
   `on:click={handler}` shape, never `onClick=` or `@click=`.

If any completion suggests `count.value`, `useState`, `createSignal`,
`computed`, `watch`, or `$:`, the editor packages are out of date with the
framework API and must be patched before publishing.

## 6. Verify the language server attached

1. Open the Output view → channel `Zenith Language Server`.
2. Expect a startup log without errors.
3. Make an invalid edit (for example `onclick="..."`); confirm a diagnostic
   appears with code `zenith.event.binding.syntax`.
4. Restore valid syntax; confirm the diagnostic clears.

## 7. Verification log template

When recording the result of a verification pass, include:

```
- VSIX path / source:
- Extension version:
- Older extensions present (yes/no, versions if yes):
- files.associations for *.zen:
- Status bar language mode:
- Token inspector evidence (paths to screenshots):
- Completion check: count.{get,set,subscribe} present? value absent?
- LSP attached (yes/no):
- Diagnostic appears for legacy onclick="..." (yes/no):
```

Treat the run as **failed** if any check fails; do not promote npm `latest`
or release notes until all items pass.
