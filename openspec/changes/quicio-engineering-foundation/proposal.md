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
- A **feature** axis reserved for opt-in capabilities. v0 only documents
  the features the product owner has named; we do not implement features
  without a real consumer.

## Goals

- G1. Generate a project from any combination of the initial
  (profile, language) pairs that already passes its own
  `check`, `test`, `build`, `format` on a clean checkout.
- G2. Make composition the primitive: the same profile must work with
  any supported language by swapping only the language module, not by
  duplicating a template per pair.
- G3. Make features opt-in and additive: enabling or disabling a
  feature on an existing generated project MUST not rewrite files
  owned by other features or by the base.
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
  uv run task test && uv run task build && uv run task format --check`.
- S3. Generating the same combination twice into the same directory
  fails with a non-zero exit and a clear message, instead of
  overwriting or corrupting the existing project.
- S4. The CLI's internal representation of (profile, language,
  features) is exercised by unit tests covering: missing profile,
  missing language, unknown feature, conflicting `--with/--without`
  for the same feature, and a request that omits both flags (defaults
  resolve to a documented default pair).
- S5. The generator's templates are **not** duplicated per
  (profile, language) pair: there is exactly one language module per
  language and one profile module per profile; the final layout is
  the deterministic composition of base + profile + language + features.

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
