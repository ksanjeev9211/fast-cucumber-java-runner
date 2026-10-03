import * as path from 'path';
import * as fs from 'fs';

export function findEnclosingModule(filePath: string): string | undefined {
    let currentDir = path.dirname(filePath);
    const root = path.parse(currentDir).root;

    while (true) {
        if (fs.existsSync(path.join(currentDir, 'pom.xml'))) {
            return currentDir;
        }
        if (currentDir === root) {
            break;
        }
        currentDir = path.dirname(currentDir);
    }

    return undefined;
}

export function readMavenArtifactId(moduleRoot: string): string | undefined {
    const pomPath = path.join(moduleRoot, 'pom.xml');
    const pomContent = fs.readFileSync(pomPath, 'utf8').replace(/<!--[\s\S]*?-->/g, '');
    const projectContent = pomContent.match(/<project\b[^>]*>([\s\S]*?)<\/project>/i)?.[1];
    if (!projectContent) {
        return undefined;
    }

    const withoutParent = projectContent.replace(/<parent\b[^>]*>[\s\S]*?<\/parent>/i, '');
    return withoutParent.match(/<artifactId>\s*([^<]+?)\s*<\/artifactId>/i)?.[1];
}