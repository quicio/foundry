# Tasks: Quicio Engineering Foundation

This task list is the contract between the proposal and the
implementation phases. Each task is a TDD-shaped vertical slice that
ends in a green test. Tasks are grouped by capability (one capability
per spec) and numbered `N.M` where `N` is the capability index and
`M`
is the task index within that capability.

**Strict rules**

- One task per commit. One commit must turn one red test green, or
  refactor a green state without breaking any green.
- Do not implement tasks outside the in-flight range.
- If a blocker appears, stop and surface it. Do not silently expand
  scope.

## Phase 0 — bootstrap (no code yet, only ops)

- 0.1 Verify OpenSpec is initialized and the change folder exists.
- 0.2 Confirm with the product owner that `proposal.md`, `design.md`,
  this `tasks.md`, and the 8 spec files are approved before any
  implementation work begins.

## Phase 1 — composition core (capabilities 1–4)

These tasks build the generator's spine: the manifest, the registries,
the CLI parsing, and the composition engine. They end with a working
`quicio new --dry-run` for any supported (profile, language) pair.

### Capability 1 — `project-profile-model`

- 1.1 RED: a `Profile` type exists and `library`, `application`,
  `experiment` are registered. GREEN: declare the type and the
  registry. (no behavior yet)
- 1.2 RED: `profiles.get('unknown')` throws a typed error with the
  list of valid names. GREEN: implement the lookup with a clear
  message.
- 1.3 RED: each registered profile exposes `displayName`,
  `description`, and a `commands()` array containing the four
  abstract names. GREEN: declare those on each profile.
- 1.4 RED: each registered profile exposes `buildKind`, with
  `library` and `application` declaring `distributable` and
  `experiment` declaring `none`. GREEN: declare the field.
- 1.5 RED: enumerating abstract command names across every profile
  and language module yields exactly `['check','test','build',
  'format']` and never `format:check` or `format-check`. GREEN:
  keep the concrete names inside the language modules only.

### Capability 2 — `template-composition`

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

### Capability 3 — `project-generator-cli`

- 3.1 RED: `quicio new demo` (no flags) resolves profile=library,
  language=typescript via documented defaults and exits 0 with a
  dry-run report on stdout. GREEN: implement flag parsing and
  defaults.
- 3.2 RED: `--with foo --without foo` exits 2 with an error
  mentioning `foo`. GREEN: detect the conflict.
- 3.3 RED: `--profile unknown` exits 2 with a list of valid
  profiles. GREEN: validate against the registry.
- 3.4 RED: when the target directory is non-empty and `--force` is
  absent, the CLI exits 3 and lists the first 5 offending entries.
  GREEN: enforce.
- 3.4b RED: with `--force` and a non-empty target whose files are
  all absent from the manifest, the CLI writes and leaves every
  pre-existing file byte-identical. GREEN: implement.
- 3.4c RED: when a manifest path already exists on disk, the CLI
  exits 3 naming that path, with and without `--force`, and
  modifies nothing. GREEN: enforce the no-overwrite invariant.
- 3.5 RED: when `--no-verify` is omitted, the CLI runs the smoke
  test on the generated project and propagates its exit code. GREEN:
  wire the smoke test hook (real impl lands in phase 2).
- 3.6 RED: `--dry-run` prints the manifest path-by-path and exits 0
  without writing files. GREEN: implement dry-run.

### Capability 4 — `typescript-toolchain`

- 4.1 RED: the `typescript` language module exposes `packageManager:
  'pnpm'`, `engines.node: '>=22'`, `commands.check/test/build`, and
  `commands.format.write` / `commands.format.check`. GREEN: declare
  it.
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
- 4.4 RED: a generated `library + typescript` project passes
  `pnpm install && pnpm run check && pnpm test && pnpm run build
  && pnpm run format:check` from a clean shell. GREEN: wire the
  templates and verify end to end.

## Phase 2 — Python + verification (capabilities 5–6)

### Capability 5 — `python-toolchain`

- 5.1 RED: the `python` language module exposes
  `packageManager: 'uv'`, `commands.check/test/build` as
  `task <name>` invocations, and `commands.format.write`
  (`task format`) / `commands.format.check` (`task format-check`).
  GREEN: declare it.
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
capability; the `N.M` convention above applies to capabilities 1–8.
