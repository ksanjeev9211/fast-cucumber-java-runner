import * as vscode from 'vscode';
import { FeatureCodeLensProvider } from './providers/codeLensProvider';
import { executeCucumberTest } from './runner/javaRunner';

export function activate(context: vscode.ExtensionContext) {
    console.log('>>> Fast Cucumber Java Runner Activated <<<');

    const codeLensProvider = new FeatureCodeLensProvider();
    context.subscriptions.push(codeLensProvider);

    // Register CodeLens for language IDs AND direct file glob pattern
    const documentSelectors: vscode.DocumentSelector = [
        { language: 'gherkin' },
        { language: 'feature' },
        { pattern: '**/*.feature' }
    ];

    context.subscriptions.push(
        vscode.languages.registerCodeLensProvider(documentSelectors, codeLensProvider)
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('fastCucumber.runScenario', async (uri: vscode.Uri, lineNumber: number) => {
            await executeCucumberTest(uri, lineNumber, false);
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('fastCucumber.debugScenario', async (uri: vscode.Uri, lineNumber: number) => {
            await executeCucumberTest(uri, lineNumber, true);
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('fastCucumber.runAllScenarios', async (uri: vscode.Uri, lineNumber: number) => {
            await executeCucumberTest(uri, lineNumber, false, true);
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('fastCucumber.debugAllScenarios', async (uri: vscode.Uri, lineNumber: number) => {
            await executeCucumberTest(uri, lineNumber, true, true);
        })
    );
}

export function deactivate() {}