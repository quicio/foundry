# Design: Quicio Engineering Foundation

## 1. Composition model

The generator's only primitive is composition. There is no "template per
pair." A generated project is the result of composing exactly four
contributions, in this fixed order:

```
base       ->  profile  ->  language  ->  selected features
```

- **base** is the minimal scaffold that every project shares: a README
  placeholder, a `.gitignore`, a project-level `check/test/build/format`
  entrypoint whose implementation is supplied by the profile + language
  (the base only declares the *names* of the four commands).
- **profile** contributes the structure of the source tree, what gets
  built, and the convention for tests. Profiles are language-agnostic
  abstractions: a `library` profile in TypeScript and a `library` profile
  in Python have the same role, but the language module fills in the
  concrete files.
- **language** contributes the toolchain: package manager, file
  extensions, formatter, linter, test runner, build command, and the
  mapping from the abstract `check/test/build/format` names to the
  concrete scripts.
- **features** are opt-in. Each feature is a self-contained delta that
  knows which files it owns. Features never modify files owned by base,
  profile, or language. Features never modify files owned by another
  feature.

Composition is **deterministic** and **idempotent** at the level of
the CLI run: given the same (profile, language, feature-set), the same
files are produced in the same paths.

## 2. Module boundaries

```
quicio
├── cli/                  # command parsing, output, exit codes
├── composition/          # the composition engine (resolves base + profile + language + features)
├── profiles/             # one module per profile: library, application, experiment
├── languages/            # one module per language: typescript, python
├── features/             # one module per feature (placeholder stubs for v0)
└── internal/
    ├── fs/               # atomic file writes, path guards, dry-run
    ├── manifest/         # the data structure a generator run produces
    └── verify/           # runs the verification contract on a generated project
```

Dependency direction (enforced by an `internal/lint-arch` rule, see
section 8):

```
cli  ->  composition  ->  { profiles, languages, features, internal }
                              ^                ^
                              +------ internal/

profiles and languages MUST NOT depend on each other.
features MUST NOT depend on profiles or languages directly; they only
depend on `internal/manifest` and the path conventions exposed by
`composition`.
```

Concretely, the rules:

- `composition` is the only module that imports from all of
  `profiles`, `languages`, `features`.
- `profiles` and `languages` are siblings; neither imports the other.
- `features` is intentionally minimal: it sees the resolved manifest
  and the target paths, never the source code of profiles or languages.
- `internal/` has no inbound dependency on `composition` or above;
  it is the lowest layer.

## 3. The verification contract

