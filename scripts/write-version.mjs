import { readFile, writeFile } from 'node:fs/promises';

const packageJson = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'));
if (typeof packageJson.version !== 'string') {
  throw new Error('package.json must define a string version');
}

await writeFile(
  new URL('../dist/the-golden-aviator/browser/version.json', import.meta.url),
  `${JSON.stringify({ version: packageJson.version })}\n`,
);
