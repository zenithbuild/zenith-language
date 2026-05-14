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
