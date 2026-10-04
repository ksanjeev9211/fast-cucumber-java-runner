import * as vscode from 'vscode';
import * as path from 'path';
import { findEnclosingModule } from '../utils/moduleResolver';
import { logError, logInfo } from '../utils/logger';

export async function executeCucumberTest(
    featureUri: vscode.Uri,
    lineNumber: number,
    debugMode: boolean,
    allScenarios = false
): Promise<boolean> {
    const featurePath = featureUri.fsPath;
    const moduleRoot = findEnclosingModule(featurePath);
    const workspaceFolder = vscode.workspace.getWorkspaceFolder(featureUri);
    logInfo(`Preparing Cucumber ${debugMode ? 'debug' : 'run'}: feature=${featurePath}, line=${lineNumber}, allScenarios=${allScenarios}, moduleRoot=${moduleRoot ?? '(not found)'}.`);
    if (!workspaceFolder) {
        logError(`Cannot run ${featurePath}: it is not inside an open workspace folder.`);
        vscode.window.showErrorMessage("Feature file must be opened within a valid workspace folder.");
        return false;
    }

    if (!moduleRoot) {
        logError(`Cannot run ${featurePath}: no enclosing pom.xml was found.`);
        vscode.window.showErrorMessage('No enclosing Maven pom.xml was found for this feature file.');
        return false;
    }

    const relativeFeaturePath = path.relative(moduleRoot, featurePath);
    const debugConfig: vscode.DebugConfiguration = {
        type: 'java',
        name: allScenarios
            ? `Cucumber Feature (${path.basename(featurePath)})`
            : `Cucumber Scenario (${path.basename(featurePath)}:${lineNumber})`,
        request: 'launch',
        mainClass: 'io.cucumber.core.cli.Main',
        args: [
            allScenarios ? relativeFeaturePath : `${relativeFeaturePath}:${lineNumber}`,
            '--plugin', 'pretty'
        ],
        cwd: moduleRoot,
        classPaths: ['$Test'],
        noDebug: !debugMode
    };
    logInfo(`Java launch configuration: cwd=${moduleRoot}, mainClass=${debugConfig.mainClass}, classPaths=${JSON.stringify(debugConfig.classPaths)}, args=${JSON.stringify(debugConfig.args)}.`);

    const javaExtension = vscode.extensions.getExtension('redhat.java');
    if (!javaExtension) {
        logError("Required extension 'redhat.java' is not installed.");
        vscode.window.showErrorMessage("Required extension 'Language Support for Java by Red Hat' is missing.");
        return false;
    }

    const javaDebugExtension = vscode.extensions.getExtension('vscjava.vscode-java-debug');
    if (!javaDebugExtension) {
        logError("Required extension 'vscjava.vscode-java-debug' is not installed.");
        vscode.window.showErrorMessage("Required extension 'Debugger for Java' is missing.");
        return false;
    }

    logInfo(`Activating Java support (active=${javaExtension.isActive}) and Java debugger (active=${javaDebugExtension.isActive}).`);
    await javaExtension.activate();
    await javaDebugExtension.activate();
    const started = await vscode.debug.startDebugging(workspaceFolder, debugConfig);
    logInfo(`vscode.debug.startDebugging returned ${started}.`);
    if (!started) {
        logError(`VS Code Java debugger declined the launch configuration for ${featurePath}.`);
        vscode.window.showErrorMessage('VS Code could not start the Cucumber Java launch configuration.');
    }
    return started;
}