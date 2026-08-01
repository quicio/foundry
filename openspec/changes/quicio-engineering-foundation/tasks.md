# Tasks: Quicio Engineering Foundation

This task list is the contract between the proposal and the
implementation phases. Each task is a TDD-shaped vertical slice that
ends in a green test. Tasks are grouped by capability (one capability
per spec) and numbered `N.M` where `N` is the capability index and
`M`
is the task index within that capability.

Capability indices 9 to 11 were added after the first review and keep
their own numbers rather than renumbering the original eight. The
index identifies a capability; it does not imply execution order. The
phase headings below are what determines order.

**Strict rules**

- One task per commit. One commit must turn one red test green, or
  refactor a green state without breaking any green.
- Do not implement tasks outside the in-flight range.
- If a blocker appears, stop and surface it. Do not silently expand
  scope.

## Phase 0 — bootstrap (no code yet, only ops)

- 0.1 Verify OpenSpec is initialized and the change folder exists.
- 0.2 Confirm with the product owner that `proposal.md`, `design.md`,
  this `tasks.md`, and the 11 spec files are approved before any
  implementation work begins.

## Phase 1 — composition core (capabilities 1–4, 9–11)

These tasks build the generator's spine: the registries, the manifest,
the filesystem guards, the CLI parsing, and the composition engine.
They end with a working `quicio new --dry-run` for any supported
(profile, language) pair.

### Capability 1 — `project-profile-model`

- 1.1 RED: a `Profile` type exists and `library`, `application`,
  `experiment` are registered. GREEN: declare the type and the
  registry. (no behavior yet)
- 1.2 RED: `profiles.get('unknown')` throws a typed error with the
  list of valid names. GREEN: implement the lookup with a clear
  message.
- 1.3 RED: each registered profile exposes `displayName` and
  `description`, and exposes no `commands` field. GREEN: declare
  those on each profile.
- 1.4 RED: each registered profile exposes `buildKind`, with
  `library` and `application` declaring `distributable` and
  `experiment` declaring `none`. GREEN: declare the field.
- 1.5 RED: the `profiles` module's import graph has no edge into
  `languages`, and the `Profile` type exposes exactly `id`,
  `displayName`, `description`, `buildKind`. GREEN: enforce
  structurally, replacing the old substring scan.

### Capability 9 — `project-language-model`

Runs immediately after capability 1: the CLI cannot validate
`--language` against a registry that does not exist.

- 9.1 RED: a `Language` type exists and `typescript`, `python` are
  registered, in insertion order. GREEN: declare the type and the
  registry.
- 9.2 RED: `getLanguage('klingon')` throws a typed error listing
  every registered id. GREEN: implement the lookup.
- 9.3 RED: each language exposes `packageManager`, `engines`,
  `wiring.check/test/build`, `wiring.format.write`,
  `wiring.format.check`, `resolveBuild`, `derivePackageName`. GREEN:
  declare the contract.
- 9.4 RED: `resolveBuild('distributable')` returns the same command
  regardless of which profile it came from. GREEN: implement.
- 9.5 RED: the `languages` import graph has no edge into `profiles`.
  GREEN: keep the boundary.

### Capability 10 — `feature-model`

- 10.1 RED: a `Feature` type exists with `id`, `description`,
  `contribute`. GREEN: declare it.
- 10.2 RED: the registry contains exactly `openspec-bootstrap` and
  `speck-integration`; `getFeature('docker')` throws a typed error
  listing the registered ids. GREEN: register only the speced two.
- 10.3 RED: an invocation with no `--with` resolves to an empty
  feature set. GREEN: default to empty.
- 10.4 RED: `--without docker` exits 2, because validation precedes
  resolution. GREEN: validate both flags against the registry first.
- 10.5 RED: `--without speck-integration` with no matching `--with`
  exits 0 and changes nothing. GREEN: treat it as a no-op.
- 10.6 RED: a repeated `--with <id>` resolves once and invokes
  `contribute` once. GREEN: de-duplicate.
