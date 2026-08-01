# Proposal: Quicio Engineering Foundation

## Why

Quicio today owns Speck (a multi-convention spec indexer) and OpenSpec
(distribution channel). Both projects exist to *consume* an already-formed
specification that the maintainer hand-writes and refactors. There is no
scaffolding story for the next batch of small repositories under
`quicio/*` and adjacent accounts: each new project currently re-invents
its folder layout, its `check/test/build/format` story, its conventions
for committing, and its CI baseline.

Quicio Foundry is the missing first step: it is a **project generator**
that produces small, composable, verifiable projects. It is not a runtime
library. It is not a domain library. It does not share entities with
Speck or OpenSpec. Its only job is to answer `quicio new <name>` with a
working project that already passes its own `check`, `test`, `build`,
and `format` commands.

## What

Introduce the **Quicio Engineering Foundation**:

- A single CLI binary, `quicio`, exposing at minimum the command
  `quicio new <project>` for the v0.
- A composition model with four axes:
  `base + profile + language + selected features`.
- Three initial profiles: `library`, `application`, `experiment`.
- Two initial languages: `TypeScript`, `Python`.
- A **verification contract** that every generated project must satisfy:
  it MUST expose working `check`, `test`, `build`, and `format` commands.
- A **feature** axis reserved for opt-in capabilities. v0 registers
  only the two features that have a spec in this change
  (`openspec-bootstrap`, `speck-integration`), and both are empty
  stubs. `github-actions` and `docker` are named in the roadmap and
  are deliberately **not** registered, so asking for them fails
  honestly instead of succeeding as a silent no-op.

## Goals

- G1. Generate a project from any combination of the initial
  (profile, language) pairs that already passes its own
  `check`, `test`, `build`, `format` on a clean checkout.
- G2. Make composition the primitive: the same profile must work with
  any supported language by swapping only the language module, not by
  duplicating a template per pair.
- G3. Make features opt-in and strictly additive at generation time:
  a feature contributes new files only and MUST NOT be able to
  rewrite a file owned by the base, the profile, the language, or
  another feature. In v0 this is enforced structurally, by the
  `contribute(context) -> ManifestEntry[]` signature, not by
  convention. Changing the feature set of an *already generated*
  project is out of scope for v0, because the CLI exposes only
  `quicio new`.
- G4. Keep the CLI surface tight: `quicio new <project>` for v0, with
  `-p/--profile`, `-l/--language`, and `--with/--without` flags.
- G5. Treat the verification contract (`check/test/build/format`) as
  a first-class invariant. A generated project that lacks any of the
  four commands is a bug in the generator, not a project decision.
- G6. Default to the smallest viable layout: no monorepos, no empty
  layer folders, no premature abstraction.

## Non-goals

- N1. v0 is **not** a runtime library. It MUST NOT expose a programmatic
  API consumed by Speck or OpenSpec.
- N2. v0 MUST NOT share domain entities, types, or schemas with Speck
  or OpenSpec. Sharing means coupling; coupling blocks both projects.
- N3. v0 MUST NOT generate monorepos. A generated project is a single
  `package`/`pyproject` workspace with one `src/` and one `tests/`.
- N4. v0 MUST NOT pre-scaffold features without a concrete consumer.
  Docker, GitHub Actions, and Speck integration are *named* but only
  speced as named placeholders; their implementation changes land in
  separate OpenSpec changes once a real consumer (an actual generated
  project that asks for them) exists.
- N5. v0 MUST NOT replace the user's local toolchain. It uses the
  user's installed `node`/`pnpm` (TypeScript) and `python`/`uv`
  (Python) and does not bundle them.
- N6. v0 MUST NOT introduce interactive prompts in the generator
  pipeline beyond a single confirmation prompt at the end. Everything
  else is flag-driven.

## Success criteria

- S1. `quicio new demo --profile library --language typescript` in a
  fresh directory produces a project that, after a single `pnpm
  install`, passes `pnpm run check && pnpm test && pnpm run build &&
  pnpm run format:check` on a clean shell.
- S2. `quicio new demo --profile experiment --language python`
  produces a project that, after `uv sync`, passes `uv run task check &&
  uv run task test && uv run task build && uv run task format-check`.
- S3. Generating the same combination twice into the same directory
  fails with exit code 3 and a clear message, with or without
  `--force`, instead of overwriting or corrupting the existing
  project.
- S4. The CLI's internal representation of (profile, language,
  features) is exercised by unit tests covering: missing profile,
  missing language, unknown feature, conflicting `--with/--without`
  for the same feature, and a request that omits both flags (defaults
  resolve to a documented default pair).
- S5. The generator's templates are **not** duplicated per
  (profile, language) pair: there is exactly one language module per
  language and one profile module per profile; the final layout is
  the deterministic composition of base + profile + language + features.
  The observable test is that no language module references the
  strings `library`, `application`, or `experiment`: a language
  module receives the profile's abstract `buildKind` and nothing
  else.
- S6. `quicio new my-lib --language python` produces a project whose
  distribution name is `my-lib`, whose module directory is
  `src/my_lib/`, and whose generated test imports `my_lib` and
  passes. A generated project that installs and then fails its own
  first test on a hyphenated name is the defect this criterion
  exists to prevent.
- S7. Two generation runs of the same arguments, on different dates,
  under different users, from different working directories, produce
  byte-identical output. Every dependency carries an exact version
  literal and no lockfile is shipped, so "passes on a clean shell"
  stays a property of the generator rather than of whatever the
  registry resolved that day.
- S8. The generator never writes outside `<out>/<project>` and never
  overwrites an existing file. Absolute paths, `..` segments, and
  symlinked components resolving outside the target are all rejected
  before the first byte is written.

## Out of scope (follow-up OpenSpec changes, *not* this one)

- Implementing the OpenSpec bootstrap feature end to end.
- Implementing the Speck integration feature end to end.
- Implementing the GitHub Actions feature end to end.
- Implementing the Docker feature end to end.
- Adding a third language (Go, Rust, ...).
- Adding an `application` profile implementation in TypeScript (this
  change covers the *model* and the *contracts*; the application
  delivery is a follow-up change that uses them).

This is deliberate. The product owner asked for a small, honest first
specification. We refuse to ship speculation.
