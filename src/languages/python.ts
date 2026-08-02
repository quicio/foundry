import type { Language } from './types.js';

export const python: Language = {
  id: 'python',
  displayName: 'Python',
  packageManager: 'uv',
  engines: { python: '>=3.12' },
  wiring: {
    check: 'task check',
    test: 'task test',
    build: (buildKind) => (buildKind === 'distributable' ? 'uv build' : 'echo "no-op build"'),
    format: {
      write: 'task format',
      check: 'task format-check',
    },
  },
  resolveBuild: function resolveBuild(buildKind) {
    return this.wiring.build(buildKind);
  },
  derivePackageName: (projectName) => projectName,
};
