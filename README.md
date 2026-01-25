# zenith-language ⚡

VS Code extension providing world-class development support for the Zenith framework.

## Overview

`zenith-language` brings the Zenith development experience into VS Code. It provides syntax highlighting, intelligent code completion, and deep integration with the Zenith LSP to make building reactive apps a breeze.

## Features

- **Syntax Highlighting**: Expertly crafted TextMate grammar for `.zen` files, including embedded JavaScript, TypeScript, and CSS.
- **IntelliSense**: Smart completions for Zenith components, hooks, and reactive state.
- **Emmet Support**: Accelerated HTML development inside `.zen` templates.
- **Project Scaffolding**: Integrated support for starting new projects.
- **LSP Integration**: Leverages `@zenithbuild/language-server` for powerful diagnostics and refactoring.

## Supported Extensions

- `.zen`
- `.zenx`
- `.zen.html`

## Recommended Settings

The extension automatically configures your editor for the best experience. For more details on customization, see the VS Code settings for Zenith.

## Development

```bash
# Clone the repository
git clone https://github.com/zenithbuild/zenith.git

# Navigate to language package
cd zenith-language

# Install dependencies
bun install

# Build the server and compile the extension
bun run build:all
```

## License

MIT
