import * as vscode from 'vscode';
import { executeCucumberTest } from '../runner/javaRunner';
import { logError, logInfo } from '../utils/logger';

interface CucumberTestData {
    uri: vscode.Uri;
    lineNumber: number;
    allScenarios: boolean;
}

export class FeatureTestController implements vscode.Disposable {
    private readonly controller = vscode.tests.createTestController(
        'fastCucumber',
        'Fast Cucumber'
    );
    private readonly testData = new WeakMap<vscode.TestItem, CucumberTestData>();
    private readonly subscriptions: vscode.Disposable[] = [];

    constructor() {
        logInfo('Creating VS Code Testing controller and Run/Debug profiles.');
        this.controller.createRunProfile(
            'Run Cucumber',
            vscode.TestRunProfileKind.Run,
            (request, token) => this.runTests(request, token, false),
            true
        );
        this.controller.createRunProfile(
            'Debug Cucumber',
            vscode.TestRunProfileKind.Debug,
            (request, token) => this.runTests(request, token, true),
            true
        );

        this.subscriptions.push(
            vscode.workspace.onDidOpenTextDocument(document => this.updateDocument(document)),
            vscode.workspace.onDidChangeTextDocument(event => this.updateDocument(event.document))
        );

        for (const document of vscode.workspace.textDocuments) {
            this.updateDocument(document);
        }
    }

    private updateDocument(document: vscode.TextDocument): void {
        if (document.uri.scheme !== 'file' || !document.uri.fsPath.toLowerCase().endsWith('.feature')) {
            return;
        }

        logInfo(`Discovering feature tests in ${document.uri.toString()} (language=${document.languageId}, lines=${document.lineCount}).`);
        const featureLine = /^\s*Feature\s*:/i;
        const scenarioLine = /^\s*Scenario(?:\s+Outline)?\s*:/i;
        const featureHeader = Array.from(
            { length: document.lineCount },
            (_, line) => line
        ).find(line => featureLine.test(document.lineAt(line).text));
        const featureName = featureHeader === undefined
            ? document.uri.path.split('/').pop() ?? 'Feature'
            : document.lineAt(featureHeader).text.trim().replace(/^\s*Feature\s*:\s*/i, '') || 'Feature';

        const feature = this.controller.createTestItem(
            document.uri.toString(),
            featureName,
            document.uri
        );
        feature.range = new vscode.Range(featureHeader ?? 0, 0, featureHeader ?? 0, 0);
        this.testData.set(feature, {
            uri: document.uri,
            lineNumber: (featureHeader ?? 0) + 1,
            allScenarios: true
        });

        for (let line = 0; line < document.lineCount; line++) {
            const text = document.lineAt(line).text;
            if (!scenarioLine.test(text)) {
                continue;
            }

            const scenarioName = text.trim().replace(/^\s*Scenario(?:\s+Outline)?\s*:\s*/i, '') || `Scenario ${line + 1}`;
            const scenario = this.controller.createTestItem(
                `${document.uri.toString()}#${line}`,
                scenarioName,
                document.uri
            );
            scenario.range = new vscode.Range(line, 0, line, document.lineAt(line).text.length);
            feature.children.add(scenario);
            this.testData.set(scenario, {
                uri: document.uri,
                lineNumber: line + 1,
                allScenarios: false
            });
        }

        this.controller.items.delete(document.uri.toString());
        this.controller.items.add(feature);
        logInfo(`Discovered ${feature.children.size} scenarios in ${document.uri.fsPath}.`);
    }

    private async runTests(
        request: vscode.TestRunRequest,
        token: vscode.CancellationToken,
        debugMode: boolean
    ): Promise<void> {
        const run = this.controller.createTestRun(request);
        const selected = request.include ?? Array.from(this.controller.items, ([, item]) => item);
        const excluded = new Set(request.exclude?.map(item => item.id) ?? []);
        const selectedIds = new Set(selected.map(item => item.id));
        const targets: CucumberTestData[] = [];

        for (const item of selected) {
            if (excluded.has(item.id)) {
                continue;
            }
            const data = this.testData.get(item);
            if (data) {
                targets.push(data);
                continue;
            }

            item.children.forEach(child => {
                const childData = this.testData.get(child);
                if (childData && !excluded.has(child.id) && !selectedIds.has(child.id)) {
                    targets.push(childData);
                }
            });
        }

        logInfo(`Test run requested (debug=${debugMode}, selected=${selected.length}, targets=${targets.length}).`);
        for (const target of targets) {
            if (token.isCancellationRequested) {
                break;
            }

            const title = target.allScenarios ? target.uri.fsPath : `${target.uri.fsPath}:${target.lineNumber}`;
            run.appendOutput(`Starting ${debugMode ? 'debug' : 'run'}: ${title}\r\n`);
            try {
                const started = await executeCucumberTest(
                    target.uri,
                    target.lineNumber,
                    debugMode,
                    target.allScenarios
                );
                if (!started) {
                    run.appendOutput(`Could not start Cucumber execution for ${title}.\r\n`);
                    logError(`Cucumber execution did not start for ${title}.`);
                } else {
                    logInfo(`Cucumber execution started for ${title}.`);
                }
            } catch (error) {
                const details = error instanceof Error ? error.stack ?? error.message : String(error);
                run.appendOutput(`Failed to start ${title}: ${details}\r\n`);
                logError(`Test run failed for ${title}.`, error);
            }
        }

        run.end();
    }

    public dispose(): void {
        this.subscriptions.forEach(subscription => subscription.dispose());
        this.controller.dispose();
    }
}