- 10.7 RED: two `--with` flags contribute in the order given.
  GREEN: preserve flag order.

### Capability 11 — `generator-filesystem`

Runs before capability 3, because the CLI's exit code 3 paths are
this module's behaviour.

- 11.1 RED: an entry with an absolute path is rejected with exit 3
  and nothing is written. GREEN: implement the path guard.
- 11.2 RED: an entry containing a `..` segment is rejected the same
  way. GREEN: extend the guard.
- 11.3 RED: a manifest with ten valid entries and one escaping entry
  writes none of the ten. GREEN: validate the whole manifest before
  the first write.
- 11.4 RED: a symlinked directory inside the target pointing outside
  it does not grant escape. GREEN: resolve components before
  writing.
- 11.5 RED: writing to a path that already exists fails with exit 3
  and leaves that file byte-identical. GREEN: enforce no-overwrite
  at the filesystem layer.
- 11.6 RED: a write interrupted before rename leaves no file at the
  destination. GREEN: write to a temporary file in the destination
  directory and rename.
- 11.7 RED: a failure on the fifth of ten entries leaves the first
  four on disk and the error states the target is partial. GREEN:
  no rollback, explicit message.
- 11.8 RED: a dry run over an escaping entry still fails with exit 3
  and creates no file, directory, or temporary file. GREEN: run
  validation in dry-run mode too.
- 11.9 RED: every written file has mode `0644` and every created
  directory `0755`. GREEN: set the modes explicitly.

### Capability 2 — `template-composition`

- 2.0 RED: the keys of every registered language's `wiring` object
  are exactly `['check','test','build','format']`, never
  `format:check` or `format-check`, and neither the `Profile` type
  nor any registered profile exposes a field enumerating those
  names. GREEN: keep the abstract set in the composition model and
  the concrete names inside the language modules.
- 2.1 RED: a `Manifest` type describes the result of a generation
  pass (entries: target path + content + owner). GREEN: declare it.
- 2.2 RED: `compose(base, profile, language, features)` returns a
  `Manifest` containing exactly the entries contributed by each
  layer, in fixed order. GREEN: implement the merger with no
  overlapping paths.
- 2.3 RED: if two layers attempt to write the same path, the merger
  fails with a typed error naming both layers and the path. GREEN:
  enforce uniqueness.
- 2.4 RED: an empty `features` array produces the same manifest as
  omitting the argument. GREEN: normalize.
- 2.5 RED: a feature module exposes
  `contribute(context) -> ManifestEntry[]` and the `context` it
  receives contains no manifest entries from any other layer.
  GREEN: define the context type and the call site.
- 2.6 RED: a feature contributing a path already owned by base,
  profile, or language fails with the same typed collision error as
  any other overlap. GREEN: run the uniqueness check over feature
  entries too.
- 2.7 RED: `compose` passes only `buildKind` to the language module,
  and two profiles sharing a `buildKind` produce identical language
  output. GREEN: implement the resolution boundary.
- 2.8 RED: two `compose` runs under a different date, user, and
  working directory produce byte-identical manifests. GREEN: remove
  every environment-derived input.
- 2.9 RED: no entry's `content` contains a date, a time, a hostname,
  or an absolute path. GREEN: strip the offending template pieces.
- 2.10 RED: parsing and re-serialising a generated `package.json`
  and `pyproject.toml` across two runs yields identical key order.
  GREEN: emit literal key order, never map iteration.

### Capability 3 — `project-generator-cli`

- 3.1 RED: `quicio new demo` (no flags) resolves profile=library,
  language=typescript via documented defaults and exits 0 with a
  dry-run report on stdout. GREEN: implement flag parsing and
  defaults.
- 3.2 RED: `--with foo --without foo` exits 2 with an error
  mentioning `foo`. GREEN: detect the conflict.
- 3.3 RED: `--profile unknown` exits 2 with a list of valid
  profiles. GREEN: validate against the registry.
