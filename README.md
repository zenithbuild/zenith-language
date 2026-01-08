# Zenith VS Code Extension

Syntax highlighting and editor support for `.zen` files.

## Features

- **Syntax Highlighting** for `.zen` files
- **HTML-first** structure recognition
- **Embedded JavaScript** in `<script>` blocks with Zenith-specific keywords (`state`, `zenOnMount`, etc.)
- **Embedded CSS** in `<style>` blocks
- **Expression highlighting** for `{expression}` syntax in HTML
- **Component recognition** for capitalized tags (e.g., `<DefaultLayout>`)
- **Slot support** for `<slot />` elements
- **Bracket matching** and auto-closing

## Zenith-Specific Scopes

| Syntax | Scope |
|--------|-------|
| `state count = 0` | `storage.type.state.zen` |
| `zenOnMount(() => {})` | `support.function.lifecycle.zen` |
| `<DefaultLayout>` | `entity.name.tag.component.zen` |
| `<slot />` | `keyword.control.slot.zen` |
| `{expression}` | `meta.embedded.expression.zen` |

## Installation (Development)

1. Copy this folder to your VS Code extensions directory:
   - **macOS**: `~/.vscode/extensions/zenith-lang`
   - **Windows**: `%USERPROFILE%\.vscode\extensions\zenith-lang`
   - **Linux**: `~/.vscode/extensions/zenith-lang`

2. Restart VS Code

3. Open any `.zen` file

## File Structure

```
zenith-vscode/
├── package.json                    # Extension manifest
├── language-configuration.json     # Brackets, comments, folding
├── syntaxes/
│   └── zenith.tmLanguage.json     # TextMate grammar
└── README.md
```

## Grammar Design Notes

### HTML Base
The grammar treats `.zen` files as HTML-first documents. Standard HTML tags are recognized and highlighted with `entity.name.tag.html.zen` scope.

### Embedded Languages
- `<script>` blocks use JavaScript/TypeScript highlighting with additional Zenith keyword recognition
- `<style>` blocks use standard CSS highlighting

### Expression Syntax
Single brace expressions `{...}` are recognized in HTML content and attributes. The content is highlighted as JavaScript. **Double braces `{{}}` are NOT supported** per Zenith syntax rules.

### Component Tags
Capitalized tags like `<DefaultLayout>` are recognized as Zenith components and receive `entity.name.tag.component.zen` scope for distinct styling.

### Zenith Keywords
The following Zenith-specific keywords are recognized in script blocks:
- `state` - reactive state declaration
- `zenOnMount` - lifecycle hook
- `zenOnDestroy` - lifecycle hook  
- `zenOnUpdate` - lifecycle hook
- `zenEffect` - effect declaration

## REDCMD Compatibility

This grammar is authored following TextMate/REDCMD patterns:
- Uses standard `begin`/`end` capture groups
- Defines reusable patterns in `repository`
- Uses hierarchical scope names
- Compatible with VS Code's grammar engine

## Future Work

- [ ] IntelliSense / LSP support
- [ ] Snippets for common patterns
- [ ] Go-to-definition for components
- [ ] Hover documentation
# zenith-language
