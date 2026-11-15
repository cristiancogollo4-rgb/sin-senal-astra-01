import { copyFile, mkdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const threeRoot = path.join(root, 'node_modules', 'three');
const addonsRoot = path.join(threeRoot, 'examples', 'jsm');
const vendorRoot = path.join(root, 'public', 'vendor');
const addonOutput = path.join(vendorRoot, 'addons');
const addonEntries = [
  'postprocessing/EffectComposer.js',
  'postprocessing/RenderPass.js',
  'postprocessing/UnrealBloomPass.js',
  'postprocessing/OutputPass.js'
];

await mkdir(vendorRoot, { recursive: true });
await mkdir(addonOutput, { recursive: true });
await Promise.all(['three.module.js', 'three.core.js'].map((file) =>
  copyFile(path.join(threeRoot, 'build', file), path.join(vendorRoot, file))
));

const pending = [...addonEntries];
const copied = new Set();
while (pending.length) {
  const relativeFile = pending.pop();
  if (copied.has(relativeFile)) continue;
  copied.add(relativeFile);

  const sourceFile = path.resolve(addonsRoot, relativeFile);
  if (!sourceFile.startsWith(`${addonsRoot}${path.sep}`)) {
    throw new Error(`Import de addon fuera del directorio permitido: ${relativeFile}`);
  }
  const source = await readFile(sourceFile, 'utf8');
  const destination = path.join(addonOutput, relativeFile);
  await mkdir(path.dirname(destination), { recursive: true });
  await copyFile(sourceFile, destination);

  const imports = source.matchAll(/(?:from\s*|import\s*)['"]([^'"]+)['"]/g);
  for (const [, specifier] of imports) {
    if (!specifier.startsWith('.')) continue;
    const dependency = path.posix.normalize(path.posix.join(path.posix.dirname(relativeFile), specifier));
    if (!dependency.endsWith('.js')) continue;
    pending.push(dependency);
  }
}

console.log(`Vercel: Three.js y ${copied.size} módulos de postprocesado preparados.`);
