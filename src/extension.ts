import * as vscode from 'vscode';
import { FeatureCodeLensProvider } from './providers/codeLensProvider';
import { FeatureTestController } from './providers/featureTestController';
import { executeCucumberTest } from './runner/javaRunner';
import { initializeLogger, logError, logInfo } from './utils/logger';

export function activate(context: vscode.ExtensionContext) {
    const outputChannel = initializeLogger(context);
    logInfo(`Extension activated. Extension path: ${context.extensionPath}`);
    logInfo(`Workspace folders: ${(vscode.workspace.workspaceFolders ?? []).map(folder => folder.uri.fsPath).join(', ') || '(none)'}`);

    context.subscriptions.push(
        vscode.commands.registerCommand('fastCucumber.showLogs', () => outputChannel.show(true))
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('fastCucumber.runScenario', async (uri: vscode.Uri, lineNumber: number) => {
            await runCommand(uri, lineNumber, false, false);
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('fastCucumber.debugScenario', async (uri: vscode.Uri, lineNumber: number) => {
            await runCommand(uri, lineNumber, true, false);
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('fastCucumber.runAllScenarios', async (uri: vscode.Uri, lineNumber: number) => {
            await runCommand(uri, lineNumber, false, true);
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('fastCucumber.debugAllScenarios', async (uri: vscode.Uri, lineNumber: number) => {
            await runCommand(uri, lineNumber, true, true);
        })
    );

    async function runCommand(uri: vscode.Uri, lineNumber: number, debugMode: boolean, allScenarios: boolean): Promise<void> {
        logInfo(`Command invoked: uri=${uri?.toString() ?? '(missing)'}, line=${lineNumber}, debug=${debugMode}, allScenarios=${allScenarios}`);
        try {
            await executeCucumberTest(uri, lineNumber, debugMode, allScenarios);
        } catch (error) {
            logError('Command failed unexpectedly.', error);
            void vscode.window.showErrorMessage(`Fast Cucumber failed. See the Fast Cucumber output channel for details.`);
        }
    }

    try {
        const codeLensProvider = new FeatureCodeLensProvider();
        context.subscriptions.push(codeLensProvider);
        context.subscriptions.push(new FeatureTestController());

        const documentSelectors: vscode.DocumentSelector = [
            { language: 'gherkin' },
            { language: 'feature' },
            { pattern: '**/*.feature' }
        ];
        context.subscriptions.push(
            vscode.languages.registerCodeLensProvider(documentSelectors, codeLensProvider)
        );
        logInfo('CodeLens provider and feature test controller initialized.');
    } catch (error) {
        logError('Failed to initialize feature providers.', error);
        void vscode.window.showErrorMessage('Fast Cucumber could not initialize. Run “Fast Cucumber: Show Diagnostic Logs” and check the output.');
    }
}

export function deactivate() {}