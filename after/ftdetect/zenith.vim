" Override older local .zen=filetype=html/zen rules after all ftdetect scripts load.
augroup zenith_filetype_after
  autocmd!
  autocmd BufRead,BufNewFile *.zen,*.zen.html,*.zenx setlocal filetype=zenith
augroup END