- 3.3b RED: `--language klingon` exits 2 with a list of valid
  languages. GREEN: validate against the language registry.
- 3.3c RED: `quicio new MiProyecto`, `quicio new 2fast`, and
  `quicio new foo/bar` each exit 2 stating the accepted pattern, and
  create no directory. GREEN: validate `<project>` first, before
  anything else resolves.
- 3.3d RED: `quicio new demo` targets `./demo`, and
  `--out /tmp/work` targets `/tmp/work/demo`, creating the parent if
  absent without requiring `--force`. GREEN: implement `--out`.
- 3.4 RED: when the target directory is non-empty and `--force` is
  absent, the CLI exits 3 and lists the first 5 offending entries.
  GREEN: enforce.
- 3.4b RED: with `--force` and a non-empty target whose files are
  all absent from the manifest, the CLI writes and leaves every
  pre-existing file byte-identical. GREEN: implement.
- 3.4c RED: when a manifest path already exists on disk, the CLI
  exits 3 naming that path, with and without `--force`, and
  modifies nothing. GREEN: enforce the no-overwrite invariant.
- 3.5 RED: when `--no-verify` is omitted, the CLI invokes the
  verification hook and exits 4 when it reports failure. GREEN: wire
  the hook against a test double. The real runner lands in
  capability 6; task 6.5 reconciles this slice against it.
- 3.5b RED: every documented failure path exits with the code the
  table in `project-generator-cli` assigns it, and an unexpected
  internal error exits 1. GREEN: centralise the exit codes in one
  module so no call site invents one.
- 3.6 RED: `--dry-run` prints the manifest path-by-path and exits 0
  without writing files. GREEN: implement dry-run.

### Capability 4 — `typescript-toolchain`

- 4.1 RED: the `typescript` language module exposes `packageManager:
  'pnpm'`, `engines.node: '>=22'`, `wiring.check/test/build`, and
  `wiring.format.write` / `wiring.format.check`. GREEN: declare it.
- 4.2 RED: the `package.json` template for `buildKind:
  distributable` contains `scripts.check`, `scripts.test`,
  `scripts.build`, `scripts.format`, `scripts.format:check`. GREEN:
  author the template.
- 4.3 RED: the `package.json` template for `buildKind: none` has the
  same script names but `scripts.build` is `echo "no-op build"`.
  GREEN: branch the template on `buildKind`.
- 4.3b RED: the TypeScript module's source contains none of the
  strings `library`, `application`, `experiment`. GREEN: keep the
  profile out of the module.
- 4.3c RED: every value in the generated `dependencies` and
  `devDependencies` is an exact semver literal, with no `^`, `~`,
  `>=`, `*`, or `latest`. GREEN: pin, with every version declared in
  a single versions module.
- 4.3d RED: the resolved manifest contains no `pnpm-lock.yaml`
  entry, and the generated README tells the user to commit the
  lockfile their first install produces. GREEN: do not ship a
  lockfile.
- 4.3e RED: `quicio new my-lib --language typescript` writes
  `"name": "my-lib"` in `package.json`. GREEN: implement
  `derivePackageName` as the identity.
- 4.4 RED: a generated `library + typescript` project passes
  `pnpm install && pnpm run check && pnpm run test && pnpm run
  build && pnpm run format:check` from a clean shell. GREEN: wire
  the templates and verify end to end.

## Phase 2 — Python + verification (capabilities 5–6)

### Capability 5 — `python-toolchain`

- 5.1 RED: the `python` language module exposes
  `packageManager: 'uv'`, `engines.python: '>=3.12'`,
  `wiring.check/test/build` as `task <name>` invocations, and
  `wiring.format.write` (`task format`) / `wiring.format.check`
  (`task format-check`). GREEN: declare it.
- 5.2 RED: the `pyproject.toml` template for `buildKind:
  distributable` declares `[tool.taskipy.tasks]` with `check`,
  `test`, `build`, `format`, `format-check`. GREEN: author the
  template.
