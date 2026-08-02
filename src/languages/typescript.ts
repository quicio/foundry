import type { Language } from './types.js';

export const typescript: Language = {
  id: 'typescript',
  displayName: 'TypeScript',
  packageManager: 'pnpm',
  engines: { node: '>=22' },
  wiring: {
    check: 'biome check . && tsc --noEmit',
    test: 'vitest run',
    build: (buildKind) => (buildKind === 'distributable' ? 'tsup' : 'echo "no-op build"'),
    format: {
      write: 'biome format --write .',
      check: 'biome format .',
    },
  },
  resolveBuild: function resolveBuild(buildKind) {
    return this.wiring.build(buildKind);
  },
  derivePackageName: (projectName) => projectName,
};
