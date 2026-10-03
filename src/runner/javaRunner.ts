import * as vscode from 'vscode';
import * as path from 'path';
import { findEnclosingModule, readMavenArtifactId } from '../utils/moduleResolver';

export async function executeCucumberTest(
    featureUri: vscode.Uri,
    lineNumber: number,
    debugMode: boolean,
    allScenarios = false
): Promise<void> {
    const featurePath = featureUri.fsPath;
    const moduleRoot = findEnclosingModule(featurePath);
    const workspaceFolder = vscode.workspace.getWorkspaceFolder(featureUri);
    if (!workspaceFolder) {
        vscode.window.showErrorMessage("Feature file must be opened within a valid workspace folder.");
        return;
    }

    if (!moduleRoot) {
        vscode.window.showErrorMessage('No enclosing Maven pom.xml was found for this feature file.');
        return;
    }

    const projectName = readMavenArtifactId(moduleRoot);
    if (!projectName) {
        vscode.window.showErrorMessage(`Could not read the Maven artifactId from ${path.join(moduleRoot, 'pom.xml')}.`);
        return;
    }

    const relativeFeaturePath = path.relative(moduleRoot, featurePath);
    const cucumberFeatureArgument = allScenarios
        ? relativeFeaturePath
        : `${relativeFeaturePath}:${lineNumber}`;

    const debugConfig: vscode.DebugConfiguration = {
        type: 'java',
        name: allScenarios
            ? `Cucumber Feature (${path.basename(featurePath)})`
            : `Cucumber Scenario (${path.basename(featurePath)}:${lineNumber})`,
        request: 'launch',
        mainClass: 'io.cucumber.core.cli.Main',
        args: [
            cucumberFeatureArgument,
            '--plugin', 'pretty'
        ],
        cwd: moduleRoot,
        projectName: projectName,
        classPaths: ['$Test'],
        noDebug: !debugMode
    };

    const javaExtension = vscode.extensions.getExtension('redhat.java');
    if (!javaExtension) {
        vscode.window.showErrorMessage("Required extension 'Language Support for Java by Red Hat' is missing.");
        return;
    }

    const javaDebugExtension = vscode.extensions.getExtension('vscjava.vscode-java-debug');
    if (!javaDebugExtension) {
        vscode.window.showErrorMessage("Required extension 'Debugger for Java' is missing.");
        return;
    }

    await javaExtension.activate();
    await javaDebugExtension.activate();
    const started = await vscode.debug.startDebugging(workspaceFolder, debugConfig);
    if (!started) {
        vscode.window.showErrorMessage('VS Code could not start the Cucumber Java launch configuration.');
    }
}