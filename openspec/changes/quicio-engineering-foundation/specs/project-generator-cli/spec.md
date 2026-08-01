# Spec: project-generator-cli

## Purpose

Define the command-line surface of the `quicio` binary for v0. The
single command is `quicio new <project>` with explicit flags for
profile, language, and feature selection. The CLI is the user-facing
expression of the composition model; it MUST reject invalid inputs
loudly, MUST default to documented defaults, and MUST be safe against
overwriting an existing project.

## ADDED Requirements

### Requirement: Default profile and language

The CLI SHALL default `--profile` to `library` and `--language` to
`typescript` when those flags are omitted.

#### Scenario: no flags selects documented defaults

- **WHEN** `quicio new demo` is run in an empty directory with no
  flags
- **THEN** the resolved (profile, language) SHALL be
  (`library`, `typescript`).

### Requirement: Known profile and language

The CLI SHALL accept only the registered profiles and languages.

#### Scenario: unknown profile is rejected

- **WHEN** `--profile unknown` is passed
- **THEN** the CLI SHALL exit with code 2 and print the list of
  valid profile ids.

#### Scenario: unknown language is rejected

- **WHEN** `--language klingon` is passed
- **THEN** the CLI SHALL exit with code 2 and print the list of
  valid language ids.

### Requirement: Feature flag conflicts

The CLI SHALL reject invocations in which the same feature is listed
in both `--with` and `--without`.

#### Scenario: same feature in --with and --without

- **WHEN** `--with foo --without foo` is passed
- **THEN** the CLI SHALL exit with code 2 and the error message
  SHALL mention `foo`.

### Requirement: Safe target directory handling

`--force` SHALL have exactly one meaning: it permits writing into a
target directory that is not empty. `--force` SHALL NOT authorise
overwriting, and the CLI SHALL NOT overwrite or delete an existing
file under any flag combination.

The CLI SHALL therefore behave as follows:

- Target directory absent or empty: proceed, `--force` not required.
- Target directory non-empty, `--force` absent: exit 3.
- Target directory non-empty, `--force` present, no manifest path
  collides with an existing file: proceed.
- Any manifest path collides with an existing file: exit 3, with or
  without `--force`.

#### Scenario: non-empty target directory without --force

- **WHEN** the target directory is non-empty and `--force` is
  absent
- **THEN** the CLI SHALL exit with code 3 and the error SHALL list
  the first 5 entries present.

#### Scenario: empty target directory is allowed

- **WHEN** the target directory does not exist or is empty
- **THEN** the CLI SHALL proceed without requiring `--force`.

#### Scenario: --force writes alongside unrelated existing files

- **WHEN** the target directory contains only files whose paths are
  absent from the resolved manifest, and `--force` is supplied
- **THEN** the CLI SHALL write the manifest and SHALL leave every
  pre-existing file byte-identical.

#### Scenario: --force does not authorise overwriting

- **WHEN** a resolved manifest path already exists on disk and
  `--force` is supplied
- **THEN** the CLI SHALL exit with code 3, SHALL name the colliding
  path, and SHALL NOT modify or delete any existing file.

### Requirement: Dry run

`--dry-run` SHALL print the resolved manifest path-by-path and SHALL
NOT write files.

#### Scenario: dry run prints and exits

- **WHEN** `--dry-run` is passed
- **THEN** the CLI SHALL exit 0 after printing every manifest entry,
  and the target directory SHALL remain unchanged.

### Requirement: Post-generation verification

Unless `--no-verify` is supplied, the CLI SHALL run the verification
contract on the generated project and SHALL propagate its exit code.

#### Scenario: a generated project's check fails

- **WHEN** the generated project's `check` step exits non-zero
- **THEN** the CLI SHALL exit non-zero and SHALL NOT delete the
  generated project (partial work is preserved).

#### Scenario: --no-verify skips the smoke test

- **WHEN** `--no-verify` is supplied
- **THEN** the CLI SHALL exit 0 after writing files, even if the
  generated project's tools would fail.

### Requirement: Repeated runs into the same directory fail closed

Running `quicio new` twice into the same directory with the same
arguments SHALL fail rather than overwrite. This is a fail-closed
guarantee, not idempotency: the second run does not converge to the
same state, it refuses to run.

#### Scenario: second run into the same directory

- **WHEN** `quicio new demo` runs successfully once, and is then
  invoked again with the same arguments
- **THEN** the second invocation SHALL exit with code 3 and SHALL
  NOT delete or modify any file from the first run.

#### Scenario: second run with --force still fails closed

- **WHEN** the second invocation adds `--force`
- **THEN** it SHALL still exit with code 3, because every manifest
  path collides with a file written by the first run.
