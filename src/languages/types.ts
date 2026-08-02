export type LanguageId = 'typescript' | 'python';

export type BuildKind = 'distributable' | 'none';

export type Engines = Readonly<Record<string, string>>;

export type Wiring = {
  check: string;
  test: string;
  build: (buildKind: BuildKind) => string;
  format: {
    write: string;
    check: string;
  };
};

export type Language = {
  id: LanguageId;
  displayName: string;
  packageManager: string;
  engines: Engines;
  wiring: Wiring;
  resolveBuild: (buildKind: BuildKind) => string;
  derivePackageName: (projectName: string) => string;
};
