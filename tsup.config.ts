import { defineConfig } from 'tsup';

export default defineConfig({
  entry: { quicio: 'src/cli/index.ts' },
  format: ['esm'],
  target: 'node22',
  clean: true,
  shims: false,
  bundle: true,
});
