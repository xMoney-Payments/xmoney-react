import { readFileSync } from 'node:fs';

const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
const groups = ['dependencies', 'devDependencies', 'peerDependencies', 'optionalDependencies'];
let failed = false;

for (const group of groups) {
  for (const [name, spec] of Object.entries(pkg[group] ?? {})) {
    if (typeof spec === 'string' && /^(file:|link:)/.test(spec)) {
      console.error(`${group}.${name} is "${spec}". Publish a registry version instead.`);
      failed = true;
    }
  }
}

if (failed) {
  process.exit(1);
}
