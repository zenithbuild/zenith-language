# zenith-language

VS Code language package for Zenith.

## Overview

`zenith-language` provides the VS Code extension package for Zenith `.zen`
files. It owns the language id, TextMate grammar, snippets, VS Code settings,
and VS Code language-client integration with `@zenithbuild/language-server`.

For Neovim and other plain LSP clients, install and configure the standalone
language server package instead:

```bash
npm i -g @zenithbuild/language-server
zenith-language-server
```

For Neovim syntax/filetype support, install this repository as a runtime plugin
or add the installed package directory to `runtimepath` before opening `.zen`
files, then source `plugin/zenith.lua` if your plugin manager does not source it
automatically. See [manual Neovim verification](docs/manual-neovim-verification.md).
Remove older local ftdetect rules that force `.zen` files to `html` or `zen`;
the Zenith LSP config attaches to `filetype=zenith`.

> Cursor/VS Code support requires installing the actual extension (Marketplace,
> Open VSX, or a local `.vsix`). Running `npm i -g @zenithbuild/language` only
> ships the Neovim runtime files; it does not register the VS Code extension.

## Features

- **Syntax Highlighting**: Expertly crafted TextMate grammar for `.zen` files, including embedded JavaScript, TypeScript, and CSS.
- **Snippets**: Canonical Zenith snippets that use `on:*` event syntax and current DOM primitives.
- **Emmet Support**: Accelerated HTML development inside `.zen` templates.
- **LSP Integration**: Bundles the Zenith language server for compiler-backed diagnostics, limited doc-backed hover/completion, and supported quick fixes in VS Code.
- **Workspace Commands**:
  - `Zenith: Run Contract Pack`
  - `Zenith: Run Legacy Tests`
  - `Zenith: Build`
  - `Zenith: Restart Server`

## Settings

- `zenith.componentScripts`: `forbid` (default) or `allow`.
- `zenith.languageServer.path`: optional absolute or workspace-relative path override for the language server entry file.

The extension supports multi-root workspaces. Command execution prompts for the target workspace folder when multiple folders are open.

## Supported Extensions

- `.zen`
- `.zen.html`
- `.zenx`

## Recommended Settings

The extension automatically configures your editor for the best experience. For more details on customization, see the VS Code settings for Zenith.

## Editor Scope

This package is the VS Code extension. It does not provide a public
`zenith-language-server` command for Neovim or other editors. It does provide a
Neovim filetype/syntax fallback when this repository or package is on
`runtimepath`. Use `@zenithbuild/language-server` for the standalone LSP server.

Current language-server limitations still apply in VS Code:
- no full TypeScript semantic completion or typechecking
- no project-wide symbol index
- no semantic tokens yet; Neovim highlighting is a syntax fallback

## Development

```bash
# Clone the repository
git clone https://github.com/zenithbuild/zenith-language.git

# Navigate to language package
cd zenith-language

# Install dependencies
bun install

# Build the server and compile the extension
bun run build:all
```

## Troubleshooting

### Cursor / VS Code shows plain or HTML highlighting on `.zen` files

1. Open `Command Palette` → `Change Language Mode` and confirm `Zenith` is
   listed. If only `Plain Text` is shown, the extension is not installed in
   this editor profile. Install the Marketplace/Open VSX listing or a `.vsix`
   produced by `bun run build:all`.
2. Check user `settings.json` for a stale `files.associations` entry such as:
   ```json
   "files.associations": { "*.zen": "zen" }
   ```
   Either remove the entry (the extension already binds `.zen` to language id
   `zenith`) or change it to `"*.zen": "zenith"`. The extension also accepts
   the legacy id `zen` as an alias, so either value will activate the grammar.
3. Disable older `zenithbuild.zenith-language-*` extensions (for example
   `0.2.x` / `0.3.x`). Multiple installed versions cause language-id and
   grammar-scope races.
4. Use `Developer: Inspect Editor Tokens and Scopes` on a tag, attribute,
   event binding (`on:click`), expression (`{expr}`), and `<script lang="ts">`
   to confirm `entity.name.tag.zenith`, `source.ts`, etc. show up.

### Neovim shows no highlighting on `.zen` files

1. Verify `:set filetype?` reports `zenith` (not empty, not `html`).
2. Verify `:echo globpath(&runtimepath,'syntax/zenith.vim')` returns a path
   inside this package. If empty, the package directory is not on
   `runtimepath`. Add it via your plugin manager or:
   ```lua
   local root = vim.fn.systemlist('npm root -g')[1]
   vim.opt.runtimepath:prepend(root .. '/@zenithbuild/language')
   vim.cmd('runtime plugin/zenith.lua')
   ```
3. Remove older local `ftdetect/zen.vim` rules that force `.zen` to `html`.

### Completions suggest `count.value` or other framework-foreign syntax

That is a stale snippet / completion bug. The current canonical Zenith API is:

```ts
const count = signal(0);
count.set(count.get() + 1);
```

```zen
<script lang="ts">
  state count = 0;
  function increment() { count += 1; }
</script>
<button on:click={increment}>{count}</button>
```

If a completion is suggesting `count.value` or `useState`/`createSignal`/
Vue/Svelte primitives, file an issue with the extension version
(`Extensions: About Extension` in VS Code/Cursor) and a screenshot.

## License

MIT


## Support Zenith

If this project is useful to you, consider sponsoring Zenith on GitHub: [Sponsor Zenith](https://github.com/sponsors/zenithbuild). Sponsorship helps fund ongoing work across the compiler, runtime, tooling, documentation, and long-term maintenance.
