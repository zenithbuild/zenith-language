import * as path from 'path';
import * as vscode from 'vscode';
import {
    LanguageClient,
    LanguageClientOptions,
    ServerOptions,
    TransportKind
} from 'vscode-languageclient/node';

let client: LanguageClient | undefined;

function getConfiguredServerPath(context: vscode.ExtensionContext): string {
    const configured = vscode.workspace.getConfiguration('zenith').get<string>('languageServer.path', '').trim();
    if (!configured) {
        return context.asAbsolutePath(path.join('out', 'server.js'));
    }

    if (path.isAbsolute(configured)) {
        return configured;
    }

    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    if (workspaceFolder) {
        return path.resolve(workspaceFolder.uri.fsPath, configured);
    }

    return context.asAbsolutePath(configured);
}

async function startLanguageClient(context: vscode.ExtensionContext): Promise<void> {
    const serverModule = getConfiguredServerPath(context);
    console.log('Zenith: Starting language server from:', serverModule);

    const serverOptions: ServerOptions = {
        run: { module: serverModule, transport: TransportKind.ipc },
        debug: { module: serverModule, transport: TransportKind.ipc }
    };

    const clientOptions: LanguageClientOptions = {
        documentSelector: [
            { scheme: 'file', language: 'zenith' },
            { scheme: 'file', language: 'zen' }
        ],
        synchronize: {
            configurationSection: 'zenith',
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

    await client.start();
    context.subscriptions.push(client);
}

async function restartLanguageClient(context: vscode.ExtensionContext): Promise<void> {
    if (client) {
        await client.stop();
        client = undefined;
    }
    await startLanguageClient(context);
}

async function selectWorkspaceFolder(): Promise<vscode.WorkspaceFolder | undefined> {
    const folders = vscode.workspace.workspaceFolders || [];
    if (folders.length === 0) {
        vscode.window.showErrorMessage('Zenith: No workspace folder is open.');
        return undefined;
    }

    if (folders.length === 1) {
        return folders[0];
    }

    const pick = await vscode.window.showWorkspaceFolderPick({
        placeHolder: 'Select workspace folder for Zenith command'
    });
    return pick || undefined;
}

async function runInWorkspaceTerminal(command: string, terminalName: string): Promise<void> {
    const folder = await selectWorkspaceFolder();
    if (!folder) {
        return;
    }

    const terminal = vscode.window.createTerminal({
        name: terminalName,
        cwd: folder.uri.fsPath
    });
    terminal.show(true);
    terminal.sendText(command);
}

const ZEN_FILE_PATTERN = /\.(zen|zenx|zen\.html)$/;
const KNOWN_ZEN_LANGUAGE_IDS = new Set(['zenith', 'zen']);
const MISCONFIG_WARNING_STATE_KEY = 'zenith.languageAssociationWarningShown';

async function maybeWarnOnZenAssociationMisconfig(context: vscode.ExtensionContext): Promise<void> {
    if (context.workspaceState.get<boolean>(MISCONFIG_WARNING_STATE_KEY) === true) {
        return;
    }

    const misconfigured = vscode.workspace.textDocuments.find((doc) => {
        const filename = doc.uri.fsPath;
        if (!ZEN_FILE_PATTERN.test(filename)) {
            return false;
        }
        return !KNOWN_ZEN_LANGUAGE_IDS.has(doc.languageId);
    });

    if (!misconfigured) {
        return;
    }

    await context.workspaceState.update(MISCONFIG_WARNING_STATE_KEY, true);
    const choice = await vscode.window.showWarningMessage(
        `Zenith: ${misconfigured.languageId === '' ? 'untyped' : `\`${misconfigured.languageId}\``} is set as the language for ${misconfigured.uri.fsPath}. Zenith highlighting requires language id "zenith" (or alias "zen"). Check files.associations.`,
        'Open Settings',
        'Open README'
    );

    if (choice === 'Open Settings') {
        await vscode.commands.executeCommand('workbench.action.openSettings', 'files.associations');
    } else if (choice === 'Open README') {
        await vscode.env.openExternal(vscode.Uri.parse('https://github.com/zenithbuild/zenith-language#troubleshooting'));
    }
}

export function activate(context: vscode.ExtensionContext) {
    startLanguageClient(context).catch((error) => {
        vscode.window.showErrorMessage(`Zenith: Failed to start language server: ${String(error)}`);
    });

    void maybeWarnOnZenAssociationMisconfig(context);

    context.subscriptions.push(
        vscode.commands.registerCommand('zenith.runContractPack', async () => {
            await runInWorkspaceTerminal('npm test', 'Zenith Contract Pack');
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('zenith.runLegacyTests', async () => {
            await runInWorkspaceTerminal('npm run test:legacy', 'Zenith Legacy Tests');
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('zenith.build', async () => {
            await runInWorkspaceTerminal('zenith build', 'Zenith Build');
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('zenith.restartServer', async () => {
            await restartLanguageClient(context);
            vscode.window.showInformationMessage('Zenith language server restarted.');
        })
    );

    context.subscriptions.push(
        vscode.workspace.onDidChangeConfiguration(async (event) => {
            if (!event.affectsConfiguration('zenith.languageServer.path')) {
                return;
            }
            await restartLanguageClient(context);
        })
    );

    console.log('Zenith Language Support activated');
}

export function deactivate(): Thenable<void> | undefined {
    if (!client) {
        return undefined;
    }
    return client.stop();
}
