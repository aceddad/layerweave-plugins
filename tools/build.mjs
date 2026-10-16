import {build} from 'vite';
import {readFileSync, readdirSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {join} from 'node:path';

const root = fileURLToPath(new URL('..', import.meta.url));
for (const name of readdirSync(join(root, 'plugins')).sort()) {
  const folder = join(root, 'plugins', name);
  const manifest = JSON.parse(readFileSync(join(folder, 'plugin.json'), 'utf8'));
  if (manifest.kind !== 'view-plugin') continue;
  await build({configFile: false, root: folder, publicDir: false,
    esbuild: {jsx: 'transform', jsxFactory: 'h', jsxFragment: 'Fragment'},
    build: {outDir: join(folder, 'dist'), emptyOutDir: true,
      lib: {entry: join(folder, 'src/index.tsx'), formats: ['es'], fileName: () => 'plugin.js'}}});
}
