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
