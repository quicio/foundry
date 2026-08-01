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
- **profile** contributes the structure of the source tree, the
  convention for tests, and a single abstract `buildKind`
  (`distributable` or `none`). Profiles are language-agnostic
  abstractions: a `library` profile in TypeScript and a `library` profile
  in Python have the same role, but the language module fills in the
  concrete files.
- **language** contributes the toolchain: package manager, file
  extensions, formatter, linter, test runner, build command, and the
  mapping from the abstract `check/test/build/format` names to the
  concrete scripts. The language module receives `buildKind` from
  `composition` and never sees the profile itself.
- **features** are opt-in and **additive-only in v0**. A feature
  contributes new files and nothing else. It cannot add a script, a
  dependency, or a configuration key to a file owned by base, profile,
  or language, because v0 ships no merge strategy. This is enforced
  structurally: a feature exposes
  `contribute(context) -> ManifestEntry[]` and never receives the
  accumulated manifest.

Composition is **deterministic**: given the same (profile, language,
feature-set), the same files are produced in the same paths with the
same contents. It is deliberately **not idempotent** at the level of
the CLI run: a second run into a populated directory fails closed
rather than converging (see section 4).

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
  The only value that crosses between them is the profile's
  `buildKind`, and `composition` is what carries it. A language module
  that references the strings `library`, `application`, or
  `experiment` is a violation of this rule.
- `features` is intentionally minimal: `contribute(context)` receives
  the resolved `buildKind`, the language `id`, the project name, and
  the path conventions. It never receives the accumulated manifest and
  never sees the source of profiles or languages.
- `internal/` has no inbound dependency on `composition` or above;
  it is the lowest layer.

## 3. The verification contract

The abstract command set is **exactly four**: `check`, `test`,
`build`, `format`. `format` has two **modes**, `write` and `check`.
The modes are two invocations of one abstract command; they are not a
fifth command. Concrete script and task names differ per language and
never leak into the abstract model.

| Abstract | Mode  | TypeScript (`package.json` script) | Python (taskipy task) |
| -------- | ----- | ---------------------------------- | --------------------- |
| `check`  | —     | `check`                            | `check`               |
| `test`   | —     | `test`                             | `test`                |
| `build`  | —     | `build`                            | `build`               |
| `format` | write | `format`                           | `format`              |
| `format` | check | `format:check`                     | `format-check`        |

What each one does:

- `check`    -> static analysis. For TypeScript: `biome check` +
  `tsc --noEmit`. For Python: `ruff check` + `basedpyright`.
- `test`     -> the project's test runner. For TypeScript: vitest.
  For Python: pytest.
- `build`    -> resolved from the profile's `buildKind`. With
  `distributable`, the project MUST produce an artifact in `dist/`
  (`tsup` for TypeScript, `uv build` for Python). With `none`, the
  command MUST succeed and produce nothing (`echo "no-op build"`).
- `format`   -> write mode reformats, check mode only verifies. For
  TypeScript: `biome format --write .` / `biome format .`. For
  Python: `ruff format .` / `ruff format --check .`.

Note for the Python module: taskipy does not reliably forward extra
CLI arguments to the underlying command, so the check mode is its own
task (`task format-check`). `task format --check` is not a supported
invocation and MUST NOT appear in any spec, script, or task list.

The verification contract is enforced in two places:

1. The generator's own unit tests assert that, for every supported
   (buildKind, language) pair, the resolved manifest contains entries
   for all four abstract commands, including both `format` modes, and
   that the concrete scripts resolve to the tools listed above.
2. An end-to-end smoke test, run in CI, generates each supported pair
   into a temp directory, then runs `check`, `test`, `build`, and
   `format` in check mode. This is the *real* gate; unit tests are not
   sufficient.

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
      --force              Allow writing into a NON-EMPTY target
                           directory. Never authorises overwriting.
      --dry-run            Print the resolved plan without writing files.
      --no-verify          Skip the post-generation smoke test.
