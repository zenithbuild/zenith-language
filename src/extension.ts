import * as path from 'path';
import * as vscode from 'vscode';
import {
    LanguageClient,
    LanguageClientOptions,
    ServerOptions,
    TransportKind
} from 'vscode-languageclient/node';

let client: LanguageClient | undefined;
let outputChannel: vscode.OutputChannel | undefined;

const DOCUMENT_SELECTOR = [
    { scheme: 'file', language: 'zenith' },
    { scheme: 'file', language: 'zen' }
];
const ZEN_FILE_PATTERN = /\.(zen|zenx|zen\.html)$/;
const KNOWN_ZEN_LANGUAGE_IDS = new Set(['zenith', 'zen']);

function log(message: string): void {
    const line = `[${new Date().toISOString()}] ${message}`;
    outputChannel?.appendLine(line);
    console.log(`Zenith: ${message}`);
}

function isZenFilePath(filePath: string): boolean {
    return ZEN_FILE_PATTERN.test(filePath);
}

function documentSelectorMatches(document: vscode.TextDocument): boolean {
    return document.uri.scheme === 'file' && KNOWN_ZEN_LANGUAGE_IDS.has(document.languageId);
}

function describeDocument(document: vscode.TextDocument): string {
    return `${document.uri.toString()} language=${document.languageId} selectorMatched=${documentSelectorMatches(document)} fileMatched=${isZenFilePath(document.uri.fsPath)}`;
}

function logZenDocumentStatus(prefix: string, document?: vscode.TextDocument): void {
    if (document) {
        if (isZenFilePath(document.uri.fsPath) || KNOWN_ZEN_LANGUAGE_IDS.has(document.languageId)) {
            log(`${prefix}: ${describeDocument(document)}`);
        }
        return;
    }

    const documents = vscode.workspace.textDocuments
        .filter((doc) => isZenFilePath(doc.uri.fsPath) || KNOWN_ZEN_LANGUAGE_IDS.has(doc.languageId))
        .slice(0, 5);

    if (documents.length === 0) {
        log(`${prefix}: no open Zenith documents`);
        return;
    }

    for (const doc of documents) {
        log(`${prefix}: ${describeDocument(doc)}`);
    }
}

function completionLabel(item: vscode.CompletionItem): string {
    const label = item.label;
    return typeof label === 'string' ? label : label.label;
}

function topCompletionLabels(
    result: vscode.CompletionItem[] | vscode.CompletionList | null | undefined
): string {
    if (!result) {
        return '(none)';
    }
    const items = Array.isArray(result) ? result : result.items;
    const labels = items.slice(0, 8).map(completionLabel);
    return labels.length > 0 ? labels.join(', ') : '(none)';
}

function completionTriggerSummary(context: vscode.CompletionContext): string {
    const character = context.triggerCharacter ? ` char=${context.triggerCharacter}` : '';
    return `kind=${context.triggerKind}${character}`;
}

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
    log(`resolved server path: ${serverModule}`);
    log('language client starting');

    const serverOptions: ServerOptions = {
        run: { module: serverModule, transport: TransportKind.ipc },
        debug: { module: serverModule, transport: TransportKind.ipc }
    };

    const clientOptions: LanguageClientOptions = {
        documentSelector: DOCUMENT_SELECTOR,
        synchronize: {
            configurationSection: 'zenith',
            fileEvents: vscode.workspace.createFileSystemWatcher('**/*.{zen,zen.html,zenx}')
        },
        // Disable pull diagnostics - server uses push diagnostics only
        middleware: {
            provideDiagnostics: () => undefined,
            provideCompletionItem: async (document, position, completionContext, token, next) => {
                log(
                    `completion request uri=${document.uri.toString()} position=${position.line}:${position.character} ${completionTriggerSummary(completionContext)}`
                );
                const result = await next(document, position, completionContext, token);
                log(`completion response top=${topCompletionLabels(result)}`);
                return result;
            }
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
    log('language client started');
    const activeDocument = vscode.window.activeTextEditor?.document;
    logZenDocumentStatus('active document', activeDocument);
    logZenDocumentStatus('open document');
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
    outputChannel = vscode.window.createOutputChannel('Zenith Language Support');
    context.subscriptions.push(outputChannel);
    log('extension activated');

    startLanguageClient(context).catch((error) => {
        log(`failed to start language server: ${String(error)}`);
        vscode.window.showErrorMessage(`Zenith: Failed to start language server: ${String(error)}`);
    });

    void maybeWarnOnZenAssociationMisconfig(context);

    context.subscriptions.push(
        vscode.workspace.onDidOpenTextDocument((document) => {
            logZenDocumentStatus('opened document', document);
        })
    );

    context.subscriptions.push(
        vscode.window.onDidChangeActiveTextEditor((editor) => {
            logZenDocumentStatus('active document', editor?.document);
        })
    );

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
            log('language server path configuration changed; restarting client');
            await restartLanguageClient(context);
        })
    );

    log('activation complete');
}

export function deactivate(): Thenable<void> | undefined {
    if (!client) {
        return undefined;
    }
    return client.stop();
}
