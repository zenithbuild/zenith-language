import * as path from 'path';
import * as vscode from 'vscode';
import {
    LanguageClient,
    LanguageClientOptions,
    ServerOptions,
    TransportKind
} from 'vscode-languageclient/node';

let client: LanguageClient;

export function activate(context: vscode.ExtensionContext) {
    // Server is bundled in out/server.js
    const serverModule = context.asAbsolutePath(path.join('out', 'server.js'));

    console.log('Zenith: Starting language server from:', serverModule);

    const serverOptions: ServerOptions = {
        run: { module: serverModule, transport: TransportKind.ipc },
        debug: { module: serverModule, transport: TransportKind.ipc }
    };

    const clientOptions: LanguageClientOptions = {
        documentSelector: [{ scheme: 'file', language: 'zenith' }],
        synchronize: {
            fileEvents: vscode.workspace.createFileSystemWatcher('**/*.{zen,zen.html,zenx}')
        },
        // Disable pull diagnostics - server uses push diagnostics only
        middleware: {
            provideDiagnostics: () => undefined
        }
    };

    client = new LanguageClient(
        'zenithLanguageServer',
        'Zenith Language Server',
        serverOptions,
        clientOptions
    );

    client.start();

    console.log('Zenith Language Support activated');
}

export function deactivate(): Thenable<void> | undefined {
    if (!client) {
        return undefined;
    }
    return client.stop();
}
