import * as vscode from 'vscode';

let outputChannel: vscode.OutputChannel | undefined;

export function initializeLogger(context: vscode.ExtensionContext): vscode.OutputChannel {
    outputChannel = vscode.window.createOutputChannel('Fast Cucumber');
    context.subscriptions.push(outputChannel);
    return outputChannel;
}

export function logInfo(message: string): void {
    outputChannel?.appendLine(`[INFO ${new Date().toISOString()}] ${message}`);
}

export function logError(message: string, error?: unknown): void {
    const details = error instanceof Error ? error.stack ?? error.message : String(error ?? '');
    outputChannel?.appendLine(`[ERROR ${new Date().toISOString()}] ${message}${details ? `\n${details}` : ''}`);
}
