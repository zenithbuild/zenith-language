# Manual Neovim Verification

Use this checklist against a real Zenith project, not only a fixture.

## Install/runtime setup

Install the syntax/runtime package as a Neovim plugin, or add this package root
to `runtimepath` before opening `.zen` files:

```lua
vim.opt.runtimepath:prepend("/path/to/zenith-language")
vim.cmd("runtime plugin/zenith.lua")
```

If you install from npm, replace the path with the package directory reported by
your package manager, for example:

```lua
local root = vim.fn.systemlist("npm root -g")[1]
vim.opt.runtimepath:prepend(root .. "/@zenithbuild/language")
vim.cmd("runtime plugin/zenith.lua")
```

Remove older local rules that force `.zen` files to `html` or `zen`. Those rules
prevent the Zenith language server from attaching to `filetype=zenith` buffers.

Then configure the language server:

```lua
vim.filetype.add({
  extension = {
    zen = "zenith",
    zenx = "zenith",
  },
  pattern = {
    [".*%.zen%.html"] = "zenith",
  },
})

if vim.lsp.config then
  vim.lsp.config("zenith", {
    cmd = { "zenith-language-server" },
    filetypes = { "zenith" },
    root_markers = { "zenith.config.js", "zenith.config.ts", "package.json", ".git" },
  })
  vim.lsp.enable("zenith")
else
  vim.api.nvim_create_autocmd("FileType", {
    pattern = "zenith",
    callback = function()
      vim.lsp.start({
        name = "zenith-language-server",
        cmd = { "zenith-language-server" },
        root_dir = vim.fs.root(0, { "zenith.config.js", "zenith.config.ts", "package.json", ".git" }),
      })
    end,
  })
end
```

## Verify

Open a real page:

```vim
:edit src/pages/index.zen
:set filetype?
:lua print(vim.inspect(vim.lsp.get_clients({ bufnr = 0 })))
:lua print(vim.inspect(vim.diagnostic.get(0)))
```

Expected:

- `filetype=zenith`
- one active `zenith-language-server` client for the buffer
- diagnostics appear after an invalid unsaved edit and clear after restoring valid content
- `vim.lsp.buf.hover()` returns limited doc-backed hover where supported
- completion requests include documented Zenith items such as `on:click`
- syntax highlighting is a Vim syntax fallback, not Tree-sitter or semantic tokens

The language server currently does not provide full TypeScript semantic
completion/typechecking or semantic tokens.
