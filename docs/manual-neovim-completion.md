# Manual Neovim Completion

Attaching the Zenith language server is not the same thing as seeing completion
items in insert mode. Neovim only shows LSP completion when an insert-mode
completion source is wired up. This document covers the three common setups.

If your `.zen` files highlight correctly but pressing keys never offers
suggestions, you are almost certainly missing one of the steps below.

Pre-requisite (see [`manual-neovim-verification.md`](./manual-neovim-verification.md)):

- `@zenithbuild/language` runtime is on `runtimepath` (filetype=`zenith`)
- `@zenithbuild/language-server` is on `$PATH` and `vim.lsp.enable("zenith")`
  (or your `FileType zenith` autocmd) is wired up
- `:lua print(vim.inspect(vim.lsp.get_clients({ bufnr = 0 })))` lists a single
  `zenith-language-server` client

## Option A — Built-in LSP completion (Neovim 0.11+)

Neovim 0.11 ships `vim.lsp.completion.enable()`, which attaches LSP completion
to the buffer using the built-in `:h ins-completion` engine.

```lua
vim.api.nvim_create_autocmd("LspAttach", {
  callback = function(args)
    local client = vim.lsp.get_client_by_id(args.data.client_id)
    if client and client.name == "zenith-language-server" then
      vim.lsp.completion.enable(true, client.id, args.buf, { autotrigger = true })
    end
  end,
})
```

Verify:

1. Open a `.zen` file.
2. Insert mode inside `<script lang="ts">`, type `sig` — `signal`, `state`,
   `zenMount`, `zenEffect` should appear in the popup.
3. Outside any tag, type `<` — components, layouts, and `ZenLink` (when
   `@zenithbuild/router` is imported) should appear.

If `vim.lsp.completion` is missing, you are on Neovim 0.10 or older. Use
Option B or C.

## Option B — nvim-cmp

[`nvim-cmp`](https://github.com/hrsh7th/nvim-cmp) is the most common
third-party completion engine.

```lua
local cmp = require("cmp")
cmp.setup({
  sources = cmp.config.sources({
    { name = "nvim_lsp" },
  }),
})

cmp.setup.filetype("zenith", {
  sources = cmp.config.sources({
    { name = "nvim_lsp" },
  }),
})
```

Make sure `cmp-nvim-lsp` is installed and that the `zenith` filetype is
enabled. cmp will then surface every label the Zenith LSP returns.

## Option C — blink.cmp

[`blink.cmp`](https://github.com/saghen/blink.cmp) reads the LSP automatically
once a client is attached. No filetype-specific block is required, but you
should confirm:

```lua
require("blink.cmp").setup({
  sources = {
    default = { "lsp", "path", "snippets", "buffer" },
  },
})
```

## Smoke-test from the command line

`@zenithbuild/language` ships a non-interactive smoke that drives a real
Neovim process and asserts that completion labels include canonical Zenith
items (`signal`, `state`, `zenMount`, `on:click`) and exclude stale ones
(`zenOnMount`, `useState`, `createSignal`, `useRoute`, `useRouter`).

```sh
ZENITH_NVIM_SAMPLE=/path/to/your/project/src/pages/index.zen \
  node node_modules/@zenithbuild/language/scripts/neovim-installed-smoke.mjs
```

The script prints a JSON report with `completionLabels.attrContext` and
`completionLabels.scriptContext` for debugging. Non-zero exit means the LSP
returned the wrong label set (the script prints the captured labels so you
can see exactly what was offered).

If the smoke passes locally but interactive completion never appears, the
problem is on the editor side: re-check Option A / B / C, not the LSP.

## Troubleshooting

Print whatever the LSP would return right now (no popup engine required):

```vim
:lua= vim.lsp.buf_request_sync(0, 'textDocument/completion', { textDocument = { uri = vim.uri_from_bufnr(0) }, position = { line = vim.fn.line('.') - 1, character = vim.fn.col('.') - 1 } }, 3000)
```

If that command returns an items array but your completion engine still shows
nothing, the LSP is healthy and the engine is mis-configured (see Option A / B
/ C). If it returns `nil`, re-check that the LSP attached at all (see
`manual-neovim-verification.md`).

## What the LSP does not do

- It does not provide TypeScript semantic completion. For TS hovers inside
  `<script lang="ts">`, attach a separate TS server scoped to embedded
  TypeScript, or open the `.ts` files directly.
- It does not provide tree-sitter parsing. Syntax highlighting comes from
  `@zenithbuild/language` runtime files only.
- It does not invent React-style `children` or `className` props. Children
  inline through the implicit `<slot />`; the canonical class attribute is
  `class`.
