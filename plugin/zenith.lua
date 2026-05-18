-- Zenith Neovim runtime: filetype + syntax wiring only.
--
-- This plugin deliberately does NOT start the language server or wire up an
-- insert-mode completion source. Both decisions are user-stack specific (e.g.
-- built-in `vim.lsp.completion.enable`, nvim-cmp, blink.cmp, etc.).
--
-- See `docs/manual-neovim-completion.md` for recipes covering each option.

if vim and vim.filetype then
  vim.filetype.add({
    extension = {
      zen = "zenith",
      zenx = "zenith",
    },
    pattern = {
      [".*%.zen%.html"] = "zenith",
    },
  })
end

vim.api.nvim_create_augroup("zenith_runtime_filetype", { clear = true })
vim.api.nvim_create_autocmd({ "BufRead", "BufNewFile", "BufEnter", "BufWinEnter" }, {
  group = "zenith_runtime_filetype",
  pattern = { "*.zen", "*.zen.html", "*.zenx" },
  callback = function()
    if vim.bo.filetype ~= "zenith" then
      vim.b.current_syntax = nil
      vim.bo.filetype = "zenith"
      vim.bo.syntax = "zenith"
    end
  end,
})