- 5.3 RED: the `pyproject.toml` template for `buildKind: none` has
  the same tasks with `build` as a no-op. GREEN: branch on
  `buildKind`.
- 5.3b RED: the Python module's source contains none of the strings
  `library`, `application`, `experiment`. GREEN: keep the profile
  out of the module.
- 5.3c RED: the generated `pyproject.toml` declares `taskipy` as a
  development dependency. GREEN: add it to the template.
- 5.3d RED: every dependency in the generated `pyproject.toml` uses
  `==` with an exact version, declared in a single versions module.
  GREEN: pin.
- 5.3e RED: the resolved manifest contains no `uv.lock` entry, and
  the generated README tells the user to commit the lockfile their
  first `uv sync` produces. GREEN: do not ship a lockfile.
- 5.3f RED: `quicio new my-lib --language python` writes
  `[project].name = "my-lib"`, creates `src/my_lib/`, and the
  generated test imports `my_lib`. GREEN: implement the distribution
  and module name derivations separately.
- 5.3g RED: `uv run task test` passes in a project generated from a
  hyphenated name, proving the module actually imports. GREEN: wire
  the module directory and the test template to the derived name.
- 5.4 RED: a generated `experiment + python` project passes
  `uv sync && uv run task check && uv run task test && uv run task
  build && uv run task format-check`. GREEN: wire templates.

### Capability 6 — `generated-project-verification`

- 6.1 RED: `verify(projectRoot, language)` returns an aggregated
  result `{ ok: boolean, steps: { name, ok, stderr? }[] }`.
  GREEN: declare the type.
- 6.2 RED: `verify` runs the four abstract commands in fixed order
  (`check`, `test`, `build`, `format`), resolving each through the
  language module and invoking `format` in check mode. GREEN:
  implement the runner.
- 6.2b RED: `steps[].name` carries abstract names only, so a
  TypeScript run reports `format`, not `format:check`. GREEN: keep
  the concrete script name inside the language module.
- 6.2c RED: a successful `verify` leaves every generator-written
  file byte-identical, proving `format` ran in check mode. GREEN:
  wire the check mode, not the write mode.
- 6.3 RED: a failing step short-circuits subsequent steps, records
  the failing step's stderr, and sets `ok=false`. GREEN: enforce.
- 6.4 RED: a missing tool on PATH (e.g. `pnpm` not installed)
  surfaces as `ok=false` with a clear message naming the missing
  tool, not as a generic command-not-found stack. GREEN: friendly
  error mapping.
- 6.5 REFACTOR: replace the test double wired in task 3.5 with the
  real runner, delete the double, and confirm the CLI still exits 4
  on a failing generated project. This task exists so that the only
  slice in this plan that ships against a stub is closed
  explicitly, rather than left green against something that is not
  the implementation.

## Phase 3 — feature stubs (capabilities 7–8)

These tasks do **not** implement features. They ship the placeholder
registry and the named slots, so future OpenSpec changes can plug
features in without a refactor.

### Capability 7 — `openspec-bootstrap`

- 7.1 RED: `features.get('openspec-bootstrap')` returns a stub
  module with `name`, `description`, and a
  `contribute(context)` that returns an empty `ManifestEntry[]`.
  GREEN: declare it.
- 7.2 RED: `--with openspec-bootstrap` is accepted and resolves to
  the stub; the generated project is byte-identical to the same
  project without the flag. GREEN: wire the registry.

### Capability 8 — `speck-integration`

- 8.1 RED: same shape as 7.1 but for `speck-integration`.
- 8.2 RED: same shape as 7.2 but for `speck-integration`.

## Phase 4 — close-out

- C.1 Run the generator end-to-end for every supported pair
  (`library+ts`, `experiment+py`) and confirm the verification
  contract passes on each. Capture the exact commands in
  `design.md` as a worked example.
- C.2 Confirm with the product owner that the change can be archived.

Close-out tasks are lettered `C.M` because they belong to no
capability; the `N.M` convention above applies to capabilities 1–11.
