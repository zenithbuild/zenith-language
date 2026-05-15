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

## License

MIT


## Support Zenith

If this project is useful to you, consider sponsoring Zenith on GitHub: [Sponsor Zenith](https://github.com/sponsors/zenithbuild). Sponsorship helps fund ongoing work across the compiler, runtime, tooling, documentation, and long-term maintenance.
