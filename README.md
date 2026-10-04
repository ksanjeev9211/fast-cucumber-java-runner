# Fast Cucumber Java Runner

![Fast Cucumber Java Runner icon](icon.png)

Fast Cucumber Java Runner is a VS Code extension for running and debugging
Cucumber scenarios from `.feature` files in Java Maven projects. It uses the
Java Debugger extension to launch Cucumber's `io.cucumber.core.cli.Main`
directly; it does not run `mvn test`.

## Requirements

- VS Code 1.85 or later
- A Java Maven project imported by **Language Support for Java by Red Hat**
  (`redhat.java`)
- **Debugger for Java** (`vscjava.vscode-java-debug`)
- Cucumber dependencies and test classes available on the Java project's test
  classpath

The two Java extensions are declared as extension dependencies and must be
available in the same VS Code window where this extension runs. **Gherkin Full
Support** can provide Gherkin editing features, but is not required by this
extension and does not replace either Java extension.

## Features

- Run or debug an individual `Scenario:` or `Scenario Outline:`.
- Run or debug all scenarios in a feature.
- Resolve the closest `pom.xml` above the feature file to set the module working
  directory and feature path.
- Use the Java Debugger's `$Test` classpath selector for test classes and
  dependencies rather than starting the Maven test lifecycle.
- Discover feature/scenario entries through VS Code's Testing API. Run and
  Debug actions are also available as CodeLens links above matching lines.
- Write activation, discovery, launch, and error details to a **Fast Cucumber**
  output channel.

## Usage

Open a Maven project in VS Code and open a `.feature` file. The extension
recognizes `Feature:`, `Scenario:`, and `Scenario Outline:` lines.

- Use **Run Scenario** or **Debug Scenario** above a scenario to execute just
  that scenario.
- Use **Run All Scenarios** or **Debug All Scenarios** above `Feature:` to run
  the whole feature.
- Alternatively, open the **Testing** view and use its Run/Debug actions for
  the discovered feature and scenarios.

CodeLens actions are text links above feature/scenario lines. Testing API
actions may also appear in the editor gutter depending on VS Code's testing
gutter settings.

The runner passes a scenario's feature-file-relative line number to Cucumber
and uses the nearest Maven module as the launch working directory. Java project
selection and `$Test` classpath resolution are handled by the Java extensions;
the runner intentionally does not pass a Maven `artifactId` as the Java
debugger's `projectName`.

## Troubleshooting

1. Confirm **Language Support for Java by Red Hat** and **Debugger for Java**
   are installed and enabled in the current VS Code window.
2. For local extension development, start the **Run Extension** configuration
   with F5 and use the newly opened Extension Development Host. Source changes
   require rebuilding and restarting that host.
3. Run **Fast Cucumber: Show Diagnostic Logs** from the Command Palette, or
   choose **Fast Cucumber** in the Output panel. The log reports activation,
   feature discovery, launch arguments, Java extension status, and launch
   failures.
4. Check **View → Output → Log (Extension Host)** for activation failures if
   Fast Cucumber commands are not listed in the Command Palette.
5. Verify VS Code's Java extensions have imported the Maven module containing
   the feature and that the Cucumber runtime and test classes are on its test
   classpath.

## Development

Install the dependencies with `npm install`, then compile with:

```sh
npm run compile
```

The **Run Extension** launch configuration compiles before starting an
Extension Development Host. The repository currently has no automated test or
lint scripts.

## Commands

| Command | Purpose |
| --- | --- |
| `Fast Cucumber: Run Scenario` | Run a selected scenario |
| `Fast Cucumber: Debug Scenario` | Debug a selected scenario |
| `Fast Cucumber: Run All Scenarios` | Run every scenario in the feature |
| `Fast Cucumber: Debug All Scenarios` | Debug every scenario in the feature |
| `Fast Cucumber: Show Diagnostic Logs` | Open extension diagnostics |