```

`--force` has exactly one meaning: it permits a non-empty target
directory. It does not authorise overwriting, and the generator never
overwrites or deletes an existing file under any flag combination.
The full truth table:

| Target state                            | `--force` | Result |
| --------------------------------------- | --------- | ------ |
| Absent or empty                         | absent    | write  |
| Absent or empty                         | present   | write  |
| Non-empty, no manifest path collides    | absent    | exit 3 |
| Non-empty, no manifest path collides    | present   | write  |
| Any manifest path already exists on disk| absent    | exit 3 |
| Any manifest path already exists on disk| present   | exit 3 |

A consequence worth stating: running `quicio new` twice into the same
directory fails closed on the last row, with or without `--force`.
That is the intended behaviour, and it is why composition is
deterministic but the CLI run is not idempotent.

The CLI MUST refuse to run if `--with` and `--without` mention the same
feature, and MUST refuse to run if `--profile` or `--language` is unknown.

## 5. Profiles

Every profile declares a `buildKind`. That value is the profile's
only influence on the language module's build wiring.

### library

- `buildKind: distributable`.
- Tree: `src/`, `tests/`, single `package.json` / `pyproject.toml`.
- `build` MUST produce a distributable artifact in `dist/`.
- `test` MUST run the unit tests and report coverage.
- `format` check mode MUST be wired.

### application (model only in v0; full delivery is a follow-up change)

- `buildKind: distributable`.
- The shape is reserved: an `application` profile is expected to add
  `src/main.ts` (or `src/main.py`) as the entrypoint and an `e2e/`
  folder for end-to-end tests. This is a note on intended shape, not
  a v0 requirement: the full delivery is out of scope and carries no
  `SHALL` in any spec of this change.

### experiment

- `buildKind: none`.
- Tree: `src/`, `tests/`, single manifest, no `dist/` requirement.
- `build` MUST succeed but is a no-op (`echo "no-op build"` in both
  languages).
- `test` MUST run the tests but coverage is optional.
- `format` check mode MUST be wired.

## 6. Languages

### typescript

- Package manager: **pnpm**.
- Runtime: Node 22+ (declared in `package.json` `engines`).
- Linter/formatter: **Biome** (covers both `format` and `check`).
- Type checker: `tsc --noEmit`.
- Test runner: **Vitest**.
- Builder: `tsup` when `buildKind` is `distributable`,
  `echo "no-op build"` when it is `none`. The module reads
  `buildKind` and never `Profile.id`.
- The four abstract commands are wired in `package.json` `scripts`,
  with `format` contributing two entries:
  `check`, `test`, `build`, `format`, `format:check`.

### python

- Package manager: **uv** (PEP 723 for inline scripts, `pyproject.toml`
  for projects).
- Linter/formatter: **Ruff** (covers both `format` and `check`).
- Type checker: **basedpyright**.
- Test runner: **pytest**.
- Builder: `uv build` when `buildKind` is `distributable`,
  `echo "no-op build"` when it is `none`. The module reads
  `buildKind` and never `Profile.id`.
- Task runner: **taskipy**, declared as a development dependency so
  `uv run task <name>` resolves after `uv sync`.
- Tasks are declared in `[tool.taskipy.tasks]`:
  `check`, `test`, `build`, `format`, `format-check`. The check mode
  is its own task because taskipy does not reliably forward extra CLI
  arguments.

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

### Additive-only, and what it costs

v0 features are **additive-only**: `contribute(context)` returns new
manifest entries and nothing else. There is no merge, patch, or
append strategy, so a feature cannot add a `package.json` script, a
dependency, or a `pyproject.toml` key. Combined with the
no-overlapping-paths rule, a feature that needs to touch an existing
file simply cannot be built on this model.

That is a real limit, stated on purpose rather than discovered later.
The first feature that genuinely needs it (GitHub Actions and Docker
plausibly do not, since they only add files; OpenSpec bootstrap
plausibly does) opens a separate OpenSpec change that introduces a
per-entry strategy such as `create | merge-json | merge-toml`, with
its own determinism requirements. Until then, an implementer who hits
this wall surfaces it as a blocker instead of inventing a workaround.

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
- **A manifest path already exists on disk**: caught by
  `internal/fs`, fail with exit code 3 naming the colliding path.
  `--force` does not suppress this; nothing is overwritten.
- **A feature needs to modify a file it does not own**: not a
  runtime failure but a design wall (section 7). Surface it as a
  blocker; do not add an ad-hoc merge.
- **Toolchain missing** (e.g. `pnpm` not on PATH): the post-generation
  smoke test fails with a non-zero exit and a clear message; the
  generated project is **not** deleted (the user keeps partial work).
- **Generator crash mid-write**: writes are atomic per file via
  `internal/fs`; a crash leaves either the full file or no file.
