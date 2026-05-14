" Vim syntax fallback for Zenith .zen files.
" This is intentionally a TextMate/Tree-sitter fallback, not semantic highlighting.
if exists("b:current_syntax")
  finish
endif

runtime! syntax/html.vim
unlet! b:current_syntax
syntax include @zenithTypeScript syntax/typescript.vim
syntax include @zenithCss syntax/css.vim

syntax region zenithScript
  \ matchgroup=zenithTag
  \ start=+<script\%(\_s\+[^>]*\)\?>+
  \ end=+</script>+
  \ contains=@zenithTypeScript,zenithExpression,zenithEventBinding
  \ keepend

syntax region zenithStyle
  \ matchgroup=zenithTag
  \ start=+<style\%(\_s\+[^>]*\)\?>+
  \ end=+</style>+
  \ contains=@zenithCss
  \ keepend

syntax region zenithExpression start=+{+ end=+}+ contains=@zenithTypeScript containedin=ALLBUT,zenithScript,zenithStyle keepend
syntax match zenithEventBinding /\<on:[A-Za-z][A-Za-z0-9_-]*/ containedin=ALL
syntax match zenithDirective /\<zen:[A-Za-z][A-Za-z0-9_-]*/ containedin=ALL
syntax match zenithState /\<state\>\s\+[A-Za-z_$][A-Za-z0-9_$]*/ containedin=zenithScript
syntax keyword zenithPrimitive state signal ref zenMount zenEffect zenWindow zenDocument zenOn zenResize collectRefs containedin=zenithScript,zenithExpression

highlight default link zenithTag Statement
highlight default link zenithEventBinding Type
highlight default link zenithDirective Keyword
highlight default link zenithExpression PreProc
highlight default link zenithState StorageClass
highlight default link zenithPrimitive Function

let b:current_syntax = "zenith"
