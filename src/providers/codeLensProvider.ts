import * as vscode from 'vscode';
import { logInfo } from '../utils/logger';

export class FeatureCodeLensProvider implements vscode.CodeLensProvider, vscode.Disposable {
    private readonly onDocumentChange: vscode.Disposable;
    private readonly _onDidChangeCodeLenses = new vscode.EventEmitter<void>();
    public readonly onDidChangeCodeLenses = this._onDidChangeCodeLenses.event;

    constructor() {
        this.onDocumentChange = vscode.workspace.onDidChangeTextDocument((event) => {
            if (event.document.uri.fsPath.endsWith('.feature')) {
                this._onDidChangeCodeLenses.fire();
            }
        });
    }

    public provideCodeLenses(
        document: vscode.TextDocument,
        token: vscode.CancellationToken
    ): vscode.CodeLens[] {
        if (token.isCancellationRequested) {
            logInfo(`CodeLens request cancelled for ${document.uri.toString()}`);
            return [];
        }

        const codeLenses: vscode.CodeLens[] = [];
        let matchedLines = 0;
        const featureLine = /^\s*Feature\s*:/i;
        const scenarioLine = /^\s*Scenario(?:\s+Outline)?\s*:/i;

        for (let line = 0; line < document.lineCount; line++) {
            const text = document.lineAt(line).text;
            let runCommand: vscode.Command | undefined;
            let debugCommand: vscode.Command | undefined;

            if (featureLine.test(text)) {
                runCommand = {
                    title: '▶ Run All Scenarios',
                    command: 'fastCucumber.runAllScenarios',
                    arguments: [document.uri, line + 1]
                };
                debugCommand = {
                    title: '🐞 Debug All Scenarios',
                    command: 'fastCucumber.debugAllScenarios',
                    arguments: [document.uri, line + 1]
                };
            } else if (scenarioLine.test(text)) {
                runCommand = {
                    title: '▶ Run Scenario',
                    command: 'fastCucumber.runScenario',
                    arguments: [document.uri, line + 1]
                };
                debugCommand = {
                    title: '🐞 Debug Scenario',
                    command: 'fastCucumber.debugScenario',
                    arguments: [document.uri, line + 1]
                };
            }

            if (runCommand && debugCommand) {
                const range = new vscode.Range(line, 0, line, 0);
                codeLenses.push(new vscode.CodeLens(range, runCommand));
                codeLenses.push(new vscode.CodeLens(range, debugCommand));
                matchedLines++;
            }
        }

        logInfo(`CodeLens requested for ${document.uri.toString()} (language=${document.languageId}); matched ${matchedLines} feature/scenario lines and returned ${codeLenses.length} lenses.`);
        return codeLenses;
    }

    public dispose(): void {
        this.onDocumentChange.dispose();
        this._onDidChangeCodeLenses.dispose();
    }
}