# Copilot instructions

## Build and validation

- Compile the extension with `npm run compile`.
- The repository does not currently define automated test or lint scripts.
- `.vscode/launch.json` contains the **Run Extension** configuration; it runs
  the `npm: compile` task before launching an Extension Development Host.
- TypeScript source is under `src/`; `out/` is compiler output and is ignored.

## Architecture

- `src/extension.ts` initializes logging, registers commands, and wires the
  CodeLens and test providers into VS Code.
- `src/providers/codeLensProvider.ts` creates Run/Debug CodeLens actions above
  Gherkin `Feature:`, `Scenario:`, and `Scenario Outline:` lines.
- `src/providers/featureTestController.ts` discovers `.feature` files opened
  or edited in the workspace and publishes feature/scenario test items through
  VS Code's Testing API.
- `src/runner/javaRunner.ts` resolves the nearest Maven module and starts
  `io.cucumber.core.cli.Main` using the Java Debugger extension and `$Test`
  classpath. Do not introduce `mvn test` execution.
- `src/utils/moduleResolver.ts` locates the nearest ancestor `pom.xml`.
- `src/utils/logger.ts` provides the **Fast Cucumber** output channel.

## Repository-specific behavior

- The supported document selectors include both `gherkin` and `feature`
  language IDs as well as the `**/*.feature` path pattern.
- Scenario commands pass the feature URI and a 1-based line number; feature
  commands pass the URI and use all-scenarios mode.
- The Java debugger selects the Java project from its imported workspace
  metadata. Do not set `projectName` to a Maven `artifactId`: those names need
  not match, and the debugger can reject the launch configuration.
- Java execution requires `redhat.java` and `vscjava.vscode-java-debug` in the
  same VS Code window. Gherkin editing extensions are not substitutes for
  these dependencies.
- Use the logger for actionable activation, discovery, and launch diagnostics;
  command palette titles come from `package.json` contributions.