Every generated project MUST expose four top-level commands (named in
the base, implemented by the language module's scripts):

- `check`    -> static analysis + format check. For TypeScript:
  `pnpm run check` runs `biome check` + `tsc --noEmit`. For Python:
  `uv run task check` runs `ruff check` + `basedpyright`.
- `test`     -> the project's test runner. For TypeScript:
  `pnpm test` (vitest). For Python: `uv run task test` (pytest).
- `build`    -> the project must produce a distributable artifact.
  For TypeScript libraries: `pnpm run build` produces `dist/`.
  For Python libraries: `uv build` produces `dist/*.whl`.
  For experiments: `build` MUST succeed but is allowed to be a
  no-op (e.g. `echo`) — the experiment profile is not meant to ship.
- `format`   -> `format` reformats; `format:check` only verifies.
  For TypeScript: `biome format --write` / `biome format`. For Python:
  `ruff format`.

The verification contract is enforced in two places:

1. The generator's own unit tests assert that, for every supported
   (profile, language) pair, the resolved manifest contains entries
   for all four commands and that the concrete scripts resolve to the
   tools listed above.
2. An end-to-end smoke test, run in CI, generates each supported pair
   into a temp directory, then runs all four commands. This is the
   *real* gate; unit tests are not sufficient.

## 4. CLI surface (v0)

```
quicio new <project> [options]

Options:
  -p, --profile <name>     One of: library, application, experiment.
                           Default: library.
  -l, --language <name>    One of: typescript, python.
                           Default: typescript.
      --with <feature>     Add a feature. Repeatable.
      --without <feature>  Explicitly remove a feature. Repeatable.
      --out <dir>          Target directory. Default: current directory.
      --force              Overwrite an empty target directory.
                           Refuses to overwrite a non-empty one.
      --dry-run            Print the resolved plan without writing files.
      --no-verify          Skip the post-generation smoke test.
```

The CLI MUST refuse to run if `--with` and `--without` mention the same
feature, and MUST refuse to run if `--profile` or `--language` is unknown.

## 5. Profiles

### library

- Tree: `src/`, `tests/`, single `package.json` / `pyproject.toml`.
- `build` MUST produce a distributable artifact in `dist/`.
- `test` MUST run the unit tests and report coverage.
- `format:check` MUST be wired.

### application (model only in v0; full delivery is a follow-up change)

- The shape is reserved: an `application` profile MUST add
  `src/main.ts` (or `src/main.py`) as the entrypoint and an `e2e/`
  folder for end-to-end tests. The full delivery is out of scope.

### experiment

- Tree: `src/`, `tests/`, single manifest, no `dist/` requirement.
- `build` MUST succeed but is a no-op (`echo` for shell, no script for
  Python; documented in the experiment's profile).
- `test` MUST run the tests but coverage is optional.
- `format:check` MUST be wired.

## 6. Languages

### typescript

- Package manager: **pnpm**.
- Runtime: Node 22+ (declared in `package.json` `engines`).
- Linter/formatter: **Biome** (covers both `format` and `check`).
- Type checker: `tsc --noEmit`.
- Test runner: **Vitest**.
- Builder: `tsup` for libraries, plain `tsc` for experiments.
- The four abstract commands are wired in `package.json` `scripts`:
  `check`, `test`, `build`, `format`, `format:check`.

### python

- Package manager: **uv** (PEP 723 for inline scripts, `pyproject.toml`
  for projects).
- Linter/formatter: **Ruff** (covers both `format` and `check`).
- Type checker: **basedpyright**.
- Test runner: **pytest**.
- Builder: `uv build` for libraries; no-op for experiments.
- Tasks are declared in `[tool.taskipy.tasks]` so that
  `uv run task <name>` works for `check/test/build/format`.

## 7. Features (v0 placeholders only)

The product owner named four features: OpenSpec bootstrap, Speck
integration, GitHub Actions, Docker. **v0 does not implement any of
them.** What v0 ships is:

- A `features/` module that declares each feature's name and a
  documentation-only description.
- A registry that resolves names to modules.
- An assertion that `--with unknown` fails with a clear error.

Implementation of each feature happens in its own OpenSpec change
once a real consumer exists. This is intentional: the rule from the
product owner is "no anticipar features sin consumidores reales."

## 8. Quality gates

The generator itself ships with the same `check/test/build/format`
contract it enforces. The CI pipeline (added in a follow-up change
after the generator is functional locally) MUST run:

```
pnpm run check && pnpm test && pnpm run build && pnpm run format:check
```

For v0 (no CI yet), the orchestrator runs these locally after every
self-written phase commit, exactly as in the speck precedent.

## 9. Migration seams

None. Foundry is a new repo. There is no existing code to migrate.

## 10. Security and privacy

- The generator does not send telemetry, analytics, or network
  requests to a remote service. All output is local.
- The generator does not read or write outside the target directory
  (enforced by `internal/fs` path guards).
- Generated projects do not include secrets, tokens, or example
  credentials.

## 11. Failure modes the implementer will forget

- **Duplicate `--with/--without`** for the same feature: caught by
  CLI parsing, fail with exit code 2.
- **Unknown profile or language**: caught by registry lookup, fail
  with exit code 2 and a list of valid values.
- **Existing non-empty target directory without `--force`**: caught
  by `internal/fs`, fail with exit code 3.
- **Toolchain missing** (e.g. `pnpm` not on PATH): the post-generation
  smoke test fails with a non-zero exit and a clear message; the
  generated project is **not** deleted (the user keeps partial work).
- **Generator crash mid-write**: writes are atomic per file via
  `internal/fs`; a crash leaves either the full file or no file.
